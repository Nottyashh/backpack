import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId!: string; // Supabase profile id

  @IsUUID()
  listingId!: string; // Property listing id

  @IsNumber()
  quantity!: number; // Number of fractions to purchase

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g., 'fiat'
}

