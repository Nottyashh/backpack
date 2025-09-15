import { Test } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('OrdersService', () => {
  it('creates a pending order in memory without DB', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [OrdersService, PrismaService],
    }).compile();
    const svc = moduleRef.get(OrdersService);
    const order = await svc.createPendingOrder({
      userId: '11111111-1111-1111-1111-111111111111',
      listingId: '22222222-2222-2222-2222-222222222222',
      quantity: 1,
    });
    expect(order.status).toBe('PENDING');
  });
});

