import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders -> returns PENDING', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ userId: '11111111-1111-1111-1111-111111111111', listingId: '22222222-2222-2222-2222-222222222222', quantity: 5 })
      .expect(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.id).toBeDefined();
  });

  it('POST /orders/fiat/webhook -> returns SUCCESS with mock txs', async () => {
    const create = await request(app.getHttpServer())
      .post('/orders')
      .send({ userId: '11111111-1111-1111-1111-111111111111', listingId: '22222222-2222-2222-2222-222222222222', quantity: 2 })
      .expect(201);
    const orderId = create.body.id;
    const webhook = await request(app.getHttpServer())
      .post('/orders/fiat/webhook')
      .send({ orderId })
      .expect(200);
    expect(webhook.body.status).toBe('SUCCESS');
    expect(webhook.body.escrowTx).toBeDefined();
    expect(webhook.body.mintTx).toBeDefined();
  });
});

