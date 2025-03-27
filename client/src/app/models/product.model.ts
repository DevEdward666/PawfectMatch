export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: 'food' | 'toys' | 'accessories' | 'grooming' | 'other';
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductForm {
  name: string;
  description?: string;
  price: number;
  category: 'food' | 'toys' | 'accessories' | 'grooming' | 'other';
  stock: number;
}
