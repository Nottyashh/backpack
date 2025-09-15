import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'User ID who is placing the order',
    example: 'user_123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Listing ID for the property',
    example: 'listing_456'
  })
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @ApiProperty({
    description: 'Number of shares to purchase',
    example: 10,
    minimum: 1
  })
  @IsNumber()
  @IsPositive()
  quantity: number;
}