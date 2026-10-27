import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  X,
  User as UserIcon,
  LogIn,
  LogOut,
  LayoutDashboard,
  Store,
  Menu,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';

interface NavbarProps {
  portalMode?: 'customer' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({ portalMode = 'customer' }) => {
  const { user, isAuthenticated, isAdmin, openLogin, openLogout, openAccount } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { searchQuery, setSearchQuery, filteredProducts } = useProducts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminUrl =
    (import.meta.env.VITE_ADMIN_URL as string) || 'http://localhost:4001';
  const customerUrl =
    (import.meta.env.VITE_CUSTOMER_URL as string) || 'http://localhost:4000';

  const isCustomerMode = portalMode === 'customer';

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo & Contextual Role Badge */}
        <div className="navbar-brand-section">
          <a
            href={isCustomerMode ? customerUrl : adminUrl}
            className="navbar-brand-btn"
            title="AURA Studio"
          >
            <span className="brand-symbol">◈</span>
            <span className="brand-text">AURA</span>
            <span className="brand-subtext">{isCustomerMode ? 'STUDIO' : 'ADMIN'}</span>
          </a>

          {/* Role-based Portal Indicator */}
          {!isCustomerMode ? (
            <div className="role-portal-badge admin-portal-badge">
              <LayoutDashboard size={15} />
              <span>Admin Console</span>
              <span className="admin-status-pill">MANAGEMENT</span>
            </div>
          ) : (
            <div className="role-portal-badge customer-portal-badge">
              <Store size={15} />
              <span>Storefront</span>
            </div>
          )}
        </div>

        {/* Live Search Bar (Customer Storefront only) */}
        {isCustomerMode && (
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
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        )}

        {/* Right Actions: Links, Cart & Auth */}
        <div className="navbar-actions">
          {/* Quick link across portals */}
          {isCustomerMode ? (
            isAdmin && (
              <a
                href={adminUrl}
                className="portal-jump-link admin-jump"
                title="Open Administrative Console"
              >
                <LayoutDashboard size={14} />
                <span>Admin Console</span>
                <ExternalLink size={12} />
              </a>
            )
          ) : (
            <a
              href={customerUrl}
              className="portal-jump-link customer-jump"
              title="Open Customer Storefront"
            >
              <Store size={14} />
              <span>Customer Store</span>
              <ExternalLink size={12} />
            </a>
          )}

          {/* User Auth Section */}
          {isAuthenticated && user ? (
            <div className="user-profile-widget">
              {/* Account orders button for customers */}
              {isCustomerMode && (
                <button
                  onClick={openAccount}
                  className="navbar-account-trigger"
                  title="View My Orders"
                >
                  <ClipboardList size={16} />
                  <span>Orders</span>
                </button>
              )}

              <div
                className="user-avatar-badge"
                title={`${user.name} (${user.role})`}
                onClick={isCustomerMode ? openAccount : undefined}
                style={{ cursor: isCustomerMode ? 'pointer' : 'default' }}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-fallback">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-meta-info">
                <span className="user-display-name">{user.name.split(' ')[0]}</span>
                <span className="user-role-tag">{user.role}</span>
              </div>
              <button
                onClick={openLogout}
                className="navbar-icon-btn logout-trigger-btn"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="navbar-auth-btn"
              title="Sign in to your account"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}

          {/* Cart Drawer Trigger: ONLY visible in customer storefront */}
          {isCustomerMode && (
            <button
              onClick={toggleCart}
              className="navbar-cart-btn"
              aria-label={`Shopping Cart with ${totalItems} items`}
            >
              <div className="cart-icon-container">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="cart-counter-badge" key={totalItems}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </div>
              <span className="cart-label-text">Bag</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-trigger"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown-menu">
          {isCustomerMode && (
            <div className="mobile-search-section">
              <input
                type="text"
                placeholder="Search store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search-input"
              />
            </div>
          )}
          <div className="mobile-links-section">
            {!isCustomerMode ? (
              <div className="mobile-nav-link active">
                <LayoutDashboard size={18} />
                <span>Admin Operations Dashboard</span>
                <span className="admin-status-pill">ADMIN</span>
              </div>
            ) : (
              <div className="mobile-nav-link active">
                <Store size={18} />
                <span>Customer Storefront</span>
              </div>
            )}
            {isCustomerMode && (
              <button
                onClick={() => {
                  openAccount();
                  setMobileMenuOpen(false);
                }}
                className="mobile-nav-link"
              >
                <ClipboardList size={18} />
                <span>My Orders & Account</span>
              </button>
            )}
          </div>
          <div className="mobile-auth-section">
            {isAuthenticated && user ? (
              <div className="mobile-user-row">
                <div className="mobile-user-left">
                  <UserIcon size={18} />
                  <span>
                    {user.name} ({user.role})
                  </span>
                </div>
                <button
                  onClick={() => {
                    openLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mobile-logout-btn"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openLogin();
                  setMobileMenuOpen(false);
                }}
                className="mobile-login-btn"
              >
                <LogIn size={18} />
                <span>Sign In / Demo Accounts</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
