import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isLoginModalOpen, closeLogin, login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const adminUrl =
    (import.meta.env.VITE_ADMIN_URL as string) || 'http://localhost:4001';

  if (!isLoginModalOpen) return null;

  const validateSignIn = () => {
    if (!email.trim()) {
      setError('Please provide your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    if (!regName.trim()) {
      setError('Please provide your full name.');
      return false;
    }
    if (!regEmail.trim()) {
      setError('Please provide your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdminNotice(null);

    if (!validateSignIn()) return;

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please verify your email and password.');
      } else {
        // Check if admin logged into customer store
        const storedUser = localStorage.getItem('aura_user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        if (parsed?.role?.toUpperCase() === 'ADMIN') {
          setAdminNotice('You logged in with an Administrator account.');
        } else {
          closeLogin();
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateRegister()) return;

    setLoading(true);
    try {
      const result = await register(regName, regEmail, regPassword);
      if (!result.success) {
        setError(result.error || 'Registration failed.');
      } else {
        closeLogin();
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCustomerDemo = () => {
    setEmail('customer@aura.store');
    setPassword('customer123');
    setError('');
  };

  return (
    <div className="modal-backdrop-overlay" onClick={closeLogin}>
      <div
        className="auth-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <button
          onClick={closeLogin}
          className="modal-close-icon-btn"
          aria-label="Close authentication modal"
        >
          <X size={20} />
        </button>

        {/* Brand / Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">◈ AURA STUDIO</div>
          <h2 id="auth-modal-title" className="auth-modal-title">
            {tab === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === 'signin'
              ? 'Access curated orders, real-time tracking, and express checkout.'
              : 'Join the AURA community for order tracking and exclusive releases.'}
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="auth-tabs-bar">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setTab('signin');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {adminNotice ? (
          <div className="admin-redirect-banner">
            <h4>Administrator Account Detected</h4>
            <p>You have signed in with an administrator account ({email}).</p>
            <div className="admin-banner-actions">
              <a
                href={adminUrl}
                className="admin-banner-go-btn"
                title="Open Administrative Console"
              >
                <span>Go to Admin Portal</span>
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                onClick={closeLogin}
                className="admin-banner-stay-btn"
              >
                Continue Browsing Storefront
              </button>
            </div>
          </div>
        ) : tab === 'signin' ? (
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
            <form onSubmit={handleSignInSubmit} className="auth-form" noValidate>
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
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
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
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
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
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
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
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
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
        )}

        <div className="auth-footer-note">
          <ShieldCheck size={15} />
          <span>Protected with cryptographic salt hashing & JWT token validation</span>
        </div>
      </div>
    </div>
  );
};
