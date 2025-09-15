import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FiatPaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export class FiatWebhookDto {
  @ApiProperty({
    description: 'Order ID to process',
    example: 'order_789'
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'Payment status',
    enum: FiatPaymentStatus,
    example: FiatPaymentStatus.SUCCESS
  })
  @IsEnum(FiatPaymentStatus)
  status: FiatPaymentStatus;

  @ApiProperty({
    description: 'Transaction hash from payment processor',
    example: 'tx_abc123',
    required: false
  })
  @IsString()
  transactionHash?: string;
}