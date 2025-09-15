import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId!: string; // maps to profiles.id

  @IsUUID()
  listingId!: string;

  @IsNumber()
  quantity!: number; // number of fractions

  @IsOptional()
  @IsString()
  fiatPaymentId?: string; // optional external reference
}

