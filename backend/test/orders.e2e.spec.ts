import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Orders (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ listingId: '00000000-0000-0000-0000-000000000000', quantity: 1, userId: '11111111-1111-1111-1111-111111111111' })
      .expect(201);
    expect(res.body.status).toBe('PENDING');
  });

  it('/orders/fiat/webhook (POST)', async () => {
    // create order first
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({ listingId: '00000000-0000-0000-0000-000000000000', quantity: 1, userId: '11111111-1111-1111-1111-111111111111' });
    const orderId = orderRes.body.id;

    const res = await request(app.getHttpServer())
      .post('/orders/fiat/webhook')
      .send({ orderId })
      .expect(201);

    expect(res.body.order.status).toBe('COMPLETED');
  });
});