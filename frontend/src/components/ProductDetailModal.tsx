import React, { useState } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { X, Star, Plus, Minus, ShoppingBag, ShieldCheck, Truck, RefreshCw, Check } from 'lucide-react';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const cleanDesc = product.description.replace(/^\[(Electronics|Apparel|Accessories|Home)\]\s*/i, '');
  const isOutOfStock = product.quantity <= 0;

  const resolvedUrl = resolveImageUrl(product.imageUrl, product.name, product.category);
  const fallbackImage = getProductFallbackImage(product.name, product.category);
  const displayImage = failedUrl === resolvedUrl ? fallbackImage : resolvedUrl;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div
        className="product-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="modal-close-icon-btn"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <div className="product-modal-grid">
          {/* Left Column: Big Product Image */}
          <div className="product-modal-media">
            <img
              src={displayImage}
              alt={product.name}
              onError={() => setFailedUrl(resolvedUrl)}
              referrerPolicy="no-referrer"
              className="product-modal-image"
            />
            {product.badge && (
              <span className="product-modal-badge">{product.badge}</span>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="product-modal-info">
            <div className="modal-header-meta">
              <span className="modal-category-tag">{product.category || 'Collection'}</span>
              <div className="modal-rating-row">
                <Star size={15} className="star-filled" fill="currentColor" />
                <span className="rating-score">{Number(product.rating || 4.9).toFixed(1)}</span>
                <span className="rating-count">({product.reviewCount || 48} verified reviews)</span>
              </div>
            </div>

            <h2 className="product-modal-title">{product.name}</h2>

            <div className="product-modal-price-row">
              <span className="product-modal-price">${Number(product.price).toFixed(2)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="product-modal-strike">${Number(product.originalPrice).toFixed(2)}</span>
              )}
              <span className={`modal-stock-badge ${isOutOfStock ? 'badge-out' : 'badge-in'}`}>
                {isOutOfStock ? 'Sold Out' : `${product.quantity} Available`}
              </span>
            </div>

            <p className="product-modal-desc">{cleanDesc}</p>

            {/* Quantity Selector & Add Action */}
            <div className="modal-action-row">
              <div className="quantity-counter-box">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="counter-btn"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="counter-value">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.quantity || 99, q + 1))}
                  disabled={quantity >= product.quantity || isOutOfStock}
                  className="counter-btn"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`modal-add-cart-btn ${isAdded ? 'btn-added' : ''}`}
              >
                {isAdded ? (
                  <>
                    <Check size={18} />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{isOutOfStock ? 'Out of Stock' : `Add to Bag • $${(product.price * quantity).toFixed(2)}`}</span>
                  </>
                )}
              </button>
            </div>

            {/* Guarantee and Shipping Highlights */}
            <div className="modal-perks-list">
              <div className="modal-perk-item">
                <Truck size={17} />
                <div>
                  <strong>Complimentary Express Delivery</strong>
                  <p>Dispatched in custom protective minimalist packaging.</p>
                </div>
              </div>
              <div className="modal-perk-item">
                <ShieldCheck size={17} />
                <div>
                  <strong>Authenticity & Warranty Included</strong>
                  <p>Covered by AURA 2-year manufacturer studio warranty.</p>
                </div>
              </div>
              <div className="modal-perk-item">
                <RefreshCw size={17} />
                <div>
                  <strong>30-Day Effortless Returns</strong>
                  <p>Prepaid return label enclosed with every package.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
