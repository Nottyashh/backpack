import { Body, Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /orders
  @Post()
  async createPending(@Body() dto: CreateOrderDto) {
    // TODO: Add auth guard to inject userId
    return this.ordersService.createPending(dto);
  }

  // POST /orders/fiat/webhook
  @Post('fiat/webhook')
  async fiatWebhook(@Body('orderId') orderId: string) {
    // In production, verify webhook signature here
    return this.ordersService.handleFiatSuccess(orderId);
  }
}