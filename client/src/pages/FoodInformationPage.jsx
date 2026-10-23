import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import ListingSteps from '../components/ListingSteps.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './FoodInformationPage.css';

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function FoodInformationPage() {
  const { listingId } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const navigate = useNavigate();
  const communityListing = location.state?.listing;
  const isCommunityListing = listingId?.startsWith('comm-');
  const [form, setForm] = useState({ preparedAt: '', storageDetails: '', foodCondition: 'fresh', useByAt: '', safetyNotes: '' });
  const [loading, setLoading] = useState(true);
  const [listingLoaded, setListingLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (isCommunityListing) {
      setListingLoaded(true);
      setLoading(false);
      return;
    }
    apiRequest(`/listings/${listingId}`, { token: session.token })
      .then(({ listing }) => {
        if (listing.status !== 'draft') { navigate('/listings/mine', { replace: true }); return; }
        setForm({
          preparedAt: toLocalDateTime(listing.preparedAt), storageDetails: listing.storageDetails || '',
          foodCondition: listing.foodCondition || 'fresh', useByAt: toLocalDateTime(listing.useByAt), safetyNotes: listing.safetyNotes || '',
        });
        setListingLoaded(true);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [isCommunityListing, listingId, navigate, session.token]);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await apiRequest(`/listings/${listingId}/information`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ ...form, preparedAt: new Date(form.preparedAt).toISOString(), useByAt: form.useByAt ? new Date(form.useByAt).toISOString() : '' }),
      });
      navigate(`/listings/${listingId}/pickup`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (isCommunityListing) {
    return (
      <main className="community-info-placeholder">
        <Link className="community-info-back" to="/">← Back to food listings</Link>
        <div className="community-info-content">
          <span className="community-info-eyebrow">FOOD INFORMATION</span>
          <h1>{communityListing?.foodName || 'Food information'}</h1>
          <p>
            Pickup scheduling and pickup coordination will take place here.
          </p>
        </div>
      </main>
    );
  }

  return <>
    <div className="page-title"><div><span className="eyebrow">FOOD SAFETY DETAILS</span><h1>Food <em>information.</em></h1><p>Share preparation and storage details with receivers.</p></div><Link className="text-button" to="/listings/mine">My listings</Link></div>
    <ListingSteps current="02" />
    {loading ? <div className="empty-state">Loading listing…</div> : !listingLoaded ? <div className="notice error" role="alert">{error} <Link to="/listings/mine">Return to my listings</Link></div> : <section className="panel form-panel">
      <div className="panel-heading"><div><span className="eyebrow">FEATURE 04</span><h2>Preparation and storage</h2><p>Provider-declared details help receivers decide whether the food suits their needs.</p></div></div>
      <form className="listing-form" onSubmit={submit}>
        <div className="field-grid">
          <label>Prepared at<input required type="datetime-local" value={form.preparedAt} onChange={e => set('preparedAt', e.target.value)} /></label>
          <label>Food condition<select required value={form.foodCondition} onChange={e => set('foodCondition', e.target.value)}><option value="fresh">Fresh / room temperature</option><option value="refrigerated">Refrigerated</option><option value="frozen">Frozen</option><option value="shelf-stable">Shelf-stable</option></select></label>
          <label className="span-2">Storage details<input required maxLength={500} placeholder="e.g. Kept refrigerated at 4°C" value={form.storageDetails} onChange={e => set('storageDetails', e.target.value)} /></label>
          <label>Use by <span className="optional">(optional)</span><input type="datetime-local" value={form.useByAt} onChange={e => set('useByAt', e.target.value)} /></label>
          <label>Safety notes <span className="optional">(optional)</span><input maxLength={500} placeholder="Allergens or handling notes" value={form.safetyNotes} onChange={e => set('safetyNotes', e.target.value)} /></label>
        </div>
        {error && <p className="notice error" role="alert">{error}</p>}
        <div className="form-actions"><p>Keep food and pickup information accurate.</p><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'} <span>↗</span></button></div>
      </form>
    </section>}
  </>;
}
