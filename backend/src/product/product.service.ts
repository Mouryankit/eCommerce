import { Injectable, NotFoundException, BadRequestException, Optional } from "@nestjs/common";
import { Repository } from "typeorm";
import { ProductEntity } from "./entity/product.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { AddProductArgs } from "./args/addProduct.args.js";
import { UpdateProductArgs } from "./args/updateProduct.args.js"; 
import { CloudinaryService } from "../cloudinary/cloudinary.service.js";

export interface PaginatedResult {
    items: ProductEntity[];
    total: number;
    limit?: number;
    offset?: number;
}

@Injectable()
export class ProductService {

    constructor(
        @InjectRepository(ProductEntity) public readonly productRepo: Repository<ProductEntity>,
        @Optional() private readonly cloudinaryService?: CloudinaryService,
    ) { }

    async findAllProduct(): Promise<ProductEntity[]> {
        let product = await this.productRepo.find();
        return product;
    }

    async findPaginatedProducts(
        limit?: number,
        offset?: number,
        category?: string,
        search?: string,
    ): Promise<PaginatedResult> {
        // Validation: handle invalid pagination arguments
        if (offset !== undefined && offset !== null && (typeof offset !== 'number' || isNaN(offset) || offset < 0 || !Number.isInteger(offset))) {
            throw new BadRequestException('Offset must be a non-negative integer');
        }
        if (limit !== undefined && limit !== null && (typeof limit !== 'number' || isNaN(limit) || limit < 0 || !Number.isInteger(limit))) {
            throw new BadRequestException('Limit must be a non-negative integer or omitted');
        }

        const safeOffset = offset && offset > 0 ? offset : 0;
        const hasFilter = (search && search.trim().length > 0) || (category && category !== 'All');

        if (!hasFilter) {
            // Handle "All products" separately (Requirement 5):
            // When limit is omitted, null, or 0, retrieve all available products without limiting to 50
            if (limit === undefined || limit === null || limit === 0) {
                const [items, total] = await this.productRepo.findAndCount({
                    order: { id: 'ASC' },
                    skip: safeOffset > 0 ? safeOffset : undefined,
                });
                return {
                    items,
                    total,
                    limit: undefined,
                    offset: safeOffset,
                };
            }

            // Standard server-side pagination with skip and take (LIMIT & OFFSET in PostgreSQL)
            const [items, total] = await this.productRepo.findAndCount({
                skip: safeOffset,
                take: limit,
                order: { id: 'ASC' },
            });

            return {
                items,
                total,
                limit,
                offset: safeOffset,
            };
        }

        // When search / category filters are applied, use query builder
        const queryBuilder = this.productRepo.createQueryBuilder('product');

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(product.name) LIKE :term OR LOWER(product.description) LIKE :term)',
                { term },
            );
        }

        if (category && category !== 'All') {
            const catPrefix = `[${category.toLowerCase()}]%`;
            const catTerm = `%${category.toLowerCase()}%`;
            queryBuilder.andWhere(
                '(LOWER(product.description) LIKE :catPrefix OR LOWER(product.description) LIKE :catTerm OR LOWER(product.name) LIKE :catTerm)',
                { catPrefix, catTerm },
            );
        }

        queryBuilder.orderBy('product.id', 'ASC');

        if (limit !== undefined && limit !== null && limit > 0) {
            queryBuilder.skip(safeOffset).take(limit);
        } else if (safeOffset > 0) {
            queryBuilder.skip(safeOffset);
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items,
            total,
            limit: (limit && limit > 0) ? limit : undefined,
            offset: safeOffset,
        };
    }

    async findProductById(id: number): Promise<ProductEntity> {
        let product = await this.productRepo.findOne({ where: { id: id } });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async delteProduct(id: number): Promise<string> {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // Clean up Cloudinary asset if hosted on Cloudinary
        if (product.imageUrl && this.cloudinaryService) {
            await this.cloudinaryService.deleteImage(product.imageUrl);
        }

        await this.productRepo.delete(id);
        return "Product has deleted";
    }

    async addProduct(addProductArgs: AddProductArgs): Promise<string> {
        let product = new ProductEntity(); 

        product.name = addProductArgs.name; 
        product.description = addProductArgs.description; 
        product.imageUrl = addProductArgs.imageUrl; 
        product.price = addProductArgs.price; 
        product.quantity = addProductArgs.quantity; 

        await this.productRepo.save(product); 
        return "Product has been Added successFully"; 
    }
    
    async updateProduct(updateProductArgs: UpdateProductArgs): Promise<string> {
        const product = await this.productRepo.findOne({where: {
            id: updateProductArgs.id
        }}); 
        if (!product) {
            throw new NotFoundException(
            `Product with ID ${updateProductArgs.id} not found`,
            );
        }
        if (updateProductArgs.name !== undefined)  product.name = updateProductArgs.name;
        if (updateProductArgs.description !== undefined)  product.description = updateProductArgs.description;
        if (updateProductArgs.imageUrl !== undefined && updateProductArgs.imageUrl !== product.imageUrl) {
            // If the image was replaced, remove the old image from Cloudinary
            if (product.imageUrl && this.cloudinaryService) {
                await this.cloudinaryService.deleteImage(product.imageUrl);
            }
            product.imageUrl = updateProductArgs.imageUrl;
        }
        if (updateProductArgs.price !== undefined)  product.price = updateProductArgs.price;
        if (updateProductArgs.quantity !== undefined)  product.quantity = updateProductArgs.quantity;  

        await this.productRepo.save(product); 
        return "Product has been successFully updated"; 
    }
}
