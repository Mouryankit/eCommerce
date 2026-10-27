import React from 'react';
import { useProducts } from '../context/ProductContext';
import type { Category, SortOption, PageSizeOption } from '../types';
import { SlidersHorizontal, Layers, Smartphone, Shirt, Watch, Home, LayoutList } from 'lucide-react';

const CATEGORIES: { label: Category; icon: React.FC<{ size?: number }> }[] = [
  { label: 'All', icon: Layers },
  { label: 'Electronics', icon: Smartphone },
  { label: 'Apparel', icon: Shirt },
  { label: 'Accessories', icon: Watch },
  { label: 'Home', icon: Home },
];

export const CategoryFilter: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    pageSize,
    setPageSize,
    totalProductsCount,
    currentPage,
  } = useProducts();

  const getCategoryCount = (cat: Category) => {
    if (cat === 'All') return products.length;
    return products.filter((p) => p.category === cat).length;
  };

  const renderResultsIndicator = () => {
    if (totalProductsCount === 0) {
      return <span>Showing <strong>0</strong> items</span>;
    }
    if (pageSize === 'all') {
      return <span>Showing all <strong>{totalProductsCount}</strong> items</span>;
    }
    const start = (currentPage - 1) * (pageSize as number) + 1;
    const end = Math.min(currentPage * (pageSize as number), totalProductsCount);
    return (
      <span>
        Showing <strong>{start}–{end}</strong> of <strong>{totalProductsCount}</strong> items
      </span>
    );
  };

  return (
    <div className="filter-bar-root" id="shop-section">
      <div className="filter-bar-container">
        {/* Category Pills */}
        <div className="category-pills-scroll" role="tablist" aria-label="Product categories">
          {CATEGORIES.map(({ label, icon: Icon }) => {
            const count = getCategoryCount(label);
            const isActive = selectedCategory === label;
            return (
              <button
                key={label}
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(label)}
                className={`category-pill-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={15} />
                <span>{label}</span>
                <span className="category-pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Sort & Pagination Controls */}
        <div className="filter-sort-controls">
          {/* Products Per Page Dropdown (Requirement 1: 5, 10, 20, 50, All products. Default: 5) */}
          <div className="sort-select-wrapper per-page-wrapper">
            <LayoutList size={15} className="sort-icon" />
            <select
              id="per-page-select-header"
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : (Number(e.target.value) as PageSizeOption);
                setPageSize(val);
              }}
              className="sort-dropdown per-page-dropdown"
              aria-label="Products per page"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value="all">All products</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="sort-select-wrapper">
            <SlidersHorizontal size={15} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="sort-dropdown"
              aria-label="Sort products"
            >
              <option value="featured">Featured / New</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name-asc">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Results count indicator */}
          <span className="filter-results-indicator">
            {renderResultsIndicator()}
          </span>
        </div>
      </div>
    </div>
  );
};
