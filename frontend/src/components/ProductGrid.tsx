import React, { useState } from 'react';
import type { Product, PageSizeOption } from '../types';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import {
  PackageSearch,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
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

export const ProductGrid: React.FC = () => {
  const {
    paginatedProducts,
    loading,
    paginationLoading,
    paginationError,
    refetchPagination,
    searchQuery,
    setSearchQuery,
    setSelectedCategory,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalProductsCount,
  } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setCurrentPage(1);
  };

  // Full initial loading state
  if (loading && paginatedProducts.length === 0) {
    return (
      <div className="product-grid-loading">
        <div className="loading-spinner-ring" />
        <p>Curating our latest collection...</p>
      </div>
    );
  }

  // Error handling state (Requirement 4)
  if (paginationError && paginatedProducts.length === 0) {
    return (
      <div className="product-grid-empty pagination-error-state">
        <div className="empty-icon-circle error-circle">
          <AlertCircle size={36} strokeWidth={1.5} color="#ef4444" />
        </div>
        <h3 className="empty-title">Failed to load products</h3>
        <p className="empty-desc">{paginationError}</p>
        <button onClick={() => refetchPagination()} className="empty-reset-btn">
          <RefreshCw size={16} />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  // Empty results handling state (Requirement 4)
  if (paginatedProducts.length === 0) {
    return (
      <div className="product-grid-empty">
        <div className="empty-icon-circle">
          <PackageSearch size={36} strokeWidth={1.5} />
        </div>
        <h3 className="empty-title">No matching pieces found</h3>
        <p className="empty-desc">
          {searchQuery
            ? `We couldn't find any items matching "${searchQuery}". Try adjusting your keywords or category filters.`
            : currentPage > 1
            ? `Page ${currentPage} contains no products. Return to page 1 to see available items.`
            : 'No products are currently available in this selected collection.'}
        </p>
        {currentPage > 1 ? (
          <button onClick={() => setCurrentPage(1)} className="empty-reset-btn">
            <RotateCcw size={16} />
            <span>Go to Page 1</span>
          </button>
        ) : (
          <button onClick={resetFilters} className="empty-reset-btn">
            <RotateCcw size={16} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    );
  }

  const paginationRange = getPaginationRange(currentPage, totalPages);

  const startItem = pageSize === 'all' ? 1 : (currentPage - 1) * (pageSize as number) + 1;
  const endItem =
    pageSize === 'all'
      ? totalProductsCount
      : Math.min(currentPage * (pageSize as number), totalProductsCount);

  return (
    <>
      <section className="product-grid-section" aria-label="Product Catalog">
        {/* Loading overlay during page transitions */}
        {paginationLoading && (
          <div className="pagination-transition-overlay">
            <div className="loading-spinner-ring mini" />
            <span>Updating page {currentPage}...</span>
          </div>
        )}

        {/* Product Cards Container */}
        <div className={`product-grid-container ${paginationLoading ? 'transitioning' : ''}`}>
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="pagination-bar-root" aria-label="Product pagination controls">
          {/* Left: Summary Info */}
          <div className="pagination-info">
            {pageSize === 'all' ? (
              <span>Showing all <strong>{totalProductsCount}</strong> products</span>
            ) : (
              <span>
                Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalProductsCount}</strong> products
              </span>
            )}
          </div>

          {/* Center: Previous / Page Numbers / Next controls */}
          <div className="pagination-controls-wrapper">
            {/* Previous Button */}
            <button
              type="button"
              className="pagination-btn pagination-nav-btn prev-btn"
              disabled={currentPage <= 1 || paginationLoading || pageSize === 'all'}
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            {/* Numbered Page Buttons */}
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

                  const isActive = pageItem === currentPage;
                  return (
                    <button
                      key={pageItem}
                      type="button"
                      disabled={paginationLoading}
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

            {/* Next Button */}
            <button
              type="button"
              className="pagination-btn pagination-nav-btn next-btn"
              disabled={currentPage >= totalPages || paginationLoading || pageSize === 'all'}
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Right: Products per page selector (Requirement 1) */}
          <div className="pagination-page-size-selector">
            <LayoutList size={14} className="page-size-icon" />
            <label htmlFor="per-page-select-footer" className="page-size-label">
              Per page:
            </label>
            <select
              id="per-page-select-footer"
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSizeOption);
                setPageSize(val);
              }}
              className="pagination-size-dropdown"
              aria-label="Products per page selection"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </section>

      {/* Quick View / Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};
