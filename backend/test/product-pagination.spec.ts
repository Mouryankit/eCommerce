import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../src/product/product.service.js';
import { ProductResolver } from '../src/product/product.resolver.js';
import { ProductEntity } from '../src/product/entity/product.entity.js';
import { BadRequestException } from '@nestjs/common';

describe('Server-Side Product Pagination Tests (TypeORM & GraphQL)', () => {
  let productService: ProductService;
  let productResolver: ProductResolver;
  let mockProductRepo: any;
  let sampleProducts: ProductEntity[];

  beforeEach(() => {
    // Generate 25 sample products in mock database
    sampleProducts = Array.from({ length: 25 }, (_, i) => {
      const p = new ProductEntity();
      p.id = i + 1;
      p.name = `Product ${i + 1}`;
      p.description = i % 2 === 0 ? `[Electronics] Premium device #${i + 1}` : `[Apparel] Cotton item #${i + 1}`;
      p.imageUrl = `/uploads/products/sample-${i + 1}.webp`;
      p.price = 50 + i * 5;
      p.quantity = 10 + i;
      p.createdAt = new Date(2026, 0, i + 1);
      return p;
    });

    mockProductRepo = {
      findAndCount: vi.fn(async ({ skip, take }: any) => {
        const sorted = [...sampleProducts].sort((a, b) => a.id - b.id);
        const start = skip || 0;
        const end = take !== undefined ? start + take : sorted.length;
        const items = sorted.slice(start, end);
        return [items, sorted.length];
      }),
      createQueryBuilder: vi.fn(() => {
        let skipVal = 0;
        let takeVal: number | undefined = undefined;
        let searchFilter: string | null = null;
        let categoryFilter: string | null = null;

        const qb: any = {
          andWhere: vi.fn((clause: string, params: any) => {
            if (params.term) searchFilter = params.term.replace(/%/g, '');
            if (params.catPrefix) categoryFilter = params.catPrefix.replace(/\[|\]|%/g, '');
            return qb;
          }),
          orderBy: vi.fn(() => qb),
          skip: vi.fn((val: number) => {
            skipVal = val;
            return qb;
          }),
          take: vi.fn((val: number) => {
            takeVal = val;
            return qb;
          }),
          getManyAndCount: vi.fn(async () => {
            let filtered = [...sampleProducts];
            if (searchFilter) {
              const q = searchFilter.toLowerCase();
              filtered = filtered.filter(
                (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
              );
            }
            if (categoryFilter) {
              const cat = categoryFilter.toLowerCase();
              filtered = filtered.filter(
                (p) => p.description.toLowerCase().includes(cat) || p.name.toLowerCase().includes(cat)
              );
            }
            const total = filtered.length;
            const start = skipVal;
            const end = takeVal !== undefined ? start + takeVal : total;
            return [filtered.slice(start, end), total];
          }),
        };
        return qb;
      }),
      find: vi.fn(async () => sampleProducts),
      findOne: vi.fn(async ({ where }: any) => sampleProducts.find((p) => p.id === where.id) || null),
      delete: vi.fn(async () => ({ affected: 1 })),
      save: vi.fn(async (p: any) => p),
    };

    productService = new ProductService(mockProductRepo);
    productResolver = new ProductResolver(productService);
  });

  describe('Server-side pagination with limit & offset', () => {
    it('should paginate page 1 with limit=5 and offset=0 using TypeORM skip and take', async () => {
      const page = 1;
      const limit = 5;
      const offset = (page - 1) * limit; // 0

      const result = await productService.findPaginatedProducts(limit, offset);

      expect(mockProductRepo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 5,
        order: { id: 'ASC' },
      });
      expect(result.items).toHaveLength(5);
      expect(result.items[0].id).toBe(1);
      expect(result.items[4].id).toBe(5);
      expect(result.total).toBe(25);
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(0);
    });

    it('should paginate page 2 with limit=5 and offset=5 correctly', async () => {
      const page = 2;
      const limit = 5;
      const offset = (page - 1) * limit; // 5

      const result = await productService.findPaginatedProducts(limit, offset);

      expect(mockProductRepo.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        order: { id: 'ASC' },
      });
      expect(result.items).toHaveLength(5);
      expect(result.items[0].id).toBe(6);
      expect(result.items[4].id).toBe(10);
      expect(result.total).toBe(25);
      expect(result.offset).toBe(5);
    });

    it('should paginate page 3 with limit=10 and offset=20 correctly', async () => {
      const page = 3;
      const limit = 10;
      const offset = (page - 1) * limit; // 20

      const result = await productService.findPaginatedProducts(limit, offset);

      expect(mockProductRepo.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        order: { id: 'ASC' },
      });
      // Out of 25 items, starting at offset 20 gives remaining 5 items
      expect(result.items).toHaveLength(5);
      expect(result.items[0].id).toBe(21);
      expect(result.items[4].id).toBe(25);
      expect(result.total).toBe(25);
    });
  });

  describe('Handling "All products" separately (Requirement 5)', () => {
    it('should return all products when limit is omitted or null without limiting to 50', async () => {
      const result = await productService.findPaginatedProducts(undefined, 0);

      expect(mockProductRepo.findAndCount).toHaveBeenCalledWith({
        order: { id: 'ASC' },
        skip: undefined,
      });
      expect(result.items).toHaveLength(25);
      expect(result.total).toBe(25);
      expect(result.limit).toBeUndefined();
    });

    it('should return all products when limit is 0', async () => {
      const result = await productService.findPaginatedProducts(0, 0);

      expect(result.items).toHaveLength(25);
      expect(result.total).toBe(25);
      expect(result.limit).toBeUndefined();
    });
  });

  describe('Validation & Edge Cases', () => {
    it('should throw BadRequestException if offset is negative', async () => {
      await expect(productService.findPaginatedProducts(5, -1)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if limit is negative', async () => {
      await expect(productService.findPaginatedProducts(-5, 0)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should return empty items when offset exceeds total available products', async () => {
      const result = await productService.findPaginatedProducts(5, 100);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(25);
    });
  });

  describe('GraphQL Resolver integration', () => {
    it('should call findPaginatedProducts from products resolver query', async () => {
      const spy = vi.spyOn(productService, 'findPaginatedProducts');
      await productResolver.getProducts(10, 0);

      expect(spy).toHaveBeenCalledWith(10, 0, undefined, undefined);
    });

    it('should call findPaginatedProducts from getPaginatedProducts query alias', async () => {
      const spy = vi.spyOn(productService, 'findPaginatedProducts');
      await productResolver.getPaginatedProducts(20, 20);

      expect(spy).toHaveBeenCalledWith(20, 20, undefined, undefined);
    });

    it('should preserve existing getAllProduct query for admin interface', async () => {
      const result = await productResolver.getAllProduct();
      expect(result).toHaveLength(25);
      expect(mockProductRepo.find).toHaveBeenCalled();
    });
  });
});
