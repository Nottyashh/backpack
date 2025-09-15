import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.order.deleteMany();
    await prismaService.listing.deleteMany();
    await prismaService.profile.deleteMany();
  });

  describe('POST /orders', () => {
    it('should create a PENDING order', async () => {
      // Create test data
      const profile = await prismaService.profile.create({
        data: {
          userId: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          wallet: 'test-wallet-address'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          description: 'A beautiful test property',
          price: 100000,
          totalShares: 1000,
          availableShares: 1000,
          propertyAddress: '123 Test St, Test City',
          images: ['https://example.com/image1.jpg']
        }
      });

      const createOrderDto = {
        userId: profile.userId,
        listingId: listing.id,
        quantity: 10
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: profile.userId,
        listingId: listing.id,
        quantity: 10,
        status: 'PENDING',
        totalAmount: 10
      });

      // Verify order was created in database
      const order = await prismaService.order.findUnique({
        where: { id: response.body.id }
      });
      expect(order).toBeTruthy();
      expect(order.status).toBe('PENDING');
    });

    it('should return 404 for non-existent listing', async () => {
      const createOrderDto = {
        userId: 'test-user-123',
        listingId: 'non-existent-listing',
        quantity: 10
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(404);
    });

    it('should return 400 for insufficient shares', async () => {
      const profile = await prismaService.profile.create({
        data: {
          userId: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          price: 100000,
          totalShares: 1000,
          availableShares: 5, // Only 5 shares available
          propertyAddress: '123 Test St'
        }
      });

      const createOrderDto = {
        userId: profile.userId,
        listingId: listing.id,
        quantity: 10 // Requesting 10 shares but only 5 available
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(400);
    });
  });

  describe('POST /orders/fiat/webhook', () => {
    it('should process successful fiat payment and return SUCCESS', async () => {
      // Create test data
      const profile = await prismaService.profile.create({
        data: {
          userId: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          wallet: 'test-wallet-address'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          price: 100000,
          totalShares: 1000,
          availableShares: 1000,
          propertyAddress: '123 Test St'
        }
      });

      const order = await prismaService.order.create({
        data: {
          userId: profile.userId,
          listingId: listing.id,
          quantity: 10,
          totalAmount: 10,
          status: 'PENDING'
        }
      });

      const webhookDto = {
        orderId: order.id,
        status: 'SUCCESS',
        transactionHash: 'mock-tx-hash-123'
      };

      const response = await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: order.id,
        message: 'Order completed successfully'
      });

      // Verify order was updated to COMPLETED
      const updatedOrder = await prismaService.order.findUnique({
        where: { id: order.id }
      });
      expect(updatedOrder.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent order', async () => {
      const webhookDto = {
        orderId: 'non-existent-order',
        status: 'SUCCESS'
      };

      await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(404);
    });

    it('should handle failed payment', async () => {
      const profile = await prismaService.profile.create({
        data: {
          userId: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          price: 100000,
          totalShares: 1000,
          availableShares: 1000,
          propertyAddress: '123 Test St'
        }
      });

      const order = await prismaService.order.create({
        data: {
          userId: profile.userId,
          listingId: listing.id,
          quantity: 10,
          totalAmount: 10,
          status: 'PENDING'
        }
      });

      const webhookDto = {
        orderId: order.id,
        status: 'FAILED'
      };

      const response = await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: false,
        orderId: order.id,
        message: 'Payment failed'
      });

      // Verify order was updated to FAILED
      const updatedOrder = await prismaService.order.findUnique({
        where: { id: order.id }
      });
      expect(updatedOrder.status).toBe('FAILED');
    });
  });
});