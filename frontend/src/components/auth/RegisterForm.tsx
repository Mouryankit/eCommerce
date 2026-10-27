import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User as UserIcon, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      {error && (
        <div className="auth-error-alert" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Full Name</label>
        <div className="form-input-wrapper">
          <UserIcon size={17} className="input-icon" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Julian Vance"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <div className="form-input-wrapper">
          <Mail size={17} className="input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="form-input"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label">Password</label>
          <span className="form-hint">Minimum 6 characters</span>
        </div>
        <div className="form-input-wrapper">
          <Lock size={17} className="input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="form-input"
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
            <span>Create Customer Account</span>
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
};
