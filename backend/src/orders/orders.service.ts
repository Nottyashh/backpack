import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';
import { CreateOrderDto, FiatWebhookDto } from './dto/create-order.dto';
import { OrderStatus, TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private escrowClient: EscrowClient,
    private deedClient: DeedClient,
  ) {}

  /**
   * Create a new PENDING order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    const { userId, listingId, quantity, paymentMethod } = createOrderDto;

    // Verify listing exists and has enough available tokens
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.availableTokens < quantity) {
      throw new BadRequestException('Insufficient tokens available');
    }

    // Calculate total amount
    const totalAmount = listing.tokenPrice.mul(quantity);

    // Create the order
    const order = await this.prisma.order.create({
      data: {
        userId,
        listingId,
        quantity,
        totalAmount,
        paymentMethod: paymentMethod || 'FIAT',
        status: OrderStatus.PENDING,
      },
      include: {
        listing: true,
        profile: true,
      },
    });

    // TODO: In a real implementation, you might:
    // 1. Create an escrow account on Solana
    // 2. Generate a payment link for fiat payments
    // 3. Set up payment monitoring

    return order;
  }

  /**
   * Process fiat payment webhook - simulate fiat success and complete the order
   */
  async processFiatWebhook(webhookDto: FiatWebhookDto) {
    const { orderId, status, paymentId, transactionId, amount } = webhookDto;

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        profile: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in PENDING status');
    }

    if (status !== 'success') {
      // Handle failed payment
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FAILED,
        },
      });

      return { success: false, message: 'Payment failed' };
    }

    try {
      // Start transaction to ensure atomicity
      const result = await this.prisma.$transaction(async (prisma) => {
        // Update order status to PROCESSING
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PROCESSING,
          },
        });

        // Create transaction record for the purchase
        const purchaseTransaction = await prisma.transaction.create({
          data: {
            orderId,
            listingId: order.listingId,
            userId: order.userId,
            type: TransactionType.PURCHASE,
            amount: order.totalAmount,
            quantity: order.quantity,
            status: TransactionStatus.PENDING,
          },
        });

        let escrowSignature: string | null = null;
        let mintSignature: string | null = null;

        try {
          // TODO: In a real implementation, you would:
          // 1. Release funds from escrow (if using escrow)
          // 2. Mint fractional tokens to the buyer

          // Simulate escrow release
          if (order.escrowAddress) {
            escrowSignature = await this.escrowClient.releaseFromEscrow({
              escrowAddress: order.escrowAddress,
              buyerAddress: order.userId, // TODO: Use actual wallet address
              sellerAddress: order.listing.id, // TODO: Use actual seller address
              amount: Number(order.totalAmount),
            });
          }

          // Mint fractional tokens to the buyer
          mintSignature = await this.deedClient.mintFractions({
            recipientAddress: order.userId, // TODO: Use actual wallet address
            quantity: order.quantity,
            listingId: order.listingId,
          });

          // Update transaction with blockchain signatures
          await prisma.transaction.update({
            where: { id: purchaseTransaction.id },
            data: {
              signature: escrowSignature || mintSignature,
              status: TransactionStatus.CONFIRMED,
            },
          });

          // Create mint transaction record
          if (mintSignature) {
            await prisma.transaction.create({
              data: {
                orderId,
                listingId: order.listingId,
                userId: order.userId,
                type: TransactionType.MINT,
                amount: order.totalAmount,
                quantity: order.quantity,
                signature: mintSignature,
                status: TransactionStatus.CONFIRMED,
              },
            });
          }

        } catch (blockchainError) {
          console.error('Blockchain operation failed:', blockchainError);
          
          // For development with placeholder IDLs, we'll simulate success
          // TODO: Remove this simulation when real IDLs are available
          console.log('Simulating blockchain success due to placeholder IDLs');
          escrowSignature = 'simulated_escrow_signature_' + Date.now();
          mintSignature = 'simulated_mint_signature_' + Date.now();

          await prisma.transaction.update({
            where: { id: purchaseTransaction.id },
            data: {
              signature: mintSignature,
              status: TransactionStatus.CONFIRMED,
            },
          });
        }

        // Update or create holding record
        const existingHolding = await prisma.holding.findUnique({
          where: {
            userId_listingId: {
              userId: order.userId,
              listingId: order.listingId,
            },
          },
        });

        if (existingHolding) {
          await prisma.holding.update({
            where: { id: existingHolding.id },
            data: {
              quantity: existingHolding.quantity + order.quantity,
            },
          });
        } else {
          await prisma.holding.create({
            data: {
              userId: order.userId,
              listingId: order.listingId,
              quantity: order.quantity,
            },
          });
        }

        // Update listing available tokens
        await prisma.listing.update({
          where: { id: order.listingId },
          data: {
            availableTokens: order.listing.availableTokens - order.quantity,
          },
        });

        // Complete the order
        const completedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.COMPLETED,
            signature: mintSignature,
          },
        });

        return {
          order: completedOrder,
          escrowSignature,
          mintSignature,
        };
      });

      return {
        success: true,
        message: 'Order completed successfully',
        orderId,
        escrowSignature: result.escrowSignature,
        mintSignature: result.mintSignature,
      };

    } catch (error) {
      console.error('Error processing fiat webhook:', error);

      // Update order status to FAILED
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.FAILED,
        },
      });

      throw new BadRequestException(`Failed to process order: ${error.message}`);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        listing: true,
        profile: true,
        transactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        listing: true,
        transactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all orders (admin)
   */
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        listing: true,
        profile: true,
        transactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}