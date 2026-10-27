import React from 'react';
import { ShoppingBag, CheckCircle2, Clock, Truck, XCircle, AlertCircle } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';

interface OrdersTableProps {
  filteredOrders: Order[];
  updatingId: number | null;
  handleStatusChange: (orderId: number, nextStatus: OrderStatus) => Promise<void>;
}

export const AdminOrdersTable: React.FC<OrdersTableProps> = ({
  filteredOrders,
  updatingId,
  handleStatusChange,
}) => {
  return (
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
  );
};
