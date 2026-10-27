import React from 'react';
import { Search, Filter, LayoutList } from 'lucide-react';
import type { PageSizeOption } from '../../types';

interface ToolbarProps {
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  adminCategory: string;
  setAdminCategory: (val: string) => void;
  adminStockFilter: 'all' | 'low' | 'out';
  setAdminStockFilter: (val: 'all' | 'low' | 'out') => void;
  pageSize: PageSizeOption;
  handlePageSizeChange: (size: PageSizeOption) => void;
  setCurrentPage: (page: number) => void;
}

export const AdminProductToolbar: React.FC<ToolbarProps> = ({
  adminSearch,
  setAdminSearch,
  adminCategory,
  setAdminCategory,
  adminStockFilter,
  setAdminStockFilter,
  pageSize,
  handlePageSizeChange,
  setCurrentPage,
}) => {
  return (
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
              setAdminStockFilter(e.target.value as 'all' | 'low' | 'out');
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
  );
};
