
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER"
}

export enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface CreateOrderInput {
    items: CreateOrderItemInput[];
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    city?: Nullable<string>;
}

export interface CreateOrderItemInput {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: Nullable<string>;
}

export interface UpdateOrderStatusInput {
    orderId: number;
    status: OrderStatus;
}

export interface AddProductArgs {
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    quantity: number;
}

export interface UpdateProductArgs {
    id: number;
    name?: Nullable<string>;
    description?: Nullable<string>;
    imageUrl?: Nullable<string>;
    price?: Nullable<number>;
    quantity?: Nullable<number>;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    quantity: number;
}

export interface PaginatedProducts {
    items: Product[];
    total: number;
    limit?: Nullable<number>;
    offset?: Nullable<number>;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    avatar?: Nullable<string>;
}

export interface AuthResponse {
    token: string;
    user: User;
    redirectUrl: string;
}

export interface OrderItem {
    id: number;
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    imageUrl?: Nullable<string>;
}

export interface Order {
    id: number;
    orderNumber: string;
    userId?: Nullable<number>;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    city?: Nullable<string>;
    items: OrderItem[];
    createdAt: string;
}

export interface IQuery {
    index(): string | Promise<string>;
    me(): User | Promise<User>;
    myOrders(): Order[] | Promise<Order[]>;
    allOrders(): Order[] | Promise<Order[]>;
    getAllProduct(): Product[] | Promise<Product[]>;
    products(limit?: Nullable<number>, offset?: Nullable<number>, category?: Nullable<string>, search?: Nullable<string>): PaginatedProducts | Promise<PaginatedProducts>;
    getPaginatedProducts(limit?: Nullable<number>, offset?: Nullable<number>, category?: Nullable<string>, search?: Nullable<string>): PaginatedProducts | Promise<PaginatedProducts>;
    productById(productId: number): Product | Promise<Product>;
}

export interface IMutation {
    login(input: LoginInput): AuthResponse | Promise<AuthResponse>;
    register(input: RegisterInput): AuthResponse | Promise<AuthResponse>;
    promoteToAdmin(email: string): boolean | Promise<boolean>;
    createOrder(input: CreateOrderInput): Order | Promise<Order>;
    updateOrderStatus(input: UpdateOrderStatusInput): Order | Promise<Order>;
    deleteproduct(productId: number): string | Promise<string>;
    addproduct(addProductArgs: AddProductArgs): string | Promise<string>;
    updateProduct(updateProductArgs: UpdateProductArgs): string | Promise<string>;
    uploadProductImage(file: Upload): string | Promise<string>;
}

export type Upload = any;
type Nullable<T> = T | null;
