import { Router } from 'express';
import { getFoodInformation, saveFoodInformation } from '../controllers/foodInformationController.js';
import requireAuth, { optionalAuth } from '../middleware/requireAuth.js';

const router = Router();
router.get('/:id/information', optionalAuth, getFoodInformation);
router.patch('/:id/information', requireAuth, saveFoodInformation);
export default router;
