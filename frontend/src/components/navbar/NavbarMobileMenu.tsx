import React from 'react';
import { LayoutDashboard, Store, ClipboardList, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import type { User } from '../../types';

interface MobileMenuProps {
  isOpen: boolean;
  isCustomerMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAuthenticated: boolean;
  user: User | null;
  openAccount: () => void;
  openLogin: () => void;
  openLogout: () => void;
  closeMenu: () => void;
}

export const NavbarMobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  isCustomerMode,
  searchQuery,
  setSearchQuery,
  isAuthenticated,
  user,
  openAccount,
  openLogin,
  openLogout,
  closeMenu,
}) => {
  if (!isOpen) return null;

  return (
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
              closeMenu();
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
                closeMenu();
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
              closeMenu();
            }}
            className="mobile-login-btn"
          >
            <LogIn size={18} />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </div>
  );
};
