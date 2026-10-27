import type { Product, Category } from '../types';
import { resolveImageUrl } from '../utils/image';
import { graphqlRequest } from './apiClient';

function mapBackendProduct(item: {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
}): Product {
  let category: Category;
  let cleanDesc = item.description || '';

  const categoryMatch = item.description?.match(/^\[(Electronics|Apparel|Accessories|Home)\]\s*(.*)$/i);
  if (categoryMatch) {
    const catFound = categoryMatch[1];
    const validCats: Category[] = ['Electronics', 'Apparel', 'Accessories', 'Home'];
    category = validCats.find((c) => c.toLowerCase() === catFound.toLowerCase()) || 'Home';
    cleanDesc = categoryMatch[2];
  } else {
    const text = `${item.name} ${item.description}`.toLowerCase();
    if (text.includes('headphone') || text.includes('dac') || text.includes('charger') || text.includes('speaker') || text.includes('wireless') || text.includes('electronics')) {
      category = 'Electronics';
    } else if (text.includes('shirt') || text.includes('wool') || text.includes('cardigan') || text.includes('cotton') || text.includes('pant') || text.includes('apparel')) {
      category = 'Apparel';
    } else if (text.includes('watch') || text.includes('duffle') || text.includes('sunglasses') || text.includes('wallet') || text.includes('bag') || text.includes('accessories')) {
      category = 'Accessories';
    } else {
      category = 'Home';
    }
  }

  const fullImageUrl = resolveImageUrl(item.imageUrl, item.name, category);

  return {
    id: item.id,
    name: item.name,
    description: cleanDesc,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    imageUrl: fullImageUrl,
    category,
    rating: 4.5 + ((item.id * 17) % 5) / 10,
    reviewCount: 20 + ((item.id * 31) % 150),
  };
}

export async function fetchAllProductsFromBackend(): Promise<Product[]> {
  const data = await graphqlRequest<{
    getAllProduct: Array<{
      id: number;
      name: string;
      description: string;
      imageUrl: string;
      price: number;
      quantity: number;
    }>;
  }>(`
    query GetAllProduct {
      getAllProduct {
        id
        name
        description
        imageUrl
        price
        quantity
      }
    }
  `);

  return (data.getAllProduct || []).map(mapBackendProduct);
}

export async function fetchPaginatedProductsFromBackend(
  limit?: number | null,
  offset?: number | null,
  category?: string,
  search?: string
): Promise<{ items: Product[]; total: number; limit?: number; offset?: number }> {
  const variables: Record<string, unknown> = {};
  if (typeof limit === 'number' && limit > 0) {
    variables.limit = limit;
  }
  if (typeof offset === 'number' && offset >= 0) {
    variables.offset = offset;
  }
  if (category && category !== 'All') {
    variables.category = category;
  }
  if (search && search.trim()) {
    variables.search = search.trim();
  }

  const data = await graphqlRequest<{
    products: {
      items: Array<{
        id: number;
        name: string;
        description: string;
        imageUrl: string;
        price: number;
        quantity: number;
      }>;
      total: number;
      limit?: number;
      offset?: number;
    };
  }>(
    `
      query GetProducts($limit: Int, $offset: Int, $category: String, $search: String) {
        products(limit: $limit, offset: $offset, category: $category, search: $search) {
          items {
            id
            name
            description
            imageUrl
            price
            quantity
          }
          total
          limit
          offset
        }
      }
    `,
    variables
  );

  const rawItems = data.products?.items || [];
  const total = Number(data.products?.total) || 0;

  return {
    items: rawItems.map(mapBackendProduct),
    total,
    limit: data.products?.limit,
    offset: data.products?.offset,
  };
}

export async function createProductOnBackend(product: {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
  category?: string;
}): Promise<string> {
  const formattedDesc = product.category && product.category !== 'All'
    ? `[${product.category}] ${product.description}`
    : product.description;

  const data = await graphqlRequest<{ addproduct: string }>(
    `
      mutation AddProduct($addProductArgs: AddProductArgs!) {
        addproduct(addProductArgs: $addProductArgs)
      }
    `,
    {
      addProductArgs: {
        name: product.name,
        description: formattedDesc,
        imageUrl: product.imageUrl,
        price: Number(product.price),
        quantity: Number(product.quantity),
      },
    }
  );

  return data.addproduct;
}

export async function updateProductOnBackend(
  id: number,
  product: {
    name?: string;
    description?: string;
    imageUrl?: string;
    price?: number;
    quantity?: number;
    category?: string;
  }
): Promise<string> {
  const formattedDesc = product.category && product.description
    ? `[${product.category}] ${product.description}`
    : product.description;

  const data = await graphqlRequest<{ updateProduct: string }>(
    `
      mutation UpdateProduct($updateProductArgs: UpdateProductArgs!) {
        updateProduct(updateProductArgs: $updateProductArgs)
      }
    `,
    {
      updateProductArgs: {
        id,
        ...(product.name !== undefined ? { name: product.name } : {}),
        ...(formattedDesc !== undefined ? { description: formattedDesc } : {}),
        ...(product.imageUrl !== undefined ? { imageUrl: product.imageUrl } : {}),
        ...(product.price !== undefined ? { price: Number(product.price) } : {}),
        ...(product.quantity !== undefined ? { quantity: Number(product.quantity) } : {}),
      },
    }
  );

  return data.updateProduct;
}

export async function deleteProductOnBackend(id: number): Promise<string> {
  const data = await graphqlRequest<{ deleteproduct: string }>(
    `
      mutation DeleteProduct($productId: Int!) {
        deleteproduct(productId: $productId)
      }
    `,
    { productId: id }
  );

  return data.deleteproduct;
}
