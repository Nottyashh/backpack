import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Listing ID' })
  @IsString()
  listingId: string;

  @ApiProperty({ description: 'Number of fractions to purchase' })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Total amount in USDC' })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class FiatWebhookDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment status' })
  @IsString()
  status: string;

  @ApiProperty({ description: 'Transaction hash (optional)' })
  @IsOptional()
  @IsString()
  txHash?: string;
}