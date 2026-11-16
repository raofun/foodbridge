import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  UtensilsCrossed,
  Phone,
  User,
  Users,
  Calendar,
  Sparkles,
  ChevronRight,
  Package,
  Pencil,
  Check
} from 'lucide-react';
import { apiRequest } from '../services/api.js';

function formatSelectedDateTime(dateInput) {
  if (!dateInput) return 'Not scheduled';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Not scheduled';

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

function getAvailableDates(listing) {
  const dates = [];
  const now = new Date();
  const deadline = listing?.pickupClosesAt || listing?.pickupDeadline;
  const maxDate = deadline && !isNaN(new Date(deadline).getTime())
    ? new Date(deadline)
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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

function getTimeSlotsForDate(date, listing) {
  const slots = [];
  if (!date || isNaN(new Date(date).getTime())) return slots;

  const validDate = new Date(date);
  const opens = listing?.pickupOpensAt && !isNaN(new Date(listing.pickupOpensAt).getTime())
    ? new Date(listing.pickupOpensAt)
    : null;
  const rawClose = listing?.pickupClosesAt || listing?.pickupDeadline;
  const closes = rawClose && !isNaN(new Date(rawClose).getTime())
    ? new Date(rawClose)
    : null;
  const now = new Date();

  for (let hour = 8; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 22 && minute > 0) continue;
      const slotDate = new Date(validDate.getFullYear(), validDate.getMonth(), validDate.getDate(), hour, minute, 0, 0);
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

function getQuickTimes(listing) {
  const now = Date.now();
  const rawOpen = listing?.pickupOpensAt;
  const opens = rawOpen && !isNaN(new Date(rawOpen).getTime()) ? new Date(rawOpen).getTime() : now;
  const rawClose = listing?.pickupClosesAt || listing?.pickupDeadline;
  const closes = rawClose && !isNaN(new Date(rawClose).getTime())
    ? new Date(rawClose).getTime()
    : now + 24 * 60 * 60 * 1000;

  const presets = [];

  const in30 = new Date(now + 30 * 60 * 1000);
  if (in30.getTime() >= opens - 5 * 60 * 1000 && in30.getTime() <= closes) {
    presets.push({ label: '⚡ In 30 min', date: in30 });
  }

  const in60 = new Date(now + 60 * 60 * 1000);
  if (in60.getTime() >= opens - 5 * 60 * 1000 && in60.getTime() <= closes) {
    presets.push({ label: '⚡ In 1 hour', date: in60 });
  }

  const in120 = new Date(now + 120 * 60 * 1000);
  if (in120.getTime() >= opens - 5 * 60 * 1000 && in120.getTime() <= closes) {
    presets.push({ label: '⚡ In 2 hours', date: in120 });
  }

  return presets;
}

export default function EditClaimModal({ claim, onClose, onUpdated }) {
  if (!claim) return null;

  const initialListing = (typeof claim.listing === 'object' && claim.listing) ? claim.listing : {};
  const [liveListing, setLiveListing] = useState(initialListing);
  const [fetchingStock, setFetchingStock] = useState(false);

  const currentClaimQuantity = Number(claim.quantity) || 1;
  const listingTotal = Number(liveListing.quantity || initialListing.quantity || 1);
  const listingClaimed = liveListing.claimedQuantity !== undefined
    ? Number(liveListing.claimedQuantity)
    : Number(initialListing.claimedQuantity || 0);
  const remainingInListing = Math.max(0, listingTotal - listingClaimed);
  // User can keep current quantity, reduce to 1, or increase up to (current + remaining in listing)
  const maxAllowedQuantity = Math.max(1, currentClaimQuantity + remainingInListing);

  const [quantity, setQuantity] = useState(currentClaimQuantity);
  const [recipientName, setRecipientName] = useState(claim.recipientName || '');
  const [contactPhone, setContactPhone] = useState(claim.contactPhone || '');
  const [estimatedPickupAt, setEstimatedPickupAt] = useState(() => {
    if (!claim.estimatedPickupAt) return '';
    const d = new Date(claim.estimatedPickupAt);
    return !isNaN(d.getTime()) ? d.toISOString() : '';
  });
  const [peopleFed, setPeopleFed] = useState(
    claim.peopleFed !== null && claim.peopleFed !== undefined ? String(claim.peopleFed) : ''
  );
  const [hasContainers, setHasContainers] = useState(
    claim.hasContainers !== undefined ? Boolean(claim.hasContainers) : true
  );
  const [reservationPurpose, setReservationPurpose] = useState(claim.reservationPurpose || 'household');
  const [receiverNotes, setReceiverNotes] = useState(claim.receiverNotes || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch live fresh stock from server safely
  useEffect(() => {
    const listingId = initialListing._id || (typeof claim.listing === 'string' ? claim.listing : null);
    if (!listingId) return;

    let isMounted = true;
    setFetchingStock(true);
    apiRequest(`/listings/${listingId}`)
      .then((data) => {
        if (isMounted && data?.listing) {
          setLiveListing(data.listing);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFetchingStock(false);
      });

    return () => { isMounted = false; };
  }, [initialListing?._id, claim.listing]);

  // Date time picker sub-modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerSelectedDate, setPickerSelectedDate] = useState(() => {
    if (claim.estimatedPickupAt) {
      const d = new Date(claim.estimatedPickupAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const availableDates = useMemo(() => getAvailableDates(liveListing), [liveListing]);
  const timeSlots = useMemo(() => getTimeSlotsForDate(pickerSelectedDate, liveListing), [pickerSelectedDate, liveListing]);
  const quickTimes = useMemo(() => getQuickTimes(liveListing), [liveListing]);

  const handleSelectSlot = (isoString) => {
    setEstimatedPickupAt(isoString);
    setShowDatePicker(false);
  };

  const handleSelectQuickTime = (date) => {
    if (date && !isNaN(date.getTime())) {
      setEstimatedPickupAt(date.toISOString());
    }
  };

  const handleClearPickupTime = () => {
    setEstimatedPickupAt('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 1) {
      setError('Portion quantity must be a whole number of at least 1.');
      return;
    }
    if (parsedQty > maxAllowedQuantity) {
      setError(`Cannot exceed ${maxAllowedQuantity} portions. Only ${remainingInListing} additional portions are currently available.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quantity: parsedQty,
        recipientName: recipientName.trim(),
        contactPhone: contactPhone.trim(),
        estimatedPickupAt: estimatedPickupAt || null,
        peopleFed: peopleFed !== '' && !isNaN(Number(peopleFed)) ? Math.max(1, Number(peopleFed)) : null,
        hasContainers,
        reservationPurpose,
        receiverNotes: receiverNotes.trim(),
      };

      const res = await apiRequest(`/claims/${claim._id}`, {
        method: 'PUT',
        body: payload,
      });

      // Dispatch global real-time event so all cards across all views update their dynamic count left
      window.dispatchEvent(
        new CustomEvent('foodbridge:reservation-updated', {
          detail: {
            claimId: claim._id,
            listingId: res.listingSummary?._id || liveListing._id,
            claimedQuantity: res.listingSummary?.claimedQuantity,
            remainingQuantity: res.listingSummary?.remainingQuantity,
            status: res.listingSummary?.status,
            updatedClaim: res.claim,
          },
        })
      );

      if (onUpdated) {
        onUpdated(res.claim, res.message || 'Reservation updated successfully!', res.listingSummary);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update reservation.');
    } finally {
      setSaving(false);
    }
  };

  const portionUnit = liveListing.portionUnit || initialListing.portionUnit || 'portions';

  return (
    <div className="edit-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="edit-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <div className="edit-modal-header-info">
            <div className="edit-modal-badge">
              <Pencil size={12} />
              <span>EDIT ACTIVE RESERVATION</span>
            </div>
            <h2 className="edit-modal-title">{liveListing.foodName || initialListing.foodName || 'Food Reservation'}</h2>
            <p className="edit-modal-subtitle">
              Donated by <strong>{liveListing.donor?.name || initialListing.donor?.name || 'Community Donor'}</strong> • {liveListing.pickupLocation || initialListing.pickupLocation || 'Pickup location confirmed'}
            </p>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close edit modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="edit-modal-error" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="edit-modal-form">
          {/* Portion Stepper & Live Stock Breakdown Inside Edit Option */}
          <div className="edit-form-section">
            <div className="section-label-row">
              <label className="edit-section-label">
                <UtensilsCrossed size={14} />
                <span>Portion Quantity (Increase / Decrease)</span>
              </label>
              <span className="live-stock-tag">
                {fetchingStock ? 'Checking stock...' : `${remainingInListing} more left in donation`}
              </span>
            </div>

            <div className="edit-portion-row">
              <div className="edit-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || saving}
                  aria-label="Decrease portions"
                  title="Decrease by 1 portion"
                >
                  <Minus size={14} />
                </button>
                <span className="stepper-value">
                  <strong>{quantity}</strong>
                  <span className="stepper-unit">{portionUnit}</span>
                </span>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() => setQuantity((q) => Math.min(maxAllowedQuantity, q + 1))}
                  disabled={quantity >= maxAllowedQuantity || saving}
                  aria-label="Increase portions"
                  title={quantity >= maxAllowedQuantity ? 'No more portions available' : 'Increase by 1 portion'}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Quick Portions Selector Chips */}
              <div className="edit-quick-chips">
                <button
                  type="button"
                  className={`quick-chip-btn ${quantity === 1 ? 'active' : ''}`}
                  onClick={() => setQuantity(1)}
                  disabled={saving}
                >
                  Min (1)
                </button>
                {currentClaimQuantity > 1 && currentClaimQuantity <= maxAllowedQuantity && (
                  <button
                    type="button"
                    className={`quick-chip-btn ${quantity === currentClaimQuantity ? 'active' : ''}`}
                    onClick={() => setQuantity(currentClaimQuantity)}
                    disabled={saving}
                  >
                    Current ({currentClaimQuantity})
                  </button>
                )}
                {maxAllowedQuantity > 1 && maxAllowedQuantity !== currentClaimQuantity && (
                  <button
                    type="button"
                    className={`quick-chip-btn ${quantity === maxAllowedQuantity ? 'active' : ''}`}
                    onClick={() => setQuantity(maxAllowedQuantity)}
                    disabled={saving}
                  >
                    Max Available ({maxAllowedQuantity})
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Calculation Helper Card */}
            <div className="edit-stock-preview-card">
              <div className="preview-stat-item">
                <span className="stat-label">Your Current</span>
                <span className="stat-val">{currentClaimQuantity} {portionUnit}</span>
              </div>
              <div className="preview-divider">→</div>
              <div className="preview-stat-item highlight">
                <span className="stat-label">New Reservation</span>
                <span className="stat-val">{quantity} {portionUnit}</span>
              </div>
              <div className="preview-divider">|</div>
              <div className="preview-stat-item">
                <span className="stat-label">Donation Remaining</span>
                <span className="stat-val dynamic-left">
                  {Math.max(0, maxAllowedQuantity - quantity)} left
                </span>
              </div>
            </div>

            {quantity !== currentClaimQuantity && (
              <div className={`stock-delta-banner ${quantity > currentClaimQuantity ? 'plus' : 'minus'}`}>
                {quantity > currentClaimQuantity ? (
                  <span>＋ Adding {quantity - currentClaimQuantity} portions to your reservation.</span>
                ) : (
                  <span>－ Releasing {currentClaimQuantity - quantity} portions back to community feed.</span>
                )}
              </div>
            )}
          </div>

          {/* Estimated Pickup Time */}
          <div className="edit-form-section">
            <div className="section-label-row">
              <label className="edit-section-label">
                <Clock size={14} />
                <span>Estimated Pickup Time</span>
              </label>
              {estimatedPickupAt && (
                <button
                  type="button"
                  className="btn-clear-time"
                  onClick={handleClearPickupTime}
                >
                  Clear Time
                </button>
              )}
            </div>

            {/* Quick Presets */}
            {quickTimes.length > 0 && (
              <div className="edit-quick-chips">
                {quickTimes.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleSelectQuickTime(chip.date)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {/* Current Chosen Time / Trigger Picker */}
            <div
              className={`edit-time-display-box ${estimatedPickupAt ? 'has-time' : ''}`}
              onClick={() => setShowDatePicker(true)}
              role="button"
              tabIndex={0}
            >
              <div className="time-display-left">
                <Calendar size={15} />
                <span className="time-display-val">
                  {formatSelectedDateTime(estimatedPickupAt)}
                </span>
              </div>
              <span className="btn-open-picker-pill">
                <span>Select from Schedule</span>
                <ChevronRight size={13} />
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="edit-form-grid-2">
            <div className="edit-field-group">
              <label htmlFor="editRecipientName">
                <User size={13} />
                <span>Recipient Name</span>
              </label>
              <input
                id="editRecipientName"
                type="text"
                className="edit-input"
                placeholder="Full name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="edit-field-group">
              <label htmlFor="editContactPhone">
                <Phone size={13} />
                <span>Contact Phone</span>
              </label>
              <input
                id="editContactPhone"
                type="tel"
                className="edit-input"
                placeholder="e.g. +1 (555) 000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                maxLength={25}
              />
            </div>
          </div>

          {/* People Fed & Purpose */}
          <div className="edit-form-grid-2">
            <div className="edit-field-group">
              <label htmlFor="editPeopleFed">
                <Users size={13} />
                <span>People Fed (Optional)</span>
              </label>
              <input
                id="editPeopleFed"
                type="number"
                min="1"
                max="999"
                className="edit-input"
                placeholder="e.g. 4"
                value={peopleFed}
                onChange={(e) => setPeopleFed(e.target.value)}
              />
            </div>

            <div className="edit-field-group">
              <label htmlFor="editPurpose">
                <Package size={13} />
                <span>Reservation Purpose</span>
              </label>
              <select
                id="editPurpose"
                className="edit-select"
                value={reservationPurpose}
                onChange={(e) => setReservationPurpose(e.target.value)}
              >
                <option value="household">Household & Family</option>
                <option value="community_sharing">Community Sharing</option>
                <option value="charity_shelter">Charity / Shelter Outreach</option>
                <option value="elderly_care">Elderly or Vulnerable Care</option>
                <option value="other">Other Community Need</option>
              </select>
            </div>
          </div>

          {/* Reusable Container Checkbox */}
          <div className="edit-checkbox-row" onClick={() => setHasContainers(!hasContainers)}>
            <div className={`edit-custom-check ${hasContainers ? 'checked' : ''}`}>
              {hasContainers && <Check size={12} strokeWidth={3} />}
            </div>
            <span className="checkbox-label-text">
              I will bring clean, reusable containers to reduce single-use plastic waste.
            </span>
          </div>

          {/* Receiver Notes */}
          <div className="edit-field-group">
            <label htmlFor="editReceiverNotes">
              <span>Note for Donor / Collection Notes</span>
              <span className="char-count">{receiverNotes.length}/500</span>
            </label>
            <textarea
              id="editReceiverNotes"
              rows={2}
              className="edit-textarea"
              placeholder="Any details for donor (e.g., will arrive in blue car, dietary questions)..."
              value={receiverNotes}
              onChange={(e) => setReceiverNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          {/* Footer Actions */}
          <div className="edit-modal-footer">
            <button
              type="button"
              className="btn-edit-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-edit-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="spinning" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Update Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Date Time Picker Modal Sub-dialog */}
        {showDatePicker && (
          <div className="edit-picker-backdrop" onClick={() => setShowDatePicker(false)}>
            <div className="edit-picker-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="edit-picker-header">
                <div className="picker-header-title">
                  <Calendar size={16} />
                  <h4>Select Collection Date & Time</h4>
                </div>
                <button
                  type="button"
                  className="btn-picker-close"
                  onClick={() => setShowDatePicker(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Day selection tabs */}
              <div className="picker-days-bar">
                {availableDates.map((date, idx) => {
                  const isSelected = date.toDateString() === pickerSelectedDate.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayName = isToday ? 'Today' : date.toLocaleDateString([], { weekday: 'short' });
                  const dateNum = date.getDate();
                  const monthName = date.toLocaleDateString([], { month: 'short' });

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`picker-day-tab ${isSelected ? 'selected' : ''}`}
                      onClick={() => setPickerSelectedDate(date)}
                    >
                      <span className="picker-day-name">{dayName}</span>
                      <span className="picker-day-num">{dateNum}</span>
                      <span className="picker-day-month">{monthName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              <div className="picker-slots-container">
                <p className="slots-hint">
                  Available 30-min pickup intervals for {pickerSelectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}:
                </p>
                <div className="picker-slots-grid">
                  {timeSlots.map((slot, sIdx) => {
                    const isSelected = estimatedPickupAt && new Date(estimatedPickupAt).getTime() === slot.date.getTime();
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        disabled={!slot.isValid}
                        className={`picker-slot-btn ${isSelected ? 'selected' : ''} ${!slot.isValid ? 'disabled' : ''}`}
                        onClick={() => slot.isValid && handleSelectSlot(slot.isoString)}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
