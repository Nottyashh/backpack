import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from '../prisma.service';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowClient: EscrowClient,
    private readonly deedClient: DeedClient,
  ) {}

  async createPending(dto: CreateOrderDto) {
    // TODO: adjust field names to actual Prisma schema if different
    const order = await this.prisma.order.create({
      data: {
        ...dto,
        status: 'PENDING',
      },
    });
    return order;
  }

  /**
   * Simulates fiat success webhook -> release escrow + mint fractions.
   * Returns updated order and blockchain tx signatures.
   */
  async handleFiatSuccess(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    // TODO: derive PDA/pubkeys per IDL
    const escrowSig = await this.escrowClient.releaseEscrow(new PublicKey(orderId));
    const deedSig = await this.deedClient.mintFractions(order.quantity, new PublicKey(order.userId));

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    // TODO: create transaction & holding records atomically

    return { order: updated, escrowSig, deedSig };
  }
}