import { Router } from 'express';
import { getPickupSchedule, savePickupSchedule } from '../controllers/pickupScheduleController.js';
import requireAuth, { optionalAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/:id/pickup', optionalAuth, getPickupSchedule);
router.patch('/:id/pickup', requireAuth, savePickupSchedule);
router.put('/:id/pickup', requireAuth, savePickupSchedule);

export default router;
