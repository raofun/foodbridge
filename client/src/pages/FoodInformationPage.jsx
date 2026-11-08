import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  Thermometer,
  Loader2,
  MapPin
} from 'lucide-react';
import ListingSteps from '../components/ListingSteps.jsx';
import DonorProfileSection from '../components/DonorProfileSection.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './FoodInformationPage.css';

const CATEGORIES = [
  { id: 'meals', label: 'Cooked Meals', icon: '🍲', hint: 'Rice dishes, curries, khichuri' },
  { id: 'bakery', label: 'Artisan Bakery', icon: '🥖', hint: 'Breads, parathas, snacks' },
  { id: 'fruits', label: 'Fresh Fruits', icon: '🍎', hint: 'Seasonal fruits, bananas' },
  { id: 'produce', label: 'Produce & Greens', icon: '🥗', hint: 'Vegetables, herbs, greens' },
  { id: 'dairy', label: 'Dairy & Sweets', icon: '🥛', hint: 'Misti, yogurt, milk sweets' },
  { id: 'packaged', label: 'Packaged & Pantry', icon: '🥫', hint: 'Canned food, grains, lentils' },
  { id: 'beverages', label: 'Beverages', icon: '🧃', hint: 'Juices, drinks, bottled water' },
  { id: 'other', label: 'Other Surplus', icon: '📦', hint: 'Assorted community items' },
];

const FOOD_CONDITIONS = [
  {
    id: 'fresh',
    label: 'Fresh / Room Temp',
    badge: 'Room Temp (20–25°C)',
    icon: '🌡️',
    desc: 'Freshly prepared or ambient shelf storage',
  },
  {
    id: 'refrigerated',
    label: 'Refrigerated',
    badge: 'Chilled (1–4°C)',
    icon: '❄️',
    desc: 'Maintained continuously in cold refrigeration',
  },
  {
    id: 'frozen',
    label: 'Frozen',
    badge: 'Deep Frozen (≤ -18°C)',
    icon: '🧊',
    desc: 'Solid frozen to preserve safety and longevity',
  },
  {
    id: 'shelf-stable',
    label: 'Shelf-Stable',
    badge: 'Dry Ambient',
    icon: '📦',
    desc: 'Sealed dry goods, grains, or canned foods',
  },
];

const DIETARY_ALLERGEN_TAGS = [
  { id: 'halal', label: '100% Halal', type: 'dietary', icon: '☪️' },
  { id: 'vegetarian', label: 'Vegetarian', type: 'dietary', icon: '🥦' },
  { id: 'vegan', label: 'Vegan', type: 'dietary', icon: '🌱' },
  { id: 'dairy', label: 'Contains Dairy', type: 'allergen', icon: '🥛' },
  { id: 'nuts', label: 'Contains Tree Nuts', type: 'allergen', icon: '🥜' },
  { id: 'gluten', label: 'Contains Gluten / Wheat', type: 'allergen', icon: '🌾' },
  { id: 'egg', label: 'Contains Eggs', type: 'allergen', icon: '🥚' },
  { id: 'seafood', label: 'Contains Fish / Seafood', type: 'allergen', icon: '🐟' },
];

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'Not set yet';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPickupDeadline(deadlineDate, currentTime = new Date()) {
  if (!deadlineDate) return { text: 'Not set yet', isExpired: false };
  const deadline = new Date(deadlineDate);
  if (isNaN(deadline.getTime())) return { text: 'Invalid date', isExpired: false };
  const now = currentTime instanceof Date ? currentTime : new Date();
  if (deadline.getTime() <= now.getTime()) {
    return { text: 'Pickup closed', isExpired: true };
  }
  const day = deadline.getDate();
  const month = deadline.toLocaleString('en-US', { month: 'long' });
  const year = deadline.getFullYear();
  const time = deadline.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { text: `Pickup before ${day} ${month}, ${year}, ${time}`, isExpired: false };
}

const defaultPickupDeadline = () => {
  const target = new Date(Date.now() + 4 * 3600000);
  return toLocalDateTime(target);
};

