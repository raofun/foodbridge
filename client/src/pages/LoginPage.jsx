import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Role selection modal state for first-time Google sign-in
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('donor');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Handle Google Sign-In response
  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      
      // If brand new Google user, prompt them with the quick role picker modal
      if (result.isNewUser) {
        setPendingGoogleUser(result);
        setBusy(false);
        return;
      }

      // Existing user: proceed immediately
      signIn(result);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }, [navigate, signIn]);

  // Complete registration for new Google user with selected role
  const completeGoogleSignUp = async () => {
    if (!pendingGoogleUser) return;
    setSubmittingRole(true);
    setError('');
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          credential: pendingGoogleUser.credential,
          role: selectedRole,
        }),
      });
      signIn(result);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setSubmittingRole(false);
    }
  };

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
      navigate('/dashboard');
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
        <Link to="/register" className="auth-nav-pill-btn">
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

      {/* Role Picker Modal for New Google Sign-In Users */}
      <AnimatePresence>
        {pendingGoogleUser && (
          <motion.div
            className="auth-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="auth-modal-card"
              initial={{ scale: 0.94, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 14 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="auth-modal-header">
                <span className="auth-modal-chip">
                  <Sparkles size={11} /> One Quick Step
                </span>
                <h3 className="auth-modal-title">
                  Welcome, {pendingGoogleUser.name.split(' ')[0]}!
                </h3>
                <p className="auth-modal-subtitle">
                  Choose how you will be participating in FoodBridge:
                </p>
              </div>

              <div className="auth-modal-roles-grid" role="radiogroup" aria-label="Select account role">
                {ROLES.map(({ id, label, hint, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selectedRole === id}
                    className={`auth-modal-role-item ${selectedRole === id ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(id)}
                  >
                    <div className="auth-modal-role-icon">
                      <Icon size={18} />
                    </div>
                    <div className="auth-modal-role-info">
                      <div className="auth-modal-role-name">{label}</div>
                      <div className="auth-modal-role-desc">{hint}</div>
                    </div>
                    <div className="auth-modal-check">
                      {selectedRole === id && <Check size={11} strokeWidth={3} />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="auth-modal-actions">
                <button
                  type="button"
                  className="auth-modal-cancel-btn"
                  onClick={() => setPendingGoogleUser(null)}
                  disabled={submittingRole}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="auth-modal-confirm-btn"
                  onClick={completeGoogleSignUp}
                  disabled={submittingRole}
                >
                  {submittingRole ? (
                    <>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
