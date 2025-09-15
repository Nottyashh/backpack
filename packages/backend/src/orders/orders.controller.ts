import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // TODO: add auth guards (JWT/session) after RLS integration
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createPendingOrder(dto);
  }

  // Simulate fiat webhook success
  @Post('fiat/webhook')
  @HttpCode(HttpStatus.OK)
  async fiatWebhook(@Body() body: { orderId: string }) {
    const { orderId } = body;
    return this.ordersService.processFiatSuccess(orderId);
  }
}

