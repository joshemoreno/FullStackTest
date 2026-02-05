export type Product = {
  productId: string;
  name: string;
  description: string;
  price_in_cents: number;
  imageUrl?: string;
  stock: number;
  active: boolean;
};