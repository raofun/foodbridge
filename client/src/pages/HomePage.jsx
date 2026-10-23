import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Sparkles,
    UtensilsCrossed,
    MapPin,
    Clock,
    X,
    ArrowRight,
    ChefHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './HomePage.css';

// Active community surplus food listings
const COMMUNITY_LISTINGS = [
    {
        _id: 'comm-1',
        foodName: 'Vegetable Biryani & Golden Dahl',
        description: 'Fragrant basmati rice with farm vegetables, warm spices, and slow-simmered yellow lentil soup. Packed in separate eco-friendly meal containers.',
        photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'meals',
        quantity: 16,
        portionUnit: 'portions',
        foodCondition: 'freshly cooked',
        storageDetails: 'Kept in warm-holding cabinet at 65°C; consume or refrigerate within 2 hours of pickup.',
        safetyNotes: '100% Vegetarian, nut-free. Prepared in a certified commercial kitchen.',
        pickupLocation: '428 Market St, Kitchen Back Entrance',
        pickupWindow: 'Today · 2:30 – 5:30 PM',
        donor: {
            name: 'Chef Marcus Rivera',
            role: 'Green Table Bistro',
            avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Downtown · 0.8 mi',
            verified: true,
        },
        tags: ['Vegetarian', 'Warm Meal', 'Commercial Kitchen'],
    },
    {
        _id: 'comm-2',
        foodName: 'Artisan Sourdough & Country Baguettes',
        description: 'Naturally fermented rustic sourdough loaves with crisp crust and open crumb, baked fresh this morning from stone-ground organic flour.',
        photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'bakery',
        quantity: 14,
        portionUnit: 'loaves',
        foodCondition: 'baked today',
        storageDetails: 'Paper wrapped, room temperature. Best enjoyed within 48 hours or freeze.',
        safetyNotes: 'Contains wheat gluten. Dairy-free, egg-free, vegan.',
        pickupLocation: '19 Birch Lane, Hearth & Flour Bakery',
        pickupWindow: 'Today · 3:00 – 7:00 PM',
        donor: {
            name: 'Elena Rostova',
            role: 'Hearth & Flour Bakery',
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Old Town · 1.2 mi',
            verified: true,
        },
        tags: ['Vegan', 'Baked Today', 'Fresh Sourdough'],
    },
    {
        _id: 'comm-3',
        foodName: 'Crisp Honeycrisp Apples & Bartlett Pears',
        description: 'Freshly harvested orchard apples and sweet pears. Clean, sorted, and boxed in sturdy cardboard fruit trays for community groups and families.',
        photoUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'produce',
        quantity: 6,
        portionUnit: 'crates (~24 kg)',
        foodCondition: 'fresh produce',
        storageDetails: 'Stored in cool, shaded room at 10°C.',
        safetyNotes: 'Locally grown, unsprayed harvest. Washed and inspected before packing.',
        pickupLocation: '84 Orchard Way, Farm Stand Gate 2',
        pickupWindow: 'Today · 1:00 – 6:00 PM',
        donor: {
            name: 'Sarah Chen',
            role: 'Valley Community Orchard',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Greenview · 2.1 mi',
            verified: true,
        },
        tags: ['Organic', 'Fresh Produce', 'Bulk Fruit'],
    },
    {
        _id: 'comm-4',
        foodName: 'Hearty Tuscan White Bean & Kale Soup',
        description: 'Simmered cannellini beans, tender lacinato kale, fire-roasted tomatoes, and garden rosemary. Chilled immediately in 1-liter deli containers.',
        photoUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'meals',
        quantity: 22,
        portionUnit: 'containers',
        foodCondition: 'refrigerated',
        storageDetails: 'Rapidly chilled and held at 3°C. Ready to reheat thoroughly above 74°C.',
        safetyNotes: 'Vegan, gluten-free, low sodium. Contains celery.',
        pickupLocation: '110 Peace St, Fellowship Hall Side Door',
        pickupWindow: 'Today · 4:00 – 7:30 PM',
        donor: {
            name: 'St. Jude Community Kitchen',
            role: 'Non-Profit Kitchen',
            avatar: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Central District · 0.5 mi',
            verified: true,
        },
        tags: ['Vegan', 'Gluten-Free', 'Chilled & Labeled'],
    },
    {
        _id: 'comm-5',
        foodName: 'Assorted Morning Pastries & Croissants',
        description: 'Crispy butter croissants, chocolate pain au chocolat, and almond brioche rolls from morning cafe display, packed safely in bakery boxes.',
        photoUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'bakery',
        quantity: 20,
        portionUnit: 'pastries',
        foodCondition: 'baked today',
        storageDetails: 'Keep in dry, ambient room temperature. Can be warmed before serving.',
        safetyNotes: 'Contains dairy, wheat, eggs, tree nuts (almonds).',
        pickupLocation: '504 Riverfront Blvd, Morning Light Cafe',
        pickupWindow: 'Today · 2:00 – 6:00 PM',
        donor: {
            name: 'David Miller',
            role: 'Morning Light Cafe',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Riverfront · 1.5 mi',
            verified: false,
        },
        tags: ['Breakfast', 'Bakery Surplus', 'Cafe Partner'],
    },
    {
        _id: 'comm-6',
        foodName: 'Mediterranean Lemon Herb Chicken & Rice',
        description: 'Herb-marinated chicken breast fillets with spiced yellow basmati rice and roasted sweet peppers. Prepared for a private banquet with surplus trays.',
        photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
        category: 'meals',
        quantity: 12,
        portionUnit: 'family trays',
        foodCondition: 'refrigerated',
        storageDetails: 'Kept chilled at 2°C in walk-in cooler. Labeled with preparation timestamp.',
        safetyNotes: 'Halal certified chicken. Nut-free, peanut-free.',
        pickupLocation: '330 Commerce Rd, Catering Suite 4',
        pickupWindow: 'Today · 3:30 – 6:30 PM',
        donor: {
            name: 'Priya Sharma',
            role: 'Olive & Thyme Catering',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&auto=format&fit=crop&q=75&fm=webp',
            location: 'Eastside · 1.9 mi',
            verified: true,
        },
        tags: ['Halal', 'High Protein', 'Catering Quality'],
    },
];

