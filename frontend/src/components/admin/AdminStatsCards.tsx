import React from 'react';
import { Package, Layers, DollarSign, AlertTriangle } from 'lucide-react';

interface StatsProps {
  stats: {
    totalProducts: number;
    totalUnits: number;
    inventoryValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    categoriesCount: number;
  };
}

export const AdminStatsCards: React.FC<StatsProps> = ({ stats }) => {
  return (
    <div className="admin-stats-grid">
      <div className="admin-stat-card">
        <div className="stat-card-icon stat-icon-blue">
          <Package size={22} />
        </div>
        <div className="stat-card-details">
          <span className="stat-card-label">Catalog Products</span>
          <h3 className="stat-card-number">{stats.totalProducts}</h3>
          <span className="stat-card-sub">{stats.categoriesCount} categories active</span>
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="stat-card-icon stat-icon-indigo">
          <Layers size={22} />
        </div>
        <div className="stat-card-details">
          <span className="stat-card-label">Total Units in Stock</span>
          <h3 className="stat-card-number">{stats.totalUnits.toLocaleString()}</h3>
          <span className="stat-card-sub">Items ready to dispatch</span>
        </div>
      </div>

      <div className="admin-stat-card">
        <div className="stat-card-icon stat-icon-emerald">
          <DollarSign size={22} />
        </div>
        <div className="stat-card-details">
          <span className="stat-card-label">Inventory Valuation</span>
          <h3 className="stat-card-number">
            ${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <span className="stat-card-sub">Retail stock value</span>
        </div>
      </div>

      <div className="admin-stat-card">
        <div className={`stat-card-icon ${stats.lowStockCount > 0 ? 'stat-icon-amber' : 'stat-icon-gray'}`}>
          <AlertTriangle size={22} />
        </div>
        <div className="stat-card-details">
          <span className="stat-card-label">Low / Out of Stock</span>
          <h3 className="stat-card-number">
            {stats.lowStockCount + stats.outOfStockCount}
          </h3>
          <span className="stat-card-sub">
            {stats.lowStockCount} low stock • {stats.outOfStockCount} sold out
          </span>
        </div>
      </div>
    </div>
  );
};
