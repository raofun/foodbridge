import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  UtensilsCrossed,
  User,
  Phone,
  Package,
  ArrowLeft,
  RotateCw,
  QrCode,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import './PickupVerificationPage.css';

export default function PickupVerificationPage() {
  const { listingId, id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeListingId = listingId || id;
  const urlCode = searchParams.get('code') || '';

  // 6-Character Code State (represented as array of 6 characters for segmented input)
  const [codeArray, setCodeArray] = useState(() => {
    const clean = urlCode.trim().replace(/[\s-]+/g, '').toUpperCase().slice(0, 6);
    const arr = clean.split('');
    while (arr.length < 6) arr.push('');
    return arr;
  });

  const [activeTab, setActiveTab] = useState('verify'); // 'verify' | 'pending' | 'completed'
  const [listingData, setListingData] = useState(null);
  const [activePickupsList, setActivePickupsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // References for 6 segmented input fields
  const inputRefs = useRef([]);

  // Fetch listing verification station data OR active pickup listings for universal portal
  const fetchStationData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (activeListingId) {
        const res = await apiRequest(`/listings/${activeListingId}/verification`);
        setListingData(res);
      } else {
        // Universal direct verify station: fetch donor's listings with pending collections
        const res = await apiRequest('/verification/active-listings');
        setActivePickupsList(res.listings || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load verification station.');
    } finally {
      setLoading(false);
    }
  }, [activeListingId]);

  useEffect(() => {
    fetchStationData();
  }, [fetchStationData]);

  // Combined code string
  const fullCode = useMemo(() => codeArray.join('').trim().toUpperCase(), [codeArray]);

  // Handle segmented inputs
  const handleInputChange = (index, val) => {
    setError('');
    const char = val.slice(-1).toUpperCase();

    const newArr = [...codeArray];
    newArr[index] = char;
    setCodeArray(newArr);

    // Auto-advance to next input if character entered
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[\s-]+/g, '').toUpperCase().slice(0, 6);
    if (!pasted) return;

    const newArr = pasted.split('');
    while (newArr.length < 6) newArr.push('');
    setCodeArray(newArr);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Perform Handover Verification
  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessResult(null);

    if (fullCode.length !== 6) {
      setError('Please enter all 6 characters of the pickup verification code.');
      return;
    }

    setVerifying(true);
    try {
      const endpoint = activeListingId
        ? `/listings/${activeListingId}/verify-pickup`
        : `/verification/verify-code`;

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: { verificationCode: fullCode },
      });

      setSuccessResult(response);

      // Dispatch global real-time event across app
      window.dispatchEvent(
        new CustomEvent('foodbridge:pickup-verified', {
          detail: {
            claim: response.claim,
            listing: response.listing || response.listingSummary,
          },
        })
      );

      // Refresh station data to update pending & completed lists
      if (activeListingId) {
        fetchStationData();
      }
    } catch (err) {
      setError(err.message || 'Failed to verify pickup code. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit if opened via camera QR code scan with 6 characters
  useEffect(() => {
    if (urlCode && urlCode.length === 6 && !successResult && !error) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);

  const handleResetVerification = () => {
    setCodeArray(['', '', '', '', '', '']);
    setSuccessResult(null);
    setError('');
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  // Active or verified listing
  const listing = successResult?.listing || listingData?.listing;
  const pendingClaims = listingData?.pendingClaims || [];
  const completedClaims = listingData?.completedClaims || [];

  return (
    <div className="fb-verify-page-bg">
      <div className="fb-verify-container">
        {/* Top Breadcrumb & Navigation */}
        <div className="fb-verify-topbar">
          <Link to="/listings/mine" className="fb-verify-back-link">
            <ArrowLeft size={16} />
            <span>My Listings</span>
          </Link>
          <div className="topbar-right-actions">
            {activeListingId && (
              <button
                type="button"
                className="btn-station-refresh"
                onClick={fetchStationData}
                title="Refresh reservations"
              >
                <RotateCw size={13} className={loading ? 'spin-icon' : ''} />
                <span>Sync Station</span>
              </button>
            )}
            <span className="verify-hero-chip">
              <ShieldCheck size={13} />
              <span>FR10 Authentication</span>
            </span>
          </div>
        </div>

        {/* Hero Station Banner */}
        <div className="fb-verify-hero">
          <div className="verify-hero-left">
            <span className="verify-eyebrow-chip">
              <Sparkles size={12} />
              <span>DONOR HANDOVER STATION</span>
            </span>
            <h1>
              Pickup <em>Verification.</em>
            </h1>
            <p>
              {activeListingId
                ? 'Authenticate physical food handovers for this surplus listing using the recipient’s 6-character code or QR.'
                : 'Universal verification station: enter any recipient’s 6-character pickup code to authenticate and record the handover.'}
            </p>
          </div>
        </div>

        {/* Listing Identity Card (When loaded for specific listing) */}
        {listingData?.listing && (
          <div className="fb-verify-listing-banner">
            {listingData.listing.photoUrl ? (
              <img
                src={listingData.listing.photoUrl}
                alt={listingData.listing.foodName}
                className="verify-listing-thumb"
              />
            ) : (
              <div className="verify-listing-placeholder">
                <UtensilsCrossed size={22} />
              </div>
            )}
            <div className="verify-listing-details">
              <div className="verify-listing-header">
                <h2>{listingData.listing.foodName}</h2>
                <span className={`listing-status-tag ${listingData.listing.status}`}>
                  {listingData.listing.status === 'completed'
                    ? 'All Portions Collected'
                    : listingData.listing.status}
                </span>
              </div>
              <p className="verify-listing-meta">
                <MapPin size={13} />
                <span>{listingData.listing.pickupLocation || 'Pickup location confirmed with donor'}</span>
              </p>
              <div className="verify-listing-stats">
                <span className="stat-pill">
                  Total: <strong>{listingData.listing.quantity} {listingData.listing.portionUnit}</strong>
                </span>
                <span className="stat-pill success">
                  Collected: <strong>{listingData.listing.totalCollected || 0}</strong>
                </span>
                <span className="stat-pill pending">
                  Awaiting Pickup: <strong>{listingData.listing.totalReserved || 0}</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Verification Station Navigation Tabs (Only when station has multiple claims) */}
        {activeListingId && (
          <div className="fb-verify-tabs">
            <button
              type="button"
              className={`verify-tab ${activeTab === 'verify' ? 'active' : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              <ShieldCheck size={16} />
              <span>Verify Code</span>
            </button>
            <button
              type="button"
              className={`verify-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={16} />
              <span>Pending Pickups ({pendingClaims.length})</span>
            </button>
            <button
              type="button"
              className={`verify-tab ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              <CheckCircle2 size={16} />
              <span>Completed ({completedClaims.length})</span>
            </button>
          </div>
        )}

        {/* Main Work Area */}
        {activeTab === 'verify' && (
          <div className="fb-verify-card">
            {successResult ? (
              /* Celebratory Handover Success View: SHOWING FULL FOOD LISTING CARD + RECIPIENT DETAILS */
              <div className="fb-verify-success-box">
                <div className="verify-success-badge-banner">
                  <div className="verify-success-icon-wrap">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="verify-success-text">
                    <h2>Handover Verified & Confirmed!</h2>
                    <p>
                      Physical surplus food collection authenticated and immutably recorded in the audit log.
                    </p>
                  </div>
                </div>

                {/* THE RICH FOOD LISTING CARD */}
                {listing && (
                  <div className="verified-food-card">
                    <div className="verified-food-media">
                      {listing.photoUrl ? (
                        <img
                          src={listing.photoUrl}
                          alt={listing.foodName}
                          className="verified-food-img"
                        />
                      ) : (
                        <div className="verified-food-placeholder">
                          <UtensilsCrossed size={36} />
                        </div>
                      )}
                      <span className="verified-category-pill">{listing.category || 'meals'}</span>
                      {listing.foodCondition && (
                        <span className="verified-condition-pill">✳ {listing.foodCondition}</span>
                      )}
                    </div>

                    <div className="verified-food-info">
                      <div className="verified-food-title-row">
                        <h3>{listing.foodName}</h3>
                        <span className={`verified-status-pill ${listing.status}`}>
                          {listing.status === 'completed' ? 'Fully Collected' : listing.status}
                        </span>
                      </div>

                      {listing.pickupLocation && (
                        <div className="verified-food-meta-row">
                          <MapPin size={14} className="meta-icon" />
                          <span>{listing.pickupLocation}</span>
                        </div>
                      )}

                      <div className="verified-food-portion-row">
                        <span className="portion-handed-over">
                          <UtensilsCrossed size={13} />
                          <strong>{successResult.claim?.quantity} {successResult.claim?.portionUnit || listing.portionUnit}</strong> handed over
                        </span>
                        <span className="portion-stock-summary">
                          Total donation: {listing.quantity} {listing.portionUnit}
                        </span>
                      </div>

                      {listing._id && (
                        <Link
                          to={`/listings/${listing._id}/information`}
                          className="verified-passport-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye size={13} />
                          <span>View Food Safety Passport</span>
                          <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* RECIPIENT & HANDOVER RECEIPT DETAILS */}
                <div className="verify-receipt-card">
                  <div className="receipt-header">
                    <User size={16} />
                    <span>Recipient Handover Details</span>
                  </div>

                  <div className="receipt-grid">
                    <div className="receipt-cell">
                      <label>Recipient Name</label>
                      <p>{successResult.claim?.recipientName || 'Community Member'}</p>
                    </div>

                    <div className="receipt-cell">
                      <label>Contact Phone</label>
                      <p>
                        {successResult.claim?.contactPhone ? (
                          <a href={`tel:${successResult.claim.contactPhone}`} className="phone-link">
                            <Phone size={12} />
                            <span>{successResult.claim.contactPhone}</span>
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>

                    <div className="receipt-cell">
                      <label>Portions Verified</label>
                      <p className="highlight-green">
                        {successResult.claim?.quantity} {successResult.claim?.portionUnit}
                      </p>
                    </div>

                    <div className="receipt-cell">
                      <label>Handover Timestamp</label>
                      <p>
                        {new Date(successResult.claim?.collectedAt || Date.now()).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        • Today
                      </p>
                    </div>
                  </div>

                  {successResult.claim?.receiverNotes && (
                    <div className="receipt-note-box">
                      <strong>Recipient Note:</strong> "{successResult.claim.receiverNotes}"
                    </div>
                  )}

                  {successResult.listingSummary?.listingCompleted && (
                    <div className="receipt-completed-callout">
                      <Sparkles size={16} />
                      <span>
                        Congratulations! All portions of this surplus food donation have now been safely rescued and collected.
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="verify-success-actions">
                  <button
                    type="button"
                    className="btn-verify-primary"
                    onClick={handleResetVerification}
                  >
                    <ShieldCheck size={16} />
                    <span>Verify Another Pickup Code</span>
                  </button>
                  <Link to="/listings/mine" className="btn-verify-secondary">
                    <span>Back to My Listings</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Code Input Form */
              <form onSubmit={handleVerify} className="fb-verify-form">
                <div className="verify-header-block">
                  <div className="verify-icon-pill">
                    <QrCode size={26} />
                  </div>
                  <h3>Physical Handover Authentication</h3>
                  <p>
                    Ask the receiver for their 6-character pickup verification code or scan their QR code with your mobile camera.
                  </p>
                </div>

                {/* Segmented 6-Character Input */}
                <div className="segmented-inputs-wrap" onPaste={handlePaste}>
                  {codeArray.map((char, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`code-input-box ${char ? 'filled' : ''}`}
                      aria-label={`Digit ${index + 1}`}
                      autoFocus={index === 0 && !urlCode}
                      disabled={verifying}
                    />
                  ))}
                </div>

                {error && (
                  <div className="fb-verify-alert error" role="alert">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="verify-form-actions">
                  <button
                    type="submit"
                    className="btn-verify-primary large"
                    disabled={verifying || fullCode.length !== 6}
                  >
                    {verifying ? (
                      <>
                        <RotateCw size={18} className="spin-icon" />
                        <span>Validating Code...</span>
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Confirm Handover & Complete</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="verify-guidelines-box">
                  <Info size={16} />
                  <p>
                    <strong>Food Safety Reminder:</strong> Check packaging integrity, temperature preservation, and allergen labeling prior to physical handover.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Universal Portal: Active Listings with Pending Pickups (When no code is entered yet) */}
        {!activeListingId && !successResult && activePickupsList.length > 0 && (
          <div className="fb-verify-card portal-active-listings">
            <div className="portal-listings-header">
              <div className="portal-listings-title">
                <Clock size={18} />
                <h3>Your Active Donations with Pending Pickups</h3>
              </div>
              <p>You can also open a dedicated station for any of these active listings:</p>
            </div>

            <div className="portal-listings-grid">
              {activePickupsList.map((item) => (
                <div key={item._id} className="portal-listing-card">
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.foodName} className="portal-card-thumb" />
                  ) : (
                    <div className="portal-card-placeholder">
                      <UtensilsCrossed size={20} />
                    </div>
                  )}

                  <div className="portal-card-content">
                    <h4>{item.foodName}</h4>
                    <p className="portal-card-meta">
                      <MapPin size={12} />
                      <span>{item.pickupLocation || 'Pickup location confirmed'}</span>
                    </p>
                    <div className="portal-card-stats">
                      <span className="portal-pending-badge">
                        {item.pendingReservationsCount || 0} pending pickup{item.pendingReservationsCount === 1 ? '' : 's'}
                      </span>
                      <span className="portal-total-badge">
                        {item.claimedQuantity || 0} of {item.quantity} {item.portionUnit} claimed
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/listings/${item._id}/verify`}
                    className="btn-open-station"
                    title="Open verification station for this listing"
                  >
                    <span>Open Station</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Pending Pickups */}
        {activeTab === 'pending' && activeListingId && (
          <div className="fb-verify-card">
            <div className="claims-list-header">
              <h3>Active Reservations Awaiting Pickup</h3>
              <p>These community members have reserved portions. Ask for their 6-character code upon arrival.</p>
            </div>

            {pendingClaims.length === 0 ? (
              <div className="claims-empty-box">
                <CheckCircle2 size={38} className="empty-icon" />
                <p>No pending reservations! All claimed portions have been collected.</p>
              </div>
            ) : (
              <div className="claims-cards-grid">
                {pendingClaims.map((claim) => (
                  <div key={claim._id} className="claim-item-card">
                    <div className="claim-item-header">
                      <div className="claim-user-info">
                        <User size={16} />
                        <strong>{claim.recipientName || 'Community Member'}</strong>
                      </div>
                      <span className="claim-portion-badge">
                        {claim.quantity} {claim.portionUnit}
                      </span>
                    </div>

                    <div className="claim-details-grid">
                      {claim.contactPhone && (
                        <div className="claim-detail-row">
                          <Phone size={13} />
                          <span>{claim.contactPhone}</span>
                        </div>
                      )}
                      {claim.estimatedPickupAt && (
                        <div className="claim-detail-row">
                          <Clock size={13} />
                          <span>
                            ETA: {new Date(claim.estimatedPickupAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                      <div className="claim-detail-row">
                        <Package size={13} />
                        <span>{claim.hasContainers ? 'Bringing containers' : 'Needs containers'}</span>
                      </div>
                      {claim.receiverNotes && (
                        <div className="claim-notes-box">
                          <em>"{claim.receiverNotes}"</em>
                        </div>
                      )}
                    </div>

                    <div className="claim-card-footer">
                      <span className="claim-status-pill reserved">Awaiting Code</span>
                      <button
                        type="button"
                        className="btn-quick-verify"
                        onClick={() => {
                          setActiveTab('verify');
                          setTimeout(() => {
                            inputRefs.current[0]?.focus();
                          }, 100);
                        }}
                      >
                        <span>Enter Code →</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Completed Handovers History */}
        {activeTab === 'completed' && activeListingId && (
          <div className="fb-verify-card">
            <div className="claims-list-header">
              <h3>Completed Handover History</h3>
              <p>Immutable audit trail of all physically verified surplus food collections.</p>
            </div>

            {completedClaims.length === 0 ? (
              <div className="claims-empty-box">
                <Clock size={38} className="empty-icon" />
                <p>No handovers completed yet for this listing.</p>
              </div>
            ) : (
              <div className="claims-cards-grid">
                {completedClaims.map((claim) => (
                  <div key={claim._id} className="claim-item-card completed">
                    <div className="claim-item-header">
                      <div className="claim-user-info">
                        <User size={16} />
                        <strong>{claim.recipientName || 'Community Member'}</strong>
                      </div>
                      <span className="claim-portion-badge completed">
                        ✓ {claim.quantity} {claim.portionUnit} collected
                      </span>
                    </div>

                    <div className="claim-details-grid">
                      <div className="claim-detail-row">
                        <Clock size={13} />
                        <span>
                          Verified at{' '}
                          {claim.collectedAt
                            ? new Date(claim.collectedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                            : 'Confirmed'}
                        </span>
                      </div>
                      {claim.verifiedBy && (
                        <div className="claim-detail-row">
                          <ShieldCheck size={13} />
                          <span>Verified by: {claim.verifiedBy.name || 'Listing Owner'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
