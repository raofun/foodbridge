import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ListingSteps from '../components/ListingSteps.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function PickupSchedulePage() {
  const { listingId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ pickupLocation: '', pickupOpensAt: '', pickupClosesAt: '' });
  const [loading, setLoading] = useState(true);
  const [listingLoaded, setListingLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    apiRequest(`/listings/${listingId}`, { token: session.token })
      .then(({ listing }) => {
        if (listing.status !== 'draft') { navigate('/listings/mine', { replace: true }); return; }
        if (!listing.preparedAt || !listing.storageDetails || !listing.foodCondition) { navigate(`/listings/${listingId}/information`, { replace: true }); return; }
        setForm({ pickupLocation: listing.pickupLocation || '', pickupOpensAt: toLocalDateTime(listing.pickupOpensAt), pickupClosesAt: toLocalDateTime(listing.pickupClosesAt) });
        setListingLoaded(true);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [listingId, navigate, session.token]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await apiRequest(`/listings/${listingId}/pickup`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ ...form, pickupOpensAt: new Date(form.pickupOpensAt).toISOString(), pickupClosesAt: new Date(form.pickupClosesAt).toISOString() }),
      });
      navigate('/listings/mine', { state: { notice: 'Your listing is complete and available.' } });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <>
    <div className="page-title"><div><span className="eyebrow">COLLECTION WINDOW</span><h1>Schedule <em>pickup.</em></h1><p>Choose where and when receivers can collect the food.</p></div><Link className="text-button" to={`/listings/${listingId}/information`}>← Back</Link></div>
    <ListingSteps current="03" />
    {loading ? <div className="empty-state">Loading listing…</div> : !listingLoaded ? <div className="notice error" role="alert">{error} <Link to="/listings/mine">Return to my listings</Link></div> : <section className="panel form-panel">
      <div className="panel-heading"><div><span className="eyebrow">FEATURE 05</span><h2>Pickup schedule</h2><p>The listing becomes available once its collection window is saved.</p></div></div>
      <form className="listing-form" onSubmit={submit}>
        <div className="field-grid">
          <label className="span-2">Pickup location<input required maxLength={300} placeholder="Address, neighborhood, or landmark" value={form.pickupLocation} onChange={e => set('pickupLocation', e.target.value)} /></label>
          <label>Pickup opens<input required type="datetime-local" value={form.pickupOpensAt} onChange={e => set('pickupOpensAt', e.target.value)} /></label>
          <label>Pickup closes<input required type="datetime-local" value={form.pickupClosesAt} onChange={e => set('pickupClosesAt', e.target.value)} /></label>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="form-actions"><p>Check the location and times before publishing.</p><button className="button button-primary" disabled={busy}>{busy ? 'Publishing…' : 'Complete listing'} <span>↗</span></button></div>
      </form>
    </section>}
  </>;
}
