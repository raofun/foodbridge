import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RotateCw,
  UtensilsCrossed,
  ArrowLeft,
  ShieldCheck,
  Info,
  Calendar,
  User,
  Phone,
  Package,
  Users,
  Building2,
  HeartHandshake,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';
import './PickupPassPage.css';

export default function PickupPassPage() {
  const { claimId, id } = useParams();
  const activeClaimId = claimId || id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cacheKey = `foodbridge:pickup-pass:${activeClaimId}`;

  // Fetch pass data with offline fallback
  const fetchPassData = useCallback(async (isSilent = false) => {
    if (!activeClaimId) return;
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);
    setError('');

    try {
      const res = await apiRequest(`/claims/${activeClaimId}/pickup-pass`);
      setData(res);
      // Cache in sessionStorage for offline access at collection point
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
      } catch (e) {
        // storage quota fallback
      }
    } catch (err) {
      // Try to recover from local cache if network is down
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setError('Offline Mode: Showing cached pass. Please show your code to the donor.');
        } catch (e) {
          setError(err.message || 'Unable to load pickup pass.');
        }
      } else {
        setError(err.message || 'Unable to load pickup pass.');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeClaimId, cacheKey]);

  useEffect(() => {
    fetchPassData();
  }, [fetchPassData]);

  // Live sync: poll every 5s while reserved to detect donor verification
  useEffect(() => {
    if (!data?.claim || data.claim.status !== 'reserved') return;

    const intervalId = setInterval(() => {
      fetchPassData(true);
    }, 5000);

    const handleFocus = () => fetchPassData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [data?.claim?.status, fetchPassData]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const claim = data?.claim;
  const receiver = data?.receiver;
  const listing = data?.listing;

  // Ensure QR code always points to the active frontend origin (safeguards against placeholder domains like your-foodbridge-name)
  const qrUrl = useMemo(() => {
    const rawCode = claim?.verificationCode || data?.claim?.verificationCode;
    const listingId = listing?._id || data?.listing?._id;
    if (!rawCode || !listingId) return data?.qrUrl || '';

    if (data?.qrUrl) {
      const isPlaceholder = data.qrUrl.includes('your-foodbridge-name') ||
                            data.qrUrl.includes('example.com') ||
                            data.qrUrl.includes('your-domain');
      if (!isPlaceholder) {
        const backendIsLocal = data.qrUrl.includes('localhost') || data.qrUrl.includes('127.0.0.1');
        const browserIsLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (backendIsLocal === browserIsLocal) {
          return data.qrUrl;
        }
      }
    }

    return `${window.location.origin}/listings/${listingId}/verify?code=${rawCode}`;
  }, [claim?.verificationCode, listing?._id, data]);

  const pickupWindowFormatted = useMemo(() => {
    if (!listing) return 'Schedule confirmed with donor';
    const opens = listing.pickupOpensAt ? new Date(listing.pickupOpensAt) : null;
    const closes = listing.pickupClosesAt ? new Date(listing.pickupClosesAt) : (listing.pickupDeadline ? new Date(listing.pickupDeadline) : null);

    if (opens && closes && !isNaN(opens.getTime()) && !isNaN(closes.getTime())) {
      const openStr = opens.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' +
        opens.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const closeStr = closes.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${openStr} – ${closeStr}`;
    }
    if (closes && !isNaN(closes.getTime())) {
      return `Before ${closes.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${closes.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }
    return 'Schedule confirmed with donor';
  }, [listing]);

  const mapsUrl = useMemo(() => {
    if (!listing?.pickupLocation) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.pickupLocation)}`;
  }, [listing?.pickupLocation]);

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'FB';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="fb-pass-page-bg">
        <div className="fb-pass-wrapper loading-center">
          <div className="fb-pass-spinner" />
          <h2>Preparing Digital Pickup Pass...</h2>
          <p>Encrypting verification code and generating scannable QR ticket.</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="fb-pass-page-bg">
        <div className="fb-pass-container">
          <div className="fb-pass-card error-card">
            <AlertCircle size={44} className="pass-error-icon" />
            <h2>Pass Unavailable</h2>
            <p>{error}</p>
            <div className="fb-pass-actions">
              <button type="button" className="btn-pass-primary" onClick={() => fetchPassData()}>
                <RotateCw size={15} /> Try Again
              </button>
              <Link to="/claims/mine" className="btn-pass-secondary">
                <ArrowLeft size={15} /> Back to My Reservations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCompleted = claim?.status === 'completed';
  const isCancelled = claim?.status === 'cancelled';
  const isReserved = claim?.status === 'reserved';
  const code = claim?.verificationCode || '';

  const recipientName = claim?.recipientName || receiver?.name || 'Community Member';
  const donorName = listing?.donor?.name || 'Verified FoodBridge Donor';

  return (
    <div className="fb-pass-page-bg">
      <div className="fb-pass-container">
        {/* Top Navigation */}
        <div className="fb-pass-topbar">
          <Link to="/claims/mine" className="fb-pass-back-link">
            <ArrowLeft size={16} />
            <span>My Reservations</span>
          </Link>
          <div className="topbar-right-group">
            <button
              type="button"
              onClick={() => fetchPassData(true)}
              className={`btn-pass-refresh ${isRefreshing ? 'spinning' : ''}`}
              title="Refresh live status"
            >
              <RotateCw size={13} />
              <span>{isRefreshing ? 'Syncing...' : 'Live Sync'}</span>
            </button>
            <span className="fb-pass-pill-chip">
              <ShieldCheck size={13} />
              <span>Verified Ticket</span>
            </span>
          </div>
        </div>

        {/* Status Notification Banner */}
        {isCompleted ? (
          <div className="fb-pass-banner success">
            <CheckCircle2 size={24} className="banner-icon" />
            <div>
              <strong>Handover Confirmed & Collected!</strong>
              <p>
                Food portions successfully verified on{' '}
                {claim.collectedAt
                  ? new Date(claim.collectedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                    ' at ' +
                    new Date(claim.collectedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : 'today'}
                . Thank you for rescuing surplus food with FoodBridge!
              </p>
            </div>
          </div>
        ) : isCancelled ? (
          <div className="fb-pass-banner warning">
            <AlertCircle size={24} className="banner-icon" />
            <div>
              <strong>Reservation Cancelled</strong>
              <p>This reservation was cancelled and portions were returned to the community surplus feed.</p>
            </div>
          </div>
        ) : (
          <div className="fb-pass-banner ready">
            <ShieldCheck size={24} className="banner-icon" />
            <div>
              <strong>Ready for Collection</strong>
              <p>Present the 6-character code or QR code to the donor at the collection location.</p>
            </div>
          </div>
        )}

        {/* Main Boarding Pass Card */}
        <div className={`fb-pass-card ${isCompleted ? 'state-completed' : ''}`}>
          {/* Ticket Header */}
          <div className="fb-pass-card-header">
            <div className="fb-pass-brand">
              <span className="fb-pass-logo-badge">🌿 FoodBridge</span>
              <span className="fb-pass-ticket-label">Digital Surplus Food Pass</span>
            </div>
            <div className={`fb-pass-status-pill ${claim?.status}`}>
              <span className="status-dot" />
              <span>{isCompleted ? 'Handover Collected' : isCancelled ? 'Cancelled' : 'Ready for Pickup'}</span>
            </div>
          </div>

          {/* Ticket Code & QR Section */}
          <div className="fb-pass-code-section">
            <p className="fb-pass-code-instruction">
              {isCompleted
                ? 'Handover verification completed and confirmed'
                : 'Present this 6-character code or QR to the donor:'}
            </p>

            {/* Segmented 6-Character Code Display */}
            {isReserved && code ? (
              <div
                className="fb-pass-code-box"
                onClick={() => handleCopyCode(code)}
                title="Click to copy pickup code"
              >
                <div className="fb-pass-code-segments">
                  {code.split('').map((char, index) => (
                    <span key={index} className="code-segment">
                      {char}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className={`btn-code-copy ${copied ? 'copied' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(code);
                  }}
                  aria-label="Copy pickup code"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            ) : isCompleted ? (
              <div className="fb-pass-completed-badge">
                <CheckCircle2 size={36} />
                <span>Handover Confirmed</span>
              </div>
            ) : (
              <div className="fb-pass-empty-code">— — — — — —</div>
            )}

            {/* High-Contrast QR Code Ticket */}
            {isReserved && qrUrl && (
              <div className="fb-pass-qr-frame">
                <div className="qr-high-contrast-card">
                  <QRCodeDisplay
                    value={qrUrl}
                    size={200}
                    fgColor="#080b10"
                    bgColor="#ffffff"
                    title="Pickup Verification QR Code"
                  />
                </div>
                <span className="fb-pass-qr-subtext">Scannable by donor smartphone camera</span>
              </div>
            )}
          </div>

          {/* Perforated Divider */}
          <div className="fb-pass-perforation">
            <div className="perf-circle left" />
            <div className="perf-line" />
            <div className="perf-circle right" />
          </div>

          {/* Food Surplus Item Highlight */}
          <div className="fb-pass-food-section">
            <div className="fb-pass-food-media">
              {listing?.photoUrl ? (
                <img
                  src={listing.photoUrl}
                  alt={listing.foodName}
                  className="fb-pass-food-img"
                  loading="lazy"
                />
              ) : (
                <div className="fb-pass-food-placeholder">
                  <UtensilsCrossed size={28} />
                </div>
              )}
              <span className="food-cat-pill">{listing?.category || 'meals'}</span>
              {listing?.foodCondition && (
                <span className="food-condition-pill">✳ {listing.foodCondition}</span>
              )}
            </div>

            <div className="fb-pass-food-body">
              <div className="fb-pass-food-title-row">
                <h3>{listing?.foodName || 'Surplus Food Donation'}</h3>
                <span className="food-qty-chip">
                  {claim?.quantity} {claim?.portionUnit || 'servings'}
                </span>
              </div>

              {listing?.description && (
                <p className="fb-pass-food-desc">{listing.description}</p>
              )}

              {listing?._id && (
                <Link
                  to={`/listings/${listing._id}/information`}
                  className="fb-pass-passport-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye size={13} />
                  <span>View Food Freshness & Safety Passport</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>
          </div>

          {/* TWO DEDICATED IDENTITY PROFILE CARDS (RECIPIENT & DONOR) */}
          <div className="fb-pass-profiles-section">
            <div className="profiles-header-row">
              <HeartHandshake size={15} />
              <span>Handover Identity Profiles</span>
            </div>

            <div className="profiles-grid">
              {/* Profile 1: Recipient Profile (Pass Bearer) */}
              <div className="profile-identity-card recipient-card">
                <div className="profile-card-top">
                  <div className="profile-avatar-circle recipient-avatar">
                    {getInitials(recipientName)}
                  </div>
                  <div className="profile-identity-info">
                    <h4>{recipientName}</h4>
                    <span className="profile-role-badge recipient">
                      {receiver?.role === 'volunteer' ? 'Verified Volunteer' : 'Community Receiver'}
                    </span>
                  </div>
                </div>

                <div className="profile-details-list">
                  {claim?.contactPhone && (
                    <div className="profile-detail-item">
                      <Phone size={13} className="detail-icon" />
                      <a href={`tel:${claim.contactPhone}`} className="profile-phone-link">
                        {claim.contactPhone}
                      </a>
                    </div>
                  )}

                  {claim?.peopleFed && (
                    <div className="profile-detail-item">
                      <Users size={13} className="detail-icon" />
                      <span>Feeding {claim.peopleFed} family member{claim.peopleFed === 1 ? '' : 's'}</span>
                    </div>
                  )}

                  <div className="profile-detail-item">
                    <Package size={13} className="detail-icon" />
                    <span>{claim?.hasContainers ? 'Bringing own reusable containers' : 'Requires donor containers'}</span>
                  </div>

                  {claim?.reservationPurpose && (
                    <div className="profile-detail-item">
                      <Sparkles size={13} className="detail-icon" />
                      <span className="capitalize-text">Purpose: {claim.reservationPurpose.replace(/_/g, ' ')}</span>
                    </div>
                  )}

                  {claim?.receiverNotes && (
                    <div className="profile-notes-box">
                      <strong>Note:</strong> "{claim.receiverNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Profile 2: Donor Organization Profile (Surplus Provider) */}
              <div className="profile-identity-card donor-card">
                <div className="profile-card-top">
                  <div className="profile-avatar-circle donor-avatar">
                    <Building2 size={18} />
                  </div>
                  <div className="profile-identity-info">
                    <h4>{donorName}</h4>
                    <span className="profile-role-badge donor">
                      {listing?.donor?.role ? `Verified ${listing.donor.role}` : 'Verified Food Donor'}
                    </span>
                  </div>
                </div>

                <div className="profile-details-list">
                  <div className="profile-detail-item location-item">
                    <MapPin size={13} className="detail-icon" />
                    <span>{listing?.pickupLocation || 'Pickup location confirmed with donor'}</span>
                  </div>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-map-btn"
                    >
                      <ExternalLink size={12} />
                      <span>Open in Google Maps</span>
                    </a>
                  )}

                  <div className="profile-detail-item">
                    <Clock size={13} className="detail-icon" />
                    <span>Pickup Window: {pickupWindowFormatted}</span>
                  </div>

                  {claim?.estimatedPickupAt && (
                    <div className="profile-detail-item eta-item">
                      <Calendar size={13} className="detail-icon" />
                      <span>
                        Your ETA: {new Date(claim.estimatedPickupAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {listing?.donor?.email && (
                    <div className="profile-detail-item">
                      <User size={13} className="detail-icon" />
                      <span>Contact: {listing.donor.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Food Safety Note */}
            {listing?.safetyNotes && (
              <div className="fb-pass-safety-banner">
                <Info size={15} />
                <span>
                  <strong>Safety Guideline:</strong> {listing.safetyNotes}
                </span>
              </div>
            )}
          </div>

          {/* Ticket Footer */}
          <div className="fb-pass-card-footer">
            <span className="pass-id-text">Pass ID: {claim?._id}</span>
            <span className="pass-security-text">🔒 HMAC-SHA256 Encrypted Verification</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fb-pass-footer-actions">
          <Link to="/claims/mine" className="btn-pass-secondary">
            <ArrowLeft size={15} />
            <span>Back to My Reservations</span>
          </Link>
          <Link to="/" className="btn-pass-secondary">
            <UtensilsCrossed size={15} />
            <span>Community Feed</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
