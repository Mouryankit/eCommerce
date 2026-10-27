export type Category = 'All' | 'Electronics' | 'Apparel' | 'Accessories' | 'Home';

export type PageSizeOption = 5 | 10 | 20 | 50 | 'all';

export interface PaginatedProductsResponse {
  items: Product[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category?: Category;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  badge?: string;
  originalPrice?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type UserRole = 'ADMIN' | 'USER' | 'admin' | 'customer';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  orderNumber: string;
  userId?: number;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  city?: string;
  items: OrderItem[];
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export type ViewMode = 'shop' | 'admin';
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name-asc';