export default function FoodInformationPage() {
  const { listingId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const [form, setForm] = useState({
    preparedAt: toLocalDateTime(new Date()),
    pickupDeadline: defaultPickupDeadline(),
    storageDetails: '',
    foodCondition: 'fresh',
    useByAt: '',
    safetyNotes: '',
    selectedTags: [],
  });

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!listingId || listingId === 'new') {
      navigate('/listings/new', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    apiRequest(`/listings/${listingId}/information`, { token: session?.token })
      .then((data) => {
        if (!data?.listing) throw new Error('Listing not found in database.');
        const dbListing = data.listing;
        setListing(dbListing);
        setIsOwner(Boolean(data.isOwner));

        if (dbListing.status === 'draft') {
          if (!data.isOwner) {
            setError('Only the listing creator can access draft food information.');
            return;
          }

          let parsedTags = [];
          let cleanNotes = dbListing.safetyNotes || '';
          const tagMatch = cleanNotes.match(/^\[Tags:\s*([^\]]+)\]\s*(.*)$/s);
          if (tagMatch) {
            parsedTags = tagMatch[1].split(',').map(t => t.trim().toLowerCase());
            cleanNotes = tagMatch[2];
          }

          const initialDeadline = dbListing.pickupDeadline || dbListing.pickupClosesAt;

          setForm({
            preparedAt: toLocalDateTime(dbListing.preparedAt) || toLocalDateTime(new Date()),
            pickupDeadline: initialDeadline ? toLocalDateTime(initialDeadline) : defaultPickupDeadline(),
            storageDetails: dbListing.storageDetails || '',
            foodCondition: dbListing.foodCondition || 'fresh',
            useByAt: toLocalDateTime(dbListing.useByAt),
            safetyNotes: cleanNotes,
            selectedTags: parsedTags,
          });
        }
      })
      .catch((e) => {
        setError(e.message || 'Failed to load food information from server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [listingId, navigate, session?.token]);

  const setQuickPrepTime = (offsetHours = 0) => {
    const target = new Date(Date.now() - offsetHours * 3600000);
    set('preparedAt', toLocalDateTime(target));
  };

  const setQuickDeadline = (addHours = 4) => {
    const target = new Date(Date.now() + addHours * 3600000);
    set('pickupDeadline', toLocalDateTime(target));
  };

  const setQuickUseBy = (addHours = 24) => {
    const baseTime = form.preparedAt ? new Date(form.preparedAt).getTime() : Date.now();
    const target = new Date(baseTime + addHours * 3600000);
    set('useByAt', toLocalDateTime(target));
  };

  const toggleTag = (tagId) => {
    setForm(prev => {
      const exists = prev.selectedTags.includes(tagId);
      const nextTags = exists
        ? prev.selectedTags.filter(t => t !== tagId)
        : [...prev.selectedTags, tagId];
      return { ...prev, selectedTags: nextTags };
    });
  };

  const validateForm = () => {
    if (!form.preparedAt) {
      return 'Please specify when this food was prepared.';
    }
    if (!form.pickupDeadline) {
      return 'Please specify the required Pickup Deadline.';
    }
    const deadlineTime = new Date(form.pickupDeadline).getTime();
    if (isNaN(deadlineTime)) {
      return 'Please enter a valid date and time for the Pickup Deadline.';
    }
    if (deadlineTime <= Date.now()) {
      return 'Pickup deadline cannot be in the past. Please select a future date and time.';
    }
    if (!form.storageDetails.trim()) {
      return 'Please provide storage condition details (e.g. Kept refrigerated at 4°C).';
    }
    if (form.useByAt && new Date(form.useByAt) <= new Date(form.preparedAt)) {
      return 'The use-by date and time must be after the preparation time.';
    }
    return null;
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');

    const tagHeader = form.selectedTags.length > 0
      ? `[Tags: ${form.selectedTags.join(', ')}] `
      : '';
    const finalSafetyNotes = `${tagHeader}${form.safetyNotes.trim()}`.trim();

    try {
      const infoPayload = {
        preparedAt: new Date(form.preparedAt).toISOString(),
        pickupDeadline: new Date(form.pickupDeadline).toISOString(),
        pickupClosesAt: new Date(form.pickupDeadline).toISOString(),
        storageDetails: form.storageDetails.trim(),
        foodCondition: form.foodCondition,
        useByAt: form.useByAt ? new Date(form.useByAt).toISOString() : '',
        safetyNotes: finalSafetyNotes,
      };

      await apiRequest(`/listings/${listingId}/information`, {
        token: session?.token,
        method: 'PATCH',
        body: JSON.stringify(infoPayload),
      });

      navigate(`/listings/${listingId}/pickup`);
    } catch (e) {
      setError(e.message || 'Failed to save food safety information. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !listing) {
    return (
      <main className="food-info-view community-passport-container" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="food-info-loading-panel" role="status" aria-live="polite">
          <Loader2 size={26} className="spinning" />
          <span>Loading verified food safety records from database…</span>
        </div>
      </main>
    );
  }

  if (error && !listing) {
    return (
      <main className="food-info-view community-passport-container">
        <div className="food-info-header">
          <Link className="btn-back-link" to="/">
            <ArrowLeft size={14} />
            <span>Back to Community Feed</span>
          </Link>
        </div>
        <div className="form-error-banner" role="alert" style={{ marginTop: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  if (listing && listing.status !== 'draft') {
    const listingData = listing;
    const categoryObj = CATEGORIES.find(c => c.id === listingData.category) || CATEGORIES[0];
    const conditionObj = FOOD_CONDITIONS.find(c => c.id === listingData.foodCondition) || FOOD_CONDITIONS[0];
    const communityDeadlineInfo = formatPickupDeadline(
      listingData.pickupDeadline || listingData.pickupClosesAt,
      currentTime
    );

    return (
      <main className="food-info-view community-passport-container">
        <div className="food-info-header">
          <Link className="btn-back-link" to="/">
            <ArrowLeft size={14} />
            <span>Back to Community Feed</span>
          </Link>
          <span className="info-step-badge">
            <ShieldCheck size={13} />
            <span>Food Safety & Details Passport</span>
          </span>
        </div>

        <div className="community-passport-card">
          <div className="passport-media-banner">
            {listingData.photoUrl ? (
              <img src={listingData.photoUrl} alt={listingData.foodName} className="passport-img" />
            ) : (
              <div className="passport-placeholder-banner">
                <UtensilsCrossed size={48} />
                <span>Verified Community Surplus Food</span>
              </div>
            )}
            <div className="passport-banner-badges">
              <span className="badge-category-chip">
                {categoryObj.icon} {categoryObj.label}
              </span>
              <span className="badge-condition-chip">
                {conditionObj.icon} {conditionObj.label}
              </span>
            </div>
          </div>

          <div className="passport-details-body">
            <h1 className="passport-title">{listingData.foodName || 'Community Food Donation'}</h1>
            <DonorProfileSection
              donor={listingData.donor}
              pickupLocation={listingData.pickupLocation}
              size="prominent"
              className="passport-donor-profile"
            />

            <div className="passport-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Available Portions</span>
                <span className="stat-value">{listingData.quantity || 1} {listingData.portionUnit || 'portions'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pickup Deadline</span>
                <span className="stat-value" style={{ color: communityDeadlineInfo.isExpired ? '#f87171' : '#34d399' }}>
                  {communityDeadlineInfo.text}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Storage Verification</span>
                <span className="stat-value">{conditionObj.badge}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Current Status</span>
                <span className="stat-value" style={{ color: communityDeadlineInfo.isExpired ? '#f87171' : '#10b981', textTransform: 'capitalize' }}>
                  {communityDeadlineInfo.isExpired ? 'Pickup closed' : (listingData.status || 'Available')}
                </span>
              </div>
              {listingData.preparedAt && (
                <div className="stat-card">
                  <span className="stat-label">Prepared At</span>
                  <span className="stat-value">{formatRelativeTime(listingData.preparedAt)}</span>
                </div>
              )}
              {listingData.useByAt && (
                <div className="stat-card">
                  <span className="stat-label">Best Before</span>
                  <span className="stat-value">{formatRelativeTime(listingData.useByAt)}</span>
                </div>
              )}
            </div>

            <div className="passport-section">
              <h3 className="section-subheading">Food Description & Packaging</h3>
              <p className="passport-description">
                {listingData.description || 'No additional preparation notes provided by the donor.'}
              </p>
            </div>

            <div className="passport-section">
              <h3 className="section-subheading">Storage & Handling Instructions</h3>
              <div className="storage-callout-box">
                <Thermometer size={18} className="callout-icon" />
                <div>
                  <strong>{listingData.storageDetails || 'Stored under sanitary standard temperature conditions.'}</strong>
                  <p className="callout-sub">Receivers are recommended to maintain appropriate cooling or reheating before consumption.</p>
                </div>
              </div>
            </div>

            {listingData.safetyNotes && (
              <div className="passport-section">
                <h3 className="section-subheading">Safety, Dietary & Allergen Notes</h3>
                <div className="safety-notes-box">
                  <ShieldCheck size={18} className="safety-icon" />
                  <p>{listingData.safetyNotes}</p>
                </div>
              </div>
            )}

            {listingData.pickupLocation && (
              <div className="passport-section">
                <h3 className="section-subheading">Pickup & Collection Location</h3>
                <div className="storage-callout-box">
                  <MapPin size={18} className="callout-icon" />
                  <div>
                    <strong>{listingData.pickupLocation}</strong>
                    {listingData.pickupOpensAt && listingData.pickupClosesAt && (
                      <p className="callout-sub">
                        Collection Window: {new Date(listingData.pickupOpensAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – {new Date(listingData.pickupClosesAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const categoryObj = CATEGORIES.find(c => c.id === listing?.category) || CATEGORIES[0];

  return (
    <div className="food-info-view">
      <header className="food-info-header">
        <div className="food-info-nav-row">
          <Link to="/listings/mine" className="btn-back-link">
            <ArrowLeft size={14} />
            <span>My Listings</span>
          </Link>
          <span className="info-step-badge">
            <span className="badge-glow-dot" />
            Step 02 · Food Information & Safety
          </span>
        </div>

        <h1 className="food-info-title">Food Safety & Information Form</h1>
        <p className="food-info-subtitle">
          Specify preparation time, storage requirements, and dietary safety notes to guarantee transparent, safe community food distribution.
        </p>
      </header>

      <div className="food-info-steps-wrap">
        <ListingSteps current="02" />
      </div>

      <div className="food-info-grid">
        <form className="food-info-form-panel" onSubmit={handleSubmit} noValidate>
          {listing && (
            <div className="form-card-section food-summary-card">
              <div className="summary-card-inner">
                {listing.photoUrl ? (
                  <img src={listing.photoUrl} alt={listing.foodName} className="summary-thumb" />
                ) : (
                  <div className="summary-thumb" style={{ display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }}>
                    <UtensilsCrossed size={24} style={{ color: '#94a3b8' }} />
                  </div>
                )}
                <div className="summary-info-col">
                  <span className="summary-badge">Draft Item · Step 01 Saved</span>
                  <h3 className="summary-title">{listing.foodName}</h3>
                  <div className="summary-meta-pills">
                    <span className="summary-pill">{categoryObj.icon} {categoryObj.label}</span>
                    <span className="summary-pill">{listing.quantity} {listing.portionUnit}</span>
                  </div>
                  {listing.description && (
                    <p className="summary-desc">{listing.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="section-heading">Preparation Date & Time</h2>
                <p className="section-subtext">Essential for determining consumption safety windows and food freshness.</p>
              </div>
            </div>

            <div className="field-split-row">
              <div className="form-group">
                <label htmlFor="preparedAt" className="form-label">
                  Preparation Date & Time <span className="req">*</span>
                </label>
                <input
                  id="preparedAt"
                  type="datetime-local"
                  required
                  className="form-input"
                  value={form.preparedAt}
                  onChange={(e) => set('preparedAt', e.target.value)}
                  disabled={busy}
                />
                <div className="quick-time-chips">
                  <span className="chips-hint-text">Quick set:</span>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(0)}>Now</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(1)}>1h ago</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(3)}>3h ago</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(6)}>6h ago</button>
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="useByAt" className="form-label">
                    Use-by / Expiry Date & Time <span className="form-optional-tag">(Optional)</span>
                  </label>
                </div>
                <input
                  id="useByAt"
                  type="datetime-local"
                  className="form-input"
                  value={form.useByAt}
                  onChange={(e) => set('useByAt', e.target.value)}
                  disabled={busy}
                />
                <div className="quick-time-chips">
                  <span className="chips-hint-text">Set expiry:</span>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(12)}>+12 hrs</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(24)}>+24 hrs</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(48)}>+48 hrs</button>
                  {form.useByAt && (
                    <button type="button" className="time-chip-btn danger" onClick={() => set('useByAt', '')}>Clear</button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div className="form-label-row">
                <label htmlFor="pickupDeadline" className="form-label">
                  Pickup Deadline <span className="req">*</span>
                </label>
                <span className="form-hint-char">Do not allow deadline in the past</span>
              </div>
              <input
                id="pickupDeadline"
                name="pickupDeadline"
                type="datetime-local"
                required
                min={toLocalDateTime(new Date())}
                className="form-input"
                value={form.pickupDeadline}
                onChange={(e) => set('pickupDeadline', e.target.value)}
                disabled={busy}
              />
              <div className="quick-time-chips">
                <span className="chips-hint-text">Quick set deadline:</span>
                <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(2)}>+2 hrs</button>
                <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(4)}>+4 hrs</button>
                <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(8)}>+8 hrs</button>
                <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(24)}>Tomorrow (+24 hrs)</button>
              </div>
            </div>
          </div>

          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <Thermometer size={16} />
              </div>
              <div>
                <h2 className="section-heading">Storage Conditions & Environment</h2>
                <p className="section-subtext">How this food was preserved and maintained since cooking or preparation.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Current Storage Condition <span className="req">*</span>
              </label>
              <div className="condition-cards-grid" role="radiogroup" aria-label="Storage condition selector">
                {FOOD_CONDITIONS.map((cond) => {
                  const isSelected = form.foodCondition === cond.id;
                  return (
                    <button
                      type="button"
                      key={cond.id}
                      role="radio"
                      aria-checked={isSelected}
                      className={`condition-card-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => set('foodCondition', cond.id)}
                      disabled={busy}
                    >
                      <div className="cond-top-row">
                        <span className="cond-icon">{cond.icon}</span>
                        <span className="cond-badge">{cond.badge}</span>
                      </div>
                      <h4 className="cond-title">{cond.label}</h4>
                      <p className="cond-desc">{cond.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="storageDetails" className="form-label">
                  Specific Storage & Handling Instructions <span className="req">*</span>
                </label>
                <span className="form-hint-char">{form.storageDetails.length}/500</span>
              </div>
              <input
                id="storageDetails"
                type="text"
                required
                maxLength={500}
                placeholder="e.g. Kept in commercial refrigerator at 4°C in sealed food-grade containers"
                className="form-input"
                value={form.storageDetails}
                onChange={(e) => set('storageDetails', e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h2 className="section-heading">Dietary Certifications, Allergens & Safety Notes</h2>
                <p className="section-subtext">Critical for protecting receivers with severe allergies or dietary preferences.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Dietary Attributes & Potential Allergens
              </label>
              <div className="tags-flex-wrap">
                {DIETARY_ALLERGEN_TAGS.map((tag) => {
                  const isSelected = form.selectedTags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      className={`tag-toggle-chip ${tag.type} ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleTag(tag.id)}
                      disabled={busy}
                    >
                      <span className="tag-icon">{tag.icon}</span>
                      <span className="tag-text">{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="safetyNotes" className="form-label">
                  Additional Safety / Reheating Instructions <span className="form-optional-tag">(Optional)</span>
                </label>
                <span className="form-hint-char">{form.safetyNotes.length}/1000</span>
              </div>
              <textarea
                id="safetyNotes"
                rows={3}
                maxLength={1000}
                placeholder="e.g. Reheat thoroughly to piping hot (>75°C) before serving. Suitable for immediate consumption."
                className="form-textarea"
                value={form.safetyNotes}
                onChange={(e) => set('safetyNotes', e.target.value)}
                disabled={busy}
              />
            </div>
          </div>

          {error && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-action-bar">
            <Link to="/listings/mine" className="btn-secondary-action">
              Save Draft & Exit
            </Link>

            <button
              type="submit"
              className="btn-primary-action"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Saving to Database…</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pickup Schedule</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
