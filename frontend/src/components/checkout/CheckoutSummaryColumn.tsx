import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { CartItem, Product } from '../../types';
import { resolveImageUrl, getProductFallbackImage } from '../../utils/image';

const SummaryItemThumb: React.FC<{ product: Product }> = ({ product }) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [product.id, product.imageUrl]);

  const src = imgError
    ? getProductFallbackImage(product.name, product.category)
    : resolveImageUrl(product.imageUrl, product.name, product.category);

  return (
    <img
      src={src}
      alt={product.name}
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
      className="summary-thumb"
    />
  );
};

interface SummaryColumnProps {
  cart: CartItem[];
  subtotal: number;
  estimatedShipping: number;
  estimatedTax: number;
  grandTotal: number;
}

export const CheckoutSummaryColumn: React.FC<SummaryColumnProps> = ({
  cart,
  subtotal,
  estimatedShipping,
  estimatedTax,
  grandTotal,
}) => {
  return (
    <div className="checkout-summary-column">
      <h3 className="summary-title">Summary ({cart.length} items)</h3>
      <div className="summary-items-list">
        {cart.map(({ product, quantity }) => (
          <div key={product.id} className="summary-item-row">
            <SummaryItemThumb product={product} />
            <div className="summary-item-info">
              <span className="summary-item-name">{product.name}</span>
              <span className="summary-item-qty">Qty: {quantity}</span>
            </div>
            <span className="summary-item-price">
              ${(product.price * quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="summary-totals">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{estimatedShipping === 0 ? 'FREE' : `$${estimatedShipping.toFixed(2)}`}</span>
        </div>
        <div className="summary-row">
          <span>Estimated Sales Tax (8%)</span>
          <span>${estimatedTax.toFixed(2)}</span>
        </div>
        <div className="summary-row grand-total-row">
          <span>Total Amount</span>
          <strong>${grandTotal.toFixed(2)}</strong>
        </div>
      </div>

      <div className="checkout-trust-banner">
        <ShieldCheck size={16} />
        <span>Protected with 256-Bit SSL End-to-End Encryption</span>
      </div>
    </div>
  );
};
