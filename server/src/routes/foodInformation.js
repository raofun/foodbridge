import { Router } from 'express';
import { saveFoodInformation } from '../controllers/foodInformationController.js';

const router = Router();
router.patch('/:id/information', saveFoodInformation);
export default router;
