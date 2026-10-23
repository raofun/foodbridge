import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2,
  UtensilsCrossed,
  Users,
  HeartHandshake,
  Check,
  Sparkles
} from 'lucide-react';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const ROLES = [
  {
    id: 'donor',
    label: 'Food Donor',
    hint: 'I have surplus meals, groceries, or food to share',
    icon: UtensilsCrossed,
  },
  {
    id: 'receiver',
    label: 'Community Receiver',
    hint: 'I represent a shelter, food bank, or community needing food',
    icon: Users,
  },
  {
    id: 'volunteer',
    label: 'Volunteer Courier',
    hint: 'I want to help pick up and transport surplus donations',
    icon: HeartHandshake,
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const returnTo = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Handle Google Sign-In response
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

  // Handle email/password sign-in submission
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

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

  return (
    <motion.div
      className="auth-card-core login-mode"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Title Row */}
      <div className="auth-title-row">
        <div>
          <h2 className="auth-main-title">Welcome back</h2>
          <p className="auth-sub-desc">Sign in to manage your surplus donations or pickups</p>
        </div>
      </div>

      {/* Nav Switcher with sliding animated pill */}
      <nav className="auth-nav-pill-group" aria-label="Account navigation">
        <span className="auth-nav-pill-btn active">
          <motion.div 
            layoutId="authNavPill" 
            className="auth-nav-pill-indicator" 
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>Sign in</span>
        </span>
        <Link to="/register" state={location.state} className="auth-nav-pill-btn">
          <span style={{ position: 'relative', zIndex: 1 }}>Create account</span>
        </Link>
      </nav>

      {/* Login Form */}
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
        </div>

        {/* Error Notice */}
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

        {/* Action Button */}
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
    </motion.div>
  );
}
