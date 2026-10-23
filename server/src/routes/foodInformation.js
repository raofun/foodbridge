import { Router } from 'express';
import { getFoodInformation, saveFoodInformation } from '../controllers/foodInformationController.js';

const router = Router();
router.get('/:id/information', getFoodInformation);
router.patch('/:id/information', saveFoodInformation);
export default router;