export default function HomePage() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('all');
    const [userListings, setUserListings] = useState([]);

    // Modal State
    const [selectedListing, setSelectedListing] = useState(null);
    const [modalType, setModalType] = useState(null);

    // Fetch real listings created by logged in user
    useEffect(() => {
        if (session?.token) {
            apiRequest('/listings/mine', { token: session.token })
                .then(({ listings }) => {
                    if (listings && listings.length > 0) {
                        const formatted = listings.map(item => ({
                            ...item,
                            category: 'meals',
                            pickupWindow: item.pickupOpensAt
                                ? `Today · ${new Date(item.pickupOpensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${new Date(item.pickupClosesAt || item.pickupOpensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                                : 'Flexible pickup window',
                            donor: {
                                name: session.user.name,
                                role: 'Your Kitchen Donation',
                                avatar: '',
                                location: item.pickupLocation || 'Your specified location',
                                verified: true,
                            },
                            tags: ['Your Listing', item.foodCondition || 'Fresh'],
                        }));
                        setUserListings(formatted);
                    }
                })
                .catch(() => { });
        }
    }, [session]);

    // Combine user listings and community listings
    const allListings = useMemo(() => {
        return [...userListings, ...COMMUNITY_LISTINGS];
    }, [userListings]);

    // Filter listings based on category
    const filteredListings = useMemo(() => {
        return allListings.filter(item => {
            return activeCategory === 'all' || item.category === activeCategory;
        });
    }, [allListings, activeCategory]);

    const openListing = (listing) => {
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
                            <span><strong>18+</strong> Active Donations</span>
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
                                    <span>＋ List Surplus Food</span>
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
                        className={`category-tag-btn ${activeCategory === 'produce' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('produce')}
                    >
                        <span>🥗 Fresh Produce</span>
                    </button>
                </div>
            </section>

            {/* Feed Header */}
            <div className="feed-header-row">
                <h2>
                    <span>Live Surplus Food Feed</span>
                    <span className="feed-count-pill">{filteredListings.length} Ready</span>
                </h2>
                <p>Verified food donations ready for collection</p>
            </div>

            {/* Food Listings Feed Grid */}
            <div className="food-listings-grid">
                {filteredListings.map((item) => (
                    <article className="food-listing-card" key={item._id}>
                        {/* Food Photo Box */}
                        <div className="card-photo-box">
                            <img
                                src={item.photoUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&auto=format&fit=crop&q=70&fm=webp'}
                                alt={item.foodName}
                                className="card-photo-img"
                                loading="lazy"
                                decoding="async"
                            />
                            <span className="card-condition-pill">
                                ⚡ {item.foodCondition || 'fresh'}
                            </span>
                            <span className="card-time-pill">
                                <Clock size={12} />
                                <span>{item.pickupWindow}</span>
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
                                    <span>{item.donor.location}</span>
                                </span>
                            </div>

                            <div className="card-buttons-footer">
                                <button
                                    type="button"
                                    className="btn-card-receive"
                                    onClick={() => openListing(item)}
                                >
                                    <span>View more to receive</span>
                                    <ArrowRight size={13} />
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {/* Empty State */}
            {filteredListings.length === 0 && (
                <div className="panel" style={{ padding: '40px 20px', textAlign: 'center', marginTop: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#ffffff' }}>No surplus food in this category</h3>
                    <p style={{ margin: 0, color: 'var(--fb-text-sub)', fontSize: '13px' }}>
                        Select "All Surplus" above to browse all active donations.
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
                                    state={{ from: { pathname: `/listings/${encodeURIComponent(selectedListing._id)}/information`, state: { listing: selectedListing } } }}
                                    className="btn-gate-signin"
                                >
                                    <span>Sign in</span>
                                    <ArrowRight size={14} />
                                </Link>
                                <Link
                                    to="/register"
                                    state={{ from: { pathname: `/listings/${encodeURIComponent(selectedListing._id)}/information`, state: { listing: selectedListing } } }}
                                    className="btn-gate-register"
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
