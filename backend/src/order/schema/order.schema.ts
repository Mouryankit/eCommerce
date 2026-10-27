import { ObjectType, Field, Int, Float, registerEnumType } from '@nestjs/graphql';
import { OrderStatus } from '../entity/order.entity.js';

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Lifecycle statuses for store orders',
});

@ObjectType('OrderItem')
export class OrderItemType {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  productId: number;

  @Field()
  productName: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int)
  quantity: number;

  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType('Order')
export class OrderType {
  @Field(() => Int)
  id: number;

  @Field()
  orderNumber: string;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field()
  customerName: string;

  @Field()
  customerEmail: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field()
  shippingAddress: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => [OrderItemType])
  items: OrderItemType[];

  @Field()
  createdAt: string;
}
