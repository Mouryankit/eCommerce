import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, Category, SortOption, PageSizeOption } from '../types';
import {
  fetchAllProductsFromBackend,
  fetchPaginatedProductsFromBackend,
  createProductOnBackend,
  updateProductOnBackend,
  deleteProductOnBackend,
  checkBackendConnection,
} from '../services/graphql';
import { useToast } from './ToastContext';

interface ProductStats {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
}

interface ProductContextValue {
  // Existing properties preserved for Admin Dashboard and compatibility
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  isBackendConnected: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: number, data: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
  quickAdjustStock: (id: number, delta: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
  stats: ProductStats;

  // Server-Side Pagination
  pageSize: PageSizeOption;
  setPageSize: (size: PageSizeOption) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalProductsCount: number;
  totalPages: number;
  paginatedProducts: Product[];
  paginationLoading: boolean;
  paginationError: string | null;
  refetchPagination: () => Promise<void>;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('aura_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p) => Boolean(p && p.id && p.name));
          return cleaned;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<Category>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const { showToast } = useToast();

  // Server-side pagination state (Requirement 1: Default to 5)
  const [pageSize, setPageSizeState] = useState<PageSizeOption>(5);
  const [currentPage, setCurrentPageState] = useState<number>(1);
  const [serverPaginatedProducts, setServerPaginatedProducts] = useState<Product[]>([]);
  const [serverTotalCount, setServerTotalCount] = useState<number>(0);
  const [paginationLoading, setPaginationLoading] = useState<boolean>(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);

  // Requirement 4: Reset to page 1 when the page size changes
  const setPageSize = useCallback((size: PageSizeOption) => {
    setPageSizeState(size);
    setCurrentPageState(1);
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    // Validate page bounds
    const safePage = Math.max(1, Math.floor(page || 1));
    setCurrentPageState(safePage);
  }, []);

  // Reset to page 1 when search or category filter changes
  const setSelectedCategory = useCallback((cat: Category) => {
    setSelectedCategoryState(cat);
    setCurrentPageState(1);
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setCurrentPageState(1);
  }, []);

  // Full filtered list used for offline simulation, search counts, and admin views
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Sorting
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
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Total count for current filter
  const totalProductsCount = isBackendConnected ? serverTotalCount : filteredProducts.length;

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(totalProductsCount / (pageSize as number)));
  }, [totalProductsCount, pageSize]);

  // Safe effective page clamped between 1 and totalPages
  const effectiveCurrentPage = useMemo(() => {
    if (totalPages <= 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  // Fetch server-side pagination with GraphQL limit & offset
  const fetchPagination = useCallback(async () => {
    if (!isBackendConnected) return;

    setPaginationLoading(true);
    setPaginationError(null);

    try {
      // Requirement 2: offset = (currentPage - 1) * limit
      // Requirement 5: Handle "All products" separately without limiting to 50
      const limit = pageSize === 'all' ? null : (pageSize as number);
      const pageToQuery = totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
      const offset = pageSize === 'all' ? 0 : Math.max(0, (pageToQuery - 1) * (pageSize as number));

      const result = await fetchPaginatedProductsFromBackend(
        limit,
        offset,
        selectedCategory,
        searchQuery
      );

      setServerPaginatedProducts(result.items);
      setServerTotalCount(result.total);
    } catch (err: any) {
      console.warn('Server-side pagination error:', err);
      setPaginationError(err?.message || 'Failed to load products for the requested page.');
    } finally {
      setPaginationLoading(false);
    }
  }, [isBackendConnected, pageSize, currentPage, totalPages, selectedCategory, searchQuery]);

  const syncBackend = useCallback(async () => {
    setLoading(true);
    try {
      const isOnline = await checkBackendConnection();
      setIsBackendConnected(isOnline);

      if (isOnline) {
        const backendProducts = await fetchAllProductsFromBackend();
        setProducts(backendProducts || []);
        localStorage.setItem('aura_products', JSON.stringify(backendProducts || []));
      } else {
        setIsBackendConnected(false);
      }
    } catch (err) {
      console.warn('Backend sync failed:', err);
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void syncBackend();
  }, [syncBackend]);

  useEffect(() => {
    if (isBackendConnected) {
      void fetchPagination();
    }
  }, [fetchPagination, isBackendConnected]);

  useEffect(() => {
    localStorage.setItem('aura_products', JSON.stringify(products));
  }, [products]);

  const addProduct = async (data: Omit<Product, 'id'>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isBackendConnected) {
        await createProductOnBackend({
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price,
          quantity: data.quantity,
          category: data.category,
        });
        await syncBackend();
        await fetchPagination();
        showToast(`Product "${data.name}" published to database!`, 'success');
        return true;
      }

      // Local fallback only if backend is completely unreachable
      const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
      const newProduct: Product = {
        ...data,
        id: newId,
        rating: 5.0,
        reviewCount: 0,
      };

      setProducts((prev) => [newProduct, ...prev]);
      showToast(`Product "${data.name}" added successfully!`, 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to add product. Please check input values.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: number, data: Partial<Product>): Promise<boolean> => {
    setLoading(true);
    try {
      if (isBackendConnected) {
        await updateProductOnBackend(id, {
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price,
          quantity: data.quantity,
          category: data.category,
        });
        await syncBackend();
        await fetchPagination();
        showToast('Product updated on server!', 'success');
        return true;
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      showToast('Product updated successfully!', 'success');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to update product', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      if (isBackendConnected) {
        await deleteProductOnBackend(id);
        await syncBackend();
        await fetchPagination();
        showToast('Product deleted from database', 'info');
        return true;
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product removed from catalog', 'info');
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete product', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const quickAdjustStock = async (id: number, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    await updateProduct(id, { quantity: newQty });
  };

  // Active items for the current page
  const paginatedProducts = useMemo(() => {
    if (isBackendConnected) {
      const list = [...serverPaginatedProducts];
      // Apply sorting to the current page items
      switch (sortBy) {
        case 'price-asc':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
          break;
        case 'name-asc':
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'featured':
        default:
          list.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return a.id - b.id;
          });
          break;
      }
      return list;
    }

    // Offline fallback pagination slice
    if (pageSize === 'all') {
      return filteredProducts;
    }
    const offset = Math.max(0, (effectiveCurrentPage - 1) * (pageSize as number));
    return filteredProducts.slice(offset, offset + (pageSize as number));
  }, [isBackendConnected, serverPaginatedProducts, filteredProducts, pageSize, effectiveCurrentPage, sortBy]);

  const stats: ProductStats = useMemo(() => {
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
  }, [products]);

  return (
    <ProductContext.Provider
      value={{
        products,
        filteredProducts,
        loading,
        isBackendConnected,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        addProduct,
        updateProduct,
        deleteProduct,
        quickAdjustStock,
        refreshProducts: syncBackend,
        stats,

        // Pagination controls & state
        pageSize,
        setPageSize,
        currentPage: effectiveCurrentPage,
        setCurrentPage,
        totalProductsCount,
        totalPages,
        paginatedProducts,
        paginationLoading,
        paginationError,
        refetchPagination: fetchPagination,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export function useProducts(): ProductContextValue {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return ctx;
}
