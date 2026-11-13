import { Router } from 'express';
import requireAuth, { optionalAuth } from '../middleware/requireAuth.js';
import {
  createListing,
  deleteListing,
  getListing,
  myListings,
  updateListing
} from '../controllers/foodListingController.js';

const router = Router();

router.post('/', requireAuth, createListing);
router.get('/mine', requireAuth, myListings);
router.get('/:id', optionalAuth, getListing);
router.patch('/:id', requireAuth, updateListing);
router.put('/:id', requireAuth, updateListing);
router.delete('/:id', requireAuth, deleteListing);

export default router;
