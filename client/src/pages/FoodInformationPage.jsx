import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  Thermometer,
  Loader2,
  MapPin,
  CheckCircle2,
  Copy,
  Sparkles,
  Calendar,
  Info
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
    label: 'Fresh / Ambient',
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
    desc: 'Sealed dry goods, grains, or packaged food',
  },
];

const STORAGE_PRESETS = [
  'Sealed food-grade containers at room temperature',
  'Commercial refrigerator (1–4°C)',
  'Deep freezer (≤ -18°C)',
  'Hot holding warmer (>60°C)',
  'Clean bakery shelf in covered packaging',
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

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);

  const formatted = date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diffHours >= 0 && diffHours < 24) {
    if (diffHours === 0 && diffMins < 5) return `Just now (${formatted})`;
    if (diffHours === 0) return `${diffMins} mins ago (${formatted})`;
    return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago (${formatted})`;
  }
  return formatted;
}

function parseSafetyNotesAndTags(safetyNotes) {
  if (!safetyNotes) return { tags: [], notes: '' };
  const tagMatch = safetyNotes.match(/^\[Tags:\s*([^\]]+)\]\s*(.*)$/s);
  if (tagMatch) {
    const rawTags = tagMatch[1].split(',').map((t) => t.trim().toLowerCase());
    return {
      tags: rawTags,
      notes: tagMatch[2]?.trim() || '',
    };
  }
  return { tags: [], notes: safetyNotes.trim() };
}

function formatCollectionWindow(opensAt, closesAt, deadline) {
  const start = opensAt ? new Date(opensAt) : null;
  const end = closesAt ? new Date(closesAt) : (deadline ? new Date(deadline) : null);

  if (!end || isNaN(end.getTime())) {
    return {
      windowText: 'Collection schedule will be announced soon',
      isOpen: false,
      isExpired: false,
      urgencyText: 'Schedule pending confirmation',
    };
  }

  const now = new Date();
  const isExpired = end.getTime() <= now.getTime();
  const isOpen = start ? (now.getTime() >= start.getTime() && !isExpired) : !isExpired;

  const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  let windowText = '';
  if (start && !isNaN(start.getTime())) {
    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      windowText = `${start.toLocaleDateString([], dateOptions)} · ${start.toLocaleTimeString([], timeOptions)} – ${end.toLocaleTimeString([], timeOptions)}`;
    } else {
      windowText = `${start.toLocaleDateString([], dateOptions)}, ${start.toLocaleTimeString([], timeOptions)} – ${end.toLocaleDateString([], dateOptions)}, ${end.toLocaleTimeString([], timeOptions)}`;
    }
  } else {
    windowText = `Available until ${end.toLocaleDateString([], dateOptions)}, ${end.toLocaleTimeString([], timeOptions)}`;
  }

  let urgencyText = '';
  if (isExpired) {
    urgencyText = 'Pickup window closed';
  } else if (isOpen) {
    const diffMs = end.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    if (diffHours > 0) {
      urgencyText = `Open now · Closes in ${diffHours}h ${diffMins}m`;
    } else {
      urgencyText = `Open now · Closes in ${diffMins} mins`;
    }
  } else if (start && now.getTime() < start.getTime()) {
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    if (diffHours > 0) {
      urgencyText = `Opens in ${diffHours}h ${diffMins}m`;
    } else {
      urgencyText = `Opens in ${diffMins} mins`;
    }
  }

  return { windowText, isOpen, isExpired, urgencyText };
}

export default function FoodInformationPage() {
  const { listingId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [listing, setListing] = useState(() => location.state?.listing || null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(() => !location.state?.listing);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [form, setForm] = useState({
    preparedAt: toLocalDateTime(new Date()),
    storageDetails: '',
    foodCondition: 'fresh',
    useByAt: '',
    safetyNotes: '',
    selectedTags: [],
  });

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  useEffect(() => {
    if (!listingId || listingId === 'new') {
      navigate('/listings/new', { replace: true });
      return;
    }

    let isMounted = true;
    if (!listing) setLoading(true);
    setError('');

    apiRequest(`/listings/${listingId}/information`, { token: session?.token })
      .then((data) => {
        if (!isMounted) return;
        if (!data?.listing) throw new Error('Listing not found in database.');
        const dbListing = data.listing;
        setListing(dbListing);
        setIsOwner(Boolean(data.isOwner));

        if (dbListing.status === 'draft') {
          if (!data.isOwner) {
            setError('Only the listing creator can access draft food information.');
            return;
          }

          const { tags, notes } = parseSafetyNotesAndTags(dbListing.safetyNotes);

          setForm({
            preparedAt: toLocalDateTime(dbListing.preparedAt) || toLocalDateTime(new Date()),
            storageDetails: dbListing.storageDetails || '',
            foodCondition: dbListing.foodCondition || 'fresh',
            useByAt: toLocalDateTime(dbListing.useByAt),
            safetyNotes: notes,
            selectedTags: tags,
          });
        }
      })
      .catch((e) => {
        if (!isMounted) return;
        setError(e.message || 'Failed to load food information from server.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [listingId, navigate, session?.token]);

  const setQuickPrepTime = (offsetHours = 0) => {
    const target = new Date(Date.now() - offsetHours * 3600000);
    setField('preparedAt', toLocalDateTime(target));
  };

  const setQuickUseBy = (addHours = 24) => {
    const baseTime = form.preparedAt ? new Date(form.preparedAt).getTime() : Date.now();
    const target = new Date(baseTime + addHours * 3600000);
    setField('useByAt', toLocalDateTime(target));
  };

  const toggleTag = (tagId) => {
    setForm((prev) => {
      const exists = prev.selectedTags.includes(tagId);
      const nextTags = exists
        ? prev.selectedTags.filter((t) => t !== tagId)
        : [...prev.selectedTags, tagId];
      return { ...prev, selectedTags: nextTags };
    });
  };

  const copyAddressToClipboard = (addressText) => {
    if (!addressText) return;
    navigator.clipboard.writeText(addressText).then(() => {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2400);
    });
  };

  const validateForm = () => {
    if (!form.preparedAt) {
      return 'Please specify when this surplus food was prepared.';
    }
    const prepDate = new Date(form.preparedAt);
    if (isNaN(prepDate.getTime())) {
      return 'Enter a valid preparation date and time.';
    }
    if (!form.foodCondition) {
      return 'Please select the current storage condition.';
    }
    if (!form.storageDetails.trim()) {
      return 'Please specify storage handling details (e.g. Kept chilled in refrigerator at 4°C).';
    }
    if (form.useByAt && new Date(form.useByAt) <= new Date(form.preparedAt)) {
      return 'The use-by / expiry time must be after the preparation time.';
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

      // Proceed immediately to Step 3 (Pickup Schedule)
      navigate(`/listings/${listingId}/pickup`);
    } catch (e) {
      setError(e.message || 'Failed to save food safety information. Please check your network and try again.');
    } finally {
      setBusy(false);
    }
  }

  // Loading Screen
  if (loading && !listing) {
    return (
      <main className="food-info-view community-passport-container" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="food-info-loading-panel" role="status" aria-live="polite">
          <Loader2 size={26} className="spinning" />
          <span>Loading verified food safety records from server…</span>
        </div>
      </main>
    );
  }

  // Error Screen without cached listing
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

  // ==========================================
  // RECEIVER & PUBLIC VIEW: DETAILED PASSPORT
  // ==========================================
  if (listing && listing.status !== 'draft') {
    const listingData = listing;
    const categoryObj = CATEGORIES.find((c) => c.id === listingData.category) || CATEGORIES[0];
    const conditionObj = FOOD_CONDITIONS.find((c) => c.id === listingData.foodCondition) || FOOD_CONDITIONS[0];
    const { tags: parsedTags, notes: cleanNotes } = parseSafetyNotesAndTags(listingData.safetyNotes);
    const { windowText, isOpen, isExpired, urgencyText } = formatCollectionWindow(
      listingData.pickupOpensAt,
      listingData.pickupClosesAt,
      listingData.pickupDeadline
    );

    const fullPickupLocation = listingData.pickupLocation || 'Community Pickup Location (Dhaka)';

    return (
      <main className="food-info-view community-passport-container">
        {/* Navigation Bar */}
        <div className="passport-top-nav">
          <Link className="btn-back-link" to="/">
            <ArrowLeft size={15} />
            <span>Back to Community Feed</span>
          </Link>
          <div className="passport-status-group">
            {isExpired ? (
              <span className="badge-status-closed">
                <Clock size={12} />
                <span>Pickup Closed</span>
              </span>
            ) : isOpen ? (
              <span className="badge-status-open">
                <span className="badge-glow-dot" />
                <span>Available for Pickup</span>
              </span>
            ) : (
              <span className="badge-status-pending">
                <Clock size={12} />
                <span>Scheduled Collection</span>
              </span>
            )}
            <span className="badge-verified-passport">
              <ShieldCheck size={13} />
              <span>Food Safety Verified</span>
            </span>
          </div>
        </div>

        {/* Main Passport Card */}
        <div className="community-passport-card">
          {/* Media Header Banner */}
          <div className="passport-media-banner">
            {listingData.photoUrl ? (
              <img
                src={listingData.photoUrl}
                alt={listingData.foodName}
                className="passport-img"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="passport-placeholder-banner"
              style={{ display: listingData.photoUrl ? 'none' : 'flex' }}
            >
              <UtensilsCrossed size={52} />
              <span>Verified Community Surplus Food</span>
            </div>

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
            {/* Title & Portion Header */}
            <div className="passport-header-section">
              <div className="passport-title-row">
                <h1 className="passport-title">{listingData.foodName || 'Community Surplus Food'}</h1>
                <span className="passport-portion-badge">
                  <UtensilsCrossed size={14} />
                  <span>{listingData.quantity || 1} {listingData.portionUnit || 'portions'}</span>
                </span>
              </div>

              {listingData.description && (
                <p className="passport-description">{listingData.description}</p>
              )}
            </div>

            {/* Collection Window & Pickup Card (CRUCIAL FOR RECEIVERS) */}
            <section className="passport-schedule-card" aria-label="Pickup schedule and location">
              <div className="schedule-card-header">
                <div className="schedule-header-title">
                  <MapPin size={18} className="schedule-header-icon" />
                  <div>
                    <h2 className="schedule-card-heading">Pickup Schedule & Collection Location</h2>
                    <p className="schedule-card-sub">Collect directly from the verified community donor during this timeframe.</p>
                  </div>
                </div>
                <span className={`schedule-urgency-badge ${isExpired ? 'expired' : isOpen ? 'open' : 'upcoming'}`}>
                  <Clock size={13} />
                  <span>{urgencyText}</span>
                </span>
              </div>

              <div className="schedule-grid">
                <div className="schedule-item-box">
                  <div className="schedule-item-label">
                    <Calendar size={13} />
                    <span>Collection Window</span>
                  </div>
                  <strong className="schedule-item-val">{windowText}</strong>
                  <span className="schedule-item-hint">
                    {isExpired
                      ? 'The donor has marked this collection window as closed.'
                      : 'Please arrive within this scheduled window to receive surplus food.'}
                  </span>
                </div>

                <div className="schedule-item-box">
                  <div className="schedule-item-label">
                    <MapPin size={13} />
                    <span>Pickup Address</span>
                  </div>
                  <strong className="schedule-item-val">{fullPickupLocation}</strong>
                  <button
                    type="button"
                    className="btn-copy-address"
                    onClick={() => copyAddressToClipboard(fullPickupLocation)}
                    title="Copy address to clipboard"
                  >
                    {copiedAddress ? (
                      <>
                        <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                        <span style={{ color: '#34d399' }}>Address Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Food Safety & Freshness Passport */}
            <section className="passport-safety-card" aria-label="Food safety verification">
              <div className="safety-card-header">
                <ShieldCheck size={18} className="safety-header-icon" />
                <div>
                  <h2 className="safety-card-heading">Food Freshness & Quality Passport</h2>
                  <p className="safety-card-sub">Standardized food safety verification for transparent receiver protection.</p>
                </div>
              </div>

              <div className="safety-stats-grid">
                <div className="safety-stat-cell">
                  <span className="cell-label">Prepared At</span>
                  <strong className="cell-val">
                    {listingData.preparedAt ? formatRelativeTime(listingData.preparedAt) : 'Freshly prepared today'}
                  </strong>
                </div>

                <div className="safety-stat-cell">
                  <span className="cell-label">Storage Verification</span>
                  <strong className="cell-val">{conditionObj.badge}</strong>
                </div>

                {listingData.useByAt && (
                  <div className="safety-stat-cell">
                    <span className="cell-label">Best Before / Expiry</span>
                    <strong className="cell-val">{formatRelativeTime(listingData.useByAt)}</strong>
                  </div>
                )}

                <div className="safety-stat-cell">
                  <span className="cell-label">Portions Available</span>
                  <strong className="cell-val">{listingData.quantity} {listingData.portionUnit}</strong>
                </div>
              </div>

              {/* Storage Handling Details */}
              <div className="storage-handling-row">
                <Thermometer size={16} className="handling-icon" />
                <div className="handling-text">
                  <strong className="handling-title">Storage Environment & Packaging:</strong>
                  <p className="handling-desc">
                    {listingData.storageDetails || 'Maintained in sealed sanitary packaging under standard preservation conditions.'}
                  </p>
                </div>
              </div>

              {/* Dietary & Allergen Tags */}
              {parsedTags.length > 0 && (
                <div className="dietary-tags-container">
                  <span className="dietary-section-label">Dietary Attributes & Allergen Disclosures:</span>
                  <div className="dietary-tags-row">
                    {parsedTags.map((tagId) => {
                      const matched = DIETARY_ALLERGEN_TAGS.find((t) => t.id === tagId);
                      return (
                        <span key={tagId} className={`passport-tag-pill ${matched?.type || 'dietary'}`}>
                          <span>{matched?.icon || '🏷️'}</span>
                          <span>{matched?.label || tagId}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reheating / Safety Instructions */}
              {cleanNotes && (
                <div className="clean-notes-row">
                  <InfoNotesIcon />
                  <div className="clean-notes-content">
                    <strong>Reheating & Consumption Guidelines:</strong>
                    <p>{cleanNotes}</p>
                  </div>
                </div>
              )}
            </section>

            {/* Donor Profile & Contact Card */}
            <section className="passport-donor-card">
              <DonorProfileSection
                donor={listingData.donor}
                pickupLocation={listingData.pickupLocation}
                size="prominent"
                className="passport-donor-profile"
              />

              {session?.user?.role === 'donor' && !isOwner && (
                <div className="donor-role-notice">
                  <Info size={16} className="donor-notice-icon" />
                  <div className="donor-notice-content">
                    <span className="donor-notice-title">Viewing as Community Donor</span>
                    <p className="donor-notice-text">
                      You are signed in with a Donor account. Donors can publish surplus meals and view the community feed, but cannot request or receive food donations.
                    </p>
                  </div>
                </div>
              )}

              <div className="passport-action-buttons">
                <Link to="/" className="btn-secondary-action">
                  <ArrowLeft size={14} />
                  <span>Back to Community Feed</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // DONOR DRAFT MODE: FOOD SAFETY INPUT FORM
  // ==========================================
  const categoryObj = CATEGORIES.find((c) => c.id === listing?.category) || CATEGORIES[0];

  return (
    <div className="food-info-view">
      {/* Step Header */}
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

        <h1 className="food-info-title">Food Safety & Quality Details</h1>
        <p className="food-info-subtitle">
          Specify when this surplus food was cooked, how it is preserved, and any dietary safety notes. (Pickup schedule and location will be configured in Step 3).
        </p>
      </header>

      {/* Progress Stepper */}
      <div className="food-info-steps-wrap">
        <ListingSteps current="02" />
      </div>

      <div className="food-info-grid">
        <form className="food-info-form-panel" onSubmit={handleSubmit} noValidate>
          {/* Step 1 Overview Summary Card */}
          {listing && (
            <div className="form-card-section food-summary-card">
              <div className="summary-card-inner">
                {listing.photoUrl ? (
                  <img src={listing.photoUrl} alt={listing.foodName} className="summary-thumb" loading="lazy" decoding="async" />
                ) : (
                  <div className="summary-thumb" style={{ display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }}>
                    <UtensilsCrossed size={24} style={{ color: '#94a3b8' }} />
                  </div>
                )}
                <div className="summary-info-col">
                  <span className="summary-badge">Draft Surplus · Step 01 Saved</span>
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

          {/* Section: Preparation Time & Optional Expiry */}
          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="section-heading">Preparation Date & Time</h2>
                <p className="section-subtext">Essential for determining consumption safety windows and freshness for receivers.</p>
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
                  onChange={(e) => setField('preparedAt', e.target.value)}
                  disabled={busy}
                />
                <div className="quick-time-chips">
                  <span className="chips-hint-text">Quick set:</span>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(0)}>Now (Just Made)</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(1)}>1h ago</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(3)}>3h ago</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(6)}>6h ago</button>
                </div>
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="useByAt" className="form-label">
                    Use-by / Expiry Time <span className="form-optional-tag">(Optional)</span>
                  </label>
                </div>
                <input
                  id="useByAt"
                  type="datetime-local"
                  className="form-input"
                  value={form.useByAt}
                  onChange={(e) => setField('useByAt', e.target.value)}
                  disabled={busy}
                />
                <div className="quick-time-chips">
                  <span className="chips-hint-text">Set expiry:</span>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(12)}>+12 hrs</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(24)}>+24 hrs</button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(48)}>+48 hrs</button>
                  {form.useByAt && (
                    <button type="button" className="time-chip-btn danger" onClick={() => setField('useByAt', '')}>Clear</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Storage Condition & Packaging */}
          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <Thermometer size={16} />
              </div>
              <div>
                <h2 className="section-heading">Storage Condition & Packaging</h2>
                <p className="section-subtext">Select how this food is maintained to ensure sanitary handover.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Storage Environment <span className="req">*</span>
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
                      onClick={() => setField('foodCondition', cond.id)}
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
                placeholder="e.g. Kept in commercial refrigerator at 4°C in sealed containers"
                className="form-input"
                value={form.storageDetails}
                onChange={(e) => setField('storageDetails', e.target.value)}
                disabled={busy}
              />

              {/* Quick Storage Presets */}
              <div className="storage-preset-row">
                <span className="chips-hint-text">Quick select:</span>
                {STORAGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="storage-preset-chip"
                    onClick={() => setField('storageDetails', preset)}
                    disabled={busy}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Dietary Attributes & Safety Notes */}
          <div className="form-card-section">
            <div className="section-header-row">
              <div className="section-icon-wrap">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h2 className="section-heading">Dietary Certifications & Allergen Disclosures</h2>
                <p className="section-subtext">Helps receivers with specific diets, religious observances, or allergies consume safely.</p>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Select Applicable Dietary & Allergen Tags
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
                  Reheating & Serving Notes <span className="form-optional-tag">(Optional)</span>
                </label>
                <span className="form-hint-char">{form.safetyNotes.length}/1000</span>
              </div>
              <textarea
                id="safetyNotes"
                rows={3}
                maxLength={1000}
                placeholder="e.g. Reheat thoroughly to piping hot (>75°C) before consuming. Best enjoyed within 2 hours of pickup."
                className="form-textarea"
                value={form.safetyNotes}
                onChange={(e) => setField('safetyNotes', e.target.value)}
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

          {/* Form Action Buttons */}
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
                  <span>Saving Food Information…</span>
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

function InfoNotesIcon() {
  return (
    <div style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }}>
      <Sparkles size={16} />
    </div>
  );
}
