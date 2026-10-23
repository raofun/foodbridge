import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { getPublicFeed } from '../controllers/foodListingController.js';
import foodListings from './foodListings.js';
import foodInformation from './foodInformation.js';
import pickupSchedules from './pickupSchedules.js';

const router = Router();

// Public route for community feed on homepage (no authentication required)
router.get('/feed', getPublicFeed);

// Protected routes (require valid JWT bearer token)
router.use(requireAuth);
router.use('/', foodListings);
router.use('/', foodInformation);
router.use('/', pickupSchedules);

export default router;
