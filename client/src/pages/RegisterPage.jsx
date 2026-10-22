import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './RegisterPage.css';

const roles = [
  { id: 'donor', icon: '↗', title: 'Share food', detail: 'I have surplus to donate' },
  { id: 'receiver', icon: '⌂', title: 'Find food', detail: 'I need food for a community' },
  { id: 'volunteer', icon: '✳', title: 'Help out', detail: 'I can support collections' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential, role }),
      });
      signIn(result);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }, [navigate, role, signIn]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...form, role }),
      });
      signIn(result);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const passwordProgress = Math.min(form.password.length / 12, 1);
  const passwordStrength = form.password.length < 8 ? 'Add at least 8 characters' : form.password.length < 12 ? 'Good start' : 'Strong password';

  return <section className="auth-card register-screen" aria-busy={busy}>
    <div className="register-heading">
      <span className="eyebrow">JOIN THE FOODBRIDGE COMMUNITY</span>
      <h2>Good food has<br /><em>a next chapter.</em></h2>
      <p>Create an account to share surplus, find food, or lend a hand.</p>
    </div>

    <div className="auth-switch register-switch" aria-label="Account options">
      <span className="active" aria-current="page">Create account</span>
      <Link to="/login">Sign in</Link>
    </div>

    <form className="register-form" onSubmit={submit}>
      <fieldset className="role-picker">
        <legend>Your role</legend>
        <div className="role-options">
          {roles.map(item => <button
            key={item.id}
            type="button"
            className={`role-option${role === item.id ? ' selected' : ''}`}
            aria-pressed={role === item.id}
            onClick={() => setRole(item.id)}
          >
            <span className="role-icon" aria-hidden="true">{item.icon}</span>
            <span className="role-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
            <span className="role-check" aria-hidden="true">✓</span>
          </button>)}
        </div>
      </fieldset>

      <div className="register-field-grid">
        <label className="register-field register-field-wide">Full name
          <input required autoComplete="name" maxLength={100} placeholder="How should we call you?" value={form.name} onChange={e => setForm(current => ({ ...current, name: e.target.value }))} />
        </label>
        <label className="register-field register-field-wide">Email address
          <input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(current => ({ ...current, email: e.target.value }))} />
        </label>
        <label className="register-field register-field-wide">Create password
          <span className="password-control">
            <input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={form.password} onChange={e => setForm(current => ({ ...current, password: e.target.value }))} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
          <span className="password-hint"><span className="password-track"><span style={{ width: `${passwordProgress * 100}%` }} /></span><small>{form.password ? passwordStrength : 'Use 8 or more characters'}</small></span>
        </label>
      </div>

      {error && <p className="notice error register-error" role="alert">{error}</p>}
      <button className="button button-primary register-submit" disabled={busy}>
        <span>{busy ? 'Creating your account…' : 'Create my account'}</span><span className="submit-arrow" aria-hidden="true">↗</span>
      </button>
    </form>

    <AuthDivider />
    <div className="register-google"><GoogleSignInButton onCredential={finishGoogleSignIn} /></div>
    <p className="register-consent">By joining, you agree to share accurate food and pickup information.</p>

    <div className="register-impact" aria-label="FoodBridge flow: share, connect, nourish">
      <div className="impact-title"><span>THE FOODBRIDGE LOOP</span><span className="impact-sparkle">✳</span></div>
      <div className="impact-flow">
        <span><i>01</i> Share</span><b aria-hidden="true">···</b><span><i>02</i> Connect</span><b aria-hidden="true">···</b><span><i>03</i> Nourish</span>
      </div>
    </div>
  </section>;
}
