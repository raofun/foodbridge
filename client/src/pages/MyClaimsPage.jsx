import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  UtensilsCrossed,
  Copy,
  ExternalLink,
  ChevronRight,
  RotateCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './MyClaimsPage.css';

export default function MyClaimsPage() {
  const { session } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all' | 'cancelled'
  const [cancellingClaimId, setCancellingClaimId] = useState(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/claims/mine');
      setClaims(data.claims || []);
    } catch (err) {
      setError(err.message || 'Unable to load your food reservations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleCopyLocation = (claimId, location) => {
    if (!location) return;
    navigator.clipboard.writeText(location);
    setCopiedId(claimId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelClaim = async (claimId) => {
    setCancellingClaimId(claimId);
    setError('');
    setNotice('');
    try {
      const res = await apiRequest(`/claims/${claimId}/cancel`, { method: 'POST' });
      setNotice(res.message || 'Reservation cancelled successfully. Portions returned to community.');
      // Refresh claims list
      setClaims((prev) =>
        prev.map((c) => (c._id === claimId ? { ...c, status: 'cancelled' } : c))
      );
      setConfirmCancelModal(null);
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancellingClaimId(null);
    }
  };

  const metrics = useMemo(() => {
    const total = claims.length;
    const active = claims.filter((c) => c.status === 'reserved').length;
    const cancelled = claims.filter((c) => c.status === 'cancelled').length;
    return { total, active, cancelled };
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (activeTab === 'active') {
      return claims.filter((c) => c.status === 'reserved');
    }
    if (activeTab === 'cancelled') {
      return claims.filter((c) => c.status === 'cancelled');
    }
    return claims;
  }, [claims, activeTab]);

  return (
    <div className="my-claims-container">
      {/* Hero Console */}
      <section className="my-claims-hero">
        <div className="hero-header-row">
          <div className="hero-title-group">
            <div className="hero-eyebrow-chip">
              <Sparkles size={13} />
              <span>RECEIVER COMMAND CENTER</span>
            </div>
            <h1>
              My Food <em>Reservations.</em>
            </h1>
            <p>
              Track your reserved surplus meals, review collection windows, obtain pickup directions, or release portions if your plans change.
            </p>
          </div>
          <Link to="/" className="btn-hero-explore">
            <UtensilsCrossed size={16} />
            <span>Browse Community Feed</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="claims-metrics-grid">
          <div
            className={`metric-card ${activeTab === 'all' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('all')}
            role="button"
            tabIndex={0}
          >
            <div className="metric-card-top">
              <span>Total Claims</span>
              <span className="metric-dot total" />
            </div>
            <span className="metric-card-value">{metrics.total}</span>
            <span className="metric-card-subtitle">Lifetime portions reserved</span>
          </div>

          <div
            className={`metric-card ${activeTab === 'active' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('active')}
            role="button"
            tabIndex={0}
          >
            <div className="metric-card-top">
              <span>Active Pickups</span>
              <span className="metric-dot active" />
            </div>
            <span className="metric-card-value">{metrics.active}</span>
            <span className="metric-card-subtitle">Ready for collection</span>
          </div>

          <div
            className={`metric-card ${activeTab === 'cancelled' ? 'active-filter' : ''}`}
            onClick={() => setActiveTab('cancelled')}
            role="button"
            tabIndex={0}
          >
            <div className="metric-card-top">
              <span>Cancelled</span>
              <span className="metric-dot cancelled" />
            </div>
            <span className="metric-card-value">{metrics.cancelled}</span>
            <span className="metric-card-subtitle">Released back to feed</span>
          </div>
        </div>
      </section>

      {/* Notices & Error Alerts */}
      {notice && (
        <div className="claims-status-banner info" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="btn-banner-close" aria-label="Close notice">
            <X size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="claims-status-banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="btn-banner-close" aria-label="Close error">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="claims-toolbar">
        <div className="toolbar-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            className={`toolbar-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Pickups ({metrics.active})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`toolbar-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Claims ({metrics.total})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            className={`toolbar-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({metrics.cancelled})
          </button>
        </div>

        <button
          type="button"
          onClick={fetchClaims}
          className="btn-refresh"
          title="Refresh reservations"
          disabled={loading}
        >
          <RotateCw size={14} className={loading ? 'spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="claims-loading-state">
          <Loader2 size={28} className="spinning" />
          <p>Loading your food reservations...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="claims-empty-state">
          <div className="empty-icon-wrap">
            <HeartHandshake size={32} />
          </div>
          <h3>No reservations found</h3>
          <p>
            {activeTab === 'active'
              ? 'You do not have any active food pickups scheduled.'
              : 'You have not made any food reservations matching this filter.'}
          </p>
          <Link to="/" className="btn-empty-action">
            Browse Live Community Surplus
          </Link>
        </div>
      ) : (
        <div className="claims-grid">
          {filteredClaims.map((claim) => {
            const listing = claim.listing || {};
            const isReserved = claim.status === 'reserved';
            const pickupCloses = listing.pickupClosesAt || listing.pickupDeadline;
            const isExpired = Boolean(pickupCloses && new Date(pickupCloses) <= new Date());

            return (
              <article className={`claim-card ${isReserved ? 'active' : 'cancelled'}`} key={claim._id}>
                {/* Photo & Category */}
                <div className="claim-card-media">
                  {listing.photoUrl ? (
                    <img src={listing.photoUrl} alt={listing.foodName} />
                  ) : (
                    <div className="claim-media-placeholder">
                      <UtensilsCrossed size={36} />
                    </div>
                  )}
                  <span className={`claim-status-badge ${isReserved ? 'reserved' : 'cancelled'}`}>
                    {isReserved ? '🟢 Active Pickup' : '⚪ Cancelled'}
                  </span>
                  <span className="claim-card-category">{listing.category || 'meals'}</span>
                </div>

                {/* Content */}
                <div className="claim-card-content">
                  <div className="claim-card-top">
                    <h3 className="claim-card-title">{listing.foodName || 'Surplus Food Donation'}</h3>
                    <p className="claim-donor-meta">
                      Donated by <strong>{listing.donor?.name || 'Community Donor'}</strong>
                    </p>
                  </div>

                  {/* Quantity Pill */}
                  <div className="claim-portion-highlight">
                    <span className="portion-badge">
                      ◉ Reserved: <strong>{claim.quantity} {claim.portionUnit}</strong>
                    </span>
                    {listing.foodCondition && (
                      <span className="condition-pill">✳ {listing.foodCondition}</span>
                    )}
                  </div>

                  {/* Meta details */}
                  <div className="claim-card-meta-list">
                    <div className="meta-row">
                      <MapPin size={14} className="meta-icon" />
                      <span className="meta-text">{listing.pickupLocation || 'Pickup location confirmed with donor'}</span>
                      {listing.pickupLocation && (
                        <button
                          type="button"
                          className="btn-copy-address"
                          onClick={() => handleCopyLocation(claim._id, listing.pickupLocation)}
                          title="Copy pickup address"
                        >
                          <Copy size={12} />
                          <span>{copiedId === claim._id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="meta-row">
                      <Clock size={14} className="meta-icon" />
                      <span className="meta-text">
                        Pickup: {listing.pickupOpensAt ? new Date(listing.pickupOpensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Flexible'} – {pickupCloses ? new Date(pickupCloses).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Open window'}
                      </span>
                    </div>

                    {claim.estimatedPickupAt && (
                      <div className="meta-row eta">
                        <span className="eta-tag">Your ETA:</span>
                        <span className="meta-text">
                          {new Date(claim.estimatedPickupAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {claim.receiverNotes && (
                      <div className="claim-notes-box">
                        <strong>Your Note:</strong> "{claim.receiverNotes}"
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="claim-card-actions">
                    <Link
                      to={`/listings/${listing._id}/information`}
                      className="btn-claim-details"
                    >
                      <span>Inspect Food Passport</span>
                      <ArrowRight size={13} />
                    </Link>

                    {isReserved && (
                      <button
                        type="button"
                        className="btn-cancel-reservation"
                        onClick={() => setConfirmCancelModal(claim)}
                        disabled={cancellingClaimId === claim._id}
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelModal && (
        <div className="claims-modal-backdrop" onClick={() => setConfirmCancelModal(null)} role="dialog" aria-modal="true">
          <div className="claims-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-icon-wrap">
                <XCircle size={24} />
              </div>
              <div>
                <h3>Cancel this reservation?</h3>
                <p>
                  You are about to cancel your claim for{' '}
                  <strong>{confirmCancelModal.quantity} {confirmCancelModal.portionUnit}</strong> of{' '}
                  <em>{confirmCancelModal.listing?.foodName}</em>.
                </p>
              </div>
            </div>

            <p className="cancel-warning-text">
              Cancelling will immediately return these portions to the community feed so other families and community partners can rescue them before expiry.
            </p>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-modal-back"
                onClick={() => setConfirmCancelModal(null)}
                disabled={Boolean(cancellingClaimId)}
              >
                Keep Reservation
              </button>
              <button
                type="button"
                className="btn-modal-confirm-cancel"
                onClick={() => handleCancelClaim(confirmCancelModal._id)}
                disabled={Boolean(cancellingClaimId)}
              >
                {cancellingClaimId === confirmCancelModal._id ? (
                  <>
                    <Loader2 size={14} className="spinning" />
                    <span>Releasing Portions...</span>
                  </>
                ) : (
                  <span>Yes, Cancel & Release Portions</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
