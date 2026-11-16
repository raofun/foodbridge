import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  createClaim,
  getMyClaims,
  cancelClaim,
  updateClaim,
  getListingClaims,
} from '../controllers/claimController.js';

const router = Router();

// Receiver / Volunteer: fetch own claims
router.get('/mine', requireAuth, getMyClaims);

// Receiver / Volunteer: update a claim
router.put('/:id', requireAuth, updateClaim);

// Receiver / Volunteer: cancel a claim
router.post('/:id/cancel', requireAuth, cancelClaim);

// Receiver / Volunteer: create a claim on a listing
router.post('/listing/:id', requireAuth, createClaim);

export default router;
