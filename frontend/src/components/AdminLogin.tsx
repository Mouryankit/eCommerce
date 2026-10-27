import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomerUrl } from '../utils/navigationUrls';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ExternalLink,
  Store,
} from 'lucide-react';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const customerUrl = getCustomerUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success || !result.user) {
        setError(result.error || 'Authentication failed. Please verify credentials.');
      } else {
        const role = result.user.role?.toUpperCase();
        if (role !== 'ADMIN') {
          setError(
            `Access Denied: Account "${result.user.email}" has customer permissions only. Administrator privileges are required to access this portal.`
          );
          logout();
        } else {
          onSuccess?.();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Login encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-fullscreen">
      <div className="admin-login-card">
        {/* Header / Brand */}
        <div className="admin-login-header">
          <div className="admin-login-brand">
            <span className="brand-symbol">◈</span>
            <span className="brand-name">AURA STUDIO</span>
          </div>
          <div className="admin-secure-pill">
            <ShieldCheck size={14} />
            <span>ADMINISTRATIVE PORTAL</span>
          </div>
          <h1 className="admin-login-title">Management Sign In</h1>
          <p className="admin-login-subtitle">
            Restricted access for catalog directors, inventory managers, and store administrators.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-login-alert" role="alert">
              <ShieldAlert size={18} className="alert-icon" />
              <div className="alert-text">{error}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Administrator Email</label>
            <div className="form-input-wrapper">
              <Mail size={17} className="input-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="form-input"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Secure Password</label>
            </div>
            <div className="form-input-wrapper">
              <Lock size={17} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-login-submit-btn"
          >
            {loading ? (
              <div className="btn-spinner" />
            ) : (
              <>
                <span>Enter Administration Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="admin-login-footer">
          <a
            href={customerUrl}
            className="customer-switch-link"
            title="Go to Customer Storefront"
          >
            <Store size={15} />
            <span>Looking for customer store? Go to Customer Website</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
};
