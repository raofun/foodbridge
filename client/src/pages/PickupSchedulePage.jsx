import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  UtensilsCrossed,
  ShieldCheck,
  Calendar,
  Loader2,
  Navigation
} from 'lucide-react';
import ListingSteps from '../components/ListingSteps.jsx';
import DonorProfileSection from '../components/DonorProfileSection.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './PickupSchedulePage.css';

const AREA_SUGGESTIONS = [
  'Dhanmondi, Dhaka',
  'Gulshan 1, Dhaka',
  'Banani, Dhaka',
  'Uttara, Dhaka',
  'Mirpur 10, Dhaka',
  'Mohakhali, Dhaka',
  'Mohammadpur, Dhaka',
  'Baily Road, Dhaka',
];

const CATEGORY_META = {
  meals: { label: 'Cooked Meals', icon: '🍲' },
  bakery: { label: 'Artisan Bakery', icon: '🥖' },
  fruits: { label: 'Fresh Fruits', icon: '🍎' },
  produce: { label: 'Produce & Greens', icon: '🥗' },
  dairy: { label: 'Dairy & Sweets', icon: '🥛' },
  packaged: { label: 'Packaged & Pantry', icon: '🥫' },
  beverages: { label: 'Beverages', icon: '🧃' },
  other: { label: 'Other Surplus', icon: '📦' },
};

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatFriendlyTimeRange(opensAt, closesAt) {
  if (!opensAt || !closesAt) return 'Timeframe pending';
  const openDate = new Date(opensAt);
  const closeDate = new Date(closesAt);
  if (isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) return 'Invalid timeframe';

  const isSameDay = openDate.toDateString() === closeDate.toDateString();
  const openTimeStr = openDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const closeTimeStr = closeDate.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const now = new Date();
  const isToday = now.toDateString() === openDate.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === openDate.toDateString();

  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isSameDay) {
    return `${dayLabel}, ${openTimeStr} – ${closeTimeStr}`;
  }
  const closeDayLabel = closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dayLabel} ${openTimeStr} – ${closeDayLabel} ${closeTimeStr}`;
}

export default function PickupSchedulePage() {
  const { listingId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [form, setForm] = useState({
    pickupLocation: '',
    pickupOpensAt: '',
    pickupClosesAt: '',
    accessNotes: '',
  });
  const [loading, setLoading] = useState(true);
  const [listingLoaded, setListingLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  useEffect(() => {
    apiRequest(`/listings/${listingId}/pickup`, { token: session?.token })
      .then((data) => {
        const dbListing = data?.listing;
        if (!dbListing) throw new Error('Listing could not be loaded.');
        if (dbListing.status !== 'draft') {
          navigate('/listings/mine', { replace: true });
          return;
        }
        if (!dbListing.preparedAt || !dbListing.storageDetails || !dbListing.foodCondition) {
          navigate(`/listings/${listingId}/information`, { replace: true });
          return;
        }

        setListing(dbListing);

        const now = new Date();
        const defaultOpens = toLocalDateTime(dbListing.pickupOpensAt || now);
        const defaultCloses = toLocalDateTime(
          dbListing.pickupClosesAt ||
          dbListing.pickupDeadline ||
          new Date(now.getTime() + 4 * 3600000)
        );

        setForm({
          pickupLocation: dbListing.pickupLocation || '',
          pickupOpensAt: defaultOpens,
          pickupClosesAt: defaultCloses,
          accessNotes: '',
        });
        setListingLoaded(true);
      })
      .catch((e) => setError(e.message || 'Failed to load listing for scheduling.'))
      .finally(() => setLoading(false));
  }, [listingId, navigate, session?.token]);

  const handleAreaClick = (area) => {
    if (!form.pickupLocation.trim()) {
      set('pickupLocation', area);
    } else if (!form.pickupLocation.toLowerCase().includes(area.toLowerCase().split(',')[0].trim())) {
      set('pickupLocation', `${form.pickupLocation.trim()}, ${area}`);
    }
  };

  const setQuickOpen = (mode) => {
    const now = new Date();
    let openDate = new Date();
    if (mode === 'now') {
      openDate = now;
    } else if (mode === '1h') {
      openDate = new Date(now.getTime() + 3600000);
    } else if (mode === 'evening') {
      openDate = new Date();
      openDate.setHours(18, 0, 0, 0);
      if (openDate.getTime() <= now.getTime()) {
        openDate.setDate(openDate.getDate() + 1);
      }
    }

    const openStr = toLocalDateTime(openDate);
    set('pickupOpensAt', openStr);

    const currentCloses = form.pickupClosesAt ? new Date(form.pickupClosesAt).getTime() : 0;
    if (!currentCloses || currentCloses <= openDate.getTime() + 3600000) {
      const newCloseDate = new Date(openDate.getTime() + 4 * 3600000);
      set('pickupClosesAt', toLocalDateTime(newCloseDate));
    }
  };

  const setQuickClose = (durationHours, fixedMode = null) => {
    const baseTime = form.pickupOpensAt ? new Date(form.pickupOpensAt).getTime() : Date.now();
    let targetDate;

    if (fixedMode === 'tonight_10pm') {
      targetDate = new Date();
      targetDate.setHours(22, 0, 0, 0);
      if (targetDate.getTime() <= baseTime) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else if (fixedMode === 'tomorrow_noon') {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(12, 0, 0, 0);
    } else {
      targetDate = new Date(baseTime + durationHours * 3600000);
    }

    set('pickupClosesAt', toLocalDateTime(targetDate));
  };

  const durationInfo = (() => {
    if (!form.pickupOpensAt || !form.pickupClosesAt) return null;
    const start = new Date(form.pickupOpensAt).getTime();
    const end = new Date(form.pickupClosesAt).getTime();
    if (isNaN(start) || isNaN(end)) return null;

    if (end <= start) {
      return { isError: true, message: 'Pickup closing time must be after opening time.' };
    }
    if (end <= Date.now()) {
      return { isError: true, message: 'Pickup closing time cannot be in the past.' };
    }

    const totalMinutes = Math.round((end - start) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    let text = '';
    if (hours > 0 && mins > 0) {
      text = `${hours}h ${mins}m window`;
    } else if (hours > 0) {
      text = `${hours} ${hours === 1 ? 'hour' : 'hours'} window`;
    } else {
      text = `${mins} mins window`;
    }

    const isOpenNow = Date.now() >= start && Date.now() < end;
    const isBeyondUseBy = Boolean(listing?.useByAt && end > new Date(listing.useByAt).getTime());

    return { isError: false, text, isOpenNow, isBeyondUseBy };
  })();

  const validateForm = () => {
    if (!form.pickupLocation.trim()) {
      return 'Please specify the collection location or address.';
    }
    if (!form.pickupOpensAt) {
      return 'Please specify when the collection window opens.';
    }
    if (!form.pickupClosesAt) {
      return 'Please specify when the collection window closes.';
    }
    const opens = new Date(form.pickupOpensAt).getTime();
    const closes = new Date(form.pickupClosesAt).getTime();
    if (isNaN(opens) || isNaN(closes)) {
      return 'Please provide valid opening and closing dates and times.';
    }
    if (opens >= closes) {
      return 'Pickup closing time must be after opening time.';
    }
    if (closes <= Date.now()) {
      return 'Pickup closing time cannot be in the past. Please select a future time.';
    }
    return null;
  };

  async function submit(event) {
    event.preventDefault();
    const clientError = validateForm();
    if (clientError) {
      setError(clientError);
      return;
    }

    setBusy(true);
    setError('');

    let finalLocation = form.pickupLocation.trim();
    if (form.accessNotes.trim()) {
      finalLocation = `${finalLocation} (${form.accessNotes.trim()})`;
    }

    try {
      await apiRequest(`/listings/${listingId}/pickup`, {
        token: session?.token,
        method: 'PATCH',
        body: JSON.stringify({
          pickupLocation: finalLocation,
          pickupOpensAt: new Date(form.pickupOpensAt).toISOString(),
          pickupClosesAt: new Date(form.pickupClosesAt).toISOString(),
        }),
      });
      navigate('/listings/mine', { state: { notice: '🎉 Your surplus food listing is now published and available to the community.' } });
    } catch (e) {
      setError(e.message || 'Failed to save pickup schedule and publish listing.');
    } finally {
      setBusy(false);
    }
  }

  const categoryMeta = listing ? (CATEGORY_META[listing.category] || CATEGORY_META.meals) : CATEGORY_META.meals;

  return (
    <div className="pickup-schedule-view">
      <header className="pickup-schedule-header">
        <div className="pickup-schedule-nav-row">
          <Link className="btn-back-link" to={`/listings/${listingId}/information`}>
            <ArrowLeft size={14} />
            <span>Back to Food Information</span>
          </Link>
          <span className="pickup-step-badge">
            <span className="pickup-badge-dot" />
            Step 03 · Final Publishing
          </span>
        </div>
        <h1 className="pickup-schedule-title">Schedule Food Pickup</h1>
        <p className="pickup-schedule-subtitle">
          Confirm the handover point and collection timeframe to publish your surplus listing to the community feed.
        </p>
      </header>

      <div className="pickup-schedule-steps-wrap">
        <ListingSteps current="03" />
      </div>

      {loading ? (
        <div className="pickup-loading-state" role="status" aria-live="polite">
          <Loader2 size={32} className="spinning" style={{ color: 'var(--fb-mint-spark)' }} />
          <span>Loading verified food donation records…</span>
        </div>
      ) : !listingLoaded ? (
        <div className="pickup-empty-state">
          <div className="form-feedback-error" role="alert" style={{ maxWidth: 480 }}>
            <AlertCircle size={18} />
            <span>{error || 'Unable to load listing details.'}</span>
          </div>
          <Link to="/listings/mine" className="btn-back-link" style={{ marginTop: 12 }}>
            Return to My Listings
          </Link>
        </div>
      ) : (
        <div className="pickup-schedule-grid">
          {/* Left Form Card */}
          <form className="pickup-form-card" onSubmit={submit} noValidate>
            <div className="form-section-title">
              <MapPin size={14} />
              <span>Collection Location</span>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="pickupLocation" className="form-label">
                  Pickup Address or Landmark <span className="req">*</span>
                </label>
                <span className="form-hint-char">{form.pickupLocation.length}/300</span>
              </div>
              <div className="location-input-container">
                <MapPin size={16} className="location-input-icon" />
                <input
                  id="pickupLocation"
                  type="text"
                  required
                  maxLength={300}
                  placeholder="e.g. House 14, Road 7, Dhanmondi 27, Dhaka"
                  className="form-input"
                  value={form.pickupLocation}
                  onChange={(e) => set('pickupLocation', e.target.value)}
                  disabled={busy}
                />
              </div>

              {/* Quick Area Chips */}
              <div className="quick-locations-wrap">
                <span className="quick-locations-label">
                  <Navigation size={12} />
                  <span>Quick Dhaka areas:</span>
                </span>
                <div className="location-chips-row">
                  {AREA_SUGGESTIONS.map((area) => (
                    <button
                      type="button"
                      key={area}
                      className="location-chip-btn"
                      onClick={() => handleAreaClick(area)}
                      disabled={busy}
                    >
                      {area.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="accessNotes" className="form-label">
                  Access / Gate Instructions <span className="form-hint-char">(optional)</span>
                </label>
                <span className="form-hint-char">{form.accessNotes.length}/150</span>
              </div>
              <input
                id="accessNotes"
                type="text"
                maxLength={150}
                placeholder="e.g. Call upon arrival at security gate, ring apartment 3B"
                className="form-input"
                value={form.accessNotes}
                onChange={(e) => set('accessNotes', e.target.value)}
                disabled={busy}
              />
            </div>

            <div className="form-section-title" style={{ marginTop: 8 }}>
              <Clock size={14} />
              <span>Collection Time Window</span>
            </div>

            <div className="time-window-grid">
              <div className="form-group">
                <label htmlFor="pickupOpensAt" className="form-label">
                  Pickup Opens At <span className="req">*</span>
                </label>
                <input
                  id="pickupOpensAt"
                  type="datetime-local"
                  required
                  className="form-input"
                  value={form.pickupOpensAt}
                  onChange={(e) => set('pickupOpensAt', e.target.value)}
                  disabled={busy}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pickupClosesAt" className="form-label">
                  Pickup Closes At <span className="req">*</span>
                </label>
                <input
                  id="pickupClosesAt"
                  type="datetime-local"
                  required
                  min={form.pickupOpensAt || undefined}
                  className="form-input"
                  value={form.pickupClosesAt}
                  onChange={(e) => set('pickupClosesAt', e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Quick Time Shortcuts */}
            <div className="quick-time-shortcuts-panel">
              <div className="quick-time-group">
                <span className="quick-time-group-label">
                  <Calendar size={12} />
                  <span>Quick Open:</span>
                </span>
                <div className="quick-time-chips">
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickOpen('now')}
                    disabled={busy}
                  >
                    ⚡ Open Now
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickOpen('1h')}
                    disabled={busy}
                  >
                    ⏳ In 1 Hour
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickOpen('evening')}
                    disabled={busy}
                  >
                    🌆 Evening (6 PM)
                  </button>
                </div>
              </div>

              <div className="quick-time-group">
                <span className="quick-time-group-label">
                  <Clock size={12} />
                  <span>Duration / Close:</span>
                </span>
                <div className="quick-time-chips">
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickClose(2)}
                    disabled={busy}
                  >
                    +2 Hours
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickClose(4)}
                    disabled={busy}
                  >
                    +4 Hours
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickClose(6)}
                    disabled={busy}
                  >
                    +6 Hours
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickClose(0, 'tonight_10pm')}
                    disabled={busy}
                  >
                    Until 10 PM
                  </button>
                  <button
                    type="button"
                    className="quick-time-btn"
                    onClick={() => setQuickClose(0, 'tomorrow_noon')}
                    disabled={busy}
                  >
                    Tomorrow Noon
                  </button>
                </div>
              </div>
            </div>

            {/* Window Duration Status Banner */}
            {durationInfo && (
              <div className={`window-status-row ${durationInfo.isError ? 'error' : durationInfo.isBeyondUseBy ? 'warning' : ''}`}>
                {durationInfo.isError ? (
                  <div className="window-duration-info">
                    <AlertCircle size={15} />
                    <span>{durationInfo.message}</span>
                  </div>
                ) : (
                  <>
                    <div className="window-duration-info">
                      <Clock size={15} />
                      <span>{durationInfo.text}</span>
                    </div>
                    {durationInfo.isOpenNow ? (
                      <span className="window-timing-tag">🟢 Open for pickup immediately</span>
                    ) : (
                      <span className="window-timing-tag" style={{ background: 'rgba(45, 212, 191, 0.15)', color: 'var(--fb-mint-spark)' }}>
                        🕒 Scheduled pickup
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {durationInfo?.isBeyondUseBy && !durationInfo.isError && (
              <div className="window-status-row warning">
                <div className="window-duration-info">
                  <AlertCircle size={14} />
                  <span>Note: Selected closing time extends past recommended food safety use-by date.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="form-feedback-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="pickup-actions-bar">
              <p className="actions-note">
                Publishing makes this surplus food visible to receivers and volunteers in the community feed.
              </p>
              <button type="submit" className="btn-publish-step" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Publishing listing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Publish Listing</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Live Preview Column */}
          <aside className="pickup-preview-col" aria-label="Donation publication preview">
            <div className="preview-col-heading">
              <span className="preview-badge-label">
                <Sparkles size={13} />
                <span>Publication Summary</span>
              </span>
              <span className="preview-hint">Live feed card preview</span>
            </div>

            <article className="pickup-preview-card">
              <div className="preview-photo-wrap">
                {listing.photoUrl ? (
                  <img
                    src={listing.photoUrl}
                    alt={listing.foodName || 'Surplus food'}
                    className="preview-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="preview-photo-fallback"
                  style={{ display: listing.photoUrl ? 'none' : 'flex' }}
                >
                  <UtensilsCrossed size={28} />
                  <span>Surplus Food Donation</span>
                </div>

                <span className="preview-tag-category">
                  {categoryMeta.icon} {categoryMeta.label}
                </span>
                <span className="preview-tag-publish">
                  ⚡ Ready to Publish
                </span>
              </div>

              <div className="preview-body">
                <h3 className="preview-title">{listing.foodName}</h3>

                <div className="preview-meta-row">
                  <span className="preview-portion-pill">
                    <UtensilsCrossed size={12} />
                    <span>{listing.quantity} {listing.portionUnit}</span>
                  </span>
                  {listing.foodCondition && (
                    <span className="preview-condition-pill">
                      <span>Condition: {listing.foodCondition}</span>
                    </span>
                  )}
                </div>

                {/* Live Pickup Details Box */}
                <div className="preview-schedule-box">
                  <div className="schedule-detail-item">
                    <div className="schedule-icon-wrap">
                      <MapPin size={14} />
                    </div>
                    <div className="schedule-text-wrap">
                      <span className="schedule-text-label">Pickup Point</span>
                      <span className={`schedule-text-value ${!form.pickupLocation ? 'placeholder' : ''}`}>
                        {form.pickupLocation || 'Address not entered yet'}
                        {form.accessNotes && ` (${form.accessNotes})`}
                      </span>
                    </div>
                  </div>

                  <div className="schedule-detail-item">
                    <div className="schedule-icon-wrap clock">
                      <Clock size={14} />
                    </div>
                    <div className="schedule-text-wrap">
                      <span className="schedule-text-label">Collection Window</span>
                      <span className="schedule-text-value">
                        {formatFriendlyTimeRange(form.pickupOpensAt, form.pickupClosesAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <DonorProfileSection
                  donor={{ name: session?.user?.name || 'You (Donor)', role: session?.user?.role || 'Member' }}
                  pickupLocation={form.pickupLocation || 'Your Location'}
                  size="compact"
                />
              </div>
            </article>

            <div className="preview-pledge-note">
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                By publishing, you verify that food items are safely packaged and ready for collection at the scheduled times.
              </span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
