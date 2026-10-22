import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import foodListings from './foodListings.js';
import foodInformation from './foodInformation.js';
import pickupSchedules from './pickupSchedules.js';

const router = Router();
router.use(requireAuth);
router.use('/', foodListings);
router.use('/', foodInformation);
router.use('/', pickupSchedules);
export default router;
