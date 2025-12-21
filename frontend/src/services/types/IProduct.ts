export interface IProduct {
  id: string;
  name: string;
  shortDescription: string;
  price: number;
  category: string;
  isActive: boolean;
  artisanId: string;
  displayName: string | null;
  stock: number;
  shopName: string | null;
  rating: number;
  imageUrl: string | null;
}