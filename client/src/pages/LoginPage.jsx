import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const returnTo = location.state?.from || '/';

  const [view, setView] = useState('login'); // 'login' | 'forgot'
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [resetForm, setResetForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const resetPasswordStats = useMemo(() => {
    const hasLength = resetForm.newPassword.length >= 8;
    const hasAlphaNum = /[a-zA-Z]/.test(resetForm.newPassword) && /[0-9]/.test(resetForm.newPassword);
    const matches = resetForm.newPassword.length > 0 && resetForm.newPassword === resetForm.confirmPassword;
    return { hasLength, hasAlphaNum, matches };
  }, [resetForm.newPassword, resetForm.confirmPassword]);

  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      signIn(result);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }, [navigate, signIn, returnTo]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResetSuccess('');

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      signIn(result);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    if (!resetPasswordStats.hasLength) {
      setResetError('New password must be at least 8 characters.');
      return;
    }
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetBusy(true);
    setResetError('');

    try {
      const result = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetForm.email.trim(),
          password: resetForm.newPassword,
        }),
      });

      setForm((prev) => ({ ...prev, email: resetForm.email.trim(), password: '' }));
      setResetSuccess(result.message || 'Password updated successfully! Please sign in with your new password.');
      setResetBusy(false);
      setView('login');
    } catch (requestError) {
      setResetError(requestError.message);
      setResetBusy(false);
    }
  }

  return (
    <motion.div
      className="auth-card-core login-mode"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="auth-title-row">
        <div>
          <h2 className="auth-main-title">
            {view === 'forgot' ? 'Reset password' : 'Welcome back'}
          </h2>
          <p className="auth-sub-desc">
            {view === 'forgot'
              ? 'Enter your account email and choose a new password'
              : 'Sign in to manage your surplus donations or pickups'}
          </p>
        </div>
      </div>

      <nav className="auth-nav-pill-group" aria-label="Account navigation">
        <span
          className={`auth-nav-pill-btn ${view === 'login' ? 'active' : ''}`}
          onClick={() => {
            if (view !== 'login') {
              setView('login');
              setResetError('');
            }
          }}
          style={{ cursor: view === 'forgot' ? 'pointer' : 'default' }}
        >
          {view === 'login' && (
            <motion.div 
              layoutId="authNavPill" 
              className="auth-nav-pill-indicator" 
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>Sign in</span>
        </span>
        <Link to="/register" state={location.state} className="auth-nav-pill-btn">
          <span style={{ position: 'relative', zIndex: 1 }}>Create account</span>
        </Link>
      </nav>

      <AnimatePresence>
        {resetSuccess && view === 'login' && (
          <motion.div
            className="auth-success-alert"
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: '10px' }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{resetSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {view === 'login' ? (
        <>
          <form className="auth-form-wrap" onSubmit={submit}>
            <div className="auth-field-unit">
              <label className="auth-field-tag" htmlFor="login-email">Email Address</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon-glyph">
                  <Mail size={14} />
                </span>
                <input
                  id="login-email"
                  required
                  type="email"
                  autoComplete="email"
                  className="auth-dark-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="auth-field-unit">
              <label className="auth-field-tag" htmlFor="login-password">Password</label>
              <div className="auth-input-shell">
                <span className="auth-input-icon-glyph">
                  <Lock size={14} />
                </span>
                <input
                  id="login-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="auth-dark-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="auth-forgot-row">
                <button
                  type="button"
                  className="auth-forgot-trigger"
                  onClick={() => {
                    setError('');
                    setResetError('');
                    setResetSuccess('');
                    setResetForm((prev) => ({ ...prev, email: form.email }));
                    setView('forgot');
                  }}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-dark-alert"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="auth-glow-submit-btn"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <AuthDivider />

          <div className="auth-google-wrapper">
            <GoogleSignInButton onCredential={finishGoogleSignIn} text="signin_with" />
          </div>
        </>
      ) : (
        <motion.form 
          className="auth-form-wrap" 
          onSubmit={handleResetPassword}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="community-perks-box" style={{ background: 'rgba(255, 94, 26, 0.08)', borderColor: 'rgba(255, 94, 26, 0.22)' }}>
            <div className="community-perks-header">
              <Sparkles size={13} className="perks-spark-icon" />
              <span>Direct Account Recovery</span>
            </div>
            <p className="community-perks-text">
              Enter your registered email address and define your new 8+ character password.
            </p>
          </div>

          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reset-email">Registered Email Address</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Mail size={14} />
              </span>
              <input
                id="reset-email"
                required
                type="email"
                autoComplete="email"
                className="auth-dark-input"
                placeholder="name@example.com"
                value={resetForm.email}
                onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reset-new-password">New Password</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Lock size={14} />
              </span>
              <input
                id="reset-new-password"
                required
                type={showResetPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                className="auth-dark-input"
                placeholder="At least 8 characters"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowResetPassword((p) => !p)}
                aria-label={showResetPassword ? 'Hide password' : 'Show password'}
              >
                {showResetPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reset-confirm-password">Confirm New Password</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Lock size={14} />
              </span>
              <input
                id="reset-confirm-password"
                required
                type={showResetConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                className="auth-dark-input"
                placeholder="Re-type new password"
                value={resetForm.confirmPassword}
                onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowResetConfirm((p) => !p)}
                aria-label={showResetConfirm ? 'Hide password' : 'Show password'}
              >
                {showResetConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {resetForm.newPassword.length > 0 && (
            <div className="password-subtle-indicator">
              <div className="password-dots-row">
                <span className={`password-dot ${resetPasswordStats.hasLength ? 'active' : ''}`} title="8+ chars" />
                <span className={`password-dot ${resetPasswordStats.hasAlphaNum ? 'active' : ''}`} title="Letters & numbers" />
                <span className={`password-dot ${resetPasswordStats.matches ? 'active' : ''}`} title="Passwords match" />
              </div>
              <span className="password-status-txt">
                {!resetPasswordStats.hasLength ? '8+ chars needed' : !resetPasswordStats.hasAlphaNum ? 'Add numbers' : resetPasswordStats.matches ? 'Passwords match ✓' : 'Confirm password'}
              </span>
            </div>
          )}

          <AnimatePresence>
            {resetError && (
              <motion.div
                className="auth-dark-alert"
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle size={14} />
                <span>{resetError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            className="auth-glow-submit-btn"
            disabled={resetBusy}
          >
            {resetBusy ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Updating Password…</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <button
            type="button"
            className="auth-back-link-btn"
            onClick={() => {
              setView('login');
              setResetError('');
            }}
          >
            <ArrowLeft size={13} />
            <span>Back to Sign in</span>
          </button>
        </motion.form>
      )}
    </motion.div>
  );
}
