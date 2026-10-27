import React from 'react';
import { ShoppingBag, Clock, PackageCheck, DollarSign } from 'lucide-react';
import type { Order } from '../../types';

interface OrdersStatsProps {
  orders: Order[];
}

export const AdminOrdersStats: React.FC<OrdersStatsProps> = ({ orders }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const processingCount = orders.filter((o) => o.status === 'PROCESSING').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
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
  );
};
