import React from 'react';
import { LogIn, LogOut, ClipboardList } from 'lucide-react';
import type { User } from '../../types';

interface UserWidgetProps {
  user: User | null;
  isAuthenticated: boolean;
  isCustomerMode: boolean;
  openLogin: () => void;
  openLogout: () => void;
  openAccount: () => void;
}

export const NavbarUserWidget: React.FC<UserWidgetProps> = ({
  user,
  isAuthenticated,
  isCustomerMode,
  openLogin,
  openLogout,
  openAccount,
}) => {
  if (isAuthenticated && user) {
    return (
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
    );
  }

  return (
    <button
      onClick={openLogin}
      className="navbar-auth-btn"
      title="Sign in to your account"
    >
      <LogIn size={16} />
      <span>Sign In</span>
    </button>
  );
};
