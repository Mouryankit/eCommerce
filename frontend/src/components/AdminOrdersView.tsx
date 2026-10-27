import React, { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus } from '../types';
import {
  fetchAllOrdersFromBackend,
  updateOrderStatusOnBackend,
} from '../services/graphql';
import { useToast } from '../context/ToastContext';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrdersFromBackend();
      setOrders(data);
    } catch (err: any) {
      console.warn('Failed to load orders from backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: number, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusOnBackend(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      showToast(`Order status updated to ${nextStatus}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="admin-orders-container">
      {/* Overview Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-card-icon stat-icon-blue">
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Total Store Orders</span>
            <h3 className="stat-card-number">{orders.length}</h3>
            <span className="stat-card-sub">Placed across customer accounts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Pending Fulfillment</span>
            <h3 className="stat-card-number">{pendingCount + processingCount}</h3>
            <span className="stat-card-sub">
              {pendingCount} Pending • {processingCount} Processing
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon stat-icon-emerald">
            <PackageCheck size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Completed Deliveries</span>
            <h3 className="stat-card-number">{deliveredCount}</h3>
            <span className="stat-card-sub">Fulfilled successfully</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-card-icon stat-icon-indigo">
            <DollarSign size={22} />
          </div>
          <div className="stat-card-details">
            <span className="stat-card-label">Gross Order Volume</span>
            <h3 className="stat-card-number">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="stat-card-sub">Lifetime customer orders</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-table-toolbar">
        <div className="table-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, or Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="table-search-input"
          />
        </div>

        <div className="table-filters-group">
          <div className="table-select-wrap">
            <Filter size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="table-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => void loadOrders()}
            className={`admin-secondary-action-btn ${loading ? 'is-spinning' : ''}`}
            title="Refresh Orders"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-table-card">
        <div className="table-responsive-wrapper">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Customer</th>
                <th>Order Items</th>
                <th>Total Paid</th>
                <th>Fulfillment Status</th>
                <th className="table-header-right">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty-cell">
                    <div className="table-empty-state">
                      <ShoppingBag size={36} strokeWidth={1.5} />
                      <h4>No orders match your criteria</h4>
                      <p>Customer checkout orders will automatically populate here in real time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={order.id} className="admin-table-row">
                      {/* Reference */}
                      <td>
                        <div className="order-ref-cell">
                          <span className="order-number-badge">{order.orderNumber}</span>
                          <span className="order-date-text">{dateStr}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="customer-info-cell">
                          <span className="customer-name-text">{order.customerName}</span>
                          <span className="customer-email-text">{order.customerEmail}</span>
                          <span className="customer-dest-text">
                            {order.shippingAddress}
                            {order.city ? `, ${order.city}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td>
                        <div className="order-items-preview">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((it, idx) => (
                              <div key={idx} className="order-item-chip">
                                <span className="chip-name">{it.productName}</span>
                                <span className="chip-qty">×{it.quantity}</span>
                              </div>
                            ))
                          ) : (
                            <span className="table-product-sub">Standard Package</span>
                          )}
                        </div>
                      </td>

                      {/* Total */}
                      <td>
                        <span className="table-price-text">
                          ${Number(order.totalAmount).toFixed(2)}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`order-status-badge status-${order.status.toLowerCase()}`}
                        >
                          {order.status === 'DELIVERED' && <CheckCircle2 size={13} />}
                          {order.status === 'SHIPPED' && <Truck size={13} />}
                          {order.status === 'PROCESSING' && <Clock size={13} />}
                          {order.status === 'PENDING' && <AlertCircle size={13} />}
                          {order.status === 'CANCELLED' && <XCircle size={13} />}
                          <span>{order.status}</span>
                        </span>
                      </td>

                      {/* Status Control */}
                      <td className="table-header-right">
                        <select
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            void handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          className="status-action-select"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
