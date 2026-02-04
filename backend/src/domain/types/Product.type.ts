export type Product = {
  productId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
  active: boolean;
};