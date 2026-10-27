import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product, PageSizeOption } from '../types';
import { useProducts } from '../context/ProductContext';
import { fetchPaginatedProductsFromBackend } from '../services/graphql';
import { AdminProductModal } from './AdminProductModal';
import { ProductDetailModal } from './ProductDetailModal';
import { AdminOrdersView } from './AdminOrdersView';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';
import {
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Trash2,
  Eye,
  PlusCircle,
  MinusCircle,
  Database,
  CheckCircle2,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  LayoutList,
} from 'lucide-react';

function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total];
  }
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

const AdminProductThumb: React.FC<{ product: Product }> = ({ product }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const fallback = getProductFallbackImage(product.name, product.category);
  const resolved = resolveImageUrl(product.imageUrl, product.name, product.category);
  const src = failedUrl === resolved ? fallback : resolved;

  return (
    <img
      src={src}
      alt={product.name}
      onError={() => setFailedUrl(resolved)}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="table-thumb-image"
    />
  );
};

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
            {/* Overview Stats Cards */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-card-icon stat-icon-blue">
                  <Package size={22} />
                </div>
                <div className="stat-card-details">
                  <span className="stat-card-label">Catalog Products</span>
                  <h3 className="stat-card-number">{stats.totalProducts}</h3>
                  <span className="stat-card-sub">{stats.categoriesCount} categories active</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-icon stat-icon-indigo">
                  <Layers size={22} />
                </div>
                <div className="stat-card-details">
                  <span className="stat-card-label">Total Units in Stock</span>
                  <h3 className="stat-card-number">{stats.totalUnits.toLocaleString()}</h3>
                  <span className="stat-card-sub">Items ready to dispatch</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="stat-card-icon stat-icon-emerald">
                  <DollarSign size={22} />
                </div>
                <div className="stat-card-details">
                  <span className="stat-card-label">Inventory Valuation</span>
                  <h3 className="stat-card-number">
                    ${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className="stat-card-sub">Retail stock value</span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className={`stat-card-icon ${stats.lowStockCount > 0 ? 'stat-icon-amber' : 'stat-icon-gray'}`}>
                  <AlertTriangle size={22} />
                </div>
                <div className="stat-card-details">
                  <span className="stat-card-label">Low / Out of Stock</span>
                  <h3 className="stat-card-number">
                    {stats.lowStockCount + stats.outOfStockCount}
                  </h3>
                  <span className="stat-card-sub">
                    {stats.lowStockCount} low stock • {stats.outOfStockCount} sold out
                  </span>
                </div>
              </div>
            </div>

            {/* Toolbar & Filters for Table */}
            <div className="admin-table-toolbar">
              <div className="table-search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, description or ID..."
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="table-search-input"
                />
              </div>

              <div className="table-filters-group">
                <div className="table-select-wrap">
                  <Filter size={15} />
                  <select
                    value={adminCategory}
                    onChange={(e) => {
                      setAdminCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="table-select"
                  >
                    <option value="All">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Home">Home</option>
                  </select>
                </div>

                <div className="table-select-wrap">
                  <select
                    value={adminStockFilter}
                    onChange={(e) => {
                      setAdminStockFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="table-select"
                  >
                    <option value="all">All Inventory</option>
                    <option value="low">Low Stock Only (≤ 5)</option>
                    <option value="out">Out of Stock (0)</option>
                  </select>
                </div>

                {/* Page Size Selector (Options: 5, 10, 20, 50, All products) */}
                <div className="table-select-wrap">
                  <LayoutList size={15} />
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSizeOption);
                      handlePageSizeChange(val);
                    }}
                    className="table-select"
                    aria-label="Products per page"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value="all">All products</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="admin-table-card">
              <div className="table-responsive-wrapper">
                <table className="admin-inventory-table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Inventory</th>
                      <th>Status</th>
                      <th className="table-header-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="table-empty-cell">
                          <div className="table-empty-state">
                            <Package size={36} strokeWidth={1.5} />
                            <h4>No inventory matches your search criteria</h4>
                            <p>Try clearing filters or add a new product to your catalog.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedProducts.map((item) => {
                        const isOut = item.quantity <= 0;
                        const isLow = item.quantity > 0 && item.quantity <= 5;
                        const cleanDesc = item.description.replace(/^\[(Electronics|Apparel|Accessories|Home)\]\s*/i, '');

                        return (
                          <tr key={item.id} className="admin-table-row">
                            {/* Details */}
                            <td className="product-details-cell">
                              <div className="cell-flex">
                                <AdminProductThumb product={item} />
                                <div className="cell-text">
                                  <span className="table-product-title">{item.name}</span>
                                  <span className="table-product-sub">
                                    ID: #{item.id} • {cleanDesc.slice(0, 48)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td>
                              <span className="table-cat-pill">{item.category || 'General'}</span>
                            </td>

                            {/* Price */}
                            <td>
                              <span className="table-price-text">${Number(item.price).toFixed(2)}</span>
                            </td>

                            {/* Quantity with quick +/- adjustment */}
                            <td>
                              <div className="table-stock-control">
                                <button
                                  onClick={() => handleQuickAdjust(item.id, -1)}
                                  disabled={item.quantity <= 0}
                                  className="quick-stock-btn"
                                  title="Decrease stock by 1"
                                  aria-label="Decrease stock"
                                >
                                  <MinusCircle size={17} />
                                </button>
                                <span className="quick-stock-qty">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuickAdjust(item.id, 1)}
                                  className="quick-stock-btn"
                                  title="Increase stock by 1"
                                  aria-label="Increase stock"
                                >
                                  <PlusCircle size={17} />
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td>
                              {isOut ? (
                                <span className="stock-badge badge-danger">Out of Stock</span>
                              ) : isLow ? (
                                <span className="stock-badge badge-warning">Low Stock ({item.quantity})</span>
                              ) : (
                                <span className="stock-badge badge-success">In Stock</span>
                              )}
                            </td>

                            {/* Action buttons */}
                            <td className="table-cell-actions">
                              <div className="actions-flex-row">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="table-action-btn edit-action"
                                  title="Edit product"
                                >
                                  <Edit3 size={15} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => setPreviewProduct(item)}
                                  className="table-action-btn view-action"
                                  title="Preview product details"
                                >
                                  <Eye size={15} />
                                  <span>Preview</span>
                                </button>

                                <button
                                  onClick={() => setDeletingId(item.id)}
                                  className="table-action-btn delete-action"
                                  title="Delete product"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {effectiveTotal > 0 && (
              <div className="pagination-bar-root" aria-label="Admin product pagination controls">
                {/* Left: Summary Info */}
                <div className="pagination-info">
                  {pageSize === 'all' ? (
                    <span>Showing all <strong>{effectiveTotal}</strong> products</span>
                  ) : (
                    <span>
                      Showing <strong>{startItem}–{endItem}</strong> of <strong>{effectiveTotal}</strong> products
                    </span>
                  )}
                </div>

                {/* Center: Previous / Page Numbers / Next controls */}
                <div className="pagination-controls-wrapper">
                  <button
                    type="button"
                    className="pagination-btn pagination-nav-btn prev-btn"
                    disabled={safeCurrentPage <= 1 || loadingPage || pageSize === 'all'}
                    onClick={() => setCurrentPage(safeCurrentPage - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  {pageSize !== 'all' && (
                    <div className="pagination-pages-list" role="navigation" aria-label="Pagination pages">
                      {paginationRange.map((pageItem, idx) => {
                        if (pageItem === 'ellipsis') {
                          return (
                            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                              &hellip;
                            </span>
                          );
                        }

                        const isActive = pageItem === safeCurrentPage;
                        return (
                          <button
                            key={pageItem}
                            type="button"
                            disabled={loadingPage}
                            onClick={() => setCurrentPage(pageItem)}
                            className={`pagination-btn pagination-number-btn ${isActive ? 'active' : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={`Page ${pageItem}`}
                          >
                            {pageItem}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    className="pagination-btn pagination-nav-btn next-btn"
                    disabled={safeCurrentPage >= totalPages || loadingPage || pageSize === 'all'}
                    onClick={() => setCurrentPage(safeCurrentPage + 1)}
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Right: Products per page selector */}
                <div className="pagination-page-size-selector">
                  <LayoutList size={14} className="page-size-icon" />
                  <label htmlFor="admin-page-size-footer" className="page-size-label">
                    Per page:
                  </label>
                  <select
                    id="admin-page-size-footer"
                    value={pageSize}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSizeOption);
                      handlePageSizeChange(val);
                    }}
                    className="pagination-size-dropdown"
                    aria-label="Admin products per page"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>
            )}
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
      {deletingId !== null && (
        <div className="modal-backdrop-overlay" onClick={() => setDeletingId(null)}>
          <div
            className="delete-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <div className="delete-icon-box">
              <Trash2 size={28} />
            </div>
            <h3>Remove Product from Catalog?</h3>
            <p>
              This action will permanently delete product #{deletingId} from the active database
              and store catalog.
            </p>
            <div className="delete-modal-actions">
              <button
                onClick={() => setDeletingId(null)}
                className="admin-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="delete-confirm-btn"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
