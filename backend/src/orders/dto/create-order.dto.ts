import { IsString, IsNumber, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PaymentMethod {
  FIAT = 'FIAT',
  CRYPTO = 'CRYPTO',
}

export class CreateOrderDto {
  @IsString()
  userId: string;

  @IsString()
  listingId: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  quantity: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.FIAT;
}

export class FiatWebhookDto {
  @IsString()
  orderId: string;

  @IsString()
  status: string; // 'success', 'failed'

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}