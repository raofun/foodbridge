import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  verifyPickupByListing,
  verifyPickupDirect,
  getListingVerificationData,
  getActivePickupListings,
  getClaimPickupPass,
} from '../controllers/pickupVerificationController.js';

const router = Router();

// Handover Verification for a specific listing (Donor / Volunteer)
router.post('/listings/:id/verify-pickup', requireAuth, verifyPickupByListing);

// Listing Verification Station data (Pending vs Completed pickups)
router.get('/listings/:id/verification', requireAuth, getListingVerificationData);

// Active Listings with pending pickups for universal verification portal
router.get('/verification/active-listings', requireAuth, getActivePickupListings);

// Universal Direct Code Verification (Donor / Volunteer)
router.post('/verification/verify-code', requireAuth, verifyPickupDirect);

// Digital Pickup Pass for Receiver (Receiver / Volunteer)
router.get('/claims/:id/pickup-pass', requireAuth, getClaimPickupPass);

export default router;
