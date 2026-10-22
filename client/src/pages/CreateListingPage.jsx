import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

const initialForm = { foodName: '', description: '', photoUrl: '', quantity: '1', portionUnit: 'servings', pickupLocation: '', pickupOpensAt: '', pickupClosesAt: '' };

export default function CreateListingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await apiRequest('/listings', { token: session.token, method: 'POST', body: JSON.stringify({ ...form, quantity: Number(form.quantity), pickupOpensAt: new Date(form.pickupOpensAt).toISOString(), pickupClosesAt: new Date(form.pickupClosesAt).toISOString() }) });
      navigate('/dashboard/listings/mine', { state: { notice: 'Your food listing has been published.' } });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (session.user.role !== 'donor') return <div className="notice info">Only donor accounts can create a food listing.</div>;

  return <>
    <div className="page-title"><div><span className="eyebrow">SHARE A DONATION</span><h1>List surplus <em>food.</em></h1><p>Tell your community what’s available and when it can be collected.</p></div><Link className="text-button" to="/dashboard">← Back</Link></div>
    <section className="panel form-panel">
      <form className="listing-form" onSubmit={submit}>
        <div className="field-section"><h3><span>1</span> Food details</h3><div className="field-grid">
          <label className="span-2">Food name<input required maxLength={120} placeholder="e.g. Vegetable biryani" value={form.foodName} onChange={e => set('foodName', e.target.value)} /></label>
          <label className="span-2">Description<textarea required maxLength={2000} rows={3} placeholder="Add helpful details about the food…" value={form.description} onChange={e => set('description', e.target.value)} /></label>
          <label>Quantity<input required type="number" min="1" step="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} /></label>
          <label>Portion unit<input required maxLength={40} placeholder="servings, boxes…" value={form.portionUnit} onChange={e => set('portionUnit', e.target.value)} /></label>
          <label className="span-2">Photo URL <span className="optional">(optional)</span><input type="url" placeholder="https://example.com/food-photo.jpg" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} /></label>
        </div></div>
        <div className="field-section"><h3><span>2</span> Pickup details</h3><div className="field-grid">
          <label className="span-2">Pickup location<input required maxLength={300} placeholder="Address, neighborhood, or landmark" value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)} /></label>
          <label>Pickup opens<input required type="datetime-local" value={form.pickupOpensAt} onChange={e => set('pickupOpensAt', e.target.value)} /></label>
          <label>Pickup closes<input required type="datetime-local" value={form.pickupClosesAt} onChange={e => set('pickupClosesAt', e.target.value)} /></label>
        </div></div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="form-actions"><p>Your listing will be visible in your donor dashboard.</p><button className="button button-primary" disabled={busy}>{busy ? 'Publishing…' : 'Publish listing'} <span>↗</span></button></div>
      </form>
    </section>
  </>;
}
