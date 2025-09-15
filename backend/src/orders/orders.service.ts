import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, FiatWebhookDto } from './dto/create-order.dto';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';
import { BlockchainProvider } from '../blockchain/provider';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly escrowClient: EscrowClient;
  private readonly deedClient: DeedClient;

  constructor(private readonly prisma: PrismaService) {
    this.escrowClient = new EscrowClient();
    this.deedClient = new DeedClient();
  }

  /**
   * Create a new PENDING order
   * @param createOrderDto - Order creation data
   * @returns Created order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    try {
      // Verify listing exists and is active
      const listing = await this.prisma.listing.findFirst({
        where: {
          id: createOrderDto.listingId,
          status: 'ACTIVE'
        }
      });

      if (!listing) {
        throw new Error('Listing not found or not active');
      }

      // Verify user exists
      const user = await this.prisma.profile.findUnique({
        where: { id: createOrderDto.userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create PENDING order
      const order = await this.prisma.order.create({
        data: {
          userId: createOrderDto.userId,
          listingId: createOrderDto.listingId,
          quantity: createOrderDto.quantity,
          amount: createOrderDto.amount,
          status: 'PENDING'
        },
        include: {
          user: true,
          listing: true
        }
      });

      this.logger.log(`Created PENDING order ${order.id} for user ${createOrderDto.userId}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process fiat payment webhook
   * Simulates fiat success -> release escrow -> mint fractions -> update DB
   * @param webhookDto - Webhook data
   * @returns Updated order with transaction hashes
   */
  async processFiatWebhook(webhookDto: FiatWebhookDto) {
    try {
      // Find the order
      const order = await this.prisma.order.findUnique({
        where: { id: webhookDto.orderId },
        include: {
          user: true,
          listing: true
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Order is not in PENDING status');
      }

      // Update order status to CONFIRMED
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' }
      });

      let escrowTxHash: string | null = null;
      let deedTxHash: string | null = null;

      try {
        // TODO: Replace with actual user wallet address from order.user.wallet
        // For now, using a placeholder - you'll need to get the actual wallet address
        const userWallet = new PublicKey(order.user.wallet || '11111111111111111111111111111111');
        
        // Release escrow (simulate - replace with actual escrow release)
        // TODO: Implement actual escrow release based on your IDL
        this.logger.log('Releasing escrow...');
        // escrowTxHash = await this.escrowClient.release(
        //   new PublicKey('escrow_account_address'),
        //   new BN(order.amount * 1e6), // Convert to lamports
        //   userWallet
        // );

        // Mint deed fractions (simulate - replace with actual minting)
        // TODO: Implement actual fraction minting based on your IDL
        this.logger.log('Minting deed fractions...');
        // deedTxHash = await this.deedClient.mintFractions(
        //   new PublicKey(order.listingId), // Using listing ID as deed account
        //   new BN(order.quantity),
        //   userWallet
        // );

        // For now, generate mock transaction hashes
        escrowTxHash = `mock_escrow_${Date.now()}`;
        deedTxHash = `mock_deed_${Date.now()}`;

        // Update order with transaction hashes and mark as COMPLETED
        const updatedOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            txHash: deedTxHash
          }
        });

        // Create transaction records
        await this.prisma.transaction.createMany({
          data: [
            {
              userId: order.userId,
              listingId: order.listingId,
              orderId: order.id,
              type: 'PURCHASE',
              amount: order.amount,
              txHash: escrowTxHash,
              status: 'CONFIRMED'
            },
            {
              userId: order.userId,
              listingId: order.listingId,
              orderId: order.id,
              type: 'MINT',
              amount: order.amount,
              txHash: deedTxHash,
              status: 'CONFIRMED'
            }
          ]
        });

        // Create or update holding
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

        this.logger.log(`Successfully processed fiat webhook for order ${order.id}`);
        return {
          success: true,
          order: updatedOrder,
          escrowTxHash,
          deedTxHash
        };
      } catch (blockchainError) {
        // If blockchain operations fail, mark order as FAILED
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' }
        });

        this.logger.error(`Blockchain operation failed for order ${order.id}: ${blockchainError.message}`);
        throw blockchainError;
      }
    } catch (error) {
      this.logger.error(`Failed to process fiat webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all orders for a user
   * @param userId - User ID
   * @returns User's orders
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
   * @param orderId - Order ID
   * @returns Order details
   */
  async getOrderById(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        listing: true
      }
    });
  }
}