import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const tokenKey = 'foodbridge-token';

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'The request could not be completed.');
  return data;
}

function AuthScreen({ onSignedIn }) {
  const [mode, setMode] = useState('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('donor');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [googleReady, setGoogleReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let timer;
    const setup = () => {
      if (!clientId || !window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setBusy(true); setError('');
          try {
            const result = await request('/auth/google', { method: 'POST', body: JSON.stringify({ credential, role }) });
            onSignedIn(result);
          } catch (e) { setError(e.message); setBusy(false); }
        },
      });
      const target = document.getElementById('google-button');
      if (target) {
        target.innerHTML = '';
        window.google.accounts.id.renderButton(target, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 340 });
      }
      setGoogleReady(true);
      return true;
    };
    if (!setup()) timer = window.setInterval(() => { if (setup()) window.clearInterval(timer); }, 250);
    return () => window.clearInterval(timer);
  }, [clientId, role, onSignedIn]);

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const payload = mode === 'register' ? { ...form, role } : { email: form.email, password: form.password };
      const result = await request(path, { method: 'POST', body: JSON.stringify(payload) });
      onSignedIn(result);
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return <div className="auth-layout">
    <aside className="welcome-panel">
      <div className="brand brand-light"><span className="brand-mark">f</span> foodbridge</div>
      <div className="welcome-copy">
        <span className="eyebrow">GOOD FOOD, PASSED FORWARD</span>
        <h1>Make a little<br /><em>go a long way.</em></h1>
        <p>Bring good food to the people who need it. Every meal deserves a better next chapter.</p>
      </div>
      <div className="welcome-art" aria-hidden="true"><span>✳</span><span>↗</span><span>◌</span></div>
      <div className="welcome-footer">A community-powered way to share surplus.</div>
    </aside>

    <main className="auth-main">
      <div className="mobile-brand brand"><span className="brand-mark">f</span> foodbridge</div>
      <section className="auth-card">
        <div className="auth-heading">
          <span className="eyebrow">{mode === 'register' ? 'WELCOME TO THE TABLE' : 'GOOD TO SEE YOU AGAIN'}</span>
          <h2>{mode === 'register' ? 'Create your account' : 'Welcome back'}</h2>
          <p>{mode === 'register' ? 'Start sharing food and building community.' : 'Sign in to manage your FoodBridge activity.'}</p>
        </div>
        <div className="auth-switch" role="tablist" aria-label="Account action">
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
        </div>
        <form className="form-stack" onSubmit={submit}>
          {mode === 'register' && <>
            <label>Full name<input required autoComplete="name" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>I’m joining as<select value={role} onChange={e => setRole(e.target.value)}><option value="donor">Food donor</option><option value="receiver">Food receiver</option><option value="volunteer">Volunteer</option></select></label>
          </>}
          <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="notice error" role="alert">{error}</p>}
          <button className="button button-primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'} <span>↗</span></button>
        </form>
        <div className="separator"><span>or continue with</span></div>
        {clientId ? <div id="google-button" className="google-button" aria-label="Continue with Google" /> : <button className="button button-google full" disabled title="Add VITE_GOOGLE_CLIENT_ID to client/.env to enable Google sign-in"><span className="google-g">G</span> Continue with Google <span className="setup-hint">setup needed</span></button>}
        {!googleReady && clientId && <span className="sr-only">Loading Google sign-in</span>}
        <p className="legal-copy">By continuing, you agree to use FoodBridge responsibly and share accurate food and pickup information.</p>
      </section>
      <div className="auth-bottom">Made for better food days <span>✳</span></div>
    </main>
  </div>;
}

