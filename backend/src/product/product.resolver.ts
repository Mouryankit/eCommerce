import { Resolver } from "@nestjs/graphql";
import { Product, PaginatedProducts } from "./schema/product.schema.js";
import { ProductService } from "./product.service.js";
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";
import { Args, Int, Query, Mutation } from '@nestjs/graphql';
import { AddProductArgs } from "./args/addProduct.args.js";
import { UpdateProductArgs } from "./args/updateProduct.args.js";

import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { extname } from 'node:path';

import { GqlAuthGuard } from '../auth/guards/gql-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../user/entity/user.entity.js';

@Resolver(() => Product)
export class ProductResolver {

    constructor(
        private readonly productService: ProductService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    @Query(() => [Product])
    getAllProduct() {
        return this.productService.findAllProduct();
    }

    @Query(() => PaginatedProducts, { name: "products" })
    getProducts(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @Args('offset', { type: () => Int, nullable: true }) offset?: number,
        @Args('category', { type: () => String, nullable: true }) category?: string,
        @Args('search', { type: () => String, nullable: true }) search?: string,
    ) {
        return this.productService.findPaginatedProducts(limit, offset, category, search);
    }

    @Query(() => PaginatedProducts, { name: "getPaginatedProducts" })
    getPaginatedProducts(
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
        @Args('offset', { type: () => Int, nullable: true }) offset?: number,
        @Args('category', { type: () => String, nullable: true }) category?: string,
        @Args('search', { type: () => String, nullable: true }) search?: string,
    ) {
        return this.productService.findPaginatedProducts(limit, offset, category, search);
    }

    @Query(() => Product, { name: "productById" })
    getProductById(@Args('productId', { type: () => Int }) id: number) {
        return this.productService.findProductById(id);
    }

    @Mutation(() => String, { name: 'deleteproduct' })
    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    deleteProductById(@Args('productId', { type: () => Int }) id: number,) {
        return this.productService.delteProduct(id);
    }

    @Mutation(() => String, { name: 'addproduct' })
    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    addProduct(@Args('addProductArgs') addProductArgs: AddProductArgs) {
        return this.productService.addProduct(addProductArgs);
    }

    @Mutation(() => String, { name: 'updateProduct' })
    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    updateProduct(@Args('updateProductArgs') updateProductArgs: UpdateProductArgs) {
        return this.productService.updateProduct(updateProductArgs);
    }

    @Mutation(() => String, { name: 'uploadProductImage' })
    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async uploadProductImage(
        @Args({ name: 'file', type: () => GraphQLUpload })
        file: Promise<FileUpload>,
    ): Promise<string> {
        const { createReadStream, filename, mimetype } = await file;

        // 1. Validate MIME type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimes.includes(mimetype)) {
            throw new BadRequestException('Only JPEG, PNG and WebP images are allowed');
        }

        // 2. Validate file extension
        const extension = extname(filename).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowedExtensions.includes(extension)) {
            throw new BadRequestException('Invalid image extension. Only .jpg, .png, and .webp are accepted');
        }

        // 3. Stream directly to Cloudinary (enforces 5MB limit and returns HTTPS secure_url)
        const inStream = createReadStream();
        return this.cloudinaryService.uploadImageStream(inStream);
    }

}
