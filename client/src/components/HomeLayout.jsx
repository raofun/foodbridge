import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
    UtensilsCrossed,
    Home,
    PlusCircle,
    LogOut,
    ArrowRight,
    Sparkles,
    Menu,
    X,
    HeartHandshake
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import '../styles/homeLayout.css';

export default function HomeLayout() {
    const { session, signOut } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [feedListings, setFeedListings] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState('');

    // Keep one feed request for the layout and homepage in sync.
    const reloadFeed = useCallback(async (signal) => {
        setFeedLoading(true);
        setFeedError('');
        try {
            const { listings } = await apiRequest('/listings/feed', { signal });
            const items = listings || [];
            setFeedListings(items);
        } catch (error) {
            if (signal?.aborted) return;
            setFeedError(error.message || 'Unable to load community listings.');
            setFeedListings([]);
        } finally {
            if (!signal?.aborted) setFeedLoading(false);
        }
    }, []);

    // Refresh the feed on route changes, matching the existing refresh behavior.
    useEffect(() => {
        const controller = new AbortController();
        reloadFeed(controller.signal);
        return () => controller.abort();
    }, [location.pathname, reloadFeed]);

    // Close mobile drawer when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Current section title for topbar route indicator
    const getPageTitle = () => {
        if (location.pathname === '/') return 'Community Feed';
        if (location.pathname.startsWith('/listings/new') || location.pathname.startsWith('/create-listing')) return 'Create Listing';
        if (location.pathname.includes('/information') || location.pathname.includes('/food-information')) return 'Food Information';
        if (location.pathname.includes('/pickup')) return 'Pickup Schedule';
        if (location.pathname.startsWith('/listings/mine')) return 'My Listings';
        return 'FoodBridge Network';
    };

    return (
        <div className="dashboard">
            {/* Topbar Glass Navigation */}
            <header className="topbar">
                <div className="topbar-left">
                    <button
                        type="button"
                        className="mobile-menu-trigger"
                        onClick={() => setMobileMenuOpen(prev => !prev)}
                        aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-navigation"
                    >
                        {mobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
                    </button>

                    {/* Brand */}
                    <NavLink to="/" className="auth-brand-badge">
                        <div className="auth-brand-icon">
                            <UtensilsCrossed size={18} strokeWidth={2.4} />
                        </div>
                        <span className="brand-text">FoodBridge</span>
                        <span className="brand-subpill">Community</span>
                    </NavLink>
                </div>

                {/* Center Route Indicator (Desktop) */}
                <div className="topbar-center">
                    <div className="breadcrumb-chip">
                        <span className="breadcrumb-dot" />
                        <span className="breadcrumb-text">{getPageTitle()}</span>
                    </div>
                </div>

                {/* User Identity / Auth Actions */}
                <div className="topbar-right">
                    {session ? (
                        <>
                            <div className="user-pill">
                                <span className="avatar">
                                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                                <div className="user-info-text">
                                    <span className="user-name">{session.user?.name}</span>
                                    <span className="role-badge">{session.user?.role ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1) : 'Member'}</span>
                                </div>
                            </div>
                            <button type="button" className="signout" onClick={signOut} title="Sign Out">
                                <LogOut size={14} />
                                <span className="signout-label">Sign out</span>
                            </button>
                        </>
                    ) : (
                        <div className="topbar-auth-group">
                            <Link to="/login" className="btn-topbar-signin">
                                Sign in
                            </Link>
                            <Link to="/register" className="btn-topbar-signup">
                                <span>Join Network</span>
                                <ArrowRight size={13} strokeWidth={2.5} />
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Layout Flex Container */}
            <div className="dashboard-wrap">
                <aside id="mobile-navigation" className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {/* Mobile Drawer Header */}
                    <div className="sidebar-mobile-header">
                        <div className="sidebar-mobile-brand">
                            <div className="auth-brand-icon" style={{ width: '30px', height: '30px' }}>
                                <UtensilsCrossed size={15} strokeWidth={2.4} />
                            </div>
                            <span>FoodBridge</span>
                        </div>
                        <button
                            type="button"
                            className="sidebar-close-btn"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close menu"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="sidebar-nav-section">
                        <span className="sidebar-section-title">EXPLORE</span>

                        <NavLink end to="/" className={({ isActive }) => `nav-item${isActive ? ' selected' : ''}`}>
                            <div className="nav-icon-box">
                                <Home size={15} />
                            </div>
                            <span className="nav-title">Community Feed</span>
                            <span className="nav-pill-live">
                                <span className="dot-pulse" />
                                <span>Live</span>
                            </span>
                        </NavLink>

                        {session && (
                            <NavLink
                                to="/listings/new"
                                className={({ isActive }) =>
                                    `nav-item${isActive || location.pathname.startsWith('/create-listing') ? ' selected' : ''}`
                                }
                            >
                                <div className="nav-icon-box">
                                    <PlusCircle size={15} />
                                </div>
                                <span className="nav-title">Create Listing</span>
                                <span className="nav-pill-action">＋ New</span>
                            </NavLink>
                        )}
                    </div>

                    <div className="sidebar-bottom-group">
                        {/* Community Pulse stays with the account actions at the sidebar bottom. */}
                        <div className="sidebar-pulse-card">
                            <div className="pulse-header">
                                <HeartHandshake size={14} className="pulse-icon" />
                                <span>Community Pulse</span>
                            </div>
                            <div className="pulse-stats-grid">
                                <div className="pulse-stat">
                                    <span className="stat-number">{feedListings.length}</span>
                                    <span className="stat-label">Total Meals</span>
                                </div>
                                <div className="pulse-stat">
                                    <span className="stat-number">100%</span>
                                    <span className="stat-label">Free Rescue</span>
                                </div>
                            </div>
                        </div>

                        {/* Keep the signed-in profile anchored at the very bottom. */}
                        {!session ? (
                            <div className="sidebar-cta-card">
                                <div className="cta-icon-pill">
                                    <Sparkles size={12} />
                                    <span>ZERO FOOD WASTE</span>
                                </div>
                                <h4>Rescue. Share. Nourish.</h4>
                                <p>
                                    Connect surplus food with local community members and shelters.
                                </p>
                                <Link to="/register" className="btn-sidebar-join">
                                    <span>Get Started Free</span>
                                    <ArrowRight size={13} />
                                </Link>
                            </div>
                        ) : (
                            <div className="sidebar-user-card">
                                <div className="sidebar-user-avatar">
                                    {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="sidebar-user-meta">
                                    <span className="sidebar-user-name">{session.user?.name}</span>
                                    <span className="sidebar-user-role">{session.user?.role ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1) : 'Member'}</span>
                                </div>
                                <button
                                    type="button"
                                    className="sidebar-user-logout"
                                    onClick={signOut}
                                    title="Sign out"
                                    aria-label="Sign out"
                                >
                                    <LogOut size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="dashboard-main">
                    <Outlet context={{ feedListings, feedLoading, feedError, reloadFeed }} />
                </main>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="mobile-sidebar-backdrop"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}

