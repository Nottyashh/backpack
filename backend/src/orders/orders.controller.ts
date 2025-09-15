import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { FiatWebhookDto } from './dto/fiat-webhook.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  // TODO: Add authentication guard
  // @UseGuards(JwtAuthGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Post('fiat/webhook')
  @ApiOperation({ summary: 'Process fiat payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  // TODO: Add webhook signature verification
  async processFiatWebhook(@Body() webhookDto: FiatWebhookDto) {
    return this.ordersService.processFiatWebhook(webhookDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders for a user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  // TODO: Add authentication guard and user validation
  // @UseGuards(JwtAuthGuard)
  async getUserOrders(@Param('userId') userId: string) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  // TODO: Add authentication guard
  // @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }
}