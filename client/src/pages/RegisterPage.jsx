import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthDivider from '../components/AuthDivider.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const finishGoogleSignIn = useCallback(async (credential) => {
    setBusy(true); setError('');
    try {
      const result = await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential, role }) });
      signIn(result); navigate('/dashboard');
    } catch (e) { setError(e.message); setBusy(false); }
  }, [navigate, role, signIn]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ ...form, role }) });
      signIn(result); navigate('/dashboard');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return <section className="auth-card">
    <div className="auth-heading"><span className="eyebrow">WELCOME TO THE TABLE</span><h2>Create your account</h2><p>Start sharing food and building community.</p></div>
    <div className="auth-switch"><Link className="active" to="/register">Create account</Link><Link to="/login">Sign in</Link></div>
    <form className="form-stack" onSubmit={submit}>
      <label>Full name<input required autoComplete="name" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label>I’m joining as<select value={role} onChange={e => setRole(e.target.value)}><option value="donor">Food donor</option><option value="receiver">Food receiver</option><option value="volunteer">Volunteer</option></select></label>
      <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label>Password<input required type="password" minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
      {error && <p className="notice error" role="alert">{error}</p>}
      <button className="button button-primary full" disabled={busy}>{busy ? 'Please wait…' : 'Create account'} <span>↗</span></button>
    </form>
    <AuthDivider />
    <GoogleSignInButton onCredential={finishGoogleSignIn} />
    <p className="legal-copy">By continuing, you agree to use FoodBridge responsibly and share accurate food and pickup information.</p>
  </section>;
}
