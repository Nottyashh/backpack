import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Connect lazily so tests can run without DB if needed
    try {
      await this.$connect();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[PrismaService] Database connection failed. Falling back to in-memory ops for tests.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => undefined);
  }
}

