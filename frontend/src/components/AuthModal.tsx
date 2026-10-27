import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck } from 'lucide-react';
import { validateEmail, validatePassword, validateName } from '../utils/authValidation';
import { SignInForm } from './auth/SignInForm';
import { RegisterForm } from './auth/RegisterForm';
import { AdminNoticeBanner } from './auth/AdminNoticeBanner';

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

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const adminUrl =
    (import.meta.env.VITE_ADMIN_URL as string) || 'http://localhost:4001';

  if (!isLoginModalOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdminNotice(null);

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setError(emailVal.error!);
      return;
    }
    const passVal = validatePassword(password, 1);
    if (!passVal.valid) {
      setError(passVal.error!);
      return;
    }

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

    const nameVal = validateName(regName);
    if (!nameVal.valid) {
      setError(nameVal.error!);
      return;
    }
    const emailVal = validateEmail(regEmail);
    if (!emailVal.valid) {
      setError(emailVal.error!);
      return;
    }
    const passVal = validatePassword(regPassword, 6);
    if (!passVal.valid) {
      setError(passVal.error!);
      return;
    }

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
          <AdminNoticeBanner
            email={email}
            adminUrl={adminUrl}
            onClose={closeLogin}
          />
        ) : tab === 'signin' ? (
          <SignInForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            loading={loading}
            onSubmit={handleSignInSubmit}
          />
        ) : (
          <RegisterForm
            name={regName}
            setName={setRegName}
            email={regEmail}
            setEmail={setRegEmail}
            password={regPassword}
            setPassword={setRegPassword}
            error={error}
            loading={loading}
            onSubmit={handleRegisterSubmit}
          />
        )}

        <div className="auth-footer-note">
          <ShieldCheck size={15} />
          <span>Protected with cryptographic salt hashing & JWT token validation</span>
        </div>
      </div>
    </div>
  );
};
