import React, { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus } from '../types';
import {
  fetchAllOrdersFromBackend,
  updateOrderStatusOnBackend,
} from '../services/graphql';
import { useToast } from '../context/ToastContext';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { AdminOrdersStats } from './admin/AdminOrdersStats';
import { AdminOrdersTable } from './admin/AdminOrdersTable';

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

  return (
    <div className="admin-orders-container">
      {/* Overview Stats */}
      <AdminOrdersStats orders={orders} />

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
      <AdminOrdersTable
        filteredOrders={filteredOrders}
        updatingId={updatingId}
        handleStatusChange={handleStatusChange}
      />
    </div>
  );
};
