import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity, OrderItemEntity } from './entity/order.entity.js';
import { ProductEntity } from '../product/entity/product.entity.js';
import { OrderService } from './order.service.js';
import { OrderResolver } from './order.resolver.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, ProductEntity]),
  ],
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
