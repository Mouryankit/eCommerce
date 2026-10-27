import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, PageSizeOption } from '../types';
import { useProducts } from '../context/ProductContext';
import { fetchPaginatedProductsFromBackend } from '../services/graphql';
import { AdminProductModal } from './AdminProductModal';
import { ProductDetailModal } from './ProductDetailModal';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminStatsCards } from './admin/AdminStatsCards';
import { AdminProductToolbar } from './admin/AdminProductToolbar';
import { AdminProductTable } from './admin/AdminProductTable';
import { AdminPagination, getPaginationRange } from './admin/AdminPagination';
import { AdminDeleteModal } from './admin/AdminDeleteModal';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Database,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    stats,
    isBackendConnected,
    refreshProducts,
    quickAdjustStock,
    deleteProduct,
  } = useProducts();

  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Admin specific local search & filter state
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategory, setAdminCategory] = useState<string>('All');
  const [adminStockFilter, setAdminStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Server-side pagination state (Default to 5 per requirements)
  const [pageSize, setPageSize] = useState<PageSizeOption>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [serverTotal, setServerTotal] = useState<number>(0);
  const [loadingPage, setLoadingPage] = useState<boolean>(false);

  // Server-side fetch using GraphQL limit and offset
  const loadAdminPage = useCallback(async () => {
    if (!isBackendConnected) return;
    setLoadingPage(true);
    try {
      const limit = pageSize === 'all' ? null : (pageSize as number);
      const offset = pageSize === 'all' ? 0 : (currentPage - 1) * (pageSize as number);
      const result = await fetchPaginatedProductsFromBackend(
        limit,
        offset,
        adminCategory === 'All' ? undefined : adminCategory,
        adminSearch.trim() || undefined
      );
      setServerProducts(result.items);
      setServerTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch admin paginated products:', err);
    } finally {
      setLoadingPage(false);
    }
  }, [isBackendConnected, pageSize, currentPage, adminCategory, adminSearch]);

  useEffect(() => {
    if (isBackendConnected) {
      void loadAdminPage();
    }
  }, [isBackendConnected, loadAdminPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProducts();
    await loadAdminPage();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleCreateNew = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId !== null) {
      await deleteProduct(deletingId);
      setDeletingId(null);
      await loadAdminPage();
    }
  };

  const handleQuickAdjust = async (id: number, delta: number) => {
    await quickAdjustStock(id, delta);
    await loadAdminPage();
  };

  // Reset page size and immediately return to page 1
  const handlePageSizeChange = (newSize: PageSizeOption) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Offline fallback list
  const offlineFiltered = useMemo(() => {
    return products.filter((p) => {
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase().trim();
        const match =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          String(p.id) === q;
        if (!match) return false;
      }
      if (adminCategory !== 'All' && p.category !== adminCategory) {
        return false;
      }
      if (adminStockFilter === 'low' && !(p.quantity > 0 && p.quantity <= 5)) {
        return false;
      }
      if (adminStockFilter === 'out' && p.quantity > 0) {
        return false;
      }
      return true;
    });
  }, [products, adminSearch, adminCategory, adminStockFilter]);

  const effectiveTotal = isBackendConnected ? serverTotal : offlineFiltered.length;

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(effectiveTotal / (pageSize as number)));
  }, [effectiveTotal, pageSize]);

  const safeCurrentPage = useMemo(() => {
    if (totalPages <= 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const displayedProducts = useMemo(() => {
    if (isBackendConnected) {
      if (adminStockFilter === 'all') {
        return serverProducts;
      }
      return serverProducts.filter((p) => {
        if (adminStockFilter === 'low' && !(p.quantity > 0 && p.quantity <= 5)) return false;
        if (adminStockFilter === 'out' && p.quantity > 0) return false;
        return true;
      });
    }

    if (pageSize === 'all') {
      return offlineFiltered;
    }
    const offset = (safeCurrentPage - 1) * (pageSize as number);
    return offlineFiltered.slice(offset, offset + (pageSize as number));
  }, [isBackendConnected, serverProducts, adminStockFilter, offlineFiltered, pageSize, safeCurrentPage]);

  const paginationRange = getPaginationRange(safeCurrentPage, totalPages);
  const startItem = pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
  const endItem =
    pageSize === 'all'
      ? effectiveTotal
      : Math.min(safeCurrentPage * (pageSize as number), effectiveTotal);

  return (
    <div className="admin-dashboard-root">
      <div className="admin-dashboard-container">
        {/* Top Header & Connection Bar */}
        <div className="admin-header-row">
          <div className="admin-title-section">
            <span className="admin-eyebrow-tag">Administration Control Plane</span>
            <h1 className="admin-main-title">Store Operations & Management</h1>
            <p className="admin-main-desc">
              Manage product listings, monitor real-time stock levels, control catalog pricing, and fulfill customer orders.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              onClick={handleRefresh}
              className={`admin-secondary-action-btn ${refreshing ? 'is-spinning' : ''}`}
              title="Sync with Backend"
            >
              <RefreshCw size={16} />
              <span>{refreshing ? 'Syncing...' : 'Sync Catalog'}</span>
            </button>

            {activeTab === 'inventory' && (
              <button onClick={handleCreateNew} className="admin-primary-action-btn">
                <Plus size={18} />
                <span>Add New Product</span>
              </button>
            )}
          </div>
        </div>

        {/* Backend Connection Status Banner */}
        <div className={`backend-status-card ${isBackendConnected ? 'status-connected' : 'status-standalone'}`}>
          <div className="status-indicator-left">
            <Database size={18} />
            <div className="status-text-meta">
              <strong>
                {isBackendConnected
                  ? 'GraphQL Backend Connected (port 8000)'
                  : 'Standalone Browser Mode Active'}
              </strong>
              <span>
                {isBackendConnected
                  ? 'Authenticated mutations (Create, Update, Delete) are persisting directly to NestJS server with role checks.'
                  : 'Backend offline or not reachable. Changes are saved safely to local storage cache.'}
              </span>
            </div>
          </div>
          <div className="status-pill-badge">
            {isBackendConnected ? (
              <>
                <CheckCircle2 size={14} />
                <span>Live Protected API</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>Offline Fallback</span>
              </>
            )}
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="admin-nav-tabs-bar">
          <button
            type="button"
            className={`admin-nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Package size={17} />
            <span>Products & Inventory ({products.length})</span>
          </button>
          <button
            type="button"
            className={`admin-nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={17} />
            <span>Customer Orders & Fulfillment</span>
          </button>
        </div>

        {activeTab === 'orders' ? (
          <AdminOrdersView />
        ) : (
          <>
            <AdminStatsCards stats={stats} />

            <AdminProductToolbar
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              adminCategory={adminCategory}
              setAdminCategory={setAdminCategory}
              adminStockFilter={adminStockFilter}
              setAdminStockFilter={setAdminStockFilter}
              pageSize={pageSize}
              handlePageSizeChange={handlePageSizeChange}
              setCurrentPage={setCurrentPage}
            />

            <AdminProductTable
              displayedProducts={displayedProducts}
              handleQuickAdjust={handleQuickAdjust}
              handleEdit={handleEdit}
              setPreviewProduct={setPreviewProduct}
              setDeletingId={setDeletingId}
            />

            <AdminPagination
              effectiveTotal={effectiveTotal}
              pageSize={pageSize}
              startItem={startItem}
              endItem={endItem}
              safeCurrentPage={safeCurrentPage}
              totalPages={totalPages}
              loadingPage={loadingPage}
              paginationRange={paginationRange}
              setCurrentPage={setCurrentPage}
              handlePageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>

      {/* Product Creation / Edit Modal */}
      <AdminProductModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={async () => {
          setModalOpen(false);
          setEditingProduct(null);
          await loadAdminPage();
        }}
      />

      {/* Product Preview Modal for Admin */}
      {previewProduct && (
        <ProductDetailModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AdminDeleteModal
        deletingId={deletingId}
        setDeletingId={setDeletingId}
        confirmDelete={confirmDelete}
      />
    </div>
  );
};
