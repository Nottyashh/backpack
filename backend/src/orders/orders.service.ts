import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FiatWebhookDto, FiatPaymentStatus } from './dto/fiat-webhook.dto';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new PENDING order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    const { userId, listingId, quantity } = createOrderDto;

    // Verify listing exists and has available shares
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.availableShares < quantity) {
      throw new BadRequestException('Insufficient available shares');
    }

    // Calculate total amount (assuming 1 USDC per share for simplicity)
    const totalAmount = quantity * 1; // TODO: Get actual price per share from listing

    // Create order in PENDING status
    const order = await this.prisma.order.create({
      data: {
        userId,
        listingId,
        quantity,
        totalAmount,
        status: 'PENDING'
      },
      include: {
        user: true,
        listing: true
      }
    });

    return order;
  }

  /**
   * Process fiat payment webhook and release escrow + mint fractions
   */
  async processFiatWebhook(webhookDto: FiatWebhookDto) {
    const { orderId, status, transactionHash } = webhookDto;

    // Find the order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        listing: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in PENDING status');
    }

    if (status === FiatPaymentStatus.SUCCESS) {
      try {
        // TODO: Replace with actual PDA derivation
        // For now, using placeholder PDAs
        const escrowPda = new PublicKey('11111111111111111111111111111111');
        const deedPda = new PublicKey('22222222222222222222222222222222');
        const recipient = new PublicKey(order.user.wallet || '33333333333333333333333333333333');

        // Release escrow
        const escrowTxHash = await EscrowClient.release(
          escrowPda,
          recipient,
          Number(order.totalAmount)
        );

        // Mint fractions
        const deedTxHash = await DeedClient.mintFractions(
          deedPda,
          recipient,
          order.quantity
        );

        // Update order status
        const updatedOrder = await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            transactionHash: escrowTxHash
          }
        });

        // Create transaction record
        await this.prisma.transaction.create({
          data: {
            userId: order.userId,
            type: 'PURCHASE',
            amount: order.totalAmount,
            status: 'COMPLETED',
            hash: escrowTxHash,
            metadata: {
              deedTxHash,
              quantity: order.quantity,
              listingId: order.listingId
            }
          }
        });

        // Update or create holding
        await this.prisma.holding.upsert({
          where: {
            userId_listingId: {
              userId: order.userId,
              listingId: order.listingId
            }
          },
          update: {
            quantity: {
              increment: order.quantity
            }
          },
          create: {
            userId: order.userId,
            listingId: order.listingId,
            quantity: order.quantity
          }
        });

        // Update listing available shares
        await this.prisma.listing.update({
          where: { id: order.listingId },
          data: {
            availableShares: {
              decrement: order.quantity
            }
          }
        });

        return {
          success: true,
          orderId: updatedOrder.id,
          escrowTxHash,
          deedTxHash,
          message: 'Order completed successfully'
        };

      } catch (error) {
        // Mark order as failed
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: 'FAILED' }
        });

        throw new BadRequestException(`Failed to process order: ${error.message}`);
      }
    } else {
      // Mark order as failed for non-success status
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' }
      });

      return {
        success: false,
        orderId: updatedOrder.id,
        message: 'Payment failed'
      };
    }
  }

  /**
   * Get all orders for a user
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        listing: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        listing: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}