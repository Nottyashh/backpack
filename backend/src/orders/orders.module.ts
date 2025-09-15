import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EscrowClient } from '../blockchain/escrow.client';
import { DeedClient } from '../blockchain/deed.client';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, EscrowClient, DeedClient],
})
export class OrdersModule {}