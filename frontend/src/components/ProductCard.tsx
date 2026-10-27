import React, { useState } from 'react';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Star, Plus, Eye, Check, AlertCircle } from 'lucide-react';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => {
      setIsAdding(false);
    }, 700);
  };

  const fallbackImage = getProductFallbackImage(product.name, product.category);
  const resolvedUrl = resolveImageUrl(product.imageUrl, product.name, product.category);
  const displayImage = failedUrl === resolvedUrl ? fallbackImage : resolvedUrl;

  return (
    <article className="product-card-root" onClick={() => onQuickView(product)}>
      {/* Product Image Frame */}
      <div className="product-card-media-wrapper">
        <img
          src={displayImage}
          alt={product.name}
          onError={() => setFailedUrl(resolvedUrl)}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="product-card-image"
        />

        {/* Badges Overlay */}
        <div className="product-card-badge-container">
          {product.badge && (
            <span className="product-pill-badge badge-accent">{product.badge}</span>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="product-pill-badge badge-sale">
              SAVE ${Math.round(product.originalPrice - product.price)}
            </span>
          )}
        </div>

        {/* Stock warning pill */}
        {isOutOfStock ? (
          <span className="product-stock-tag stock-out">Out of Stock</span>
        ) : isLowStock ? (
          <span className="product-stock-tag stock-low">Only {product.quantity} Left</span>
        ) : null}

        {/* Hover Quick View Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView(product);
          }}
          className="product-card-quickview-btn"
          title="Quick preview"
          aria-label={`Quick view ${product.name}`}
        >
          <Eye size={16} />
          <span>Quick View</span>
        </button>
      </div>

      {/* Card Content & Details */}
      <div className="product-card-body">
        <div className="product-card-meta-row">
          <span className="product-category-label">{product.category || 'General'}</span>
          <div className="product-rating-inline" title={`Rating: ${product.rating || 4.8} out of 5`}>
            <Star size={13} className="star-filled" fill="currentColor" />
            <span className="rating-score">{Number(product.rating || 4.8).toFixed(1)}</span>
            <span className="rating-count">({product.reviewCount || 24})</span>
          </div>
        </div>

        <h3 className="product-card-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-card-desc">
          {product.description.replace(/^\[(Electronics|Apparel|Accessories|Home)\]\s*/i, '')}
        </p>

        {/* Pricing & Add To Cart Button */}
        <div className="product-card-footer">
          <div className="product-price-wrapper">
            <span className="product-active-price">
              ${Number(product.price).toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="product-original-price">
                ${Number(product.originalPrice).toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`product-card-add-btn ${isAdding ? 'adding-state' : ''}`}
            aria-label={`Add ${product.name} to cart`}
          >
            {isAdding ? (
              <>
                <Check size={16} />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <>
                <AlertCircle size={15} />
                <span>Sold Out</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
