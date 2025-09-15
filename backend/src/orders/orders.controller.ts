import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, FiatWebhookDto } from './dto/create-order.dto';

// TODO: Implement proper authentication guards
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { User } from '../auth/user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order
   * TODO: Add authentication guard and extract user from token
   */
  @Post()
  // @UseGuards(JwtAuthGuard)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    // TODO: In a real implementation, extract userId from JWT token
    // const userId = user.id;
    // createOrderDto.userId = userId;
    
    return this.ordersService.createOrder(createOrderDto);
  }

  /**
   * Fiat payment webhook endpoint
   * This endpoint simulates fiat payment success and triggers:
   * 1. Escrow release
   * 2. Token minting
   * 3. Database updates
   */
  @Post('fiat/webhook')
  async processFiatWebhook(@Body() webhookDto: FiatWebhookDto) {
    return this.ordersService.processFiatWebhook(webhookDto);
  }

  /**
   * Get order by ID
   * TODO: Add authentication and authorization checks
   */
  @Get(':id')
  // @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  /**
   * Get user's orders
   * TODO: Add authentication guard and extract user from token
   */
  @Get('user/:userId')
  // @UseGuards(JwtAuthGuard)
  async getUserOrders(@Param('userId') userId: string) {
    // TODO: Ensure user can only access their own orders
    return this.ordersService.getUserOrders(userId);
  }

  /**
   * Get all orders (admin endpoint)
   * TODO: Add admin authentication guard
   */
  @Get()
  // @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}