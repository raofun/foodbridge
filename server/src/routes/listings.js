import { Router } from 'express';
import { createListing, deleteListing, myListings, updateListing } from '../controllers/listingController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.post('/', createListing);
router.get('/mine', myListings);
router.patch('/:id', updateListing);
router.delete('/:id', deleteListing);
export default router;
