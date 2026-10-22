import { Router } from 'express';
import { createListing, deleteListing, getListing, myListings } from '../controllers/foodListingController.js';

const router = Router();
router.post('/', createListing);
router.get('/mine', myListings);
router.get('/:id', getListing);
router.delete('/:id', deleteListing);
export default router;
