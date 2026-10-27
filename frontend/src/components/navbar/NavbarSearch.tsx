import React from 'react';
import { Search, X } from 'lucide-react';

interface NavbarSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredCount: number;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
  searchQuery,
  setSearchQuery,
  filteredCount,
}) => {
  return (
    <div className="navbar-search-wrapper">
      <div className="navbar-search-box">
        <Search size={17} className="search-icon" />
        <input
          type="text"
          placeholder="Search products, materials, electronics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="navbar-search-input"
          aria-label="Live product search"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="search-clear-btn"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {searchQuery && (
        <span className="search-results-count">
          {filteredCount} {filteredCount === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
};
