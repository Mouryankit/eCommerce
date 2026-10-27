import type { Order, OrderStatus } from '../types';
import { graphqlRequest } from './apiClient';

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
