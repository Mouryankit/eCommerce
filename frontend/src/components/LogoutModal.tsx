import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, LogOut, ShieldCheck } from 'lucide-react';

export const LogoutModal: React.FC = () => {
  const { user, isLogoutModalOpen, closeLogout, logout } = useAuth();

  if (!isLogoutModalOpen) return null;

  return (
    <div className="modal-backdrop-overlay" onClick={closeLogout}>
      <div
        className="logout-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        <button
          onClick={closeLogout}
          className="modal-close-icon-btn"
          aria-label="Close logout confirmation"
        >
          <X size={20} />
        </button>

        <div className="logout-icon-header">
          <div className="logout-icon-ring">
            <LogOut size={28} className="logout-icon-symbol" />
          </div>
        </div>

        <h2 id="logout-title" className="logout-title">Sign Out of Session?</h2>
        <p className="logout-subtext">
          You are currently signed in as <strong>{user?.name || user?.email || 'User'}</strong> ({user?.role || 'customer'}).
        </p>

        {user && (
          <div className="logout-user-preview-card">
            <div className="logout-user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-fallback">{user.name.charAt(0)}</div>
              )}
            </div>
            <div className="logout-user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
              <span className="user-role-badge">{user.role.toUpperCase()}</span>
            </div>
          </div>
        )}

        <div className="logout-safety-note">
          <ShieldCheck size={16} />
          <span>Your cart and wishlist items will remain preserved on this device for guest browsing.</span>
        </div>

        <div className="logout-actions-group">
          <button
            onClick={logout}
            className="logout-confirm-btn"
          >
            <LogOut size={16} />
            <span>Confirm Sign Out</span>
          </button>
          <button
            onClick={closeLogout}
            className="logout-cancel-btn"
          >
            Cancel & Keep Session
          </button>
        </div>
      </div>
    </div>
  );
};
