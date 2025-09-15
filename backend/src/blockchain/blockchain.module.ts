import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainProvider } from './provider';
import { EscrowClient } from './escrow.client';
import { DeedClient } from './deed.client';

@Module({
  imports: [ConfigModule],
  providers: [BlockchainProvider, EscrowClient, DeedClient],
  exports: [BlockchainProvider, EscrowClient, DeedClient],
})
export class BlockchainModule {}