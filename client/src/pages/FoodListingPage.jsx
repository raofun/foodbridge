import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ListingSteps from '../components/ListingSteps.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function FoodListingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ foodName: '', description: '', photoUrl: '', quantity: '1', portionUnit: 'servings' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { listing } = await apiRequest('/listings', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ ...form, quantity: Number(form.quantity) }),
      });
      navigate(`/dashboard/listings/${listing._id}/information`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (session.user.role !== 'donor') return <div className="notice info">Only donor accounts can create a food listing.</div>;

  return <>
    <div className="page-title"><div><span className="eyebrow">SHARE A DONATION</span><h1>List surplus <em>food.</em></h1><p>Start with the food name, description, quantity, and photo.</p></div><Link className="text-button" to="/dashboard">← Back</Link></div>
    <ListingSteps current="01" />
    <section className="panel form-panel">
      <div className="panel-heading"><div><span className="eyebrow">FEATURE 03</span><h2>Food listing</h2><p>These details help receivers understand what’s available.</p></div></div>
      <form className="listing-form" onSubmit={submit}>
        <div className="field-grid">
          <label className="span-2">Food name<input required maxLength={120} placeholder="e.g. Vegetable biryani" value={form.foodName} onChange={e => set('foodName', e.target.value)} /></label>
          <label className="span-2">Description<textarea required maxLength={2000} rows={4} placeholder="Describe the food and how it is portioned…" value={form.description} onChange={e => set('description', e.target.value)} /></label>
          <label>Quantity<input required type="number" min="1" step="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></label>
          <label>Portion unit<input required maxLength={40} placeholder="servings, boxes…" value={form.portionUnit} onChange={e => set('portionUnit', e.target.value)} /></label>
          <label className="span-2">Photo URL <span className="optional">(optional)</span><input type="url" placeholder="https://example.com/food-photo.jpg" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} /></label>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="form-actions"><p>This saves a draft. You’ll add food safety and pickup details next.</p><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'} <span>↗</span></button></div>
      </form>
    </section>
  </>;
}
