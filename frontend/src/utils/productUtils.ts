import type { Product, Category, SortOption } from '../types';

export interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}

/**
 * Pure utility function to sort an array of products based on the specified sort option.
 */
export function sortProducts(items: Product[], sortBy: SortOption): Product[] {
  const result = [...items];
  switch (sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'featured':
    default:
      result.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.id - a.id;
      });
      break;
  }
  return result;
}

/**
 * Filters a list of products by keyword search and category selection.
 */
export function filterProducts(
  products: Product[],
  searchQuery: string,
  selectedCategory: Category
): Product[] {
  let result = [...products];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }

  if (selectedCategory !== 'All') {
    result = result.filter((p) => p.category === selectedCategory);
  }

  return result;
}

/**
 * Calculates aggregate inventory KPI metrics for administrative and reporting views.
 */
export function calculateProductStats(products: Product[]): ProductStats {
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const inventoryValue = products.reduce((acc, p) => acc + p.price * (p.quantity || 0), 0);
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= 5).length;
  const outOfStockCount = products.filter((p) => p.quantity <= 0).length;
  const categoriesCount = new Set(products.map((p) => p.category || 'Other')).size;

  return {
    totalProducts,
    totalUnits,
    inventoryValue,
    lowStockCount,
    outOfStockCount,
    categoriesCount,
  };
}
