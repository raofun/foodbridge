import { Router } from 'express';
import { getPublicFeed } from '../controllers/foodListingController.js';
import foodListings from './foodListings.js';
import foodInformation from './foodInformation.js';
import pickupSchedules from './pickupSchedules.js';

const router = Router();

router.get('/feed', getPublicFeed);
router.use('/', foodInformation);
router.use('/', pickupSchedules);
router.use('/', foodListings);

export default router;
