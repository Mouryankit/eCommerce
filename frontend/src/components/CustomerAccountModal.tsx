import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyOrdersFromBackend } from '../services/graphql';
import type { Order } from '../types';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';
import {
  X,
  User as UserIcon,
  ShoppingBag,
  PackageCheck,
  Truck,
  Clock,
  AlertCircle,
  XCircle,
  LogOut,
} from 'lucide-react';

export const CustomerAccountModal: React.FC = () => {
  const { user, isAccountModalOpen, closeAccount, openLogin, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isAccountModalOpen && user) {
      setLoading(true);
      fetchMyOrdersFromBackend()
        .then((data) => {
          if (isMounted) setOrders(data);
        })
        .catch((err) => {
          console.warn('Could not fetch user orders:', err);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isAccountModalOpen, user]);

  if (!isAccountModalOpen) return null;

  return (
    <div className="modal-backdrop-overlay" onClick={closeAccount}>
      <div
        className="account-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={closeAccount}
          className="modal-close-icon-btn"
          aria-label="Close Account modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="account-modal-header">
          <div className="account-brand-pill">
            <span>AURA CUSTOMER ACCOUNT</span>
          </div>
          <h2 className="account-modal-title">My Account & Order History</h2>
          <p className="account-modal-subtitle">
            Track packages, review order confirmations, and manage your customer profile.
          </p>
        </div>

        {!user ? (
          <div className="account-unauth-box">
            <UserIcon size={40} className="unauth-icon" />
            <h3>Sign In to View Orders</h3>
            <p>Please log in or create an account to view your past purchases and shipment statuses.</p>
            <button
              onClick={() => {
                closeAccount();
                openLogin();
              }}
              className="account-login-btn"
            >
              Sign In / Register
            </button>
          </div>
        ) : (
          <div className="account-content-layout">
            {/* User Profile Card */}
            <div className="account-profile-card">
              <div className="account-avatar-wrap">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="account-avatar-img" />
                ) : (
                  <div className="account-avatar-placeholder">{user.name.charAt(0)}</div>
                )}
              </div>
              <div className="account-user-details">
                <span className="account-name-text">{user.name}</span>
                <span className="account-email-text">{user.email}</span>
                <span className="account-role-badge">Member ({user.role})</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  closeAccount();
                }}
                className="account-signout-btn"
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Orders Section */}
            <div className="account-orders-section">
              <div className="orders-section-header">
                <div className="orders-header-title">
                  <ShoppingBag size={18} />
                  <span>Your Purchases ({orders.length})</span>
                </div>
              </div>

              {loading ? (
                <div className="orders-loading-state">
                  <div className="btn-spinner" />
                  <span>Loading your orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="orders-empty-state">
                  <ShoppingBag size={36} strokeWidth={1.5} />
                  <h4>No orders yet</h4>
                  <p>When you complete a purchase, your receipt and tracking will appear here.</p>
                </div>
              ) : (
                <div className="orders-cards-list">
                  {orders.map((order) => {
                    const dateFormatted = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recent';

                    return (
                      <div key={order.id} className="customer-order-card">
                        <div className="order-card-header">
                          <div className="order-header-left">
                            <span className="order-code-text">{order.orderNumber}</span>
                            <span className="order-date-label">Placed on {dateFormatted}</span>
                          </div>
                          <span className={`order-status-badge status-${order.status.toLowerCase()}`}>
                            {order.status === 'DELIVERED' && <PackageCheck size={13} />}
                            {order.status === 'SHIPPED' && <Truck size={13} />}
                            {order.status === 'PROCESSING' && <Clock size={13} />}
                            {order.status === 'PENDING' && <AlertCircle size={13} />}
                            {order.status === 'CANCELLED' && <XCircle size={13} />}
                            <span>{order.status}</span>
                          </span>
                        </div>

                        {/* Items preview */}
                        <div className="order-items-scroll">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="order-line-item">
                              {it.imageUrl && (
                                <img
                                  src={resolveImageUrl(it.imageUrl, it.productName)}
                                  alt={it.productName}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = getProductFallbackImage(it.productName);
                                  }}
                                  referrerPolicy="no-referrer"
                                  className="order-line-thumb"
                                />
                              )}
                              <div className="order-line-meta">
                                <span className="line-item-name">{it.productName}</span>
                                <span className="line-item-sub">
                                  Qty: {it.quantity} × ${Number(it.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div className="order-card-footer">
                          <div className="order-dest-info">
                            <span>Ship to: {order.shippingAddress}{order.city ? `, ${order.city}` : ''}</span>
                          </div>
                          <div className="order-total-info">
                            <span className="order-total-label">Total:</span>
                            <strong className="order-total-value">
                              ${Number(order.totalAmount).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
