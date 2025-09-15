import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';
import { PublicKey } from '@solana/web3.js';

// NOTE: Minimal Prisma-like interface. Replace with actual Amplication PrismaService if present.
type PrismaLike = {
  order: {
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
  };
  transaction: { create: (args: any) => Promise<any> };
  holding: {
    upsert: (args: any) => Promise<any>;
  };
};

// TODO: Wire real PrismaService from Amplication here with proper injection
const memoryDb: any = { orders: [], transactions: [], holdings: [] };
let idCounter = 1;
const PrismaStub: PrismaLike = {
  order: {
    create: async ({ data }) => {
      const row = { id: String(idCounter++), ...data };
      memoryDb.orders.push(row);
      return row;
    },
    update: async ({ where, data }) => {
      const row = memoryDb.orders.find((o: any) => o.id === where.id);
      Object.assign(row, data);
      return row;
    },
  },
  transaction: {
    create: async ({ data }) => {
      const row = { id: String(idCounter++), ...data };
      memoryDb.transactions.push(row);
      return row;
    },
  },
  holding: {
    upsert: async ({ where, create, update }) => {
      let row = memoryDb.holdings.find((h: any) => h.userId === where.userId_listingId.userId && h.listingId === where.userId_listingId.listingId);
      if (!row) {
        row = { id: String(idCounter++), ...create };
        memoryDb.holdings.push(row);
      } else {
        Object.assign(row, update);
      }
      return row;
    },
  },
};

export enum OrderStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  // TODO: Inject real PrismaService
  constructor(private readonly prisma: PrismaLike = PrismaStub) {}

  // Security: Add auth guards in controller to ensure userId === req.user.id
  async createPending(dto: CreateOrderDto) {
    // Create a pending order
    const order = await this.prisma.order.create({
      data: {
        userId: dto.userId,
        listingId: dto.listingId,
        quantity: dto.quantity,
        status: OrderStatus.PENDING,
        fiatPaymentId: dto.fiatPaymentId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return order;
  }

  // Simulate fiat success webhook: release escrow, mint fractions, update DB
  async handleFiatWebhook(body: { orderId: string }): Promise<{ status: string; escrowTx?: string; deedTx?: string }> {
    // Load order
    // TODO: replace with prisma.order.findUnique
    const order = (memoryDb.orders as any[]).find((o) => o.id === body.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Detect placeholder IDLs to avoid real chain calls in tests/dev
    const usingPlaceholderIdl = process.env.NODE_ENV === 'test' || process.env.USE_PLACEHOLDER_IDL === 'true';

    let escrowTx = 'placeholder-escrow-tx';
    let deedTx = 'placeholder-deed-tx';
    if (!usingPlaceholderIdl) {
      const escrowClient = new EscrowClient();
      const deedClient = new DeedClient();
      // TODO: compute real PDAs and accounts per IDL
      const dummyPubkey = new PublicKey('11111111111111111111111111111111');
      try {
        const receiver = new PublicKey(process.env.SPV_TREASURY || '11111111111111111111111111111111');
        escrowTx = await escrowClient.release({ escrowPda: dummyPubkey, receiver });
        deedTx = await deedClient.mintFractions({
          deedPda: dummyPubkey,
          fractionMint: dummyPubkey,
          fractionTreasury: dummyPubkey,
          quantity: order.quantity,
        });
      } catch (e) {
        this.logger.error('Blockchain failure', e as any);
        await this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED, updatedAt: new Date() } });
        await this.prisma.transaction.create({
          data: {
            orderId: order.id,
            signature: (e as any)?.txSig || 'n/a',
            chain: 'solana',
            kind: 'ESCROW_RELEASE|MINT',
            status: 'FAILED',
            createdAt: new Date(),
          },
        });
        return { status: 'FAILED' };
      }
    }

    // Update order
    await this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.SUCCESS, updatedAt: new Date() } });

    // Record transactions
    await this.prisma.transaction.create({
      data: {
        orderId: order.id,
        signature: escrowTx,
        chain: 'solana',
        kind: 'ESCROW_RELEASE',
        status: 'SUCCESS',
        createdAt: new Date(),
      },
    });
    await this.prisma.transaction.create({
      data: {
        orderId: order.id,
        signature: deedTx,
        chain: 'solana',
        kind: 'MINT_FRACTIONS',
        status: 'SUCCESS',
        createdAt: new Date(),
      },
    });

    // Update holding upsert
    // Schema: holdings @@unique([userId, listingId]) assumed
    await this.prisma.holding.upsert({
      where: { userId_listingId: { userId: order.userId, listingId: order.listingId } },
      create: { userId: order.userId, listingId: order.listingId, quantity: order.quantity, updatedAt: new Date(), createdAt: new Date() },
      update: { quantity: (this.sumHolding(order.userId, order.listingId) + order.quantity), updatedAt: new Date() },
    });

    return { status: 'SUCCESS', escrowTx, deedTx };
  }

  private sumHolding(userId: string, listingId: string): number {
    const row = (memoryDb.holdings as any[]).find((h) => h.userId === userId && h.listingId === listingId);
    return row ? Number(row.quantity || 0) : 0;
  }
}

