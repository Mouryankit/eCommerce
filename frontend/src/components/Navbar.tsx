import React, { useState } from 'react';
import {
  ShoppingBag,
  LayoutDashboard,
  Store,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { NavbarSearch } from './navbar/NavbarSearch';
import { NavbarUserWidget } from './navbar/NavbarUserWidget';
import { NavbarMobileMenu } from './navbar/NavbarMobileMenu';
import { getAdminUrl, getCustomerUrl } from '../utils/navigationUrls';

interface NavbarProps {
  portalMode?: 'customer' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({ portalMode = 'customer' }) => {
  const { user, isAuthenticated, isAdmin, openLogin, openLogout, openAccount } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { searchQuery, setSearchQuery, filteredProducts } = useProducts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminUrl = getAdminUrl();
  const customerUrl = getCustomerUrl();

  const isCustomerMode = portalMode === 'customer';

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo & Contextual Role Badge */}
        <div className="navbar-brand-section">
          <a
            href={isCustomerMode ? '/' : '/admin.html'}
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
          <NavbarSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredCount={filteredProducts.length}
          />
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
          <NavbarUserWidget
            user={user}
            isAuthenticated={isAuthenticated}
            isCustomerMode={isCustomerMode}
            openLogin={openLogin}
            openLogout={openLogout}
            openAccount={openAccount}
          />

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
      <NavbarMobileMenu
        isOpen={mobileMenuOpen}
        isCustomerMode={isCustomerMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAuthenticated={isAuthenticated}
        user={user}
        openAccount={openAccount}
        openLogin={openLogin}
        openLogout={openLogout}
        closeMenu={() => setMobileMenuOpen(false)}
      />
    </header>
  );
};
