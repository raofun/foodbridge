import { Router } from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  createClaim,
  getMyClaims,
  cancelClaim,
  updateClaim,
  deleteClaim,
  getListingClaims,
} from '../controllers/claimController.js';

const router = Router();

// Receiver / Volunteer: fetch own claims
router.get('/mine', requireAuth, getMyClaims);

// Receiver / Volunteer: update a claim
router.put('/:id', requireAuth, updateClaim);

// Receiver / Volunteer: cancel a claim
router.post('/:id/cancel', requireAuth, cancelClaim);

// Receiver / Volunteer: permanently delete a claim (e.g. cancelled record)
router.delete('/:id', requireAuth, deleteClaim);

// Receiver / Volunteer: create a claim on a listing
router.post('/listing/:id', requireAuth, createClaim);

export default router;
