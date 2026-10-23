import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
    Sparkles,
    UtensilsCrossed,
    MapPin,
    Clock,
    X,
    ArrowRight,
    ChefHat,
    RotateCw,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './HomePage.css';

export function formatPickupDeadline(deadlineValue, status, currentTime = new Date()) {
    const now = currentTime instanceof Date ? currentTime : new Date();
    const deadline = deadlineValue ? new Date(deadlineValue) : null;

    if (!deadline || isNaN(deadline.getTime())) {
        const isClosed = status === 'closed';
        return {
            text: isClosed ? 'Pickup closed' : 'Flexible pickup window',
            isExpired: isClosed,
            badgeClass: isClosed ? 'expired' : 'flexible',
        };
    }

    const isExpired = status === 'closed' || deadline.getTime() <= now.getTime();
    if (isExpired) {
        return {
            text: 'Pickup closed',
            isExpired: true,
            badgeClass: 'expired',
        };
    }

    // Format: "Pickup before 25 October, 2026, 7:00 PM"
    const day = deadline.getDate();
    const month = deadline.toLocaleString('en-US', { month: 'long' });
    const year = deadline.getFullYear();
    const time = deadline.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return {
        text: `Pickup before ${day} ${month}, ${year}, ${time}`,
        isExpired: false,
        badgeClass: 'standard',
    };
}

// Keep backward-compatible formatPickupWindow alias
export const formatPickupWindow = (opensAt, closesAt, status, currentTime) =>
    formatPickupDeadline(closesAt, status, currentTime);

