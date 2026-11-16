import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import requireAdmin from '../middleware/requireAdmin.js';
import {
  getStats,
  getUsers,
  createAdmin,
  updateUserRole,
  toggleUserStatus,
  getAdminListings,
  deleteAdminListing,
  deleteAdminUser,
} from '../controllers/adminController.js';

const router = Router();

// Protect all admin routes with authentication AND admin role checks
router.use(requireAuth, requireAdmin);

// Platform Overview Stats
router.get('/stats', getStats);

// User Management
router.get('/users', getUsers);
router.post('/users/create-admin', createAdmin);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteAdminUser);

// Listing Moderation
router.get('/listings', getAdminListings);
router.delete('/listings/:id', deleteAdminListing);

export default router;
