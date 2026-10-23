import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowLeft,
    Sparkles,
    AlertCircle,
    Info,
    UtensilsCrossed,
    Camera,
    Clock,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import ListingSteps from '../components/ListingSteps.jsx';
import DonorProfileSection from '../components/DonorProfileSection.jsx';
import './FoodListingPage.css';

const CATEGORIES = [
    { id: 'meals', label: 'Cooked Meals', icon: '🍲', hint: 'Rice dishes, curries, stews' },
    { id: 'bakery', label: 'Artisan Bakery', icon: '🥖', hint: 'Breads, parathas, snacks' },
    { id: 'fruits', label: 'Fresh Fruits', icon: '🍎', hint: 'Seasonal fruits, bananas, apples' },
    { id: 'produce', label: 'Vegetables & Greens', icon: '🥗', hint: 'Fresh vegetables, greens, herbs' },
    { id: 'dairy', label: 'Dairy & Sweets', icon: '🥛', hint: 'Sweets, misti, milk, yogurt' },
    { id: 'packaged', label: 'Packaged & Pantry', icon: '🥫', hint: 'Canned food, grains, lentils' },
    { id: 'beverages', label: 'Beverages', icon: '🧃', hint: 'Juices, water, teas, drinks' },
    { id: 'other', label: 'Other Surplus', icon: '📦', hint: 'Assorted community items' },
];

const COMMON_UNITS = ['boxes', 'servings', 'packets', 'kg', 'platters'];

