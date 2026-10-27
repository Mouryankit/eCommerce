import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { OrderStatus } from '../entity/order.entity.js';

@InputType()
export class CreateOrderItemInput {
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

@InputType()
export class CreateOrderInput {
  @Field(() => [CreateOrderItemInput])
  items: CreateOrderItemInput[];

  @Field()
  customerName: string;

  @Field()
  customerEmail: string;

  @Field()
  shippingAddress: string;

  @Field({ nullable: true })
  city?: string;
}

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => Int)
  orderId: number;

  @Field(() => OrderStatus)
  status: OrderStatus;
}
