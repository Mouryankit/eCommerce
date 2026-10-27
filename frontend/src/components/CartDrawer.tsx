import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Truck, ShieldCheck } from 'lucide-react';
import type { Product } from '../types';
import { resolveImageUrl, getProductFallbackImage } from '../utils/image';

const CartItemThumb: React.FC<{ product: Product }> = ({ product }) => {
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
      className="cart-item-thumbnail"
    />
  );
};

interface CartDrawerProps {
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout }) => {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotal,
    freeShippingThreshold,
  } = useCart();

  if (!isCartOpen) return null;

  const amountRemainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const estimatedShipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 15;
  const estimatedTotal = subtotal + estimatedShipping;

  return (
    <div className="cart-drawer-overlay" onClick={closeCart} aria-modal="true" role="dialog">
      <aside
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Shopping Bag Slide-over"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title-box">
            <ShoppingBag size={20} />
            <h2 className="cart-title">Your Bag</h2>
            <span className="cart-badge-count">{totalItems}</span>
          </div>
          <button
            onClick={closeCart}
            className="cart-close-btn"
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="cart-shipping-meter">
          <div className="meter-label-row">
            <div className="meter-icon-text">
              <Truck size={15} />
              <span>
                {amountRemainingForFreeShipping === 0
                  ? 'Complimentary Express Shipping Unlocked!'
                  : `Add $${amountRemainingForFreeShipping.toFixed(2)} more for Free Shipping`}
              </span>
            </div>
            <span className="meter-percent">{Math.round(freeShippingProgress)}%</span>
          </div>
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List / Empty State */}
        <div className="cart-items-scroll">
          {cart.length === 0 ? (
            <div className="cart-empty-view">
              <div className="empty-cart-icon-wrap">
                <ShoppingBag size={44} strokeWidth={1.3} />
              </div>
              <h3 className="empty-cart-title">Your bag is empty</h3>
              <p className="empty-cart-subtext">
                Explore our minimalist catalog and discover objects created with purpose.
              </p>
              <button onClick={closeCart} className="empty-cart-cta-btn">
                <span>Start Shopping</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="cart-item-row">
                  <CartItemThumb product={product} />
                  <div className="cart-item-info">
                    <div className="cart-item-headline">
                      <h4 className="cart-item-title">{product.name}</h4>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="cart-item-remove-btn"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <span className="cart-item-category">{product.category || 'Lifestyle'}</span>

                    <div className="cart-item-bottom">
                      <div className="cart-item-counter">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="cart-counter-btn"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="cart-item-qty">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="cart-counter-btn"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div className="cart-item-price-col">
                        <span className="cart-item-total-price">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                        {quantity > 1 && (
                          <span className="cart-item-unit-price">
                            ${product.price.toFixed(2)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cart Footer & Checkout Controls */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal-breakdown">
              <div className="subtotal-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="subtotal-row">
                <span>Estimated Shipping</span>
                <span>
                  {estimatedShipping === 0 ? (
                    <span className="free-shipping-tag">FREE</span>
                  ) : (
                    `$${estimatedShipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="subtotal-row total-highlight">
                <span>Estimated Total</span>
                <span>${estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                closeCart();
                onCheckout();
              }}
              className="cart-checkout-btn"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <div className="cart-footer-auxiliary">
              <button onClick={clearCart} className="clear-cart-link">
                Empty Bag
              </button>
              <div className="cart-security-badge">
                <ShieldCheck size={14} />
                <span>256-Bit Encrypted Checkout</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
