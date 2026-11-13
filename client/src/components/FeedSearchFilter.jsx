import {
    Search,
    MapPin,
    Clock,
    Sparkles,
    UtensilsCrossed,
    ChefHat,
    X,
    RotateCcw
} from 'lucide-react';
import './FeedSearchFilter.css';

export const DHAKA_AREAS = [
    { value: 'all', label: '📍 All Areas (Dhaka)' },
    { value: 'dhanmondi', label: 'Dhanmondi / Kalabagan' },
    { value: 'gulshan', label: 'Gulshan 1 & 2' },
    { value: 'banani', label: 'Banani / Kemal Ataturk' },
    { value: 'uttara', label: 'Uttara (Sectors 1–14)' },
    { value: 'mirpur', label: 'Mirpur (1, 2, 10, 11, 12, DOHS)' },
    { value: 'mohammadpur', label: 'Mohammadpur / Adabor' },
    { value: 'bashundhara', label: 'Bashundhara R/A / Baridhara' },
    { value: 'badda', label: 'Badda / Rampura / Aftabnagar' },
    { value: 'old-dhaka', label: 'Old Dhaka (Lalbagh / Sadarghat)' },
    { value: 'motijheel', label: 'Motijheel / Paltan / Khilgaon' },
    { value: 'mohakhali', label: 'Mohakhali / DOHS' },
    { value: 'farmgate', label: 'Farmgate / Panthapath / Tejgaon' },
    { value: 'malibagh', label: 'Malibagh / Shantinagar / Bailey Rd' },
    { value: 'savar', label: 'Savar / Keraniganj Outskirts' },
];

export const TIME_OPTIONS = [
    { value: 'all', label: '🕒 Any Pickup Window' },
    { value: 'critical', label: '🔥 Critical (< 1 Hour Left)' },
    { value: 'urgent', label: '⚡ Urgent (< 3 Hours Left)' },
    { value: 'today', label: '📅 Today\'s Pickups' },
    { value: 'evening', label: '🌅 Evening (6 PM – 11 PM)' },
    { value: 'upcoming', label: '🕒 Tomorrow & Beyond' },
    { value: 'flexible', label: '🌱 Flexible Window' },
];

export const AVAILABILITY_OPTIONS = [
    { value: 'all', label: '🌐 All Surplus (Total)' },
    { value: 'available', label: '🟢 Active / Available' },
    { value: 'closed', label: '⏸ Closed / Expired' },
];

export const CATEGORIES = [
    { value: 'all', label: 'All Surplus', icon: UtensilsCrossed },
    { value: 'meals', label: 'Cooked Meals', icon: ChefHat },
    { value: 'bakery', label: 'Artisan Bakery', emoji: '🥖' },
    { value: 'produce', label: 'Fresh Produce', emoji: '🥗' },
    { value: 'fruits', label: 'Fresh Fruits', emoji: '🍎' },
    { value: 'dairy', label: 'Dairy & Sweets', emoji: '🥛' },
    { value: 'packaged', label: 'Packaged & Pantry', emoji: '🥫' },
    { value: 'beverages', label: 'Beverages', emoji: '🧃' },
    { value: 'other', label: 'Other Surplus', emoji: '📦' },
];

export default function FeedSearchFilter({
    filters = {
        search: '',
        area: 'all',
        category: 'all',
        availability: 'all',
        pickupTime: 'all',
    },
    onFilterChange,
    totalMatches = 0,
    activeMatches = 0,
}) {
    const activeFilterCount = [
        filters.search && filters.search.trim(),
        filters.area && filters.area !== 'all',
        filters.category && filters.category !== 'all',
        filters.availability && filters.availability !== 'all',
        filters.pickupTime && filters.pickupTime !== 'all',
    ].filter(Boolean).length;

    const handleSearchChange = (e) => {
        onFilterChange?.({ ...filters, search: e.target.value });
    };

    const handleClearSearch = () => {
        onFilterChange?.({ ...filters, search: '' });
    };

    const handleSelectChange = (key, value) => {
        onFilterChange?.({ ...filters, [key]: value });
    };

    const handleResetAll = () => {
        onFilterChange?.({
            search: '',
            area: 'all',
            category: 'all',
            availability: 'all',
            pickupTime: 'all',
        });
    };

    return (
        <section className="feed-filter-console" aria-label="Search and filter community food surplus">
            <div className="filter-controls-row">
                <div className="filter-search-field">
                    <Search size={17} className="filter-field-icon search-icon" />
                    <input
                        type="text"
                        placeholder="Search food by dish, donor, keyword, or address..."
                        value={filters.search || ''}
                        onChange={handleSearchChange}
                        className="filter-text-input"
                    />
                    {filters.search && (
                        <button
                            type="button"
                            className="filter-clear-icon-btn"
                            onClick={handleClearSearch}
                            aria-label="Clear search input"
                            title="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="filter-selects-group">
                    <div className="filter-select-wrapper area-select" title="Filter by Neighborhood">
                        <MapPin size={15} className="filter-select-icon map-icon" />
                        <select
                            value={filters.area || 'all'}
                            onChange={(e) => handleSelectChange('area', e.target.value)}
                            className="filter-select-input"
                            aria-label="Filter by neighborhood or area"
                        >
                            {DHAKA_AREAS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-select-wrapper time-select" title="Filter by Pickup Urgency">
                        <Clock size={15} className="filter-select-icon time-icon" />
                        <select
                            value={filters.pickupTime || 'all'}
                            onChange={(e) => handleSelectChange('pickupTime', e.target.value)}
                            className="filter-select-input"
                            aria-label="Filter by pickup schedule urgency"
                        >
                            {TIME_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-select-wrapper status-select" title="Filter by Availability">
                        <Sparkles size={15} className="filter-select-icon status-icon" />
                        <select
                            value={filters.availability || 'all'}
                            onChange={(e) => handleSelectChange('availability', e.target.value)}
                            className="filter-select-input"
                            aria-label="Filter by availability status"
                        >
                            {AVAILABILITY_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="filter-categories-row">
                <div className="filter-category-chips">
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = (filters.category || 'all') === cat.value;
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                className={`filter-chip-btn ${isActive ? 'active' : ''}`}
                                onClick={() => handleSelectChange('category', cat.value)}
                            >
                                {Icon && <Icon size={13} className="chip-icon" />}
                                {cat.emoji && <span className="chip-emoji">{cat.emoji}</span>}
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="filter-summary-actions">
                    <span className="filter-match-count">
                        <strong>{totalMatches}</strong> total ({activeMatches} active)
                    </span>
                    {activeFilterCount > 0 && (
                        <button
                            type="button"
                            className="filter-reset-btn"
                            onClick={handleResetAll}
                            title="Reset all filters to defaults"
                        >
                            <RotateCcw size={12} />
                            <span>Reset ({activeFilterCount})</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
