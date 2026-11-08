import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getPublicFeed } from '../controllers/foodListingController.js';
import foodListings from './foodListings.js';
import foodInformation from './foodInformation.js';
import pickupSchedules from './pickupSchedules.js';

const router = Router();

// Public routes (no authentication required, or optional auth for published listings)
router.get('/feed', getPublicFeed);
router.use('/', foodInformation);

// Protected routes (require valid JWT bearer token)
router.use(requireAuth);
router.use('/', foodListings);
router.use('/', pickupSchedules);

export default router;