export default function HomePage() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const { feedListings, feedLoading: loading, feedError: error, reloadFeed } = useOutletContext();
    const [activeCategory, setActiveCategory] = useState('all');

    // Live clock reference updating regularly to keep pickup statuses accurate based on current time
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);
        return () => clearInterval(timer);
    }, []);

    // Modal State
    const [selectedListing, setSelectedListing] = useState(null);
    const [modalType, setModalType] = useState(null);

    // Live active donations count (excluding expired/closed)
    const activeCount = useMemo(() => {
        return feedListings.filter(item => {
            const deadline = item.pickupDeadline || item.pickupClosesAt;
            const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= currentTime);
            return item.status === 'available' && !isDeadlinePassed;
        }).length;
    }, [feedListings, currentTime]);

    // Filter listings based on active category pill and sort expired/closed to the bottom
    const filteredListings = useMemo(() => {
        const isItemExpired = (item) => {
            const deadline = item.pickupDeadline || item.pickupClosesAt;
            const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= currentTime);
            return item.status === 'closed' || isDeadlinePassed;
        };

        const matching = feedListings.filter(item => {
            return activeCategory === 'all' || item.category === activeCategory;
        });

        // Active listings first, expired listings automatically pushed to the bottom of the menu
        return [...matching].sort((a, b) => {
            const aExpired = isItemExpired(a);
            const bExpired = isItemExpired(b);
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;
            return 0;
        });
    }, [feedListings, activeCategory, currentTime]);

    const visibleAvailableCount = useMemo(() => {
        return filteredListings.filter(item => {
            const deadline = item.pickupDeadline || item.pickupClosesAt;
            const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= currentTime);
            return item.status === 'available' && !isDeadlinePassed;
        }).length;
    }, [filteredListings, currentTime]);

    const openListing = (listing) => {
        const deadline = listing.pickupDeadline || listing.pickupClosesAt;
        const isExpired = listing.status === 'closed' || (deadline && new Date(deadline) <= currentTime);
        if (isExpired) return;

        const pathname = `/listings/${encodeURIComponent(listing._id)}/information`;
        if (!session) {
            setSelectedListing(listing);
            setModalType('auth-gate');
            return;
        }
        navigate(pathname, { state: { listing } });
    };

    // Close Modal handler
    const closeModal = () => {
        setModalType(null);
        setSelectedListing(null);
    };

    // Close modal on Escape key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!modalType) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [modalType]);

    return (
        <div className="home-container">
            {/* Iconic Hero Console */}
            <section className="home-hero-console">
                <div className="home-hero-top">
                    <div className="home-network-pill">
                        <Sparkles size={13} />
                        <span>COMMUNITY SURPLUS FOOD NETWORK</span>
                    </div>

                    <div className="home-metrics-row">
                        <div className="metric-chip">
                            <span className="dot-live" />
                            <span><strong>{activeCount}</strong> Active Donations</span>
                        </div>
                        <div className="metric-chip">
                            <span><strong>&lt; 2 hrs</strong> Average Pickup</span>
                        </div>
                        <div className="metric-chip">
                            <span><strong>100%</strong> Free for Neighbors</span>
                        </div>
                    </div>
                </div>

                <div className="home-hero-main">
                    <div className="home-hero-copy">
                        <h1>
                            Rescue surplus food. <br />
                            Nourish our <em>community.</em>
                        </h1>
                        <p>
                            Direct food rescue connecting generous local kitchens, bakeries, and neighbors with community members and shelters. Zero waste, zero cost.
                        </p>
                    </div>

                    <div className="home-hero-buttons">
                        {session ? (
                            <>
                                <Link to="/listings/new" className="btn-hero-orange">
                                    <span>＋ Create Listing</span>
                                    <ArrowRight size={15} />
                                </Link>
                                <a href="#browse-feed" className="btn-hero-glass">
                                    Browse Available Food
                                </a>
                            </>
                        ) : (
                            <>
                                <Link to="/register" className="btn-hero-orange">
                                    <span>Join FoodBridge</span>
                                    <ArrowRight size={15} />
                                </Link>
                                <Link to="/login" className="btn-hero-glass">
                                    Sign In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Category Filter Pills Control Bar */}
            <section className="home-filter-bar" id="browse-feed">
                <div className="category-filter-group">
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('all')}
                    >
                        <UtensilsCrossed size={14} />
                        <span>All Surplus</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'meals' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('meals')}
                    >
                        <ChefHat size={14} />
                        <span>Cooked Meals</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'bakery' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('bakery')}
                    >
                        <span>🥖 Artisan Bakery</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'fruits' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('fruits')}
                    >
                        <span>🍎 Fresh Fruits</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'produce' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('produce')}
                    >
                        <span>🥗 Vegetables & Greens</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'dairy' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('dairy')}
                    >
                        <span>🥛 Dairy & Sweets</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'packaged' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('packaged')}
                    >
                        <span>🥫 Packaged & Pantry</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'beverages' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('beverages')}
                    >
                        <span>🧃 Beverages</span>
                    </button>
                    <button
                        type="button"
                        className={`category-tag-btn ${activeCategory === 'other' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('other')}
                    >
                        <span>📦 Other</span>
                    </button>
                </div>
            </section>

            {/* Feed Header */}
            <div className="feed-header-row">
                <h2>
                    <span>Live Surplus Food Feed</span>
                    <span className="feed-count-pill">{visibleAvailableCount} Available</span>
                </h2>
                <p>Verified food donations ready for collection</p>
            </div>

            {/* Loading Skeleton State */}
            {loading && (
                <div className="food-listings-grid">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                        <div className="food-listing-card" key={key} style={{ opacity: 0.6, pointerEvents: 'none' }}>
                            <div className="card-photo-box" style={{ background: 'rgba(255,255,255,0.04)' }} />
                            <div className="card-content-body" style={{ padding: '20px', gap: '12px' }}>
                                <div style={{ height: '18px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', width: '70%' }} />
                                <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '90%' }} />
                                <div style={{ height: '36px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', marginTop: '10px' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="panel" style={{ padding: '32px 24px', textAlign: 'center', margin: '16px 0', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <AlertCircle size={32} style={{ color: '#f87171', margin: '0 auto 12px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#ffffff' }}>Unable to load surplus food</h3>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--fb-text-sub)', fontSize: '13px' }}>{error}</p>
                    <button type="button" onClick={reloadFeed} className="button button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
                        <RotateCw size={14} />
                        <span>Try Again</span>
                    </button>
                </div>
            )}

            {/* Food Listings Feed Grid */}
            {!loading && !error && (
                <div className="food-listings-grid">
                    {filteredListings.map((item) => {
                        const deadline = item.pickupDeadline || item.pickupClosesAt;
                        const timeInfo = formatPickupDeadline(deadline, item.status, currentTime);
                        return (
                            <article className={`food-listing-card ${timeInfo.isExpired ? 'expired-card' : ''}`} key={item._id}>
                                {/* Food Photo Box */}
                                <div className="card-photo-box">
                                    <img
                                        src={item.photoUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&auto=format&fit=crop&q=70&fm=webp'}
                                        alt={item.foodName}
                                        className="card-photo-img"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <span className={`card-condition-pill ${timeInfo.isExpired ? 'expired' : ''}`}>
                                        {timeInfo.isExpired ? '⌛ Closed' : `⚡ ${item.foodCondition || 'fresh'}`}
                                    </span>
                                    <span className={`card-time-pill ${timeInfo.badgeClass}`}>
                                        <Clock size={12} />
                                        <span>{timeInfo.text}</span>
                                    </span>
                                </div>

                                {/* Card Content Body */}
                                <div className="card-content-body">
                                    <div className="card-food-info">
                                        <h3 className="food-title-text">{item.foodName}</h3>
                                        <p className="food-desc-text">{item.description}</p>
                                    </div>

                                    <div className="card-summary-row">
                                        <span className="pill-portion">
                                            <UtensilsCrossed size={12} />
                                            <span>{item.quantity} {item.portionUnit}</span>
                                        </span>
                                        <span className="card-neighborhood">
                                            <MapPin size={12} />
                                            <span>{item.pickupLocation || item.donor?.location || 'Community Location'}</span>
                                        </span>
                                    </div>

                                    <div className="card-buttons-footer">
                                        {timeInfo.isExpired ? (
                                            <button
                                                type="button"
                                                className="btn-card-receive expired-btn"
                                                disabled
                                                aria-disabled="true"
                                                tabIndex={-1}
                                                title="Pickup deadline for this surplus donation has passed"
                                            >
                                                <span>Pickup closed</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="btn-card-receive"
                                                onClick={() => openListing(item)}
                                            >
                                                <span>View more to receive</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredListings.length === 0 && (
                <div className="panel" style={{ padding: '40px 20px', textAlign: 'center', marginTop: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#ffffff' }}>
                        {feedListings.length === 0 ? 'No surplus food currently available' : 'No surplus food in this category'}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--fb-text-sub)', fontSize: '13px' }}>
                        {feedListings.length === 0
                            ? 'The community feed is currently empty. Check back soon or list surplus food to share.'
                            : 'Select "All Surplus" above to browse all active donations.'}
                    </p>
                </div>
            )}

            {modalType === 'auth-gate' && selectedListing && (
                <div className="modal-backdrop-dark auth-gate-backdrop" onClick={closeModal}>
                    <section
                        className="modal-dialog-obsidian auth-gate-dialog"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="food-auth-title"
                        aria-describedby="food-auth-description"
                    >
                        <button type="button" className="modal-exit-btn" onClick={closeModal} aria-label="Close sign-in prompt">
                            <X size={16} />
                        </button>
                        <div className="modal-gate-container">
                            <div className="auth-gate-mark" aria-hidden="true">
                                <UtensilsCrossed size={20} strokeWidth={2.2} />
                            </div>
                            <h2 id="food-auth-title">Welcome to FoodBridge</h2>
                            <p id="food-auth-description">Sign in to continue to this pickup.</p>
                            <div className="modal-actions-stack">
                                <Link
                                    to="/login"
                                    className="btn-gate-signin"
                                    onClick={closeModal}
                                >
                                    <span>Sign in</span>
                                    <ArrowRight size={14} />
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-gate-register"
                                    onClick={closeModal}
                                >
                                    Create an account
                                </Link>
                            </div>
                            <button type="button" className="btn-gate-browse" onClick={closeModal}>
                                Keep browsing
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
