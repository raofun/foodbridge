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
  X,
  Pencil,
  Phone,
  User,
  Users,
  Package,
  Search,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import EditClaimModal from '../components/EditClaimModal.jsx';
import './MyClaimsPage.css';

export default function MyClaimsPage() {
  const { session } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'all' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingClaimId, setCancellingClaimId] = useState(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(null);
  const [editingClaim, setEditingClaim] = useState(null);
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
    let result = claims;
    if (activeTab === 'active') {
      result = result.filter((c) => c.status === 'reserved');
    } else if (activeTab === 'cancelled') {
      result = result.filter((c) => c.status === 'cancelled');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const foodName = c.listing?.foodName?.toLowerCase() || '';
        const donorName = c.listing?.donor?.name?.toLowerCase() || '';
        const location = c.listing?.pickupLocation?.toLowerCase() || '';
        const recipient = c.recipientName?.toLowerCase() || '';
        return (
          foodName.includes(q) ||
          donorName.includes(q) ||
          location.includes(q) ||
          recipient.includes(q)
        );
      });
    }

    return result;
  }, [claims, activeTab, searchQuery]);

  // Check if current user is donor role
  const isDonorRole = session?.user?.role === 'donor';

  return (
    <div className="my-claims-container">
      {/* Donor Guidance Notice if donor navigates here */}
      {isDonorRole && (
        <div className="donor-role-warning-banner">
          <AlertCircle size={18} />
          <div className="warning-content">
            <strong>Donor Account Active</strong>
            <p>You are signed in as a Donor. Food portion reservations are reserved for Receivers and Community Volunteers.</p>
          </div>
          <Link to="/listings/mine" className="btn-banner-donor-nav">
            Go to My Listings
          </Link>
        </div>
      )}

      {/* Hero Console */}
      <section className="my-claims-hero">
        <div className="hero-header-row">
          <div className="hero-title-group">
            <div className="hero-eyebrow-chip">
              <Sparkles size={13} />
              <span>COMMUNITY RECEIVER COMMAND</span>
            </div>
            <h1>
              My Food <em>Reservations.</em>
            </h1>
            <p>
              Track your scheduled surplus food pickups, update portions or collection times, review location directions, or release portions if your plans change.
            </p>
          </div>
          <Link to="/" className="btn-hero-explore">
            <UtensilsCrossed size={16} />
            <span>Browse Community Surplus</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
        <div className="claims-metrics-grid">
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
            <span className="metric-card-subtitle">Scheduled & ready for collection</span>
          </div>

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
            <span className="metric-card-subtitle">Portions returned to community</span>
          </div>
        </div>
      </section>

      {/* Notices & Error Alerts */}
      {notice && (
        <div className="claims-status-banner info" role="status">
          <div className="banner-left">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice('')} className="btn-banner-close" aria-label="Close notice">
            <X size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="claims-status-banner error" role="alert">
          <div className="banner-left">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="btn-banner-close" aria-label="Close error">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="claims-toolbar">
        <div className="toolbar-tabs-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            className={`toolbar-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span>Active Pickups</span>
            <span className="tab-pill-badge">{metrics.active}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`toolbar-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Claims</span>
            <span className="tab-pill-badge">{metrics.total}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'cancelled'}
            className={`toolbar-tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <span>Cancelled</span>
            <span className="tab-pill-badge">{metrics.cancelled}</span>
          </button>
        </div>

        <div className="toolbar-controls-right">
          <div className="search-input-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by food, donor, location..."
              className="search-text-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={fetchClaims}
            className="btn-refresh"
            title="Refresh reservations"
            disabled={loading}
          >
            <RotateCw size={13} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="claims-loading-state">
          <Loader2 size={32} className="spinning" />
          <p>Syncing your food reservations from database...</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="claims-empty-state">
          <div className="empty-icon-wrap">
            <HeartHandshake size={32} />
          </div>
          <h3>{searchQuery ? 'No matching reservations' : 'No reservations found'}</h3>
          <p>
            {searchQuery
              ? `No claims matched "${searchQuery}". Try a different search term or clear the filter.`
              : activeTab === 'active'
              ? 'You do not have any active food pickups scheduled right now.'
              : 'You have not made any food reservations in this category.'}
          </p>
          {searchQuery ? (
            <button
              type="button"
              className="btn-empty-action"
              onClick={() => setSearchQuery('')}
            >
              Clear Search Filter
            </button>
          ) : (
            <Link to="/" className="btn-empty-action">
              Explore Available Food Feed
            </Link>
          )}
        </div>
      ) : (
        <div className="claims-grid">
          {filteredClaims.map((claim) => {
            const listing = claim.listing || {};
            const isReserved = claim.status === 'reserved';
            const pickupCloses = listing.pickupClosesAt || listing.pickupDeadline;

            return (
              <article className={`claim-card ${isReserved ? 'active' : 'cancelled'}`} key={claim._id}>
                {/* Media Image & Status Badges */}
                <div className="claim-card-media">
                  {listing.photoUrl ? (
                    <img src={listing.photoUrl} alt={listing.foodName || 'Food surplus'} />
                  ) : (
                    <div className="claim-media-placeholder">
                      <UtensilsCrossed size={36} />
                    </div>
                  )}
                  <span className={`claim-status-badge ${isReserved ? 'reserved' : 'cancelled'}`}>
                    <span className={`status-badge-dot ${isReserved ? 'reserved' : 'cancelled'}`} />
                    <span>{isReserved ? 'Active Pickup' : 'Cancelled'}</span>
                  </span>
                  <span className="claim-card-category">{listing.category || 'meals'}</span>
                </div>

                {/* Card Content Body */}
                <div className="claim-card-content">
                  <div className="claim-card-top">
                    <h3 className="claim-card-title">{listing.foodName || 'Surplus Food Donation'}</h3>
                    <p className="claim-donor-meta">
                      Donated by <strong>{listing.donor?.name || 'Community Donor'}</strong>
                    </p>
                  </div>

                  {/* Quantity and Condition Highlights */}
                  <div className="claim-portion-highlight">
                    <span className="portion-badge">
                      <strong>{claim.quantity}</strong> {claim.portionUnit || 'portions'} reserved
                    </span>
                    {listing.foodCondition && (
                      <span className="condition-pill">✳ {listing.foodCondition}</span>
                    )}
                  </div>

                  {/* Meta Details List */}
                  <div className="claim-card-meta-list">
                    {/* Location */}
                    <div className="meta-row">
                      <MapPin size={14} className="meta-icon loc" />
                      <span className="meta-text" title={listing.pickupLocation}>
                        {listing.pickupLocation || 'Pickup location confirmed with donor'}
                      </span>
                      {listing.pickupLocation && (
                        <button
                          type="button"
                          className="btn-copy-address"
                          onClick={() => handleCopyLocation(claim._id, listing.pickupLocation)}
                          title="Copy pickup address"
                        >
                          <Copy size={11} />
                          <span>{copiedId === claim._id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {/* Window */}
                    <div className="meta-row">
                      <Clock size={14} className="meta-icon time" />
                      <span className="meta-text">
                        Window: {listing.pickupOpensAt ? new Date(listing.pickupOpensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Flexible'} – {pickupCloses ? new Date(pickupCloses).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Open window'}
                      </span>
                    </div>

                    {/* Recipient & Phone */}
                    {(claim.recipientName || claim.contactPhone) && (
                      <div className="meta-row">
                        <User size={14} className="meta-icon recipient" />
                        <span className="meta-text">
                          {claim.recipientName || 'Recipient'} {claim.contactPhone ? `• ${claim.contactPhone}` : ''}
                        </span>
                      </div>
                    )}

                    {/* ETA Pill */}
                    {claim.estimatedPickupAt && (
                      <div className="meta-row eta">
                        <span className="eta-tag">Your ETA:</span>
                        <span className="meta-text eta-val">
                          {new Date(claim.estimatedPickupAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}

                    {/* Badges for People Fed & Reusable Container */}
                    <div className="claim-meta-chips-row">
                      {claim.peopleFed && (
                        <span className="chip-pill">
                          <Users size={11} />
                          <span>Feeds {claim.peopleFed}</span>
                        </span>
                      )}
                      {claim.hasContainers && (
                        <span className="chip-pill containers">
                          <Package size={11} />
                          <span>BYO Container</span>
                        </span>
                      )}
                    </div>

                    {/* Receiver Notes */}
                    {claim.receiverNotes && (
                      <div className="claim-notes-box">
                        <strong>Note:</strong> "{claim.receiverNotes}"
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="claim-card-actions">
                    <Link
                      to={`/listings/${listing._id}/information`}
                      className="btn-card-action primary"
                    >
                      <span>Food Passport</span>
                      <ArrowRight size={13} />
                    </Link>

                    {isReserved && (
                      <>
                        <button
                          type="button"
                          className="btn-card-action edit"
                          onClick={() => setEditingClaim(claim)}
                          title="Edit reservation portions or pickup details"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="btn-card-action cancel"
                          onClick={() => setConfirmCancelModal(claim)}
                          disabled={cancellingClaimId === claim._id}
                          title="Cancel and release portions"
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Edit Reservation Modal */}
      {editingClaim && (
        <EditClaimModal
          claim={editingClaim}
          onClose={() => setEditingClaim(null)}
          onUpdated={(updatedClaim, msg) => {
            setClaims((prev) =>
              prev.map((c) => (c._id === updatedClaim._id ? updatedClaim : c))
            );
            setNotice(msg || 'Reservation updated successfully!');
          }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {confirmCancelModal && (
        <div className="claims-modal-backdrop" onClick={() => setConfirmCancelModal(null)} role="dialog" aria-modal="true">
          <div className="claims-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-icon-wrap">
                <XCircle size={26} />
              </div>
              <div>
                <h3>Cancel this reservation?</h3>
                <p>
                  You are about to cancel your claim for{' '}
                  <strong>{confirmCancelModal.quantity} {confirmCancelModal.portionUnit || 'portions'}</strong> of{' '}
                  <em>{confirmCancelModal.listing?.foodName}</em>.
                </p>
              </div>
            </div>

            <p className="cancel-warning-text">
              Cancelling will immediately return these portions to the community surplus feed so other families and local partners can rescue them before expiry.
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
                  <span>Yes, Cancel & Release</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
