import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { OrderType } from './schema/order.schema.js';
import { CreateOrderInput, UpdateOrderStatusInput } from './args/order.args.js';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/auth.service.js';
import { UserRole } from '../user/entity/user.entity.js';

@Resolver(() => OrderType)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => OrderType, { name: 'createOrder' })
  @UseGuards(GqlAuthGuard)
  async createOrder(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateOrderInput,
  ) {
    const order = await this.orderService.createOrder(user.sub, input);
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
    };
  }

  @Query(() => [OrderType], { name: 'myOrders' })
  @UseGuards(GqlAuthGuard)
  async getMyOrders(@CurrentUser() user: JwtPayload) {
    const orders = await this.orderService.getMyOrders(user.sub);
    return orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  @Query(() => [OrderType], { name: 'allOrders' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllOrders() {
    const orders = await this.orderService.getAllOrders();
    return orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    }));
  }

  @Mutation(() => OrderType, { name: 'updateOrderStatus' })
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateOrderStatus(@Args('input') input: UpdateOrderStatusInput) {
    const order = await this.orderService.updateOrderStatus(input);
    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