function ListingForm({ token, onCreated }) {
  const empty = { foodName: '', description: '', photoUrl: '', quantity: '1', portionUnit: 'servings', pickupLocation: '', pickupOpensAt: '', pickupClosesAt: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { listing } = await request('/listings', { token, method: 'POST', body: JSON.stringify({ ...form, quantity: Number(form.quantity), pickupOpensAt: new Date(form.pickupOpensAt).toISOString(), pickupClosesAt: new Date(form.pickupClosesAt).toISOString() }) });
      setForm(empty); onCreated(listing);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="panel form-panel">
    <div className="panel-heading"><div><span className="eyebrow">SHARE A DONATION</span><h2>List surplus food</h2><p>Tell your community what’s available and when it can be collected.</p></div><span className="step-badge">01 <i>/ 02</i></span></div>
    <form className="listing-form" onSubmit={submit}>
      <div className="field-section"><h3><span>1</span> Food details</h3><div className="field-grid">
        <label className="span-2">Food name<input required maxLength="120" placeholder="e.g. Vegetable biryani" value={form.foodName} onChange={e => set('foodName', e.target.value)} /></label>
        <label className="span-2">Description<textarea required maxLength="2000" rows="3" placeholder="Add helpful details about the food…" value={form.description} onChange={e => set('description', e.target.value)} /></label>
        <label>Quantity<input required type="number" min="1" step="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></label>
        <label>Portion unit<input required maxLength="40" placeholder="servings, boxes…" value={form.portionUnit} onChange={e => set('portionUnit', e.target.value)} /></label>
        <label className="span-2">Photo URL <span className="optional">(optional)</span><input type="url" placeholder="https://example.com/food-photo.jpg" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} /></label>
      </div></div>
      <div className="field-section"><h3><span>2</span> Pickup details</h3><div className="field-grid">
        <label className="span-2">Pickup location<input required maxLength="300" placeholder="Address, neighborhood, or landmark" value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)} /></label>
        <label>Pickup opens<input required type="datetime-local" value={form.pickupOpensAt} onChange={e => set('pickupOpensAt', e.target.value)} /></label>
        <label>Pickup closes<input required type="datetime-local" value={form.pickupClosesAt} onChange={e => set('pickupClosesAt', e.target.value)} /></label>
      </div></div>
      {error && <p className="notice error" role="alert">{error}</p>}
      <div className="form-actions"><p>Your listing will be visible in your donor dashboard.</p><button className="button button-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish listing'} <span>↗</span></button></div>
    </form>
  </section>;
}

function Dashboard({ session, onSignOut }) {
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('listings');
  const load = async () => {
    setLoading(true);
    try { const data = await request('/listings/mine', { token: session.token }); setListings(data.listings); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (session.user.role === 'donor') load(); else setLoading(false); }, []);

  return <div className="dashboard">
    <header className="topbar"><a href="#" className="brand"><span className="brand-mark">f</span> foodbridge</a><div className="topbar-right"><span className="avatar">{session.user.name.charAt(0).toUpperCase()}</span><span className="user-name">{session.user.name}</span><button className="signout" onClick={onSignOut}>Sign out</button></div></header>
    <div className="dashboard-wrap">
      <aside className="sidebar"><span className="eyebrow">YOUR WORKSPACE</span><button className={view === 'listings' ? 'nav-item selected' : 'nav-item'} onClick={() => setView('listings')}><span>▦</span> My listings</button><div className="sidebar-note"><span>✳</span><p>Good things grow when we share them.</p></div></aside>
      <main className="dashboard-main">
        <div className="page-title"><div><span className="eyebrow">DONOR DASHBOARD</span><h1>Your food, <em>forward.</em></h1><p>Create a listing and make surplus food count.</p></div><div className="live-pill"><span /> MODULE 01</div></div>
        {session.user.role !== 'donor' ? <div className="notice info">Your account is set up as a {session.user.role}. Food listing creation is available to donor accounts.</div> : <>
          <ListingForm token={session.token} onCreated={listing => { setListings(current => [listing, ...current]); setView('listings'); }} />
          <section className="listings-section"><div className="listings-title"><div><span className="eyebrow">YOUR DONATIONS</span><h2>Recent listings <span className="count-badge">{listings.length}</span></h2></div><button className="text-button" onClick={load}>Refresh <span>↻</span></button></div>
            {error && <p className="notice error">{error}</p>}
            {loading ? <div className="empty-state">Loading your listings…</div> : listings.length ? <div className="listing-grid">{listings.map(item => <article className="listing-card" key={item._id}><div className="listing-photo">{item.photoUrl ? <img src={item.photoUrl} alt={item.foodName} /> : <span>✳</span>}<span className="status-pill">{item.status}</span></div><div className="listing-info"><h3>{item.foodName}</h3><p>{item.description}</p><div className="listing-meta"><span>◉ {item.quantity} {item.portionUnit}</span><span>⌖ {item.pickupLocation}</span></div><div className="pickup-time">Pickup {new Date(item.pickupOpensAt).toLocaleString()} – {new Date(item.pickupClosesAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div></div></article>)}</div> : <div className="empty-state"><span>◌</span><h3>Your first listing starts here</h3><p>Fill in the form above to share surplus food with your community.</p></div>}
          </section>
        </>}
      </main>
    </div>
  </div>;
}

function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const onSignedIn = React.useCallback((data) => { localStorage.setItem(tokenKey, data.token); setSession(data); }, []);
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) { setChecking(false); return; }
    request('/auth/me', { token }).then(data => setSession({ token, user: data.user })).catch(() => localStorage.removeItem(tokenKey)).finally(() => setChecking(false));
  }, []);
  const signOut = () => { localStorage.removeItem(tokenKey); setSession(null); };
  if (checking) return <div className="loading-screen">FoodBridge <span>✳</span></div>;
  return session ? <Dashboard session={session} onSignOut={signOut} /> : <AuthScreen onSignedIn={onSignedIn} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
