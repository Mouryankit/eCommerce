import type { Product, Category, User, Order, OrderStatus } from '../types';
import { resolveImageUrl } from '../utils/image';

export const GRAPHQL_URL =
  (import.meta.env.VITE_GRAPHQL_URL as string) || 'http://localhost:8000/graphql';
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem('aura_token');
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem('aura_token', token);
    } else {
      localStorage.removeItem('aura_token');
    }
  } catch {
    // Ignore storage errors
  }
}

export async function graphqlRequest<T = any>(
  query: string,
  variables?: Record<string, unknown>,
  tokenOverride?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const token = tokenOverride || getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok || result.errors?.length) {
      const errorMsg = result.errors?.[0]?.message ?? `GraphQL request failed with HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    return result.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function checkBackendConnection(): Promise<boolean> {
  try {
    const data = await graphqlRequest<{ getAllProduct?: unknown[] }>(`
      query HealthCheck {
        getAllProduct {
          id
        }
      }
    `);
    return Boolean(data);
  } catch {
    return false;
  }
}

// ==========================================
// Authentication API
// ==========================================

export async function loginToBackend(email: string, password: string): Promise<{
  token: string;
  user: User;
  redirectUrl: string;
}> {
  const data = await graphqlRequest<{
    login: {
      token: string;
      redirectUrl: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    };
  }>(
    `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          redirectUrl
          user {
            id
            name
            email
            role
            avatar
          }
        }
      }
    `,
    { input: { email, password } }
  );

  const res = data.login;
  setStoredToken(res.token);

  return {
    token: res.token,
    redirectUrl: res.redirectUrl,
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role.toUpperCase() === 'ADMIN' ? 'admin' : 'customer',
      avatar: res.user.avatar,
    },
  };
}

export async function registerToBackend(name: string, email: string, password: string): Promise<{
  token: string;
  user: User;
  redirectUrl: string;
}> {
  const data = await graphqlRequest<{
    register: {
      token: string;
      redirectUrl: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    };
  }>(
    `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          redirectUrl
          user {
            id
            name
            email
            role
            avatar
          }
        }
      }
    `,
    { input: { name, email, password } }
  );

  const res = data.register;
  setStoredToken(res.token);

  return {
    token: res.token,
    redirectUrl: res.redirectUrl,
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: 'customer',
      avatar: res.user.avatar,
    },
  };
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const data = await graphqlRequest<{
      me: {
        id: number;
        name: string;
        email: string;
        role: string;
        avatar?: string;
      };
    }>(`
      query GetCurrentUser {
        me {
          id
          name
          email
          role
          avatar
        }
      }
    `);

    if (!data.me) return null;

    return {
      id: data.me.id,
      name: data.me.name,
      email: data.me.email,
      role: data.me.role.toUpperCase() === 'ADMIN' ? 'admin' : 'customer',
      avatar: data.me.avatar,
    };
  } catch {
    return null;
  }
}

// ==========================================
// Product Management API
// ==========================================

function mapBackendProduct(item: {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
}): Product {
  let category: Category;
  let cleanDesc = item.description || '';

  const categoryMatch = item.description?.match(/^\[(Electronics|Apparel|Accessories|Home)\]\s*(.*)$/i);
  if (categoryMatch) {
    const catFound = categoryMatch[1];
    const validCats: Category[] = ['Electronics', 'Apparel', 'Accessories', 'Home'];
    category = validCats.find((c) => c.toLowerCase() === catFound.toLowerCase()) || 'Home';
    cleanDesc = categoryMatch[2];
  } else {
    const text = `${item.name} ${item.description}`.toLowerCase();
    if (text.includes('headphone') || text.includes('dac') || text.includes('charger') || text.includes('speaker') || text.includes('wireless') || text.includes('electronics')) {
      category = 'Electronics';
    } else if (text.includes('shirt') || text.includes('wool') || text.includes('cardigan') || text.includes('cotton') || text.includes('pant') || text.includes('apparel')) {
      category = 'Apparel';
    } else if (text.includes('watch') || text.includes('duffle') || text.includes('sunglasses') || text.includes('wallet') || text.includes('bag') || text.includes('accessories')) {
      category = 'Accessories';
    } else {
      category = 'Home';
    }
  }

  const fullImageUrl = resolveImageUrl(item.imageUrl, item.name, category);

  return {
    id: item.id,
    name: item.name,
    description: cleanDesc,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    imageUrl: fullImageUrl,
    category,
    rating: 4.5 + ((item.id * 17) % 5) / 10,
    reviewCount: 20 + ((item.id * 31) % 150),
  };
}

export async function fetchAllProductsFromBackend(): Promise<Product[]> {
  const data = await graphqlRequest<{
    getAllProduct: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl: string;
      price: number;
      quantity: number;
    }>;
  }>(`
    query GetAllProduct {
      getAllProduct {
        id
        name
        description
        imageUrl
        price
        quantity
      }
    }
  `);

  return (data.getAllProduct || []).map(mapBackendProduct);
}

export async function fetchPaginatedProductsFromBackend(
  limit?: number | null,
  offset?: number | null,
  category?: string,
  search?: string
): Promise<{ items: Product[]; total: number; limit?: number; offset?: number }> {
  const variables: Record<string, unknown> = {};
  if (typeof limit === 'number' && limit > 0) {
    variables.limit = limit;
  }
  if (typeof offset === 'number' && offset >= 0) {
    variables.offset = offset;
  }
  if (category && category !== 'All') {
    variables.category = category;
  }
  if (search && search.trim()) {
    variables.search = search.trim();
  }

  const data = await graphqlRequest<{
    products: {
      items: Array<{
        id: number;
        name: string;
        description: string;
        imageUrl: string;
        price: number;
        quantity: number;
      }>;
      total: number;
      limit?: number;
      offset?: number;
    };
  }>(
    `
      query GetProducts($limit: Int, $offset: Int, $category: String, $search: String) {
        products(limit: $limit, offset: $offset, category: $category, search: $search) {
          items {
            id
            name
            description
            imageUrl
            price
            quantity
          }
          total
          limit
          offset
        }
      }
    `,
    variables
  );

  const rawItems = data.products?.items || [];
  const total = Number(data.products?.total) || 0;

  return {
    items: rawItems.map(mapBackendProduct),
    total,
    limit: data.products?.limit,
    offset: data.products?.offset,
  };
}

import { uploadProductImage } from './imageUploadService';
export { uploadProductImage };
export const uploadImageToBackend = uploadProductImage;

export async function createProductOnBackend(product: {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category?: string;
}): Promise<string> {
  const formattedDesc = product.category && product.category !== 'All'
    ? `[${product.category}] ${product.description}`
    : product.description;

  const data = await graphqlRequest<{ addproduct: string }>(
    `
      mutation AddProduct($addProductArgs: AddProductArgs!) {
        addproduct(addProductArgs: $addProductArgs)
      }
    `,
    {
      addProductArgs: {
        name: product.name,
        description: formattedDesc,
        imageUrl: product.imageUrl,
        price: Number(product.price),
        quantity: Number(product.quantity),
      },
    }
  );

  return data.addproduct;
}

export async function updateProductOnBackend(
  id: number,
  product: {
    name?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    quantity?: number;
    category?: string;
  }
): Promise<string> {
  const formattedDesc = product.category && product.description
    ? `[${product.category}] ${product.description}`
    : product.description;

  const data = await graphqlRequest<{ updateProduct: string }>(
    `
      mutation UpdateProduct($updateProductArgs: UpdateProductArgs!) {
        updateProduct(updateProductArgs: $updateProductArgs)
      }
    `,
    {
      updateProductArgs: {
        id,
        ...(product.name !== undefined ? { name: product.name } : {}),
        ...(formattedDesc !== undefined ? { description: formattedDesc } : {}),
        ...(product.imageUrl !== undefined ? { imageUrl: product.imageUrl } : {}),
        ...(product.price !== undefined ? { price: Number(product.price) } : {}),
        ...(product.quantity !== undefined ? { quantity: Number(product.quantity) } : {}),
      },
    }
  );

  return data.updateProduct;
}

export async function deleteProductOnBackend(id: number): Promise<string> {
  const data = await graphqlRequest<{ deleteproduct: string }>(
    `
      mutation DeleteProduct($productId: Int!) {
        deleteproduct(productId: $productId)
      }
    `,
    { productId: id }
  );

  return data.deleteproduct;
}

// ==========================================
// Order Management API
// ==========================================

export async function createOrderOnBackend(orderInput: {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city?: string;
  items: Array<{
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
}): Promise<Order> {
  const data = await graphqlRequest<{ createOrder: Order }>(
    `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          orderNumber
          customerName
          customerEmail
          totalAmount
          status
          shippingAddress
          city
          createdAt
          items {
            id
            productId
            productName
            price
            quantity
            imageUrl
          }
        }
      }
    `,
    { input: orderInput }
  );

  return data.createOrder;
}

export async function fetchMyOrdersFromBackend(): Promise<Order[]> {
  const data = await graphqlRequest<{ myOrders: Order[] }>(`
    query GetMyOrders {
      myOrders {
        id
        orderNumber
        customerName
        customerEmail
        totalAmount
        status
        shippingAddress
        city
        createdAt
        items {
          id
          productId
          productName
          price
          quantity
          imageUrl
        }
      }
    }
  `);

  return data.myOrders || [];
}

export async function fetchAllOrdersFromBackend(): Promise<Order[]> {
  const data = await graphqlRequest<{ allOrders: Order[] }>(`
    query GetAllOrders {
      allOrders {
        id
        orderNumber
        customerName
        customerEmail
        totalAmount
        status
        shippingAddress
        city
        createdAt
        items {
          id
          productId
          productName
          price
          quantity
          imageUrl
        }
      }
    }
  `);

  return data.allOrders || [];
}

export async function updateOrderStatusOnBackend(
  orderId: number,
  status: OrderStatus
): Promise<Order> {
  const data = await graphqlRequest<{ updateOrderStatus: Order }>(
    `
      mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
        updateOrderStatus(input: $input) {
          id
          orderNumber
          status
        }
      }
    `,
    { input: { orderId, status } }
  );

  return data.updateOrderStatus;
}
