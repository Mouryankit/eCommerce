import { Module } from '@nestjs/common';
import { ProductEntity } from './entity/product.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductResolver } from './product.resolver.js';
import { ProductService } from './product.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    CloudinaryModule,
  ],
  controllers: [],
  providers: [ProductResolver, ProductService],
  exports: [ProductService],
})
export class ProductModule {}
