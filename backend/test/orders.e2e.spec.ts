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
    await prismaService.transaction.deleteMany();
    await prismaService.holding.deleteMany();
    await prismaService.order.deleteMany();
    await prismaService.listing.deleteMany();
    await prismaService.profile.deleteMany();
  });

  describe('POST /orders', () => {
    it('should create a PENDING order', async () => {
      // Create test user and listing
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User',
          wallet: '11111111111111111111111111111111'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          description: 'A beautiful test property',
          price: 1000000,
          totalSupply: 1000,
          location: 'Test City'
        }
      });

      const createOrderDto = {
        userId: user.id,
        listingId: listing.id,
        quantity: 10,
        amount: 10000
      };

      const response = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toMatchObject({
        userId: user.id,
        listingId: listing.id,
        quantity: 10,
        amount: 10000,
        status: 'PENDING'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property',
          description: 'A beautiful test property',
          price: 1000000,
          totalSupply: 1000,
          location: 'Test City'
        }
      });

      const createOrderDto = {
        userId: 'non-existent-user',
        listingId: listing.id,
        quantity: 10,
        amount: 10000
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(400);
    });

    it('should return 400 for non-existent listing', async () => {
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-2',
          email: 'test2@example.com',
          name: 'Test User 2',
          wallet: '22222222222222222222222222222222'
        }
      });

      const createOrderDto = {
        userId: user.id,
        listingId: 'non-existent-listing',
        quantity: 10,
        amount: 10000
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(400);
    });
  });

  describe('POST /orders/fiat/webhook', () => {
    it('should process fiat webhook and return SUCCESS with mock tx sigs', async () => {
      // Create test user, listing, and order
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-3',
          email: 'test3@example.com',
          name: 'Test User 3',
          wallet: '33333333333333333333333333333333'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property 2',
          description: 'Another beautiful test property',
          price: 2000000,
          totalSupply: 2000,
          location: 'Test City 2'
        }
      });

      const order = await prismaService.order.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          quantity: 20,
          amount: 20000,
          status: 'PENDING'
        }
      });

      const webhookDto = {
        orderId: order.id,
        status: 'success'
      };

      const response = await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        escrowTxHash: expect.stringMatching(/^mock_escrow_\d+$/),
        deedTxHash: expect.stringMatching(/^mock_deed_\d+$/)
      });
      expect(response.body.order.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent order', async () => {
      const webhookDto = {
        orderId: 'non-existent-order',
        status: 'success'
      };

      await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(400);
    });

    it('should return 400 for non-PENDING order', async () => {
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-4',
          email: 'test4@example.com',
          name: 'Test User 4',
          wallet: '44444444444444444444444444444444'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property 3',
          description: 'Yet another beautiful test property',
          price: 3000000,
          totalSupply: 3000,
          location: 'Test City 3'
        }
      });

      const order = await prismaService.order.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          quantity: 30,
          amount: 30000,
          status: 'COMPLETED' // Already completed
        }
      });

      const webhookDto = {
        orderId: order.id,
        status: 'success'
      };

      await request(app.getHttpServer())
        .post('/orders/fiat/webhook')
        .send(webhookDto)
        .expect(400);
    });
  });

  describe('GET /orders/user/:userId', () => {
    it('should return user orders', async () => {
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-5',
          email: 'test5@example.com',
          name: 'Test User 5',
          wallet: '55555555555555555555555555555555'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property 4',
          description: 'Another test property',
          price: 4000000,
          totalSupply: 4000,
          location: 'Test City 4'
        }
      });

      await prismaService.order.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          quantity: 40,
          amount: 40000,
          status: 'PENDING'
        }
      });

      const response = await request(app.getHttpServer())
        .get(`/orders/user/${user.id}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe(user.id);
    });
  });

  describe('GET /orders/:orderId', () => {
    it('should return order by ID', async () => {
      const user = await prismaService.profile.create({
        data: {
          userId: 'test-user-6',
          email: 'test6@example.com',
          name: 'Test User 6',
          wallet: '66666666666666666666666666666666'
        }
      });

      const listing = await prismaService.listing.create({
        data: {
          title: 'Test Property 5',
          description: 'Final test property',
          price: 5000000,
          totalSupply: 5000,
          location: 'Test City 5'
        }
      });

      const order = await prismaService.order.create({
        data: {
          userId: user.id,
          listingId: listing.id,
          quantity: 50,
          amount: 50000,
          status: 'PENDING'
        }
      });

      const response = await request(app.getHttpServer())
        .get(`/orders/${order.id}`)
        .expect(200);

      expect(response.body.id).toBe(order.id);
      expect(response.body.userId).toBe(user.id);
      expect(response.body.listingId).toBe(listing.id);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/orders/non-existent-order')
        .expect(404);
    });
  });
});