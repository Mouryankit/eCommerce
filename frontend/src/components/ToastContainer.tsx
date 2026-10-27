import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport" aria-live="assertive">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconClass = 'toast-icon-info';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconClass = 'toast-icon-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          iconClass = 'toast-icon-error';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconClass = 'toast-icon-warning';
        }

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type}`} role="alert">
            <div className={`toast-icon-wrapper ${iconClass}`}>
              <Icon size={18} strokeWidth={2.2} />
            </div>
            <p className="toast-message">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close-btn"
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
