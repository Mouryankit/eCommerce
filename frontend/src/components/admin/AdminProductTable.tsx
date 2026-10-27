import React, { useState } from 'react';
import type { Product } from '../../types';
import { resolveImageUrl, getProductFallbackImage } from '../../utils/image';
import { Package, MinusCircle, PlusCircle, Edit3, Eye, Trash2 } from 'lucide-react';

const AdminProductThumb: React.FC<{ product: Product }> = ({ product }) => {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const fallback = getProductFallbackImage(product.name, product.category);
  const resolved = resolveImageUrl(product.imageUrl, product.name, product.category);
  const src = failedUrl === resolved ? fallback : resolved;

  return (
    <img
      src={src}
      alt={product.name}
      onError={() => setFailedUrl(resolved)}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="table-thumb-image"
    />
  );
};

interface TableProps {
  displayedProducts: Product[];
  handleQuickAdjust: (id: number, delta: number) => Promise<void>;
  handleEdit: (product: Product) => void;
  setPreviewProduct: (product: Product | null) => void;
  setDeletingId: (id: number | null) => void;
}

export const AdminProductTable: React.FC<TableProps> = ({
  displayedProducts,
  handleQuickAdjust,
  handleEdit,
  setPreviewProduct,
  setDeletingId,
}) => {
  return (
    <div className="admin-table-card">
      <div className="table-responsive-wrapper">
        <table className="admin-inventory-table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Inventory</th>
              <th>Status</th>
              <th className="table-header-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty-cell">
                  <div className="table-empty-state">
                    <Package size={36} strokeWidth={1.5} />
                    <h4>No inventory matches your search criteria</h4>
                    <p>Try clearing filters or add a new product to your catalog.</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayedProducts.map((item) => {
                const isOut = item.quantity <= 0;
                const isLow = item.quantity > 0 && item.quantity <= 5;
                const cleanDesc = item.description.replace(/^\[(Electronics|Apparel|Accessories|Home)\]\s*/i, '');

                return (
                  <tr key={item.id} className="admin-table-row">
                    {/* Details */}
                    <td className="product-details-cell">
                      <div className="cell-flex">
                        <AdminProductThumb product={item} />
                        <div className="cell-text">
                          <span className="table-product-title">{item.name}</span>
                          <span className="table-product-sub">
                            ID: #{item.id} • {cleanDesc.slice(0, 48)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="table-cat-pill">{item.category || 'General'}</span>
                    </td>

                    {/* Price */}
                    <td>
                      <span className="table-price-text">${Number(item.price).toFixed(2)}</span>
                    </td>

                    {/* Quantity with quick +/- adjustment */}
                    <td>
                      <div className="table-stock-control">
                        <button
                          onClick={() => handleQuickAdjust(item.id, -1)}
                          disabled={item.quantity <= 0}
                          className="quick-stock-btn"
                          title="Decrease stock by 1"
                          aria-label="Decrease stock"
                        >
                          <MinusCircle size={17} />
                        </button>
                        <span className="quick-stock-qty">{item.quantity}</span>
                        <button
                          onClick={() => handleQuickAdjust(item.id, 1)}
                          className="quick-stock-btn"
                          title="Increase stock by 1"
                          aria-label="Increase stock"
                        >
                          <PlusCircle size={17} />
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {isOut ? (
                        <span className="stock-badge badge-danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="stock-badge badge-warning">Low Stock ({item.quantity})</span>
                      ) : (
                        <span className="stock-badge badge-success">In Stock</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="table-cell-actions">
                      <div className="actions-flex-row">
                        <button
                          onClick={() => handleEdit(item)}
                          className="table-action-btn edit-action"
                          title="Edit product"
                        >
                          <Edit3 size={15} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setPreviewProduct(item)}
                          className="table-action-btn view-action"
                          title="Preview product details"
                        >
                          <Eye size={15} />
                          <span>Preview</span>
                        </button>

                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="table-action-btn delete-action"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
