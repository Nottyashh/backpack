import { IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  listingId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  // In real app derive from auth token
  @IsUUID()
  userId: string;
}