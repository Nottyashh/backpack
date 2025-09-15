import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.transaction.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.order.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.profile.deleteMany();
    
    await app.close();
  });

  describe('/api/orders (POST)', () => {
    it('should create a PENDING order', async () => {
      // First, create test data
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
          username: 'testuser',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          title: 'Test Property',
          description: 'A test property for e2e testing',
          location: 'Test City, Test State',
          price: 500000,
          totalTokens: 1000,
          availableTokens: 1000,
          tokenPrice: 500,
          propertyType: 'Residential',
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1500,
        },
      });

      const createOrderDto = {
        userId: profile.userId,
        listingId: listing.id,
        quantity: 10,
        paymentMethod: 'FIAT',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(OrderStatus.PENDING);
      expect(response.body.userId).toBe(profile.userId);
      expect(response.body.listingId).toBe(listing.id);
      expect(response.body.quantity).toBe(10);
      expect(response.body.totalAmount).toBe('5000'); // 10 * 500
    });

    it('should fail when listing does not exist', async () => {
      const createOrderDto = {
        userId: 'test-user-1',
        listingId: 'non-existent-listing',
        quantity: 10,
        paymentMethod: 'FIAT',
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(createOrderDto)
        .expect(404);
    });

    it('should fail when insufficient tokens available', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          title: 'Test Property',
          location: 'Test City',
          price: 500000,
          totalTokens: 100,
          availableTokens: 5, // Only 5 tokens available
          tokenPrice: 500,
        },
      });

      const createOrderDto = {
        userId: profile.userId,
        listingId: listing.id,
        quantity: 10, // Requesting more than available
        paymentMethod: 'FIAT',
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(createOrderDto)
        .expect(400);
    });
  });

  describe('/api/orders/fiat/webhook (POST)', () => {
    it('should process successful fiat payment and return transaction signatures', async () => {
      // Create test data
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          title: 'Test Property',
          location: 'Test City',
          price: 500000,
          totalTokens: 1000,
          availableTokens: 1000,
          tokenPrice: 500,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: profile.userId,
          listingId: listing.id,
          quantity: 10,
          totalAmount: 5000,
          status: OrderStatus.PENDING,
          paymentMethod: 'FIAT',
        },
      });

      const webhookDto = {
        orderId: order.id,
        status: 'success',
        paymentId: 'test-payment-123',
        transactionId: 'test-tx-456',
        amount: 5000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders/fiat/webhook')
        .send(webhookDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order completed successfully');
      expect(response.body.orderId).toBe(order.id);
      
      // Since we're using placeholder IDLs, we should get simulated signatures
      expect(response.body.mintSignature).toMatch(/simulated_mint_signature_\d+/);

      // Verify order status was updated
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.COMPLETED);

      // Verify holding was created
      const holding = await prisma.holding.findUnique({
        where: {
          userId_listingId: {
            userId: profile.userId,
            listingId: listing.id,
          },
        },
      });
      expect(holding).toBeDefined();
      expect(holding.quantity).toBe(10);

      // Verify listing available tokens were updated
      const updatedListing = await prisma.listing.findUnique({
        where: { id: listing.id },
      });
      expect(updatedListing.availableTokens).toBe(990); // 1000 - 10
    });

    it('should handle failed payment status', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          title: 'Test Property',
          location: 'Test City',
          price: 500000,
          totalTokens: 1000,
          availableTokens: 1000,
          tokenPrice: 500,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: profile.userId,
          listingId: listing.id,
          quantity: 10,
          totalAmount: 5000,
          status: OrderStatus.PENDING,
          paymentMethod: 'FIAT',
        },
      });

      const webhookDto = {
        orderId: order.id,
        status: 'failed',
        paymentId: 'test-payment-123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders/fiat/webhook')
        .send(webhookDto)
        .expect(201);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Payment failed');

      // Verify order status was updated to FAILED
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder.status).toBe(OrderStatus.FAILED);
    });

    it('should fail when order does not exist', async () => {
      const webhookDto = {
        orderId: 'non-existent-order',
        status: 'success',
      };

      await request(app.getHttpServer())
        .post('/api/orders/fiat/webhook')
        .send(webhookDto)
        .expect(404);
    });
  });

  describe('/api/orders/:id (GET)', () => {
    it('should get order by id', async () => {
      const profile = await prisma.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
        },
      });

      const listing = await prisma.listing.create({
        data: {
          title: 'Test Property',
          location: 'Test City',
          price: 500000,
          totalTokens: 1000,
          availableTokens: 1000,
          tokenPrice: 500,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: profile.userId,
          listingId: listing.id,
          quantity: 10,
          totalAmount: 5000,
          status: OrderStatus.PENDING,
          paymentMethod: 'FIAT',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/orders/${order.id}`)
        .expect(200);

      expect(response.body.id).toBe(order.id);
      expect(response.body.listing).toBeDefined();
      expect(response.body.profile).toBeDefined();
    });

    it('should return 404 when order does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/non-existent-order')
        .expect(404);
    });
  });
});