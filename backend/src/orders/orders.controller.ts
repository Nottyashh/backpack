import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // TODO: Add authentication guard to derive userId from JWT instead of trusting body
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.createPending(dto);
    return order; // should have status PENDING
  }

  @Post('fiat/webhook')
  @HttpCode(HttpStatus.OK)
  async fiatWebhook(@Body() body: { orderId: string }) {
    return this.ordersService.handleFiatWebhook(body);
  }
}

