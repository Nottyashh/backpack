import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Orders (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders returns PENDING', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ userId: '00000000-0000-0000-0000-000000000000', listingId: '00000000-0000-0000-0000-000000000001', quantity: 5 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.id).toBeDefined();
  });

  it('POST /orders/fiat/webhook returns SUCCESS with mock tx sigs', async () => {
    const create = await request(app.getHttpServer())
      .post('/orders')
      .send({ userId: '00000000-0000-0000-0000-000000000000', listingId: '00000000-0000-0000-0000-000000000001', quantity: 2 });
    const orderId = create.body.id;
    const res = await request(app.getHttpServer())
      .post('/orders/fiat/webhook')
      .send({ orderId });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUCCESS');
    // When IDL placeholders, tx sigs are mocked
    expect(typeof res.body.escrowTx).toBe('string');
    expect(typeof res.body.deedTx).toBe('string');
  });
});

