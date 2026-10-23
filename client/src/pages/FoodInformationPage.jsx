import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  UtensilsCrossed,
  Camera,
  UploadCloud,
  Check,
  Clock,
  ShieldCheck,
  Thermometer,
  CheckCircle2,
  Trash2,
  Loader2,
  HeartHandshake
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

const COMMON_PORTION_UNITS = ['boxes', 'servings', 'packets', 'kg', 'platters', 'portions'];

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
  const location = useLocation();
  const { session } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [communityListing, setCommunityListing] = useState(() => location.state?.listing || null);
  const isCommunityListing = Boolean(communityListing);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({
    foodName: '',
    category: 'meals',
    description: '',
    photoUrl: '',
    quantity: '',
    portionUnit: '',
    preparedAt: toLocalDateTime(new Date()),
    pickupDeadline: defaultPickupDeadline(),
    storageDetails: '',
    foodCondition: 'fresh',
    useByAt: '',
    safetyNotes: '',
    selectedTags: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'url'

  const set = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    if (error) setError('');
  };

  useEffect(() => {
    // If route already passed community listing, display it directly
    if (communityListing) {
      setLoading(false);
      return;
    }

    if (!listingId || listingId === 'new') {
      // Direct access to food information form without prior draft ID
      setLoading(false);
      return;
    }

    // Fetch existing listing from server
    apiRequest(`/listings/${listingId}/information`, { token: session?.token })
      .then(({ listing, isOwner, isDraft }) => {
        if (!listing) throw new Error('Listing not found');

        // If it's a published community listing (available or closed), render the Food Safety Passport
        if (listing.status !== 'draft') {
          setCommunityListing(listing);
          return;
        }

        // If draft and user is not the owner
        if (isDraft && !isOwner) {
          setError('Only the creator can edit this food information draft.');
          return;
        }

        // Parse any tags from safetyNotes if present
        let parsedTags = [];
        let cleanNotes = listing.safetyNotes || '';
        const tagMatch = cleanNotes.match(/^\[Tags:\s*([^\]]+)\]\s*(.*)$/s);
        if (tagMatch) {
          parsedTags = tagMatch[1].split(',').map(t => t.trim().toLowerCase());
          cleanNotes = tagMatch[2];
        }

        const initialDeadline = listing.pickupDeadline || listing.pickupClosesAt;

        setForm({
          foodName: listing.foodName || '',
          category: listing.category || 'meals',
          description: listing.description || '',
          photoUrl: listing.photoUrl || '',
          quantity: listing.quantity !== undefined && listing.quantity !== null ? String(listing.quantity) : '',
          portionUnit: listing.portionUnit || '',
          preparedAt: toLocalDateTime(listing.preparedAt) || toLocalDateTime(new Date()),
          pickupDeadline: initialDeadline ? toLocalDateTime(initialDeadline) : defaultPickupDeadline(),
          storageDetails: listing.storageDetails || '',
          foodCondition: listing.foodCondition || 'fresh',
          useByAt: toLocalDateTime(listing.useByAt),
          safetyNotes: cleanNotes,
          selectedTags: parsedTags,
        });
      })
      .catch(e => {
        setError(e.message || 'Failed to load food information.');
      })
      .finally(() => setLoading(false));
  }, [communityListing, listingId, navigate, session?.token]);

  // Quick timestamp helpers
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

  // Toggle dietary & allergen tags
  const toggleTag = (tagId) => {
    setForm(prev => {
      const exists = prev.selectedTags.includes(tagId);
      const nextTags = exists
        ? prev.selectedTags.filter(t => t !== tagId)
        : [...prev.selectedTags, tagId];
      return { ...prev, selectedTags: nextTags };
    });
  };

  // Image File Handling
  const handleFileProcess = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Food photo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      set('photoUrl', e.target?.result);
    };
    reader.onerror = () => {
      setError('Could not process the selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const clearPhoto = () => {
    set('photoUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Client Validation
  const validateForm = () => {
    if (!form.foodName.trim()) {
      return 'Please specify the food or dish name.';
    }
    if (!form.description.trim()) {
      return 'Please enter a description for the food.';
    }
    const qtyNum = Number(form.quantity);
    if (!Number.isInteger(qtyNum) || qtyNum < 1) {
      return 'Quantity must be a whole positive number (at least 1).';
    }
    if (!form.portionUnit.trim()) {
      return 'Please specify a portion unit (e.g. boxes, servings, kg).';
    }
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

  // Form Submission
  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');

    // Format combined safety notes with selected tags
    const tagHeader = form.selectedTags.length > 0
      ? `[Tags: ${form.selectedTags.join(', ')}] `
      : '';
    const finalSafetyNotes = `${tagHeader}${form.safetyNotes.trim()}`.trim();

    try {
      let activeListingId = listingId;

      // If accessed without an existing listing draft, create one first
      if (!activeListingId || activeListingId === 'new') {
        const createPayload = {
          foodName: form.foodName.trim(),
          description: form.description.trim(),
          category: form.category,
          quantity: parseInt(form.quantity, 10),
          portionUnit: form.portionUnit.trim(),
          photoUrl: form.photoUrl || undefined,
          pickupDeadline: new Date(form.pickupDeadline).toISOString(),
          pickupClosesAt: new Date(form.pickupDeadline).toISOString(),
        };

        const createRes = await apiRequest('/listings', {
          token: session?.token,
          method: 'POST',
          body: JSON.stringify(createPayload),
        });

        if (!createRes?.listing?._id) {
          throw new Error('Could not initialize food listing draft on server.');
        }
        activeListingId = createRes.listing._id;
      }

      // Save Food Information (preparation date, storage condition, notes, + updated basics)
      const infoPayload = {
        foodName: form.foodName.trim(),
        category: form.category,
        description: form.description.trim(),
        quantity: parseInt(form.quantity, 10),
        portionUnit: form.portionUnit.trim(),
        photoUrl: form.photoUrl || '',
        preparedAt: new Date(form.preparedAt).toISOString(),
        pickupDeadline: new Date(form.pickupDeadline).toISOString(),
        pickupClosesAt: new Date(form.pickupDeadline).toISOString(),
        storageDetails: form.storageDetails.trim(),
        foodCondition: form.foodCondition,
        useByAt: form.useByAt ? new Date(form.useByAt).toISOString() : '',
        safetyNotes: finalSafetyNotes,
      };

      await apiRequest(`/listings/${activeListingId}/information`, {
        token: session?.token,
        method: 'PATCH',
        body: JSON.stringify(infoPayload),
      });

      // Proceed to Step 03: Pickup Scheduling
      navigate(`/listings/${activeListingId}/pickup`);
    } catch (e) {
      setError(e.message || 'Failed to save food safety information. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // Read-only View for Public/Community Listings
  if (isCommunityListing) {
    const listingData = communityListing || {};
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

            <div className="passport-actions-row">
              <button
                type="button"
                className="btn-food-action disabled"
                disabled
                aria-disabled="true"
                tabIndex={-1}
              >
                Pickup Food
              </button>
              <button
                type="button"
                className="btn-food-action disabled primary"
                disabled
                aria-disabled="true"
                tabIndex={-1}
              >
                Schedule Pickup
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const activeCategory = CATEGORIES.find(c => c.id === form.category) || CATEGORIES[0];
  const activeCondition = FOOD_CONDITIONS.find(c => c.id === form.foodCondition) || FOOD_CONDITIONS[0];

  return (
    <div className="food-info-view">
      {/* Top Header & Navigation */}
      <header className="food-info-header">
        <div className="food-info-nav-row">
          <Link
            to={listingId && listingId !== 'new' ? `/listings/new` : '/'}
            className="btn-back-link"
          >
            <ArrowLeft size={14} />
            <span>{listingId && listingId !== 'new' ? 'Edit Step 01 Overview' : 'Back to Community Feed'}</span>
          </Link>
          <span className="info-step-badge">
            <span className="badge-glow-dot" />
            Step 02 · Food Information & Safety
          </span>
        </div>

        <h1 className="food-info-title">Food Safety & Information Form</h1>
        <p className="food-info-subtitle">
          Specify preparation time, storage requirements, portion details, and dietary safety notes to guarantee transparent, safe community food distribution.
        </p>
      </header>

      {/* Progress Steps Indicator */}
      <div className="food-info-steps-wrap">
        <ListingSteps current="02" />
      </div>

      {loading ? (
        <div className="food-info-loading-panel" role="status" aria-live="polite">
          <Loader2 size={24} className="spinning" />
          <span>Loading listing safety records…</span>
        </div>
      ) : (
        <div className="food-info-grid">
          {/* Main Form Column */}
          <form className="food-info-form-panel" onSubmit={handleSubmit} noValidate>
            
            {/* Section 1: Food Identity & Category */}
            <div className="form-card-section">
              <div className="section-header-row">
                <div className="section-icon-wrap">
                  <UtensilsCrossed size={16} />
                </div>
                <div>
                  <h2 className="section-heading">Food Identity & Category</h2>
                  <p className="section-subtext">Clear names and correct categories help volunteers and community shelters quickly identify meals.</p>
                </div>
              </div>

              {/* Food Name Field */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="foodName" className="form-label">
                    Food / Dish Name <span className="req">*</span>
                  </label>
                  <span className="form-hint-char">{form.foodName.length}/120</span>
                </div>
                <input
                  id="foodName"
                  type="text"
                  required
                  maxLength={120}
                  placeholder="e.g. Chicken Dum Biryani with Boiled Eggs"
                  className="form-input"
                  value={form.foodName}
                  onChange={(e) => set('foodName', e.target.value)}
                  disabled={busy}
                />
              </div>

              {/* Category Radio Grid */}
              <div className="form-group">
                <label className="form-label">
                  Food Category <span className="req">*</span>
                </label>
                <div className="category-pill-grid" role="radiogroup" aria-label="Food category selector">
                  {CATEGORIES.map((cat) => {
                    const isSelected = form.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        role="radio"
                        aria-checked={isSelected}
                        className={`category-pill-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => set('category', cat.id)}
                        disabled={busy}
                      >
                        <span className="pill-icon">{cat.icon}</span>
                        <div className="pill-text-col">
                          <span className="pill-label">{cat.label}</span>
                          <span className="pill-hint">{cat.hint}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description Field */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="description" className="form-label">
                    Description & Packaging <span className="req">*</span>
                  </label>
                  <span className="form-hint-char">{form.description.length}/2000</span>
                </div>
                <textarea
                  id="description"
                  required
                  rows={3}
                  maxLength={2000}
                  placeholder="Describe ingredients, cooking style, packaging (e.g. sealed foil boxes), and who would benefit most..."
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Section 2: Quantity, Portions & Photo Upload */}
            <div className="form-card-section">
              <div className="section-header-row">
                <div className="section-icon-wrap">
                  <Camera size={16} />
                </div>
                <div>
                  <h2 className="section-heading">Quantity, Portions & Photo</h2>
                  <p className="section-subtext">Accurate portion units ensure receivers send the right transport vehicle or bags.</p>
                </div>
              </div>

              {/* Quantity and Portion Unit Row */}
              <div className="field-split-row">
                <div className="form-group">
                  <label htmlFor="quantity" className="form-label">
                    Quantity Portions <span className="req">*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="form-input"
                    value={form.quantity}
                    onChange={(e) => set('quantity', e.target.value)}
                    disabled={busy}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="portionUnit" className="form-label">
                    Portion Unit <span className="req">*</span>
                  </label>
                  <input
                    id="portionUnit"
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. boxes, servings, kg"
                    className="form-input"
                    value={form.portionUnit}
                    onChange={(e) => set('portionUnit', e.target.value)}
                    disabled={busy}
                  />
                  <div className="unit-chips-row">
                    {COMMON_PORTION_UNITS.map((unit) => (
                      <button
                        type="button"
                        key={unit}
                        className={`unit-chip ${form.portionUnit === unit ? 'active' : ''}`}
                        onClick={() => set('portionUnit', unit)}
                        disabled={busy}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Food Photo Upload & Media Section */}
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">
                    Food Photo <span className="form-optional-tag">(High recommendation)</span>
                  </label>
                  <div className="photo-mode-tabs">
                    <button
                      type="button"
                      className={`mode-tab-btn ${photoMode === 'upload' ? 'active' : ''}`}
                      onClick={() => setPhotoMode('upload')}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      className={`mode-tab-btn ${photoMode === 'url' ? 'active' : ''}`}
                      onClick={() => setPhotoMode('url')}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* File Upload Mode */}
                {photoMode === 'upload' && (
                  <div
                    className={`file-upload-dropzone ${isDragging ? 'dragging' : ''} ${form.photoUrl ? 'has-preview' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !form.photoUrl && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden-file-input"
                      onChange={(e) => handleFileProcess(e.target.files?.[0])}
                    />

                    {form.photoUrl ? (
                      <div className="upload-preview-container">
                        <img src={form.photoUrl} alt="Uploaded food preview" className="dropzone-preview-img" />
                        <div className="upload-preview-overlay">
                          <button
                            type="button"
                            className="btn-clear-photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearPhoto();
                            }}
                            title="Remove photo"
                          >
                            <Trash2 size={14} />
                            <span>Remove Photo</span>
                          </button>
                          <button
                            type="button"
                            className="btn-replace-photo"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                          >
                            Change Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-prompt">
                        <div className="dropzone-icon-circle">
                          <UploadCloud size={24} />
                        </div>
                        <p className="dropzone-text-primary">
                          <strong>Click to upload</strong> or drag and drop food photo here
                        </p>
                        <p className="dropzone-text-secondary">
                          PNG, JPG, or WebP up to 5MB · Clear photos increase pickup speed by 4x
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Image URL Mode */}
                {photoMode === 'url' && (
                  <div className="photo-url-input-wrap">
                    <input
                      type="url"
                      placeholder="https://images.example.com/food-donation.jpg"
                      className="form-input"
                      value={form.photoUrl}
                      onChange={(e) => set('photoUrl', e.target.value)}
                      disabled={busy}
                    />
                    {form.photoUrl && (
                      <button type="button" className="btn-clear-inline" onClick={clearPhoto}>
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Preparation Date & Time */}
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
                {/* Prepared At Input */}
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
                    <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(0)}>
                      Now
                    </button>
                    <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(1)}>
                      1h ago
                    </button>
                    <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(3)}>
                      3h ago
                    </button>
                    <button type="button" className="time-chip-btn" onClick={() => setQuickPrepTime(6)}>
                      6h ago
                    </button>
                  </div>
                </div>

                {/* Use By At Input */}
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
                    <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(12)}>
                      +12 hrs
                    </button>
                    <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(24)}>
                      +24 hrs
                    </button>
                    <button type="button" className="time-chip-btn" onClick={() => setQuickUseBy(48)}>
                      +48 hrs
                    </button>
                    {form.useByAt && (
                      <button type="button" className="time-chip-btn danger" onClick={() => set('useByAt', '')}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup Deadline Required Field */}
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
                  <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(2)}>
                    +2 hrs
                  </button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(4)}>
                    +4 hrs
                  </button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(8)}>
                    +8 hrs
                  </button>
                  <button type="button" className="time-chip-btn" onClick={() => setQuickDeadline(24)}>
                    Tomorrow (+24 hrs)
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Storage Conditions & Temperature */}
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

              {/* Food Condition Cards */}
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

              {/* Storage Details */}
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

            {/* Section 5: Safety Notes, Allergens & Dietary Requirements */}
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

              {/* Tag Chips Selection */}
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
                        {isSelected && <Check size={12} className="tag-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Safety Notes */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="safetyNotes" className="form-label">
                    Additional Safety & Reheating Notes <span className="form-optional-tag">(Optional)</span>
                  </label>
                  <span className="form-hint-char">{form.safetyNotes.length}/500</span>
                </div>
                <textarea
                  id="safetyNotes"
                  rows={2}
                  maxLength={500}
                  placeholder="e.g. Please reheat thoroughly before serving. Prepared in a nut-free commercial kitchen with sanitary gloves."
                  className="form-textarea"
                  value={form.safetyNotes}
                  onChange={(e) => set('safetyNotes', e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Error Feedback Banner */}
            {error && (
              <div className="form-error-banner" role="alert">
                <AlertCircle size={18} className="error-icon" />
                <div className="error-text-col">
                  <strong>Validation error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Submit Actions Bar */}
            <div className="form-actions-bar">
              <div className="actions-info-col">
                <ShieldCheck size={16} className="text-emerald" />
                <span>Step 2 information is verified prior to scheduling receiver pickups.</span>
              </div>
              <button
                type="submit"
                className="btn-submit-action"
                disabled={busy}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Saving Food Safety Details…</span>
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

          {/* Right Aside: Interactive Live Community Preview Passport */}
          <aside className="food-info-preview-col" aria-label="Surplus food live safety passport">
            <div className="preview-sticky-wrap">
              <div className="preview-card-header">
                <span className="preview-passport-badge">
                  <Sparkles size={13} />
                  <span>Live Safety Passport</span>
                </span>
                <span className="preview-live-pulse">
                  <span className="pulse-dot" />
                  Live Sync
                </span>
              </div>

              <article className="preview-passport-card">
                <div className="preview-photo-frame">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt={form.foodName || 'Food preview'}
                      className="preview-passport-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="preview-photo-fallback"
                    style={{ display: form.photoUrl ? 'none' : 'flex' }}
                  >
                    <span className="fallback-category-icon">{activeCategory.icon}</span>
                    <span className="fallback-text">{activeCategory.label}</span>
                  </div>

                  <span className="passport-pill-category">
                    {activeCategory.icon} {activeCategory.label}
                  </span>
                  <span className="passport-pill-condition">
                    {activeCondition.icon} {activeCondition.label}
                  </span>
                </div>

                <div className="preview-passport-content">
                  <h3 className={`passport-item-title ${!form.foodName ? 'placeholder' : ''}`}>
                    {form.foodName || 'Untitled Surplus Food Item'}
                  </h3>

                  <p className="passport-item-desc">
                    {form.description || 'Detailed food description, packaging, and ingredients will appear here...'}
                  </p>

                  <div className="passport-meta-row">
                    <span className="meta-portion-tag">
                      <UtensilsCrossed size={12} />
                      <span>{form.quantity || 1} {form.portionUnit || 'portions'}</span>
                    </span>
                  </div>

                  <DonorProfileSection
                    donor={{ name: session?.user?.name || 'You (Donor)', role: session?.user?.role || 'Member' }}
                    pickupLocation={session?.user?.location || 'Community Location'}
                    size="compact"
                    className="preview-donor-profile"
                  />

                  <div className="passport-safety-divider" />

                  {/* Safety & Preparation Snapshot */}
                  <div className="passport-safety-metrics">
                    <div className="safety-metric-item">
                      <Clock size={13} className="metric-icon" />
                      <div>
                        <span className="metric-label">Prepared</span>
                        <span className="metric-val">{formatRelativeTime(form.preparedAt)}</span>
                      </div>
                    </div>

                    <div className="safety-metric-item">
                      <Thermometer size={13} className="metric-icon" />
                      <div>
                        <span className="metric-label">Storage</span>
                        <span className="metric-val">{activeCondition.badge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pickup Deadline Live Preview Pill */}
                  {(() => {
                    const deadlineInfo = formatPickupDeadline(form.pickupDeadline, currentTime);
                    return (
                      <div className={`preview-deadline-badge ${deadlineInfo.isExpired ? 'expired' : 'active'}`}>
                        <Clock size={12} />
                        <span>{deadlineInfo.text}</span>
                      </div>
                    );
                  })()}

                  {/* Storage Details Callout */}
                  <div className="preview-storage-note">
                    <span className="note-title">Storage Instruction:</span>
                    <p className="note-body">{form.storageDetails || 'No specific storage details given.'}</p>
                  </div>

                  {/* Tags Row */}
                  {form.selectedTags.length > 0 && (
                    <div className="preview-tags-row">
                      {form.selectedTags.map((tagId) => {
                        const tagObj = DIETARY_ALLERGEN_TAGS.find(t => t.id === tagId);
                        if (!tagObj) return null;
                        return (
                          <span key={tagId} className={`preview-mini-tag ${tagObj.type}`}>
                            {tagObj.icon} {tagObj.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Food Action Buttons (Disabled for now) */}
                  <div className="passport-preview-actions-row">
                    <button
                      type="button"
                      className="btn-food-action disabled"
                      disabled
                      aria-disabled="true"
                      tabIndex={-1}
                    >
                      Pickup Food
                    </button>
                    <button
                      type="button"
                      className="btn-food-action disabled primary"
                      disabled
                      aria-disabled="true"
                      tabIndex={-1}
                    >
                      Schedule Pickup
                    </button>
                  </div>
                </div>
              </article>

              {/* Safety Compliance Checklist */}
              <div className="safety-checklist-card">
                <h4 className="checklist-heading">
                  <ShieldCheck size={14} className="text-emerald" />
                  <span>Safety Verification Checklist</span>
                </h4>
                <ul className="checklist-items">
                  <li className={form.foodName.trim() ? 'checked' : 'pending'}>
                    <CheckCircle2 size={13} />
                    <span>Food title and description declared</span>
                  </li>
                  <li className={form.preparedAt ? 'checked' : 'pending'}>
                    <CheckCircle2 size={13} />
                    <span>Preparation timestamp registered</span>
                  </li>
                  <li className={form.pickupDeadline && !formatPickupDeadline(form.pickupDeadline, currentTime).isExpired ? 'checked' : 'pending'}>
                    <CheckCircle2 size={13} />
                    <span>Pickup deadline set ({formatPickupDeadline(form.pickupDeadline, currentTime).text})</span>
                  </li>
                  <li className={form.storageDetails.trim() ? 'checked' : 'pending'}>
                    <CheckCircle2 size={13} />
                    <span>Temperature & storage conditions verified</span>
                  </li>
                  <li className={form.photoUrl ? 'checked' : 'optional'}>
                    <CheckCircle2 size={13} />
                    <span>Food photo verified ({form.photoUrl ? 'Included' : 'Optional'})</span>
                  </li>
                </ul>
              </div>

              <div className="preview-civic-card">
                <HeartHandshake size={16} className="civic-icon" />
                <p>
                  Transparent food information protects community health and eliminates food rescue delays in Dhaka.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
