import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserCheck } from 'lucide-react';

interface SignInFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  fillCustomerDemo: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
  fillCustomerDemo,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      {/* Demo Account Quick Picker */}
      <div className="demo-accounts-box">
        <span className="demo-accounts-label">Customer Demo:</span>
        <button
          type="button"
          onClick={fillCustomerDemo}
          className="demo-pill-btn"
        >
          <UserCheck size={14} />
          <span>Quick-Fill Customer Demo (`customer@aura.store`)</span>
        </button>
      </div>

      {/* Sign In Form */}
      <form onSubmit={onSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="auth-email" className="form-label">
            Email Address
          </label>
          <div className="form-input-wrapper">
            <Mail size={17} className="input-icon" />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@aura.store"
              className="form-input"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label htmlFor="auth-password" className="form-label">
              Password
            </label>
          </div>
          <div className="form-input-wrapper">
            <Lock size={17} className="input-icon" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="form-input"
              autoComplete="current-password"
              required
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
          className="auth-submit-btn"
        >
          {loading ? (
            <div className="btn-spinner" />
          ) : (
            <>
              <span>Sign In Securely</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </>
  );
};
