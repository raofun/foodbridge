import { Router } from 'express';
import { savePickupSchedule } from '../controllers/pickupScheduleController.js';

const router = Router();
router.patch('/:id/pickup', savePickupSchedule);
export default router;
