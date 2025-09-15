// Minimal utility to map between Amplication naming differences if present.
export type OrderStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface OrderLike {
  id: string;
  userId: string;
  listingId: string;
  quantity: number;
  status: OrderStatus;
  createdAt?: Date;
}

export function toOrderLike(input: any): OrderLike {
  return {
    id: input.id ?? input.orderId,
    userId: input.userId ?? input.user_id,
    listingId: input.listingId ?? input.listing_id,
    quantity: input.quantity ?? input.qty ?? 0,
    status: (input.status ?? 'PENDING') as OrderStatus,
    createdAt: input.createdAt ?? input.created_at,
  };
}

