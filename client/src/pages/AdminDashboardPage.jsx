import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  UtensilsCrossed,
  HeartHandshake,
  CheckCircle2,
  Trash2,
  Search,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { session } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'listings'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [listingQuery, setListingQuery] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminFormError, setAdminFormError] = useState('');

  const [listingToDelete, setListingToDelete] = useState(null);
  const [deletingListing, setDeletingListing] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, usersRes, listingsRes] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/users'),
        apiRequest('/admin/listings'),
      ]);

      setStats(statsRes.stats || null);
      setUsers(usersRes.users || []);
      setListings(listingsRes.listings || []);
      setFeedback(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role: newRole },
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      setFeedback({ type: 'success', message: res.message || 'Role updated successfully.' });
      loadDashboardData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Could not update user role.' });
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PATCH',
      });

      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' }
            : u
        )
      );
      setFeedback({ type: 'success', message: res.message || 'User status updated.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Could not update status.' });
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminFormError('');

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword) {
      setAdminFormError('Please fill in all fields.');
      return;
    }
    if (newAdminPassword.length < 8) {
      setAdminFormError('Password must be at least 8 characters long.');
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await apiRequest('/admin/users/create-admin', {
        method: 'POST',
        body: {
          name: newAdminName.trim(),
          email: newAdminEmail.trim(),
          password: newAdminPassword,
        },
      });

      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setFeedback({ type: 'success', message: res.message || 'New administrator created successfully.' });
      loadDashboardData(true);
    } catch (err) {
      setAdminFormError(err.message || 'Failed to create admin.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;
    setDeletingListing(true);

    try {
      const res = await apiRequest(`/admin/listings/${listingToDelete._id}`, {
        method: 'DELETE',
      });

      setListings((prev) => prev.filter((l) => l._id !== listingToDelete._id));
      setListingToDelete(null);
      setFeedback({ type: 'success', message: res.message || 'Listing removed successfully.' });
      loadDashboardData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Could not remove listing.' });
    } finally {
      setDeletingListing(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);

    try {
      const res = await apiRequest(`/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null);
      setFeedback({ type: 'success', message: res.message || 'User record permanently deleted.' });
      loadDashboardData(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Could not delete user record.' });
    } finally {
      setDeletingUser(false);
    }
  };
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !userQuery.trim() ||
        u.name?.toLowerCase().includes(userQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userQuery.toLowerCase());

      const matchesRole =
        userRoleFilter === 'all' ||
        (userRoleFilter === 'suspended' ? u.status === 'suspended' : u.role === userRoleFilter);

      return matchesQuery && matchesRole;
    });
  }, [users, userQuery, userRoleFilter]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchesQuery =
        !listingQuery.trim() ||
        l.foodName?.toLowerCase().includes(listingQuery.toLowerCase()) ||
        l.pickupLocation?.toLowerCase().includes(listingQuery.toLowerCase()) ||
        l.donor?.name?.toLowerCase().includes(listingQuery.toLowerCase());

      const matchesStatus =
        listingStatusFilter === 'all' || l.status === listingStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [listings, listingQuery, listingStatusFilter]);

  const currentUserId = String(session?.user?.id || session?.user?._id || '');

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-badge-row">
            <span className="admin-shield-badge">
              <ShieldAlert size={14} />
              <span>Admin Control Center</span>
            </span>
            <span className="admin-role-indicator">
              Signed in as <strong>{session?.user?.email}</strong>
            </span>
          </div>
          <h1 className="admin-page-title">Platform Administration</h1>
          <p className="admin-page-subtitle">
            Manage user roles, platform permissions, and surplus food distribution records.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-refresh"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            title="Refresh dashboard data"
          >
            <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn-admin-add"
            onClick={() => {
              setAdminFormError('');
              setShowAddAdminModal(true);
            }}
          >
            <UserPlus size={16} />
            <span>+ Add Admin</span>
          </button>
        </div>
      </header>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className={`admin-feedback-banner ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
          <button
            type="button"
            className="btn-close-feedback"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Metric Tiles (4 Simple Cards) */}
      <section className="admin-stats-grid" aria-label="Platform Statistics">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper user-icon">
            <Users size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{stats ? stats.totalUsers : '—'}</span>
            <span className="stat-breakdown">
              {stats?.usersByRole
                ? `${stats.usersByRole.donors} Donors • ${stats.usersByRole.receivers} Receivers • ${stats.usersByRole.admins} Admins`
                : 'Loading roles...'}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper food-icon">
            <UtensilsCrossed size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Surplus Listings</span>
            <span className="stat-value">{stats ? stats.activeListings : '—'}</span>
            <span className="stat-breakdown">
              {stats ? `${stats.totalListings} total listed across Dhaka` : 'Available in feed'}
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper rescue-icon">
            <HeartHandshake size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rescued Portions</span>
            <span className="stat-value">{stats ? stats.totalRescuedPortions : '—'}</span>
            <span className="stat-breakdown">Servings saved from waste</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper verify-icon">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Verified Handovers</span>
            <span className="stat-value">{stats ? stats.completedClaims : '—'}</span>
            <span className="stat-breakdown">
              {stats ? `${stats.totalClaims} reservations initiated` : 'Confirmed pickups'}
            </span>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="admin-tabs-bar">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>User Accounts & Roles</span>
          <span className="tab-count-pill">{users.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
        >
          <UtensilsCrossed size={16} />
          <span>Listing Moderation</span>
          <span className="tab-count-pill">{listings.length}</span>
        </button>
      </div>

      {/* TAB 1: USER ACCOUNTS & ROLES */}
      {activeTab === 'users' && (
        <section className="admin-section-content">
          <div className="admin-table-toolbar">
            <div className="admin-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              {userQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setUserQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="admin-filter-pills">
              {['all', 'donor', 'receiver', 'volunteer', 'admin', 'member', 'suspended'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`admin-filter-pill ${userRoleFilter === r ? 'active' : ''}`}
                  onClick={() => setUserRoleFilter(r)}
                >
                  {r === 'all'
                    ? 'All Users'
                    : r === 'suspended'
                    ? 'Suspended'
                    : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <span>Loading user registry...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty-state">
              <Users size={32} />
              <p>No users found matching your search or filter.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Current Role</th>
                    <th>Account Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = String(u._id || u.id) === currentUserId;
                    const isSuspended = u.status === 'suspended';

                    return (
                      <tr key={u._id} className={isSuspended ? 'row-suspended' : ''}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-circle">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="user-meta">
                              <span className="user-cell-name">
                                {u.name}
                                {isSelf && <span className="self-badge">You</span>}
                              </span>
                              <span className="user-cell-email">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="role-select-wrap">
                            <select
                              className={`role-select role-${u.role || 'member'}`}
                              value={u.role || 'member'}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              title={isSelf ? 'Cannot demote your own account' : 'Change user role'}
                            >
                              <option value="donor">Donor</option>
                              <option value="receiver">Receiver</option>
                              <option value="volunteer">Volunteer</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                          </div>
                        </td>

                        <td>
                          <span className={`admin-account-status-pill ${isSuspended ? 'status-suspended' : 'status-active'}`}>
                            {isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td>
                          <span className="date-cell">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="user-action-group">
                            <button
                              type="button"
                              className={`btn-action-status ${isSuspended ? 'activate' : 'suspend'}`}
                              disabled={isSelf}
                              onClick={() => handleToggleStatus(u._id)}
                              title={
                                isSelf
                                  ? 'Cannot suspend your own account'
                                  : isSuspended
                                  ? 'Re-activate account'
                                  : 'Suspend account access'
                              }
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>

                            {isSuspended && (
                              <button
                                type="button"
                                className="btn-action-delete-user"
                                disabled={isSelf}
                                onClick={() => setUserToDelete(u)}
                                title="Permanently delete suspended user record from database"
                              >
                                <Trash2 size={13} />
                                <span>Delete Record</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: LISTING MODERATION */}
      {activeTab === 'listings' && (
        <section className="admin-section-content">
          <div className="admin-table-toolbar">
            <div className="admin-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search listings by title, donor, or location..."
                value={listingQuery}
                onChange={(e) => setListingQuery(e.target.value)}
              />
              {listingQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setListingQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="admin-filter-pills">
              {['all', 'available', 'claimed', 'completed', 'draft'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`admin-filter-pill ${listingStatusFilter === s ? 'active' : ''}`}
                  onClick={() => setListingStatusFilter(s)}
                >
                  {s === 'all' ? 'All Listings' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-state">
              <RefreshCw size={24} className="spin-icon" />
              <span>Loading listings for moderation...</span>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="admin-empty-state">
              <UtensilsCrossed size={32} />
              <p>No listings found matching your search or status filter.</p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Food Donation</th>
                    <th>Donor</th>
                    <th>Location</th>
                    <th>Portions</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Moderation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((l) => (
                    <tr key={l._id}>
                      <td>
                        <div className="listing-cell">
                          {l.photoUrl ? (
                            <img
                              src={l.photoUrl}
                              alt={l.foodName}
                              className="listing-cell-thumb"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="listing-cell-thumb-placeholder">
                              <UtensilsCrossed size={16} />
                            </div>
                          )}
                          <div className="listing-meta">
                            <span className="listing-cell-title">{l.foodName}</span>
                            <span className="listing-cell-cat">{l.category || 'Surplus Food'}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="donor-cell">
                          <span className="donor-name">{l.donor?.name || 'Unknown Donor'}</span>
                          <span className="donor-email">{l.donor?.email || '—'}</span>
                        </div>
                      </td>

                      <td>
                        <span className="location-cell">{l.pickupLocation || 'Dhaka'}</span>
                      </td>

                      <td>
                        <span className="portion-cell">
                          <strong>{l.quantity}</strong> {l.portionUnit || 'servings'}
                        </span>
                      </td>

                      <td>
                        <span className={`listing-status-pill status-${l.status}`}>
                          {l.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-row-actions">
                          <a
                            href={`/listings/${l._id}/information`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-view-link"
                            title="View safety passport in new tab"
                          >
                            <ExternalLink size={14} />
                          </a>

                          <button
                            type="button"
                            className="btn-admin-delete"
                            onClick={() => setListingToDelete(l)}
                            title="Emergency Remove: permanently delete listing and claims"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MODAL: ADD NEW ADMIN */}
      {showAddAdminModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddAdminModal(false)}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-admin-title"
          >
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 id="add-admin-title" className="modal-heading">
                    Add Platform Administrator
                  </h2>
                  <p className="modal-subheading">
                    Create a new privileged account with full administrative rights.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAddAdminModal(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="admin-modal-form">
              {adminFormError && (
                <div className="modal-error-banner">
                  <AlertTriangle size={14} />
                  <span>{adminFormError}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="adminName">Full Name</label>
                <input
                  id="adminName"
                  type="text"
                  placeholder="e.g., Tahmid Rahman"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminEmail">Email Address</label>
                <input
                  id="adminEmail"
                  type="email"
                  placeholder="admin.name@foodbridge.org"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="adminPassword">Temporary Password</label>
                <input
                  id="adminPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <span className="field-hint">
                  <Lock size={12} /> The new admin can sign in immediately with these credentials.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowAddAdminModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={creatingAdmin}
                >
                  {creatingAdmin ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE LISTING */}
      {listingToDelete && (
        <div className="admin-modal-overlay" onClick={() => setListingToDelete(null)}>
          <div
            className="admin-modal-card modal-danger"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="delete-listing-title"
          >
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge danger">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 id="delete-listing-title" className="modal-heading">
                    Permanently Remove Listing?
                  </h2>
                  <p className="modal-subheading">
                    This action will immediately delete <strong>"{listingToDelete.foodName}"</strong> and any associated reservation claims from the database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setListingToDelete(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setListingToDelete(null)}
              >
                Keep Listing
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={confirmDeleteListing}
                disabled={deletingListing}
              >
                {deletingListing ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Remove Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE SUSPENDED USER */}
      {userToDelete && (
        <div className="admin-modal-overlay" onClick={() => setUserToDelete(null)}>
          <div
            className="admin-modal-card modal-danger"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="delete-user-title"
          >
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge danger">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 id="delete-user-title" className="modal-heading">
                    Permanently Delete User Record?
                  </h2>
                  <p className="modal-subheading">
                    This will permanently delete the suspended account for <strong>"{userToDelete.name}"</strong> ({userToDelete.email}) and wipe their records from the MongoDB database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setUserToDelete(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setUserToDelete(null)}
              >
                Keep Record
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={confirmDeleteUser}
                disabled={deletingUser}
              >
                {deletingUser ? (
                  <>
                    <RefreshCw size={14} className="spin-icon" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Yes, Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
