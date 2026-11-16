import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  Clock,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  UtensilsCrossed,
  Info,
  Phone,
  User,
  Users,
  Calendar,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './ClaimModal.css';

// Reusable date & time formatters
function toLocalDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatSelectedDateTime(dateInput) {
  if (!dateInput) return 'Select pickup time';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Select pickup time';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
}

// Generate selectable dates within donor window (max 7 days)
function getAvailableDates(listing) {
  const dates = [];
  const now = new Date();
  const deadline = listing?.pickupClosesAt || listing?.pickupDeadline;
  const maxDate = deadline ? new Date(deadline) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

  let dayCount = 0;
  while (current <= end && dayCount < 7) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
    dayCount++;
  }
  return dates.length > 0 ? dates : [new Date()];
}

// Generate 30-min time slots for a given day
function getTimeSlotsForDate(date, listing) {
  const slots = [];
  const opens = listing?.pickupOpensAt ? new Date(listing.pickupOpensAt) : null;
  const closes = listing?.pickupClosesAt ? new Date(listing.pickupClosesAt) : (listing?.pickupDeadline ? new Date(listing.pickupDeadline) : null);
  const now = new Date();

  // 8:00 AM to 10:00 PM in 30-min increments
  for (let hour = 8; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 22 && minute > 0) continue;
      const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
      const isPast = slotDate.getTime() < now.getTime() - 2 * 60 * 1000;
      const isBeforeOpen = opens && slotDate.getTime() < opens.getTime() - 5 * 60 * 1000;
      const isAfterClose = closes && slotDate.getTime() > closes.getTime();
      const isValid = !isPast && !isBeforeOpen && !isAfterClose;

      const pad = (n) => String(n).padStart(2, '0');
      const hour12 = hour % 12 || 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${pad(minute)} ${ampm}`;

      slots.push({
        date: slotDate,
        isoString: slotDate.toISOString(),
        label,
        isValid,
      });
    }
  }
  return slots;
}

// Generate quick preset times
function getQuickTimes(listing) {
  const now = Date.now();
  const opens = listing?.pickupOpensAt ? new Date(listing.pickupOpensAt).getTime() : now;
  const closes = listing?.pickupClosesAt
    ? new Date(listing.pickupClosesAt).getTime()
    : (listing?.pickupDeadline ? new Date(listing.pickupDeadline).getTime() : now + 24 * 60 * 60 * 1000);

  const presets = [];

  // In 30 min
  const in30 = new Date(now + 30 * 60 * 1000);
  if (in30.getTime() >= opens - 5 * 60 * 1000 && in30.getTime() <= closes) {
    presets.push({
      label: '⚡ In 30 min',
      date: in30,
    });
  }

  // In 1 hour
  const in60 = new Date(now + 60 * 60 * 1000);
  if (in60.getTime() >= opens - 5 * 60 * 1000 && in60.getTime() <= closes) {
    presets.push({
      label: '⚡ In 1 hour',
      date: in60,
    });
  }

  // In 2 hours
  const in120 = new Date(now + 120 * 60 * 1000);
  if (in120.getTime() >= opens - 5 * 60 * 1000 && in120.getTime() <= closes) {
    presets.push({
      label: '⚡ In 2 hours',
      date: in120,
    });
  }

  // If opening time is in the future
  if (opens > now && opens <= closes) {
    const openDate = new Date(opens);
    const openTimeStr = openDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    presets.unshift({
      label: `⚡ Opens (${openTimeStr})`,
      date: openDate,
    });
  }

  return presets;
}

export default function ClaimModal({ listing, onClose, onClaimSuccess }) {
  const { session, loading: authLoading } = useAuth();
  const activeToken = session?.token || (typeof window !== 'undefined' ? localStorage.getItem('foodbridge-token') : null);

  const userRole = String(session?.user?.role || '').trim().toLowerCase();
  const isDonor = userRole === 'donor';

  const donorId = String(listing?.donor?._id || listing?.donor || '');
  const currentUserId = String(session?.user?.id || session?.user?._id || '');
  const isOwner = Boolean(currentUserId && donorId && currentUserId === donorId);

  const totalQuantity = Number(listing?.quantity) || 1;
  const claimedQuantity = Number(listing?.claimedQuantity) || 0;
  const remainingQuantity = Math.max(0, totalQuantity - claimedQuantity);
  const portionUnit = listing?.portionUnit || 'portions';

  // Form states
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState(() => session?.user?.name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [peopleFed, setPeopleFed] = useState('');
  const [hasContainers, setHasContainers] = useState(true);
  const [reservationPurpose, setReservationPurpose] = useState('household');

  // Initial pickup time: 1 hour from now or listing opening time
  const [estimatedPickupAt, setEstimatedPickupAt] = useState(() => {
    const opens = listing?.pickupOpensAt ? new Date(listing.pickupOpensAt).getTime() : 0;
    const initialMs = Math.max(Date.now() + 60 * 60 * 1000, opens);
    return new Date(initialMs).toISOString();
  });

  // Date Time Picker Modal state
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState(() => new Date(estimatedPickupAt || Date.now()));
  const [selectedModalTime, setSelectedModalTime] = useState(() => estimatedPickupAt);

  const [receiverNotes, setReceiverNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedClaim, setConfirmedClaim] = useState(null);

  // Sync recipient name once session hydrates
  useEffect(() => {
    if (session?.user?.name && !recipientName) {
      setRecipientName(session.user.name);
    }
  }, [session?.user?.name, recipientName]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        if (showDatePickerModal) {
          setShowDatePickerModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, loading, showDatePickerModal]);

  // Formatted pickup window
  const pickupWindowFormatted = useMemo(() => {
    const opens = listing?.pickupOpensAt ? new Date(listing.pickupOpensAt) : null;
    const closes = listing?.pickupClosesAt ? new Date(listing.pickupClosesAt) : (listing?.pickupDeadline ? new Date(listing.pickupDeadline) : null);

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

  // Available dates & quick times
  const availableDates = useMemo(() => getAvailableDates(listing), [listing]);
  const quickTimes = useMemo(() => getQuickTimes(listing), [listing]);
  const currentTimeSlots = useMemo(() => getTimeSlotsForDate(selectedModalDate, listing), [selectedModalDate, listing]);

  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setQuantity(1);
    } else {
      setQuantity(Math.min(Math.max(1, num), remainingQuantity));
    }
  };

  const handleIncrement = () => {
    if (quantity < remainingQuantity) {
      setQuantity((q) => q + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const openDatePicker = () => {
    const current = estimatedPickupAt ? new Date(estimatedPickupAt) : new Date();
    setSelectedModalDate(current);
    setSelectedModalTime(estimatedPickupAt);
    setShowDatePickerModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!session || !activeToken) {
      setError('Please sign in with a receiver or volunteer account to reserve food.');
      return;
    }

    if (isDonor) {
      setError('Donors cannot claim food donations. Please use a Receiver or Volunteer account.');
      return;
    }

    if (isOwner) {
      setError('You cannot claim your own food listing. Food can only be reserved from other donors.');
      return;
    }

    if (remainingQuantity <= 0) {
      setError('All portions of this listing have already been claimed.');
      return;
    }

    if (quantity < 1 || quantity > remainingQuantity) {
      setError(`Please choose a quantity between 1 and ${remainingQuantity}.`);
      return;
    }

    if (!contactPhone.trim()) {
      setError('Please enter your contact phone number for pickup coordination.');
      return;
    }

    if (!estimatedPickupAt) {
      setError('Please select an estimated pickup date and time.');
      return;
    }

    const pickupTimeMs = new Date(estimatedPickupAt).getTime();
    if (isNaN(pickupTimeMs)) {
      setError('Please select a valid pickup date and time.');
      return;
    }
    if (pickupTimeMs < Date.now() - 5 * 60 * 1000) {
      setError('Estimated pickup time cannot be in the past.');
      return;
    }
    const closes = listing?.pickupClosesAt || listing?.pickupDeadline;
    if (closes && pickupTimeMs > new Date(closes).getTime()) {
      setError('Estimated pickup time cannot be after the donor pickup window closes.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        quantity,
        recipientName: recipientName.trim() || session?.user?.name || 'Receiver',
        contactPhone: contactPhone.trim(),
        peopleFed: peopleFed !== '' && !isNaN(Number(peopleFed)) ? Math.max(1, parseInt(peopleFed, 10)) : undefined,
        hasContainers: Boolean(hasContainers),
        reservationPurpose,
        estimatedPickupAt: new Date(estimatedPickupAt).toISOString(),
        receiverNotes: receiverNotes.trim() || undefined,
      };

      const response = await apiRequest(`/listings/${listing._id}/claim`, {
        method: 'POST',
        token: activeToken,
        body: payload,
      });

      setConfirmedClaim(response.claim);

      // Dispatch global real-time event so all cards across all views update their dynamic count left
      window.dispatchEvent(
        new CustomEvent('foodbridge:reservation-updated', {
          detail: {
            claimId: response.claim?._id,
            listingId: response.listing?._id || listing._id,
            claimedQuantity: response.listing?.claimedQuantity,
            remainingQuantity: response.listing?.remainingQuantity,
            status: response.listing?.status,
            newClaim: response.claim,
          },
        })
      );

      if (onClaimSuccess) {
        onClaimSuccess(response);
      }
    } catch (err) {
      setError(err.message || 'Failed to reserve food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fb-cmodal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-cmodal-title"
    >
      <div className="fb-cmodal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fb-cmodal-header">
          <div className="fb-cmodal-header-info">
            <h2 id="fb-cmodal-title" className="fb-cmodal-title">
              {confirmedClaim ? 'Reservation Confirmed!' : 'Reserve Surplus Food'}
            </h2>
            <p className="fb-cmodal-subtitle">
              {confirmedClaim
                ? 'Your surplus food pickup is booked.'
                : 'Complete the pickup details to reserve your portions.'}
            </p>
          </div>
          <button
            type="button"
            className="fb-cmodal-btn-close"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>

        {/* Loading Session */}
        {authLoading && !activeToken ? (
          <div className="fb-cmodal-body fb-cmodal-loading-box">
            <Loader2 size={24} className="fb-cmodal-spin" />
            <p>Loading your account details...</p>
          </div>
        ) : confirmedClaim ? (
          /* Success Receipt State */
          <div className="fb-cmodal-success">
            <div className="fb-cmodal-success-icon">
              <CheckCircle2 size={44} />
            </div>

            <div className="fb-cmodal-receipt">
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Food Item:</span>
                <span className="fb-cmodal-rval bold">{listing.foodName}</span>
              </div>
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Reserved:</span>
                <span className="fb-cmodal-rval badge">
                  {confirmedClaim.quantity} {confirmedClaim.portionUnit}
                </span>
              </div>
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Recipient:</span>
                <span className="fb-cmodal-rval">{confirmedClaim.recipientName || session?.user?.name}</span>
              </div>
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Contact Phone:</span>
                <span className="fb-cmodal-rval">{confirmedClaim.contactPhone}</span>
              </div>
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Pickup Location:</span>
                <span className="fb-cmodal-rval">{listing.pickupLocation || 'Location confirmed with donor'}</span>
              </div>
              <div className="fb-cmodal-receipt-row">
                <span className="fb-cmodal-rlabel">Pickup Window:</span>
                <span className="fb-cmodal-rval">{pickupWindowFormatted}</span>
              </div>
              {confirmedClaim.estimatedPickupAt && (
                <div className="fb-cmodal-receipt-row">
                  <span className="fb-cmodal-rlabel">Your Pickup ETA:</span>
                  <span className="fb-cmodal-rval bold">
                    {formatSelectedDateTime(confirmedClaim.estimatedPickupAt)}
                  </span>
                </div>
              )}
            </div>

            <div className="fb-cmodal-success-actions">
              <Link to="/claims/mine" className="fb-cmodal-btn-primary" onClick={onClose}>
                <HeartHandshake size={15} />
                <span>View My Reservations</span>
              </Link>
              <button type="button" className="fb-cmodal-btn-secondary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : !session ? (
          /* Sign In Required Guard */
          <div className="fb-cmodal-body">
            <div className="fb-cmodal-alert warning">
              <Info size={18} />
              <div>
                <strong>Sign In Required</strong>
                <p>You must be signed in with a Receiver or Volunteer account to reserve surplus food.</p>
              </div>
            </div>
            <div className="fb-cmodal-footer">
              <button type="button" className="fb-cmodal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <Link to="/login" className="fb-cmodal-btn-primary" onClick={onClose}>
                Sign In to Reserve
              </Link>
            </div>
          </div>
        ) : isOwner ? (
          /* Owner Guard: Volunteer/Donor cannot claim own listing */
          <div className="fb-cmodal-body">
            <div className="fb-cmodal-alert warning">
              <Info size={18} />
              <div>
                <strong>Cannot Claim Own Listing</strong>
                <p>You are the creator of this food donation. Volunteers and donors cannot claim their own listings. Food can only be reserved from other community donors.</p>
              </div>
            </div>
            <div className="fb-cmodal-footer">
              <button type="button" className="fb-cmodal-btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : isDonor ? (
          /* Donor Role Guard */
          <div className="fb-cmodal-body">
            <div className="fb-cmodal-alert warning">
              <Info size={18} />
              <div>
                <strong>Viewing as Donor</strong>
                <p>Donors can list surplus meals, but cannot make reservations. Please sign in with a Receiver or Volunteer account to claim food.</p>
              </div>
            </div>
            <div className="fb-cmodal-footer">
              <button type="button" className="fb-cmodal-btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Standard Interactive Claim Form */
          <form onSubmit={handleSubmit} className="fb-cmodal-form">
            <div className="fb-cmodal-body">
              {/* Account Status Pill */}
              <div className="fb-cmodal-user-status">
                <span className="fb-cmodal-user-dot" />
                <span>Reserving as <strong>{session.user?.name}</strong> ({session.user?.role || 'Volunteer'})</span>
              </div>

              {/* Food Summary Card */}
              <div className="fb-cmodal-summary-card">
                <div className="fb-cmodal-summary-thumb">
                  {listing.photoUrl ? (
                    <img src={listing.photoUrl} alt={listing.foodName} />
                  ) : (
                    <div className="fb-cmodal-thumb-placeholder">
                      <UtensilsCrossed size={22} />
                    </div>
                  )}
                </div>
                <div className="fb-cmodal-summary-text">
                  <h3 className="fb-cmodal-food-title">{listing.foodName}</h3>
                  <p className="fb-cmodal-food-donor">
                    By <strong>{listing.donor?.name || 'Community Donor'}</strong>
                  </p>
                  <div className="fb-cmodal-meta-row">
                    <MapPin size={12} />
                    <span>{listing.pickupLocation || 'Pickup location confirmed with donor'}</span>
                  </div>
                  <div className="fb-cmodal-meta-row">
                    <Clock size={12} />
                    <span>{pickupWindowFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="fb-cmodal-alert error" role="alert">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Portion Selector */}
              <div className="fb-cmodal-field">
                <div className="fb-cmodal-field-header">
                  <label htmlFor="fb-portion-input" className="fb-cmodal-label">
                    Portions to Reserve <span className="fb-cmodal-required">*</span>
                  </label>
                  <span className="fb-cmodal-stock-badge">
                    <strong>{remainingQuantity}</strong> {portionUnit} remaining
                  </span>
                </div>

                {remainingQuantity <= 0 ? (
                  <div className="fb-cmodal-alert error">
                    <AlertCircle size={15} />
                    <span>All portions of this listing have been claimed.</span>
                  </div>
                ) : (
                  <>
                    <div className="fb-cmodal-stepper">
                      <button
                        type="button"
                        className="fb-cmodal-step-btn"
                        onClick={handleDecrement}
                        disabled={quantity <= 1 || loading}
                        aria-label="Decrease portion"
                      >
                        <Minus size={15} />
                      </button>
                      <div className="fb-cmodal-step-center">
                        <input
                          id="fb-portion-input"
                          type="number"
                          min={1}
                          max={remainingQuantity}
                          className="fb-cmodal-number-input"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          disabled={loading}
                        />
                        <span className="fb-cmodal-unit-label">{portionUnit}</span>
                      </div>
                      <button
                        type="button"
                        className="fb-cmodal-step-btn"
                        onClick={handleIncrement}
                        disabled={quantity >= remainingQuantity || loading}
                        aria-label="Increase portion"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {remainingQuantity > 1 && (
                      <div className="fb-cmodal-quick-chips">
                        <button
                          type="button"
                          className={`fb-cmodal-chip ${quantity === 1 ? 'active' : ''}`}
                          onClick={() => setQuantity(1)}
                          disabled={loading}
                        >
                          1 portion
                        </button>
                        {remainingQuantity >= 4 && (
                          <button
                            type="button"
                            className={`fb-cmodal-chip ${quantity === Math.floor(remainingQuantity / 2) ? 'active' : ''}`}
                            onClick={() => setQuantity(Math.floor(remainingQuantity / 2))}
                            disabled={loading}
                          >
                            Half ({Math.floor(remainingQuantity / 2)})
                          </button>
                        )}
                        <button
                          type="button"
                          className={`fb-cmodal-chip ${quantity === remainingQuantity ? 'active' : ''}`}
                          onClick={() => setQuantity(remainingQuantity)}
                          disabled={loading}
                        >
                          All Remaining ({remainingQuantity})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 2. Recipient Name & Contact Phone */}
              <div className="fb-cmodal-grid-2">
                <div className="fb-cmodal-field">
                  <label htmlFor="fb-recipient-name" className="fb-cmodal-label">
                    <User size={13} className="fb-field-icon" />
                    <span>Recipient / Collector Name</span>
                  </label>
                  <input
                    id="fb-recipient-name"
                    type="text"
                    className="fb-cmodal-input"
                    placeholder="Your Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="fb-cmodal-field">
                  <label htmlFor="fb-contact-phone" className="fb-cmodal-label">
                    <Phone size={13} className="fb-field-icon" />
                    <span>Contact Phone <span className="fb-cmodal-required">*</span></span>
                  </label>
                  <input
                    id="fb-contact-phone"
                    type="tel"
                    className="fb-cmodal-input"
                    placeholder="e.g. +880 1712-345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* 3. Estimated Pickup Date & Time (ZERO MANUAL TYPING) */}
              <div className="fb-cmodal-field">
                <div className="fb-cmodal-field-header">
                  <label className="fb-cmodal-label">
                    <Calendar size={13} className="fb-field-icon" />
                    <span>Estimated Pickup Date & Time <span className="fb-cmodal-required">*</span></span>
                  </label>
                  <button
                    type="button"
                    className="fb-cmodal-btn-open-picker"
                    onClick={openDatePicker}
                    disabled={loading || remainingQuantity <= 0}
                  >
                    <span>📅 Open Picker</span>
                  </button>
                </div>

                {/* Clickable Pickup Display Card */}
                <div
                  className="fb-cmodal-time-display-card"
                  onClick={openDatePicker}
                  role="button"
                  tabIndex={0}
                  title="Click to choose date and time from calendar and slots"
                >
                  <div className="fb-cmodal-time-card-content">
                    <Clock size={18} className="fb-cmodal-time-card-icon" />
                    <div className="fb-cmodal-time-card-text">
                      <span className="fb-cmodal-time-primary">
                        {formatSelectedDateTime(estimatedPickupAt)}
                      </span>
                      <span className="fb-cmodal-time-secondary">
                        Donor Window: {pickupWindowFormatted}
                      </span>
                    </div>
                  </div>
                  <span className="fb-cmodal-time-badge">
                    Change Slot <ChevronRight size={13} />
                  </span>
                </div>

                {/* Quick Preset Buttons (1-Click Selection) */}
                {quickTimes.length > 0 && (
                  <div className="fb-cmodal-quick-times-container">
                    <span className="fb-cmodal-quick-time-title">Quick Select:</span>
                    <div className="fb-cmodal-quick-time-chips">
                      {quickTimes.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="fb-cmodal-quick-time-btn"
                          onClick={() => setEstimatedPickupAt(preset.date.toISOString())}
                          disabled={loading}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Community Impact: People Fed & Purpose */}
              <div className="fb-cmodal-grid-2">
                <div className="fb-cmodal-field">
                  <label htmlFor="fb-people-fed" className="fb-cmodal-label">
                    <Users size={13} className="fb-field-icon" />
                    <span>People Fed <span className="fb-cmodal-hint">(Optional)</span></span>
                  </label>
                  <input
                    id="fb-people-fed"
                    type="number"
                    min={1}
                    max={200}
                    className="fb-cmodal-input"
                    placeholder="e.g. 2 (optional)"
                    value={peopleFed}
                    onChange={(e) => setPeopleFed(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="fb-cmodal-field">
                  <label htmlFor="fb-purpose" className="fb-cmodal-label">
                    <HeartHandshake size={13} className="fb-field-icon" />
                    <span>Allocation Purpose</span>
                  </label>
                  <select
                    id="fb-purpose"
                    className="fb-cmodal-select"
                    value={reservationPurpose}
                    onChange={(e) => setReservationPurpose(e.target.value)}
                    disabled={loading}
                  >
                    <option value="household">🏠 Household Consumption</option>
                    <option value="community_sharing">🤝 Community Meal Sharing</option>
                    <option value="charity_shelter">🏥 Charity / Shelter / Orphanage</option>
                    <option value="elderly_care">👵 Elderly / Vulnerable Care</option>
                    <option value="other">📋 Other Community Need</option>
                  </select>
                </div>
              </div>

              {/* 5. Food Safety Guarantee Checkbox */}
              <div
                className="fb-cmodal-checkbox-row"
                onClick={() => setHasContainers((c) => !c)}
                role="checkbox"
                aria-checked={hasContainers}
                tabIndex={0}
              >
                <div className="fb-cmodal-checkbox-icon">
                  {hasContainers ? (
                    <CheckSquare size={17} className="checked" />
                  ) : (
                    <Square size={17} />
                  )}
                </div>
                <span className="fb-cmodal-checkbox-label">
                  I will bring clean food-safe containers or insulated bags to pick up and store this food safely.
                </span>
              </div>

              {/* 6. Special Notes for Donor */}
              <div className="fb-cmodal-field">
                <label htmlFor="fb-notes-input" className="fb-cmodal-label">
                  Special Notes for Donor <span className="fb-cmodal-hint">(Optional)</span>
                </label>
                <textarea
                  id="fb-notes-input"
                  className="fb-cmodal-textarea"
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Arriving on time, bringing insulated carrier, specific dietary notice..."
                  value={receiverNotes}
                  onChange={(e) => setReceiverNotes(e.target.value)}
                  disabled={loading || remainingQuantity <= 0}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="fb-cmodal-footer">
              <button
                type="button"
                className="fb-cmodal-btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="fb-cmodal-btn-primary"
                disabled={loading || remainingQuantity <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="fb-cmodal-spin" />
                    <span>Reserving...</span>
                  </>
                ) : (
                  <>
                    <HeartHandshake size={15} />
                    <span>Confirm Claim ({quantity} {portionUnit})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Dedicated Date & Time Picker Modal - Zero manual writing */}
        {showDatePickerModal && (
          <div className="fb-dtpicker-backdrop" onClick={() => setShowDatePickerModal(false)}>
            <div className="fb-dtpicker-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="fb-dtpicker-header">
                <div>
                  <h3 className="fb-dtpicker-title">Select Pickup Date & Time</h3>
                  <p className="fb-dtpicker-sub">Pick from available collection days and 30-min time slots</p>
                </div>
                <button
                  type="button"
                  className="fb-dtpicker-close"
                  onClick={() => setShowDatePickerModal(false)}
                  aria-label="Close date time picker"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="fb-dtpicker-body">
                {/* Donor Window Alert */}
                <div className="fb-dtpicker-window-notice">
                  <Clock size={13} />
                  <span>Donor Schedule: <strong>{pickupWindowFormatted}</strong></span>
                </div>

                {/* 1. Date Selection Row */}
                <div className="fb-dtpicker-section">
                  <span className="fb-dtpicker-section-label">1. Choose Date</span>
                  <div className="fb-dtpicker-dates-grid">
                    {availableDates.map((dateObj, idx) => {
                      const isSelected = selectedModalDate.toDateString() === dateObj.toDateString();
                      const isToday = dateObj.toDateString() === new Date().toDateString();
                      const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();
                      const dayName = isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : dateObj.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
                      const dateNumber = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`fb-dtpicker-date-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedModalDate(dateObj);
                            // Also adjust selectedModalTime to that day with same hour/min if valid
                            const currentT = selectedModalTime ? new Date(selectedModalTime) : new Date();
                            const newDateWithTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), currentT.getHours(), currentT.getMinutes(), 0, 0);
                            setSelectedModalTime(newDateWithTime.toISOString());
                          }}
                        >
                          <span className="dtpicker-day-name">{dayName}</span>
                          <span className="dtpicker-date-num">{dateNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Time Slot Selection Grid */}
                <div className="fb-dtpicker-section">
                  <div className="fb-dtpicker-section-header">
                    <span className="fb-dtpicker-section-label">2. Choose Time Slot (30-min intervals)</span>
                  </div>

                  <div className="fb-dtpicker-slots-grid">
                    {currentTimeSlots.map((slot, idx) => {
                      const isSelected = selectedModalTime && Math.abs(new Date(selectedModalTime).getTime() - slot.date.getTime()) < 60000;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={!slot.isValid}
                          className={`fb-dtpicker-slot-btn ${isSelected ? 'selected' : ''} ${!slot.isValid ? 'disabled' : ''}`}
                          onClick={() => setSelectedModalTime(slot.date.toISOString())}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="fb-dtpicker-footer">
                <div className="fb-dtpicker-footer-summary">
                  <span className="dtpicker-summary-label">Selected:</span>
                  <strong className="dtpicker-summary-val">
                    {selectedModalTime ? formatSelectedDateTime(selectedModalTime) : 'None'}
                  </strong>
                </div>

                <div className="fb-dtpicker-footer-actions">
                  <button
                    type="button"
                    className="fb-dtpicker-btn-cancel"
                    onClick={() => setShowDatePickerModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="fb-dtpicker-btn-apply"
                    disabled={!selectedModalTime}
                    onClick={() => {
                      if (selectedModalTime) {
                        setEstimatedPickupAt(selectedModalTime);
                        setShowDatePickerModal(false);
                      }
                    }}
                  >
                    Apply Pickup Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
