import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, 
  Users, 
  HeartHandshake, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const ROLES = [
  {
    id: 'donor',
    label: 'Donor',
    hint: 'Share surplus food from restaurants, kitchens, or groceries',
    icon: UtensilsCrossed,
  },
  {
    id: 'receiver',
    label: 'Receiver',
    hint: 'Request surplus meals for community shelters & families',
    icon: Users,
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    hint: 'Help transport and coordinate neighborhood pickups',
    icon: HeartHandshake,
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const returnTo = location.state?.from || '/';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Real-time password validations
  const passwordStats = useMemo(() => {
    const hasLength = form.password.length >= 8;
    const hasAlphaNum = /[a-zA-Z]/.test(form.password) && /[0-9]/.test(form.password);
    const matches = form.password.length > 0 && form.password === form.confirmPassword;
    return { hasLength, hasAlphaNum, matches };
  }, [form.password, form.confirmPassword]);

  // Google sign in callback
  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, role: 'member' }),
      });
      signIn(result);
      navigate(returnTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }, [navigate, signIn, returnTo]);

  // Submit registration form
  async function submit(event) {
    event.preventDefault();

    if (!passwordStats.hasLength) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'member',
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
      className="auth-card-core"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Title Row */}
      <div className="auth-title-row">
        <div>
          <h2 className="auth-main-title">Join FoodBridge</h2>
          <p className="auth-sub-desc">Redistribute good food to where it’s needed most</p>
        </div>
      </div>

      {/* Nav Switcher with sliding animated pill */}
      <nav className="auth-nav-pill-group" aria-label="Account navigation">
        <Link to="/login" state={location.state} className="auth-nav-pill-btn">
          <span style={{ position: 'relative', zIndex: 1 }}>Sign in</span>
        </Link>
        <span className="auth-nav-pill-btn active">
          <motion.div 
            layoutId="authNavPill" 
            className="auth-nav-pill-indicator" 
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          />
          <span style={{ position: 'relative', zIndex: 1 }}>Create account</span>
        </span>
      </nav>

      {/* All-In-One Community Account Perks Badge */}
      <div className="community-perks-box">
        <div className="community-perks-header">
          <Sparkles size={13} className="perks-spark-icon" />
          <span>One Community Account</span>
        </div>
        <p className="community-perks-text">
          Donate surplus food, claim meals from neighbors, and volunteer for local pickups anytime.
        </p>
      </div>

      {/* Responsive Form Grid */}
      <form className="auth-form-wrap" onSubmit={submit}>
        <div className="form-grid-2col">
          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reg-name">Full Name</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <User size={14} />
              </span>
              <input
                id="reg-name"
                required
                maxLength={100}
                autoComplete="name"
                className="auth-dark-input"
                placeholder="e.g. Maya Lin"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reg-email">Email Address</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Mail size={14} />
              </span>
              <input
                id="reg-email"
                required
                type="email"
                autoComplete="email"
                className="auth-dark-input"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="form-grid-2col">
          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reg-password">Password</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Lock size={14} />
              </span>
              <input
                id="reg-password"
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                className="auth-dark-input"
                placeholder="Min 8 characters"
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

          <div className="auth-field-unit">
            <label className="auth-field-tag" htmlFor="reg-confirm">Confirm Password</label>
            <div className="auth-input-shell">
              <span className="auth-input-icon-glyph">
                <Lock size={14} />
              </span>
              <input
                id="reg-confirm"
                required
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                className="auth-dark-input"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowConfirmPassword((p) => !p)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Inline Subtle Password Checklist Dots */}
        {form.password.length > 0 && (
          <div className="password-subtle-indicator">
            <div className="password-dots-row">
              <span className={`password-dot ${passwordStats.hasLength ? 'active' : ''}`} title="8+ chars" />
              <span className={`password-dot ${passwordStats.hasAlphaNum ? 'active' : ''}`} title="Letters & numbers" />
              <span className={`password-dot ${passwordStats.matches ? 'active' : ''}`} title="Passwords match" />
            </div>
            <span className="password-status-txt">
              {!passwordStats.hasLength ? '8+ chars needed' : !passwordStats.hasAlphaNum ? 'Add numbers' : passwordStats.matches ? 'Passwords match ✓' : 'Confirm password'}
            </span>
          </div>
        )}

        {/* Error Alert */}
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
              <span>Creating account…</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <AuthDivider />

      <div className="auth-google-wrapper">
        <GoogleSignInButton onCredential={finishGoogleSignIn} text="signup_with" />
      </div>
    </motion.div>
  );
}
