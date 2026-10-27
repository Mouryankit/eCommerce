import React from 'react';
import { ChevronLeft, ChevronRight, LayoutList } from 'lucide-react';
import type { PageSizeOption } from '../../types';

export function getPaginationRange(current: number, total: number): (number | 'ellipsis')[] {
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

interface PaginationProps {
  effectiveTotal: number;
  pageSize: PageSizeOption;
  startItem: number;
  endItem: number;
  safeCurrentPage: number;
  totalPages: number;
  loadingPage: boolean;
  paginationRange: (number | 'ellipsis')[];
  setCurrentPage: (page: number) => void;
  handlePageSizeChange: (size: PageSizeOption) => void;
}

export const AdminPagination: React.FC<PaginationProps> = ({
  effectiveTotal,
  pageSize,
  startItem,
  endItem,
  safeCurrentPage,
  totalPages,
  loadingPage,
  paginationRange,
  setCurrentPage,
  handlePageSizeChange,
}) => {
  if (effectiveTotal <= 0) return null;

  return (
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
  );
};
