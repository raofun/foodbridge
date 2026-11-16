import { useState, useEffect, useRef } from 'react';
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
    Loader2,
    Upload,
    Link2,
    X,
    CheckCircle2
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
    { label: '🍲 Warm Meal', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🍛 Biryani / Rice', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🥖 Artisan Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🍎 Fresh Fruits', url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🥗 Vegetables', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🥛 Dairy & Sweets', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
    { label: '🧃 Beverages', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=480&h=320&auto=format&fit=crop&q=70&fm=webp' },
];

export default function FoodListingPage() {
    const { session } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (session?.user?.role === 'receiver') {
            navigate('/', { replace: true });
        }
    }, [session, navigate]);

    if (session?.user?.role === 'receiver') {
        return null;
    }

    const [form, setForm] = useState({
        foodName: '',
        category: 'meals',
        quantity: '10',
        portionUnit: 'boxes',
        description: '',
        photoUrl: '',
    });

    const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'url'
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [uploadedFileSize, setUploadedFileSize] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errorMessage) setErrorMessage('');
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file (JPEG, PNG, WEBP).');
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setUploadError('Selected image exceeds 15MB limit. Please choose a smaller photo.');
            return;
        }

        setUploadError('');
        setIsProcessingFile(true);

        const reader = new FileReader();
        reader.onload = (event) => {
            const rawDataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                // High-performance canvas downsampling and compact compression
                const maxDim = 800;
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Compact compression: WebP where available, with JPEG fallback
                let optimizedDataUrl = '';
                try {
                    const webpUrl = canvas.toDataURL('image/webp', 0.72);
                    optimizedDataUrl = webpUrl.startsWith('data:image/webp') ? webpUrl : canvas.toDataURL('image/jpeg', 0.72);
                } catch {
                    optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.72);
                }

                const base64Length = optimizedDataUrl.length - (optimizedDataUrl.indexOf(',') + 1);
                const compressedBytes = (base64Length * 3) / 4;
                const compressedKb = Math.round(compressedBytes / 1024);
                const compressedFormatted = compressedBytes > 1024 * 1024
                    ? `${(compressedBytes / (1024 * 1024)).toFixed(1)} MB`
                    : `${compressedKb} KB`;

                const savings = Math.max(0, Math.round(((file.size - compressedBytes) / file.size) * 100));
                const sizeLabel = savings > 10
                    ? `${compressedFormatted} · compressed (-${savings}%)`
                    : `${compressedFormatted} · compressed & optimized`;

                handleChange('photoUrl', optimizedDataUrl);
                setUploadedFileName(file.name);
                setUploadedFileSize(sizeLabel);
                setIsProcessingFile(false);
            };
            img.onerror = () => {
                setUploadError('Unable to process this image. Please try another image file.');
                setIsProcessingFile(false);
            };
            img.src = rawDataUrl;
        };
        reader.onerror = () => {
            setUploadError('Failed to read image file from your device.');
            setIsProcessingFile(false);
        };
        reader.readAsDataURL(file);
    };

    const clearPhoto = () => {
        handleChange('photoUrl', '');
        setUploadedFileName('');
        setUploadedFileSize('');
        setUploadError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSelectPreset = (presetUrl) => {
        setUploadedFileName('');
        setUploadedFileSize('');
        setUploadError('');
        handleChange('photoUrl', presetUrl);
    };

    const validateForm = () => {
        if (!form.foodName.trim()) {
            return 'Please provide a clear title or name for the surplus food.';
        }
        const qtyNum = Number(form.quantity);
        if (!Number.isInteger(qtyNum) || qtyNum < 1) {
            return 'Quantity must be a whole positive number (at least 1).';
        }
        if (!form.portionUnit.trim()) {
            return 'Please specify the portion unit (e.g. boxes, servings, kg).';
        }
        if (form.photoUrl && !/^https?:\/\//i.test(form.photoUrl.trim()) && !/^data:image\//i.test(form.photoUrl.trim())) {
            return 'Photo must be a valid image link (http/https) or an uploaded image file.';
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
            };

            const data = await apiRequest('/listings', {
                token: session?.token,
                method: 'POST',
                body: JSON.stringify(payload),
            });

            if (data?.listing?._id) {
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

            <div className="create-listing-steps-wrap">
                <ListingSteps current="01" />
            </div>

            <div className="create-listing-grid">
                <form className="listing-form-card" onSubmit={handleSubmit} noValidate>
                    <div className="form-section-title">
                        <Sparkles size={14} />
                        <span>Food Overview</span>
                    </div>

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

                    <div className="form-group">
                        <div className="form-label-row">
                            <label htmlFor="description" className="form-label">
                                Detailed Description <span className="form-hint-char">(optional)</span>
                            </label>
                            <span className="form-hint-char">{form.description.length}/2000</span>
                        </div>
                        <textarea
                            id="description"
                            maxLength={2000}
                            rows={3}
                            placeholder="Describe ingredients, packaging (e.g. sealed foil boxes), and approximate dietary details (optional)..."
                            className="form-textarea"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-group photo-upload-section">
                        <div className="form-label-row">
                            <label className="form-label">
                                <Camera size={14} />
                                <span>Food Photo</span>
                                <span className="form-hint-char">(optional)</span>
                            </label>
                            {form.photoUrl && (
                                <button
                                    type="button"
                                    className="btn-clear-photo"
                                    onClick={clearPhoto}
                                    disabled={submitting}
                                >
                                    <X size={12} />
                                    <span>Remove Photo</span>
                                </button>
                            )}
                        </div>

                        {/* Photo Input Mode Tabs */}
                        <div className="photo-input-mode-tabs" role="tablist" aria-label="Photo selection method">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={photoMode === 'upload'}
                                className={`photo-mode-tab ${photoMode === 'upload' ? 'active' : ''}`}
                                onClick={() => setPhotoMode('upload')}
                                disabled={submitting}
                            >
                                <Upload size={14} />
                                <span>Upload from Device</span>
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={photoMode === 'url'}
                                className={`photo-mode-tab ${photoMode === 'url' ? 'active' : ''}`}
                                onClick={() => setPhotoMode('url')}
                                disabled={submitting}
                            >
                                <Link2 size={14} />
                                <span>Image Link</span>
                            </button>
                        </div>

                        {/* Tab Content: Upload from Device */}
                        {photoMode === 'upload' && (
                            <div className="photo-upload-panel">
                                <div
                                    className={`photo-dropzone ${isDragging ? 'dragging' : ''} ${form.photoUrl?.startsWith('data:') ? 'has-file' : ''}`}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setIsDragging(false);
                                        if (e.dataTransfer.files?.[0]) {
                                            handleFileSelect(e.dataTransfer.files[0]);
                                        }
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            fileInputRef.current?.click();
                                        }
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg, image/webp"
                                        className="sr-only"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                handleFileSelect(e.target.files[0]);
                                            }
                                        }}
                                        disabled={submitting || isProcessingFile}
                                    />

                                    {isProcessingFile ? (
                                        <div className="dropzone-content">
                                            <Loader2 size={24} className="spinning" style={{ color: 'var(--fb-mint-spark)' }} />
                                            <span className="dropzone-label">Compressing & optimizing image…</span>
                                        </div>
                                    ) : form.photoUrl?.startsWith('data:') ? (
                                        <div className="dropzone-file-preview">
                                            <img src={form.photoUrl} alt="Upload preview" className="dropzone-thumb" loading="lazy" decoding="async" />
                                            <div className="dropzone-file-meta">
                                                <span className="dropzone-file-name">{uploadedFileName || 'Uploaded Photo'}</span>
                                                <span className="dropzone-file-size">
                                                    <CheckCircle2 size={13} />
                                                    {uploadedFileSize}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-replace-upload"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="dropzone-content">
                                            <div className="dropzone-icon-circle">
                                                <Upload size={18} />
                                            </div>
                                            <div className="dropzone-text">
                                                <span className="dropzone-label">Click or drag image to upload from device</span>
                                                <span className="dropzone-sub">Auto-compressed for fast loading · Supports JPG, PNG, WEBP</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {uploadError && (
                                    <p className="photo-upload-error">{uploadError}</p>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Image Link */}
                        {photoMode === 'url' && (
                            <div className="photo-url-panel">
                                <input
                                    id="photoUrl"
                                    type="url"
                                    placeholder="https://images.unsplash.com/... or paste image web link"
                                    className="form-input"
                                    value={form.photoUrl?.startsWith('data:') ? '' : form.photoUrl}
                                    onChange={(e) => {
                                        setUploadedFileName('');
                                        setUploadedFileSize('');
                                        setUploadError('');
                                        handleChange('photoUrl', e.target.value);
                                    }}
                                    disabled={submitting}
                                />
                            </div>
                        )}

                        {/* Active Image Indicator Card (if a photo is active) */}
                        {form.photoUrl && (
                            <div className="active-photo-card">
                                <img src={form.photoUrl} alt="Current food preview" className="active-photo-thumb" loading="lazy" decoding="async" />
                                <div className="active-photo-details">
                                    <span className="active-photo-title">
                                        {form.photoUrl.startsWith('data:')
                                            ? (uploadedFileName || 'Attached from Device')
                                            : PHOTO_PRESETS.find(p => p.url === form.photoUrl)?.label
                                            ? `Sample: ${PHOTO_PRESETS.find(p => p.url === form.photoUrl).label}`
                                            : 'Web Image URL'}
                                    </span>
                                    <span className="active-photo-source">
                                        {form.photoUrl.startsWith('data:')
                                            ? `Ready & compressed (${uploadedFileSize || 'Optimized'})`
                                            : form.photoUrl.length > 45
                                            ? `${form.photoUrl.slice(0, 42)}…`
                                            : form.photoUrl}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    className="btn-remove-active-photo"
                                    onClick={clearPhoto}
                                    title="Remove photo"
                                    aria-label="Remove photo"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Demo Sample Photos / Presets */}
                        <div className="photo-presets-block">
                            <div className="photo-presets-header">
                                <Sparkles size={13} style={{ color: 'var(--fb-mint-spark)' }} />
                                <span className="photo-preset-label">Or select a demo picture:</span>
                            </div>
                            <div className="photo-presets-row">
                                {PHOTO_PRESETS.map((preset) => {
                                    const isSelected = form.photoUrl === preset.url;
                                    return (
                                        <button
                                            type="button"
                                            key={preset.label}
                                            className={`photo-preset-btn ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleSelectPreset(preset.url)}
                                            disabled={submitting}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="form-feedback-error" role="alert">
                            <AlertCircle size={16} />
                            <span>{errorMessage}</span>
                        </div>
                    )}

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
                                    loading="lazy"
                                    decoding="async"
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
                                {form.description || 'No description provided. You can add dietary and storage details in the next step.'}
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

                            <div className="preview-schedule-note">
                                <Clock size={12} />
                                <span>Collection window scheduled in Step 3</span>
                            </div>
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