const PHOTO_PRESETS = [
    { label: 'Warm Meal', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=720&auto=format&fit=crop&q=80' },
    { label: 'Biryani / Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=720&auto=format&fit=crop&q=80' },
    { label: 'Artisan Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=720&auto=format&fit=crop&q=80' },
    { label: 'Fresh Fruits', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=720&auto=format&fit=crop&q=80' },
    { label: 'Vegetables', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=720&auto=format&fit=crop&q=80' },
    { label: 'Dairy & Sweets', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=720&auto=format&fit=crop&q=80' },
    { label: 'Beverages', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=720&auto=format&fit=crop&q=80' },
];

export default function FoodListingPage() {
    const { session } = useAuth();
    const navigate = useNavigate();

    const defaultDeadline = () => {
        const d = new Date(Date.now() + 4 * 3600000);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    };

    const [form, setForm] = useState({
        foodName: '',
        category: 'meals',
        quantity: '10',
        portionUnit: 'boxes',
        pickupDeadline: defaultDeadline(),
        description: '',
        photoUrl: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const validateForm = () => {
        if (!form.foodName.trim()) {
            return 'Please provide a clear title or name for the surplus food.';
        }
        if (!form.description.trim()) {
            return 'Please write a brief description with packaging or ingredient details.';
        }
        const qtyNum = Number(form.quantity);
        if (!Number.isInteger(qtyNum) || qtyNum < 1) {
            return 'Quantity must be a whole positive number (at least 1).';
        }
        if (!form.portionUnit.trim()) {
            return 'Please specify the portion unit (e.g. boxes, servings, kg).';
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
        if (form.photoUrl && !/^https?:\/\//i.test(form.photoUrl.trim())) {
            return 'Photo URL must begin with http:// or https://.';
        }
        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const clientError = validateForm();
        if (clientError) {
            setErrorMessage(clientError);
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const payload = {
                foodName: form.foodName.trim(),
                description: form.description.trim(),
                category: form.category,
                quantity: parseInt(form.quantity, 10),
                portionUnit: form.portionUnit.trim(),
                photoUrl: form.photoUrl.trim() || undefined,
                pickupDeadline: new Date(form.pickupDeadline).toISOString(),
                pickupClosesAt: new Date(form.pickupDeadline).toISOString(),
            };

            const data = await apiRequest('/listings', {
                token: session?.token,
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (data?.listing?._id) {
                // Smooth transition to Step 02: Food Information
                navigate(`/listings/${data.listing._id}/information`);
            } else {
                throw new Error('Listing draft could not be verified by the server.');
            }
        } catch (error) {
            setErrorMessage(error.message || 'Failed to create food listing. Please check your network and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const activeCategoryItem = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0];

    return (
        <div className="create-listing-view">
            {/* Header with Navigation and Context */}
            <header className="create-listing-header">
                <div className="create-listing-nav-row">
                    <Link to="/" className="btn-back-link">
                        <ArrowLeft size={14} />
                        <span>Back to Community Feed</span>
                    </Link>
                    <span className="listing-draft-badge">
                        <span className="listing-draft-dot" />
                        Step 01 · Draft Creation
                    </span>
                </div>
                <h1 className="create-listing-title">Share Surplus Food</h1>
                <p className="create-listing-subtitle">
                    List surplus food to connect with community members, shelters, and volunteers.
                </p>
            </header>

            {/* Step Progress Tracker */}
            <div className="create-listing-steps-wrap">
                <ListingSteps current="01" />
            </div>

            {/* Main Console Layout */}
            <div className="create-listing-grid">
                {/* Left: Input Form Card */}
                <form className="listing-form-card" onSubmit={handleSubmit} noValidate>
                    <div className="form-section-title">
                        <Sparkles size={14} />
                        <span>Food Overview</span>
                    </div>

                    {/* Food Name Field */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="foodName" className="form-label">
                                Dish or Food Name <span className="req">*</span>
                            </label>
                            <span className="form-hint-char">{form.foodName.length}/120</span>
                        </div>
                        <input
                            id="foodName"
                            type="text"
                            required
                            maxLength={120}
                            placeholder="e.g. Fresh Vegetable Khichuri with Egg Curry"
                            className="form-input"
                            value={form.foodName}
                            onChange={(e) => handleChange('foodName', e.target.value)}
                            disabled={submitting}
                            autoFocus
                        />
                    </div>

                    {/* Category Selector */}
                    <div className="form-group">
                        <label className="form-label">
                            Food Category <span className="req">*</span>
                        </label>
                        <div className="category-pill-grid" role="radiogroup" aria-label="Food category">
                            {CATEGORIES.map((cat) => {
                                const isSelected = form.category === cat.id;
                                return (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        role="radio"
                                        aria-checked={isSelected}
                                        className={`category-choice-btn ${isSelected ? 'active' : ''}`}
                                        onClick={() => handleChange('category', cat.id)}
                                        disabled={submitting}
                                    >
                                        <span className="category-choice-icon">{cat.icon}</span>
                                        <span className="category-choice-label">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quantity & Portion Unit Row */}
                    <div className="quantity-portion-grid">
                        <div className="form-group">
                            <label htmlFor="quantity" className="form-label">
                                Quantity <span className="req">*</span>
                            </label>
                            <input
                                id="quantity"
                                type="number"
                                min="1"
                                step="1"
                                required
                                className="form-input"
                                value={form.quantity}
                                onChange={(e) => handleChange('quantity', e.target.value)}
                                disabled={submitting}
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
                                onChange={(e) => handleChange('portionUnit', e.target.value)}
                                disabled={submitting}
                            />
                            <div className="portion-unit-chips">
                                {COMMON_UNITS.map((unit) => (
                                    <button
                                        type="button"
                                        key={unit}
                                        className={`chip-unit-btn ${form.portionUnit === unit ? 'active' : ''}`}
                                        onClick={() => handleChange('portionUnit', unit)}
                                        disabled={submitting}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pickup Deadline Required Field */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="pickupDeadline" className="form-label">
                                Pickup Deadline <span className="req">*</span>
                            </label>
                            <span className="form-hint-char">Do not allow deadline in the past</span>
                        </div>
                        <input
                            id="pickupDeadline"
                            type="datetime-local"
                            required
                            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                            className="form-input"
                            value={form.pickupDeadline}
                            onChange={(e) => handleChange('pickupDeadline', e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    {/* Description Field */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="description" className="form-label">
                                Detailed Description <span className="req">*</span>
                            </label>
                            <span className="form-hint-char">{form.description.length}/2000</span>
                        </div>
                        <textarea
                            id="description"
                            required
                            maxLength={2000}
                            rows={3}
                            placeholder="Describe ingredients, packaging (e.g. sealed foil boxes), and approximate dietary details..."
                            className="form-textarea"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    {/* Photo URL & Presets */}
                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="photoUrl" className="form-label">
                                Photo Image Link <span className="form-hint-char">(optional)</span>
                            </label>
                        </div>
                        <input
                            id="photoUrl"
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            className="form-input"
                            value={form.photoUrl}
                            onChange={(e) => handleChange('photoUrl', e.target.value)}
                            disabled={submitting}
                        />
                        <div className="photo-presets-row">
                            <span className="photo-preset-label">Quick sample photos:</span>
                            {PHOTO_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset.label}
                                    className="photo-preset-btn"
                                    onClick={() => handleChange('photoUrl', preset.url)}
                                    disabled={submitting}
                                >
                                    {preset.label}
                                </button>
                            ))}
                            {form.photoUrl && (
                                <button
                                    type="button"
                                    className="photo-preset-btn"
                                    style={{ color: '#f87171' }}
                                    onClick={() => handleChange('photoUrl', '')}
                                    disabled={submitting}
                                >
                                    Clear Photo
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className="form-feedback-error" role="alert">
                            <AlertCircle size={16} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Actions Bar */}
                    <div className="listing-actions-bar">
                        <p className="actions-note">
                            Step 1 creates a safe draft. You will specify preparation times and storage in Step 2.
                        </p>
                        <button type="submit" className="btn-submit-step" disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 size={16} className="spinning" />
                                    <span>Saving draft…</span>
                                </>
                            ) : (
                                <>
                                    <span>Continue to Food Info</span>
                                    <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Right: Live Interactive Card Preview */}
                <aside className="listing-preview-col" aria-label="Surplus listing live preview">
                    <div className="preview-col-heading">
                        <span className="preview-badge-label">
                            <Sparkles size={13} />
                            <span>Live Community Preview</span>
                        </span>
                        <span className="preview-hint">Updates as you type</span>
                    </div>

                    <article className="preview-card-wrap">
                        <div className="preview-photo-box">
                            {form.photoUrl ? (
                                <img
                                    src={form.photoUrl}
                                    alt={form.foodName || 'Surplus food preview'}
                                    className="preview-img"
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
                                <Camera size={28} />
                                <span>No photo provided (placeholder will be shown)</span>
                            </div>

                            <span className="preview-tag-category">
                                {activeCategoryItem.icon} {activeCategoryItem.label}
                            </span>
                            <span className="preview-tag-condition">
                                ⚡ Freshly listed
                            </span>
                        </div>

                        <div className="preview-body">
                            <h3 className={`preview-title ${!form.foodName ? 'placeholder' : ''}`}>
                                {form.foodName || 'Untitled Surplus Food Donation'}
                            </h3>
                            <p className="preview-desc">
                                {form.description || 'Provide a brief description of food contents, preparation style, and packaging to help receivers.'}
                            </p>

                            <div className="preview-meta-row">
                                <span className="preview-portion-pill">
                                    <UtensilsCrossed size={12} />
                                    <span>{form.quantity || 1} {form.portionUnit || 'portions'}</span>
                                </span>
                            </div>

                            <DonorProfileSection
                                donor={{ name: session?.user?.name || 'You (Donor)', role: session?.user?.role || 'Member' }}
                                pickupLocation="Your Community Location"
                                size="compact"
                                className="preview-donor-profile"
                            />

                            {form.pickupDeadline && (
                                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ff945e', fontWeight: 650 }}>
                                    <Clock size={12} />
                                    <span>
                                        {new Date(form.pickupDeadline) <= new Date()
                                            ? 'Pickup closed'
                                            : `Pickup before ${new Date(form.pickupDeadline).getDate()} ${new Date(form.pickupDeadline).toLocaleString('en-US', { month: 'long' })}, ${new Date(form.pickupDeadline).getFullYear()}, ${new Date(form.pickupDeadline).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </article>

                    <div className="preview-next-tip">
                        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                            After saving this overview, you will provide food safety preparation details and collection timeframes.
                        </span>
                    </div>
                </aside>
            </div>
        </div>
    );
}
