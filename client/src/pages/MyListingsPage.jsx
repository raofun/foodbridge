import { useCallback, useEffect, useState, useMemo, useRef, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Search,
  X,
  Clock,
  MapPin,
  UtensilsCrossed,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Share2,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './MyListingsPage.css';

export function optimizeImageUrl(url, width = 600, quality = 80) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
    return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  }
  return trimmed;
}

function ListingMediaImage({ photoUrl, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const optimizedUrl = useMemo(() => optimizeImageUrl(photoUrl, 600, 80), [photoUrl]);

  if (!photoUrl || failed) {
    return (
      <div className="card-media-fallback">
        <UtensilsCrossed size={32} />
        <span style={{ fontSize: '11px' }}>No photo uploaded</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && <div className="card-media-placeholder skeleton-shimmer" />}
      <img
        src={optimizedUrl}
        alt={alt || 'Food donation'}
        className={`card-media-img ${loaded ? 'loaded' : ''}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}

function SkeletonListingCard() {
  return (
    <article className="donor-card skeleton-card">
      <div className="skeleton-media-box skeleton-shimmer" />
      <div className="skeleton-content-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton-line title skeleton-shimmer" />
          <div className="skeleton-line badge skeleton-shimmer" />
        </div>
        <div className="skeleton-line text-long skeleton-shimmer" />
        <div className="skeleton-line text-short skeleton-shimmer" />
      </div>
      <div className="skeleton-actions-row">
        <div className="skeleton-button skeleton-shimmer" />
        <div className="skeleton-button skeleton-shimmer" />
        <div className="skeleton-button icon-only skeleton-shimmer" />
      </div>
    </article>
  );
}

const ListingCard = memo(function ListingCard({
  item,
  timeInfo,
  active,
  isDraft,
  isClosed,
  copiedId,
  onCopyLink,
  onEdit,
  onClose,
  onDelete,
}) {
  return (
    <article className={`donor-card ${isClosed ? 'is-closed' : ''}`}>
      {/* Card Media Header */}
      <div className="card-media-box">
        <ListingMediaImage photoUrl={item.photoUrl} alt={item.foodName} />

        {/* Status Badge */}
        <span className={`card-status-badge ${active ? 'available' : isDraft ? 'draft' : 'closed'}`}>
          {active ? '🟢 Available' : isDraft ? '⏳ Draft' : '⌛ Closed'}
        </span>

        {/* Condition & Portion */}
        {item.foodCondition && (
          <span className="card-condition-pill">
            {item.foodCondition === 'fresh'
              ? '⚡ Fresh'
              : item.foodCondition === 'refrigerated'
              ? '❄️ Chilled'
              : item.foodCondition === 'frozen'
              ? '🧊 Frozen'
              : '📦 Pantry'}
          </span>
        )}

        <span className="card-portion-pill">
          <UtensilsCrossed size={11} />
          <span>
            {item.claimedQuantity > 0
              ? item.claimedQuantity >= item.quantity
                ? `Fully Claimed (${item.quantity} ${item.portionUnit})`
                : `${item.claimedQuantity}/${item.quantity} ${item.portionUnit} reserved`
              : `${item.quantity} ${item.portionUnit}`}
          </span>
        </span>
      </div>

      {/* Card Body */}
      <div className="card-content">
        <div className="card-title-row">
          <h3>
            <Link
              to={`/listings/${item._id}/information`}
              className="card-title-link"
              title="View Community Food Passport"
            >
              {item.foodName}
            </Link>
          </h3>
          <span className="card-category-tag">{item.category || 'meals'}</span>
        </div>

        {item.description && (
          <p className="card-description-text">{item.description}</p>
        )}

        {/* Detailed Meta Items */}
        <div className="card-details-list">
          <div className="detail-item location">
            <MapPin size={13} />
            <span>{item.pickupLocation || 'Pickup location not specified yet'}</span>
          </div>

          <div className="detail-item time">
            <Clock size={13} />
            <span>
              <strong>Pickup: </strong> {timeInfo.text}
              {timeInfo.urgencyLabel && (
                <span style={{ color: '#ff9100', marginLeft: '6px', fontWeight: 700 }}>
                  {timeInfo.urgencyLabel}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Action Footer */}
      <div className="card-actions-footer">
        {/* View Details Button */}
        <Link
          to={`/listings/${item._id}/information`}
          className="btn-card-action primary"
          title="View food passport & details"
        >
          <Eye size={13} />
          <span>View</span>
        </Link>

        {/* Edit Everything Button */}
        <button
          type="button"
          className="btn-card-action edit"
          onClick={() => onEdit(item)}
          title="Edit all listing details (food basics, safety & pickup schedule)"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        {/* Draft Flow: Continue Setup */}
        {isDraft && (
          <Link
            to={`/listings/${item._id}/${item.preparedAt ? 'pickup' : 'information'}`}
            className="btn-card-action reopen"
            title="Continue listing setup wizard"
          >
            <ArrowRight size={13} />
            <span>{item.preparedAt ? 'Set Pickup' : 'Continue'}</span>
          </Link>
        )}

        {/* Active Pickup: Close Button */}
        {active && (
          <button
            type="button"
            className="btn-card-action close-pickup"
            onClick={() => onClose(item)}
            title="Close pickup window (mark as claimed/rescued)"
          >
            <CheckCircle2 size={13} />
            <span>Close</span>
          </button>
        )}

        {/* Closed / Expired: Reopen connects directly to Pickup Schedule */}
        {isClosed && (
          <Link
            to={`/listings/${item._id}/pickup`}
            className="btn-card-action reopen"
            title="Reopen pickup schedule and reactivate listing on feed"
          >
            <RotateCcw size={13} />
            <span>Reopen</span>
          </Link>
        )}

        {/* Share / Copy Link */}
        {!isDraft && (
          <button
            type="button"
            className="btn-card-action icon-only"
            onClick={() => onCopyLink(item)}
            title="Copy public link to share"
          >
            {copiedId === item._id ? <Check size={13} style={{ color: '#2dd4bf' }} /> : <Share2 size={13} />}
          </button>
        )}

        {/* Delete Button */}
        <button
          type="button"
          className="btn-card-action icon-only delete"
          onClick={() => onDelete(item)}
          title="Delete this listing permanently"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </article>
  );
});

function toLocalDateTimeInput(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${mins}`;
}

function toSafeISO(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatPickupSchedule(opensAt, closesAt, deadlineValue, status, currentTime = new Date()) {
  const deadline = deadlineValue || closesAt ? new Date(deadlineValue || closesAt) : null;
  const isClosed = status === 'closed';

  if (!deadline || isNaN(deadline.getTime())) {
    if (status === 'draft') {
      return { text: 'Schedule pending (Step 3)', isExpired: false, badgeClass: 'draft' };
    }
    return { text: isClosed ? 'Pickup closed' : 'Flexible pickup window', isExpired: isClosed, badgeClass: isClosed ? 'closed' : 'available' };
  }

  const isExpired = isClosed || deadline.getTime() <= currentTime.getTime();
  if (isExpired) {
    return { text: 'Pickup closed / expired', isExpired: true, badgeClass: 'closed' };
  }

  const day = deadline.getDate();
  const month = deadline.toLocaleString('en-US', { month: 'short' });
  const time = deadline.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const diffHours = Math.round((deadline.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
  const urgencyLabel = diffHours <= 1 ? '🔥 < 1 hr left' : diffHours <= 3 ? `⚡ < ${diffHours} hrs left` : '';

  return {
    text: `Before ${day} ${month}, ${time}`,
    urgencyLabel,
    isExpired: false,
    badgeClass: 'available',
  };
}

export default function MyListingsPage() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice || '');

  // Filter & Search Controls
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'available' | 'draft' | 'closed'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'deadline' | 'oldest' | 'quantity'

  // Clock for reactive unexpired status updates
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Interactive Modals
  const [modalState, setModalState] = useState({ type: null, listing: null });
  const [reopenDeadline, setReopenDeadline] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Edit Listing Form State
  const [editForm, setEditForm] = useState({
    foodName: '',
    category: 'meals',
    quantity: 1,
    portionUnit: 'servings',
    description: '',
    photoUrl: '',
    foodCondition: 'fresh',
    preparedAt: '',
    useByAt: '',
    storageDetails: '',
    safetyNotes: '',
    pickupLocation: '',
    pickupOpensAt: '',
    pickupClosesAt: '',
    status: 'available',
  });

  // Photo Upload States in Edit Modal
  const editFileInputRef = useRef(null);
  const [editPhotoMode, setEditPhotoMode] = useState('upload'); // 'upload' | 'url'
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [isEditProcessing, setIsEditProcessing] = useState(false);
  const [editPhotoError, setEditPhotoError] = useState('');
  const [editFileName, setEditFileName] = useState('');

  const setEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const processEditImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditPhotoError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setEditPhotoError('Selected image exceeds 15MB limit. Please choose a smaller photo.');
      return;
    }

    setEditPhotoError('');
    setIsEditProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
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

        let optimizedDataUrl = '';
        try {
          const webpUrl = canvas.toDataURL('image/webp', 0.75);
          optimizedDataUrl = webpUrl.startsWith('data:image/webp') ? webpUrl : canvas.toDataURL('image/jpeg', 0.75);
        } catch {
          optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        }

        setEditField('photoUrl', optimizedDataUrl);
        setEditFileName(file.name);
        setIsEditProcessing(false);
      };
      img.onerror = () => {
        setEditPhotoError('Unable to process this image. Please try another image file.');
        setIsEditProcessing(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setEditPhotoError('Failed to read image file from your device.');
      setIsEditProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = useCallback((item) => {
    const rawPhoto = item.photoUrl || '';
    setEditForm({
      foodName: item.foodName || '',
      category: item.category || 'meals',
      quantity: item.quantity || 1,
      portionUnit: item.portionUnit || 'servings',
      description: item.description || '',
      photoUrl: rawPhoto,
      foodCondition: item.foodCondition || 'fresh',
      preparedAt: toLocalDateTimeInput(item.preparedAt),
      useByAt: toLocalDateTimeInput(item.useByAt),
      storageDetails: item.storageDetails || '',
      safetyNotes: item.safetyNotes || '',
      pickupLocation: item.pickupLocation || '',
      pickupOpensAt: toLocalDateTimeInput(item.pickupOpensAt),
      pickupClosesAt: toLocalDateTimeInput(item.pickupClosesAt || item.pickupDeadline),
      status: item.status || 'available',
    });

    if (rawPhoto.startsWith('data:')) {
      setEditPhotoMode('upload');
      setEditFileName('Uploaded custom image');
    } else if (rawPhoto.startsWith('http')) {
      setEditPhotoMode('url');
      setEditFileName('');
    } else {
      setEditPhotoMode('upload');
      setEditFileName('');
    }
    setEditPhotoError('');
    setModalState({ type: 'edit', listing: item });
    setError('');
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/listings/mine', { token: session?.token });
      setListings(result.listings || []);
      setError('');
    } catch (e) {
      setError(e.message || 'Unable to load your listings.');
    } finally {
      setLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Check if an item is actively available
  const isItemActive = useCallback((item) => {
    const deadline = item.pickupDeadline || item.pickupClosesAt;
    const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= currentTime);
    return item.status === 'available' && !isDeadlinePassed;
  }, [currentTime]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = listings.length;
    let active = 0;
    let draft = 0;
    let closed = 0;

    listings.forEach((item) => {
      if (item.status === 'draft') {
        draft += 1;
      } else if (isItemActive(item)) {
        active += 1;
      } else {
        closed += 1;
      }
    });

    return { total, active, draft, closed };
  }, [listings, isItemActive]);

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        // Tab Filter
        if (activeTab === 'available' && !isItemActive(item)) return false;
        if (activeTab === 'draft' && item.status !== 'draft') return false;
        if (activeTab === 'closed' && (isItemActive(item) || item.status === 'draft')) return false;

        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.foodName?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          const matchLocation = item.pickupLocation?.toLowerCase().includes(q);
          const matchCategory = item.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLocation && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
        if (sortBy === 'quantity') {
          return (Number(b.quantity) || 0) - (Number(a.quantity) || 0);
        }
        if (sortBy === 'deadline') {
          const aTime = new Date(a.pickupDeadline || a.pickupClosesAt || Infinity).getTime();
          const bTime = new Date(b.pickupDeadline || b.pickupClosesAt || Infinity).getTime();
          return aTime - bTime;
        }
        return 0;
      });
  }, [listings, activeTab, searchQuery, sortBy, isItemActive]);

  // Smooth Pagination Controls & Slice
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE) || 1;

  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredListings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredListings, currentPage]);

  // Handle Share / Copy Link
  const handleCopyLink = useCallback((listing) => {
    const url = `${window.location.origin}/listings/${listing._id}/information`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(listing._id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  }, []);

  const handleOpenCloseModal = useCallback((item) => {
    setModalState({ type: 'close', listing: item });
  }, []);

  const handleOpenDeleteModal = useCallback((item) => {
    setModalState({ type: 'delete', listing: item });
  }, []);

  // Close Pickup Action
  const handleClosePickup = async () => {
    const listing = modalState.listing;
    if (!listing) return;

    setActionLoading(true);
    try {
      await apiRequest(`/listings/${listing._id}/close`, {
        token: session.token,
        method: 'PATCH',
      });
      setListings((prev) =>
        prev.map((l) => (l._id === listing._id ? { ...l, status: 'closed' } : l))
      );
      setNotice(`Pickup closed for "${listing.foodName}". It is now marked as closed.`);
      setModalState({ type: null, listing: null });
    } catch (e) {
      setError(e.message || 'Unable to close pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  // Re-open / Extend Pickup Action
  const handleReopenPickup = async () => {
    const listing = modalState.listing;
    if (!listing) return;

    if (!reopenDeadline) {
      setError('Please select a valid future pickup closing deadline.');
      return;
    }

    const deadlineDate = new Date(reopenDeadline);
    if (deadlineDate.getTime() <= Date.now()) {
      setError('Pickup closing deadline must be in the future.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await apiRequest(`/listings/${listing._id}`, {
        token: session.token,
        method: 'PATCH',
        body: {
          status: 'available',
          pickupDeadline: deadlineDate.toISOString(),
          pickupClosesAt: deadlineDate.toISOString(),
        },
      });

      const updated = res.listing || {
        ...listing,
        status: 'available',
        pickupDeadline: deadlineDate.toISOString(),
        pickupClosesAt: deadlineDate.toISOString(),
      };

      setListings((prev) => prev.map((l) => (l._id === listing._id ? updated : l)));
      setNotice(`"${listing.foodName}" has been re-opened and is now active on the community feed!`);
      setModalState({ type: null, listing: null });
    } catch (e) {
      setError(e.message || 'Unable to reopen pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Action
  const handleDeleteListing = async () => {
    const listing = modalState.listing;
    if (!listing) return;

    setActionLoading(true);
    try {
      await apiRequest(`/listings/${listing._id}`, {
        token: session.token,
        method: 'DELETE',
      });
      setListings((prev) => prev.filter((l) => l._id !== listing._id));
      setNotice(`"${listing.foodName}" has been permanently deleted.`);
      setModalState({ type: null, listing: null });
    } catch (e) {
      setError(e.message || 'Unable to delete listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Comprehensive Edit Action (Updates all listing attributes via API)
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    const listing = modalState.listing;
    if (!listing) return;

    if (!editForm.foodName.trim()) {
      setError('Food name cannot be empty.');
      return;
    }
    if (!editForm.portionUnit.trim()) {
      setError('Portion unit cannot be empty.');
      return;
    }
    const qty = Number(editForm.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError('Quantity must be a whole number of at least 1.');
      return;
    }

    const safePreparedAt = toSafeISO(editForm.preparedAt);
    const safeUseByAt = toSafeISO(editForm.useByAt);
    const safePickupOpensAt = toSafeISO(editForm.pickupOpensAt);
    const safePickupClosesAt = toSafeISO(editForm.pickupClosesAt);

    if (safePickupOpensAt && safePickupClosesAt) {
      const opens = new Date(safePickupOpensAt).getTime();
      const closes = new Date(safePickupClosesAt).getTime();
      if (opens >= closes) {
        setError('Pickup closing time must be after opening time.');
        return;
      }
    }

    if (safePreparedAt && safeUseByAt) {
      const prep = new Date(safePreparedAt).getTime();
      const useBy = new Date(safeUseByAt).getTime();
      if (useBy <= prep) {
        setError('Use-by date and time must be after preparation time.');
        return;
      }
    }

    if (editForm.status === 'available') {
      const closes = safePickupClosesAt ? new Date(safePickupClosesAt).getTime() : 0;
      if (!closes || closes <= Date.now()) {
        setError('To make this listing available, please provide a future pickup closing deadline.');
        return;
      }
    }

    setActionLoading(true);
    try {
      const payload = {
        foodName: editForm.foodName.trim(),
        category: editForm.category,
        quantity: Number(editForm.quantity),
        portionUnit: editForm.portionUnit.trim(),
        description: editForm.description.trim(),
        photoUrl: editForm.photoUrl.trim(),
        foodCondition: editForm.foodCondition,
        preparedAt: safePreparedAt,
        useByAt: safeUseByAt,
        storageDetails: editForm.storageDetails.trim(),
        safetyNotes: editForm.safetyNotes.trim(),
        pickupLocation: editForm.pickupLocation.trim(),
        pickupOpensAt: safePickupOpensAt,
        pickupClosesAt: safePickupClosesAt,
        pickupDeadline: safePickupClosesAt,
        status: editForm.status,
      };

      const res = await apiRequest(`/listings/${listing._id}`, {
        token: session?.token,
        method: 'PATCH',
        body: payload,
      });

      const updated = res.listing;
      if (!updated) {
        throw new Error(res.message || 'Server did not return updated listing.');
      }

      setListings((prev) => prev.map((l) => (l._id === listing._id ? updated : l)));
      setNotice(`Listing "${updated.foodName}" has been successfully updated.`);
      setModalState({ type: null, listing: null });
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to update listing.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reopen Modal with suggested future time (+4 hours)
  const openReopenModal = (listing) => {
    const defaultFuture = new Date(Date.now() + 4 * 60 * 60 * 1000);
    setReopenDeadline(toLocalDateTimeInput(defaultFuture));
    setError('');
    setModalState({ type: 'reopen', listing });
  };

  return (
    <div className="my-listings-container">
      {/* Hero Console */}
      <section className="my-listings-hero">
        <div className="hero-header-row">
          <div className="hero-title-group">
            <div className="hero-eyebrow-chip">
              <Sparkles size={13} />
              <span>DONOR COMMAND CENTER</span>
            </div>
            <h1>
              My Food <em>Listings.</em>
            </h1>
            <p>
              Monitor active community surplus donations, update pickup schedules, extend deadlines, or mark collections as closed.
            </p>
          </div>
          <Link to="/listings/new" className="btn-hero-create">
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Listing</span>
          </Link>
        </div>

        {/* 4 Live Metrics Cards */}
        <div className="donor-metrics-grid">
          <div className="donor-metric-card" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-top">
              <span>Total Donations</span>
              <span className="metric-dot total" />
            </div>
            <span className="metric-card-value">{metrics.total}</span>
            <span className="metric-card-subtitle">All meals shared to date</span>
          </div>

          <div className="donor-metric-card" onClick={() => setActiveTab('available')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-top">
              <span>Active Pickups</span>
              <span className="metric-dot active" />
            </div>
            <span className="metric-card-value">{metrics.active}</span>
            <span className="metric-card-subtitle">Ready on community feed</span>
          </div>

          <div className="donor-metric-card" onClick={() => setActiveTab('draft')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-top">
              <span>Drafts Pending</span>
              <span className="metric-dot draft" />
            </div>
            <span className="metric-card-value">{metrics.draft}</span>
            <span className="metric-card-subtitle">Setup awaiting completion</span>
          </div>

          <div className="donor-metric-card" onClick={() => setActiveTab('closed')} style={{ cursor: 'pointer' }}>
            <div className="metric-card-top">
              <span>Closed / Rescued</span>
              <span className="metric-dot closed" />
            </div>
            <span className="metric-card-value">{metrics.closed}</span>
            <span className="metric-card-subtitle">Completed pickups</span>
          </div>
        </div>
      </section>

      {/* Notice & Error Banners */}
      {notice && (
        <div className="status-banner info" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="btn-banner-close" aria-label="Dismiss notice">
            <X size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="status-banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="btn-banner-close" aria-label="Dismiss error">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="my-listings-toolbar">
        <div className="toolbar-tabs-group my-listings-tabs-group" role="tablist" aria-label="Filter listings by state">
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Donations</span>
            <span className="tab-pill-badge">{metrics.total}</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <span>🟢 Active</span>
            <span className="tab-pill-badge">{metrics.active}</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            <span>⏳ Drafts</span>
            <span className="tab-pill-badge">{metrics.draft}</span>
          </button>
          <button
            type="button"
            className={`tab-pill-btn ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            <span>⌛ Closed</span>
            <span className="tab-pill-badge">{metrics.closed}</span>
          </button>
        </div>

        <div className="toolbar-controls-right">
          <div className="search-input-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search your listings…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-text-field"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="sort-select-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort your listings"
            >
              <option value="newest">🕒 Newest First</option>
              <option value="deadline">⏳ Nearest Deadline</option>
              <option value="quantity">📦 Quantity (High to Low)</option>
              <option value="oldest">📅 Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid or Loading / Empty States */}
      {loading ? (
        <div className="donor-listings-grid" aria-busy="true" aria-label="Loading your donations">
          {[1, 2, 3, 4].map((id) => (
            <SkeletonListingCard key={id} />
          ))}
        </div>
      ) : filteredListings.length ? (
        <>
          <div className="donor-listings-grid">
            {paginatedListings.map((item) => (
              <ListingCard
                key={item._id}
                item={item}
                timeInfo={formatPickupSchedule(
                  item.pickupOpensAt,
                  item.pickupClosesAt,
                  item.pickupDeadline,
                  item.status,
                  currentTime
                )}
                active={isItemActive(item)}
                isDraft={item.status === 'draft'}
                isClosed={!isItemActive(item) && item.status !== 'draft'}
                copiedId={copiedId}
                onCopyLink={handleCopyLink}
                onEdit={openEditModal}
                onClose={handleOpenCloseModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>

          {/* Smooth Pagination Controls */}
          {totalPages > 1 && (
            <div className="my-listings-pagination" role="navigation" aria-label="Donations pagination">
              <span className="pagination-info">
                Showing{' '}
                <strong style={{ color: '#ffffff' }}>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredListings.length)}
                </strong>{' '}
                of <strong style={{ color: '#ffffff' }}>{filteredListings.length}</strong> donations
              </span>

              <div className="pagination-buttons-group">
                <button
                  type="button"
                  className="pagination-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-page-pill ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="pagination-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty Results Console */
        <div className="donor-empty-console">
          <div className="empty-icon-wrap">
            {searchQuery || activeTab !== 'all' ? <Search size={28} /> : <UtensilsCrossed size={28} />}
          </div>
          <h3>
            {searchQuery || activeTab !== 'all'
              ? 'No matching food donations found'
              : 'You haven’t listed any surplus food yet'}
          </h3>
          <p>
            {searchQuery || activeTab !== 'all'
              ? 'Try adjusting your search terms or clearing the active status tab.'
              : 'Share surplus meals, artisan bakery, or fresh pantry goods with community members in need.'}
          </p>
          {searchQuery || activeTab !== 'all' ? (
            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          ) : (
            <Link to="/listings/new" className="button button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={14} />
              <span>Create Your First Listing</span>
            </Link>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------------
          Interactive Modals
         -------------------------------------------------------------------------- */}

      {/* 1. Close Pickup Modal */}
      {modalState.type === 'close' && modalState.listing && (
        <div className="modal-backdrop-dark" onClick={() => !actionLoading && setModalState({ type: null, listing: null })}>
          <div className="modal-dialog-obsidian" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header-line">
              <div className="modal-icon-badge success">
                <CheckCircle2 size={20} />
              </div>
              <h3>Close Food Pickup</h3>
            </div>
            <p>
              Are you sure you want to close pickup for <strong>"{modalState.listing.foodName}"</strong>?
            </p>
            <p style={{ color: '#64748b', fontSize: '12px' }}>
              This indicates the surplus has been collected or is no longer available. It will immediately be marked as closed on the live community feed.
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={actionLoading}
                onClick={() => setModalState({ type: null, listing: null })}
              >
                Keep Open
              </button>
              <button
                type="button"
                className="btn-modal-confirm success"
                disabled={actionLoading}
                onClick={handleClosePickup}
              >
                {actionLoading && <Loader2 size={13} className="spinning" />}
                <span>Yes, Close Pickup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Re-open / Extend Deadline Modal */}
      {modalState.type === 'reopen' && modalState.listing && (
        <div className="modal-backdrop-dark" onClick={() => !actionLoading && setModalState({ type: null, listing: null })}>
          <div className="modal-dialog-obsidian" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header-line">
              <div className="modal-icon-badge warning">
                <RotateCcw size={20} />
              </div>
              <h3>Re-open Food Donation</h3>
            </div>
            <p>
              Reactivate <strong>"{modalState.listing.foodName}"</strong> and make it visible again on the community feed by setting a new collection deadline.
            </p>

            <div className="modal-form-field">
              <label htmlFor="reopenDeadline">New Pickup Closing Deadline:</label>
              <input
                id="reopenDeadline"
                type="datetime-local"
                value={reopenDeadline}
                onChange={(e) => setReopenDeadline(e.target.value)}
                min={toLocalDateTimeInput(new Date())}
              />
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={actionLoading}
                onClick={() => setModalState({ type: null, listing: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm warning"
                disabled={actionLoading}
                onClick={handleReopenPickup}
              >
                {actionLoading && <Loader2 size={13} className="spinning" />}
                <span>Re-open Listing</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {modalState.type === 'delete' && modalState.listing && (
        <div className="modal-backdrop-dark" onClick={() => !actionLoading && setModalState({ type: null, listing: null })}>
          <div className="modal-dialog-obsidian" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header-line">
              <div className="modal-icon-badge danger">
                <Trash2 size={20} />
              </div>
              <h3>Delete Food Listing</h3>
            </div>
            <p>
              Are you sure you want to permanently delete <strong>"{modalState.listing.foodName}"</strong>?
            </p>
            <p style={{ color: '#f87171', fontSize: '12px' }}>
              Warning: This action cannot be undone. All pickup schedules and verification records for this listing will be erased.
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-cancel"
                disabled={actionLoading}
                onClick={() => setModalState({ type: null, listing: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm danger"
                disabled={actionLoading}
                onClick={handleDeleteListing}
              >
                {actionLoading && <Loader2 size={13} className="spinning" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Comprehensive Edit Modal (Edit Everything) */}
      {modalState.type === 'edit' && modalState.listing && (
        <div className="modal-backdrop-dark" onClick={() => !actionLoading && setModalState({ type: null, listing: null })}>
          <div className="modal-dialog-obsidian large-edit-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header-line">
              <div className="modal-icon-badge edit">
                <Edit3 size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0 }}>Edit Food Listing</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Update details, food safety passport, and pickup schedule
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalState({ type: null, listing: null })}
                className="btn-banner-close"
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="status-banner error" style={{ margin: '0' }} role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="btn-banner-close" aria-label="Dismiss error">
                  <X size={15} />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section 1: Basic Information */}
              <div className="edit-modal-section">
                <div className="edit-modal-section-title">
                  <UtensilsCrossed size={14} />
                  <span>1. Basic Listing Details</span>
                </div>

                <div className="modal-form-field">
                  <label htmlFor="editFoodName">Food Name / Title *</label>
                  <input
                    id="editFoodName"
                    type="text"
                    required
                    maxLength={120}
                    value={editForm.foodName}
                    onChange={(e) => setEditField('foodName', e.target.value)}
                    placeholder="e.g. Freshly Baked Focaccia & Sourdough"
                  />
                </div>

                <div className="edit-grid-2col">
                  <div className="modal-form-field">
                    <label htmlFor="editCategory">Category *</label>
                    <select
                      id="editCategory"
                      value={editForm.category}
                      onChange={(e) => setEditField('category', e.target.value)}
                    >
                      <option value="meals">🍲 Cooked Meals</option>
                      <option value="bakery">🥖 Bakery & Bread</option>
                      <option value="produce">🥦 Fresh Vegetables</option>
                      <option value="fruits">🍎 Fresh Fruits</option>
                      <option value="dairy">🧀 Dairy & Sweets</option>
                      <option value="packaged">📦 Packaged & Pantry</option>
                      <option value="beverages">🧃 Drinks & Juices</option>
                      <option value="other">🍽️ Other Surplus Food</option>
                    </select>
                  </div>

                  <div className="edit-grid-2col">
                    <div className="modal-form-field">
                      <label htmlFor="editQuantity">Quantity *</label>
                      <input
                        id="editQuantity"
                        type="number"
                        min="1"
                        required
                        value={editForm.quantity}
                        onChange={(e) => setEditField('quantity', e.target.value)}
                      />
                    </div>
                    <div className="modal-form-field">
                      <label htmlFor="editPortionUnit">Unit *</label>
                      <input
                        id="editPortionUnit"
                        type="text"
                        required
                        maxLength={40}
                        placeholder="servings, boxes, kg"
                        value={editForm.portionUnit}
                        onChange={(e) => setEditField('portionUnit', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-form-field">
                  <label htmlFor="editDescription">Description</label>
                  <textarea
                    id="editDescription"
                    rows={2}
                    maxLength={2000}
                    placeholder="Brief description of the surplus meal..."
                    value={editForm.description}
                    onChange={(e) => setEditField('description', e.target.value)}
                  />
                </div>

                <div className="modal-form-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Food Photo</label>
                    {editForm.photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditField('photoUrl', '');
                          setEditFileName('');
                        }}
                        className="btn-edit-clear-photo"
                        title="Remove current photo"
                      >
                        <Trash2 size={12} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  {/* Mode switcher tabs: Upload Photo vs Paste URL */}
                  <div className="edit-photo-tabs-bar">
                    <button
                      type="button"
                      className={`edit-photo-tab-btn ${editPhotoMode === 'upload' ? 'active' : ''}`}
                      onClick={() => setEditPhotoMode('upload')}
                    >
                      <Upload size={13} />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      className={`edit-photo-tab-btn ${editPhotoMode === 'url' ? 'active' : ''}`}
                      onClick={() => setEditPhotoMode('url')}
                    >
                      <Link2 size={13} />
                      <span>Paste Image URL</span>
                    </button>
                  </div>

                  {/* Mode 1: Device File Upload */}
                  {editPhotoMode === 'upload' && (
                    <div className="edit-upload-box">
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processEditImageFile(file);
                        }}
                      />

                      <div
                        className={`edit-photo-dropzone ${isEditDragging ? 'dragging' : ''}`}
                        onClick={() => editFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsEditDragging(true);
                        }}
                        onDragLeave={() => setIsEditDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsEditDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) processEditImageFile(file);
                        }}
                      >
                        {isEditProcessing ? (
                          <div className="edit-dropzone-loading">
                            <Loader2 size={24} className="spinning" style={{ color: '#ff5e1a' }} />
                            <span>Optimizing and compressing photo…</span>
                          </div>
                        ) : (
                          <div className="edit-dropzone-inner">
                            <div className="edit-dropzone-icon-circle">
                              <Upload size={18} />
                            </div>
                            <div className="edit-dropzone-copy">
                              <strong>Click or drag & drop to upload photo</strong>
                              <span>Supports JPEG, PNG, WEBP (auto-downsampled and compressed)</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {editPhotoError && (
                        <div className="edit-photo-error-banner" role="alert">
                          <AlertCircle size={14} />
                          <span>{editPhotoError}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Paste Web Image URL */}
                  {editPhotoMode === 'url' && (
                    <div className="edit-url-box">
                      <input
                        id="editPhotoUrl"
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={editForm.photoUrl.startsWith('data:') ? '' : editForm.photoUrl}
                        onChange={(e) => {
                          setEditField('photoUrl', e.target.value);
                          setEditFileName('');
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Paste any public image link (Unsplash, Pexels, Cloudinary, etc.)
                      </span>
                    </div>
                  )}

                  {/* Active Photo Preview & Details */}
                  {editForm.photoUrl && (
                    <div className="edit-photo-preview-card">
                      <img
                        src={editForm.photoUrl}
                        alt="Listing Preview"
                        className="edit-photo-preview-thumb"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        onLoad={(e) => { e.target.style.display = 'block'; }}
                      />
                      <div className="edit-photo-preview-details">
                        <div className="edit-photo-preview-status">
                          <CheckCircle2 size={13} style={{ color: '#2dd4bf' }} />
                          <strong>Photo Attached</strong>
                        </div>
                        <span className="edit-photo-preview-text">
                          {editFileName || (editForm.photoUrl.startsWith('data:') ? 'Custom uploaded image (optimized)' : 'Web link image')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editPhotoMode === 'upload') {
                            editFileInputRef.current?.click();
                          } else {
                            setEditField('photoUrl', '');
                          }
                        }}
                        className="btn-edit-change-photo"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Food Information & Safety */}
              <div className="edit-modal-section">
                <div className="edit-modal-section-title">
                  <ShieldCheck size={14} />
                  <span>2. Food Safety & Verification</span>
                </div>

                <div className="edit-grid-2col">
                  <div className="modal-form-field">
                    <label htmlFor="editFoodCondition">Food Condition *</label>
                    <select
                      id="editFoodCondition"
                      value={editForm.foodCondition}
                      onChange={(e) => setEditField('foodCondition', e.target.value)}
                    >
                      <option value="fresh">⚡ Freshly Prepared</option>
                      <option value="refrigerated">❄️ Refrigerated (1–4°C)</option>
                      <option value="frozen">🧊 Deep Frozen (≤ -18°C)</option>
                      <option value="shelf-stable">📦 Dry Shelf-Stable</option>
                    </select>
                  </div>

                  <div className="modal-form-field">
                    <label htmlFor="editPreparedAt">Prepared Date & Time</label>
                    <input
                      id="editPreparedAt"
                      type="datetime-local"
                      value={editForm.preparedAt}
                      onChange={(e) => setEditField('preparedAt', e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-grid-2col">
                  <div className="modal-form-field">
                    <label htmlFor="editUseByAt">Best Before / Use By</label>
                    <input
                      id="editUseByAt"
                      type="datetime-local"
                      value={editForm.useByAt}
                      onChange={(e) => setEditField('useByAt', e.target.value)}
                    />
                  </div>

                  <div className="modal-form-field">
                    <label htmlFor="editStorageDetails">Storage Details</label>
                    <input
                      id="editStorageDetails"
                      type="text"
                      maxLength={500}
                      placeholder="e.g. Commercial refrigerator (1–4°C)"
                      value={editForm.storageDetails}
                      onChange={(e) => setEditField('storageDetails', e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-form-field">
                  <label htmlFor="editSafetyNotes">Dietary & Safety Notes</label>
                  <textarea
                    id="editSafetyNotes"
                    rows={2}
                    maxLength={1000}
                    placeholder="e.g. 100% Halal, Vegetarian, Contains Nuts..."
                    value={editForm.safetyNotes}
                    onChange={(e) => setEditField('safetyNotes', e.target.value)}
                  />
                </div>
              </div>

              {/* Section 3: Pickup Window & Status */}
              <div className="edit-modal-section">
                <div className="edit-modal-section-title">
                  <MapPin size={14} />
                  <span>3. Pickup Schedule & Availability</span>
                </div>

                <div className="modal-form-field">
                  <label htmlFor="editPickupLocation">Pickup Location / Address</label>
                  <input
                    id="editPickupLocation"
                    type="text"
                    maxLength={300}
                    placeholder="e.g. House 14, Road 7, Dhanmondi 27, Dhaka"
                    value={editForm.pickupLocation}
                    onChange={(e) => setEditField('pickupLocation', e.target.value)}
                  />
                </div>

                <div className="edit-grid-2col">
                  <div className="modal-form-field">
                    <label htmlFor="editPickupOpensAt">Pickup Opens At</label>
                    <input
                      id="editPickupOpensAt"
                      type="datetime-local"
                      value={editForm.pickupOpensAt}
                      onChange={(e) => setEditField('pickupOpensAt', e.target.value)}
                    />
                  </div>

                  <div className="modal-form-field">
                    <label htmlFor="editPickupClosesAt">Pickup Closes At (Deadline)</label>
                    <input
                      id="editPickupClosesAt"
                      type="datetime-local"
                      value={editForm.pickupClosesAt}
                      onChange={(e) => setEditField('pickupClosesAt', e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-form-field">
                  <label htmlFor="editStatus">Listing Status</label>
                  <select
                    id="editStatus"
                    value={editForm.status}
                    onChange={(e) => setEditField('status', e.target.value)}
                  >
                    <option value="available">🟢 Available (Live on Community Feed)</option>
                    <option value="draft">⏳ Draft (Setup Pending)</option>
                    <option value="closed">⌛ Closed (Pickup Complete / Expired)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={actionLoading}
                  onClick={() => setModalState({ type: null, listing: null })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-confirm success"
                  disabled={actionLoading}
                >
                  {actionLoading && <Loader2 size={13} className="spinning" />}
                  <span>Save All Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
