import { Router } from 'express';
import { getPublicFeed } from '../controllers/foodListingController.js';
import { createClaim, getListingClaims } from '../controllers/claimController.js';
import requireAuth, { optionalAuth } from '../middleware/requireAuth.js';
import foodListings from './foodListings.js';
import foodInformation from './foodInformation.js';
import pickupSchedules from './pickupSchedules.js';

const router = Router();

router.get('/feed', getPublicFeed);
router.post('/:id/claim', requireAuth, createClaim);
router.get('/:id/claims', requireAuth, getListingClaims);
router.use('/', foodInformation);
router.use('/', pickupSchedules);
router.use('/', foodListings);

export default router;
