import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export default function MyListingsPage() {
  const { session } = useAuth();
  const location = useLocation();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  const loadListings = useCallback(async () => {
    setLoading(true);
    try { const result = await apiRequest('/listings/mine', { token: session.token }); setListings(result.listings); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { loadListings(); }, [loadListings]);

  async function removeListing(id) {
    if (!window.confirm('Delete this food listing?')) return;
    try { await apiRequest(`/listings/${id}`, { token: session.token, method: 'DELETE' }); setListings(current => current.filter(item => item._id !== id)); setNotice('Listing deleted.'); }
    catch (e) { setError(e.message); }
  }

  if (session.user.role !== 'donor') return <div className="notice info">Your account is set up as a {session.user.role}. Donor listings are available to donor accounts.</div>;

  return <>
    <div className="page-title"><div><span className="eyebrow">YOUR DONATIONS</span><h1>Food, <em>forward.</em></h1><p>Review the food listings you’ve shared with your community.</p></div><Link className="button button-primary" to="/dashboard/listings/new">Create listing <span>↗</span></Link></div>
    {notice && <p className="notice info" role="status">{notice}</p>}
    {error && <p className="notice error" role="alert">{error}</p>}
    {loading ? <div className="empty-state">Loading your listings…</div> : listings.length ? <div className="listing-grid">{listings.map(item => <article className="listing-card" key={item._id}>
      <div className="listing-photo">{item.photoUrl ? <img src={item.photoUrl} alt={item.foodName} /> : <span>✳</span>}<span className="status-pill">{item.status}</span></div>
      <div className="listing-info"><h3>{item.foodName}</h3><p>{item.description}</p><div className="listing-meta"><span>◉ {item.quantity} {item.portionUnit}</span><span>⌖ {item.pickupLocation || 'Pickup details pending'}</span>{item.foodCondition && <span>✳ {item.foodCondition} · {item.storageDetails}</span>}</div>{item.status === 'available' && <div className="pickup-time">Pickup {new Date(item.pickupOpensAt).toLocaleString()} – {new Date(item.pickupClosesAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>}{item.status === 'draft' && <Link className="text-button continue-button" to={`/dashboard/listings/${item._id}/${item.preparedAt ? 'pickup' : 'information'}`}>Continue setup →</Link>}<button className="text-button delete-button" onClick={() => removeListing(item._id)}>Delete listing</button></div>
    </article>)}</div> : <div className="empty-state"><span>◌</span><h3>Your first listing starts here</h3><p>Share surplus food with your community when you’re ready.</p><Link className="button button-primary" to="/dashboard/listings/new">Create a listing <span>↗</span></Link></div>}
  </>;
}
