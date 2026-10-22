import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true); setError('');
    try {
      const result = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
      signIn(result); navigate('/dashboard');
    } catch (e) { setError(e.message); setBusy(false); }
  }, [navigate, signIn]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(form) });
      signIn(result); navigate('/dashboard');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return <section className="auth-card">
    <div className="auth-heading"><span className="eyebrow">GOOD TO SEE YOU AGAIN</span><h2>Welcome back</h2><p>Sign in to manage your FoodBridge activity.</p></div>
    <div className="auth-switch"><Link to="/register">Create account</Link><Link className="active" to="/login">Sign in</Link></div>
    <form className="form-stack" onSubmit={submit}>
      <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label>Password<input required type="password" autoComplete="current-password" placeholder="Your password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
      {error && <p className="notice error" role="alert">{error}</p>}
      <button className="button button-primary full" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'} <span>↗</span></button>
    </form>
    <AuthDivider />
    <GoogleSignInButton onCredential={finishGoogleSignIn} text="signin_with" />
    <p className="legal-copy">Sign in to manage your account and FoodBridge activity.</p>
  </section>;
}
