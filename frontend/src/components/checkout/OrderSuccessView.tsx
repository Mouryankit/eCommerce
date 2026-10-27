import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface OrderSuccessProps {
  completedOrder: string;
  fullName: string;
  address: string;
  city: string;
  grandTotal: number;
  onContinue: () => void;
}

export const OrderSuccessView: React.FC<OrderSuccessProps> = ({
  completedOrder,
  fullName,
  address,
  city,
  grandTotal,
  onContinue,
}) => {
  return (
    <div className="order-success-view">
      <div className="order-success-icon-box">
        <CheckCircle2 size={48} className="order-success-icon" />
      </div>
      <h2 className="order-success-title">Order Confirmed!</h2>
      <p className="order-success-desc">
        Thank you for shopping with AURA Studio. We have received your order and are
        preparing your items for dispatch.
      </p>

      <div className="order-receipt-card">
        <div className="receipt-row">
          <span>Confirmation Code</span>
          <strong>{completedOrder}</strong>
        </div>
        <div className="receipt-row">
          <span>Recipient</span>
          <span>{fullName}</span>
        </div>
        <div className="receipt-row">
          <span>Shipping Address</span>
          <span>{address}, {city}</span>
        </div>
        <div className="receipt-row total-row">
          <span>Total Paid</span>
          <strong>${grandTotal.toFixed(2)}</strong>
        </div>
      </div>

      <button onClick={onContinue} className="order-done-btn">
        Continue Browsing
      </button>
    </div>
  );
};
