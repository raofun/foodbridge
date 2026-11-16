import Listing from '../models/Listing.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';

const ALLOWED_RECEIVER_ROLES = ['receiver', 'volunteer'];

/**
 * FR09: Create a food portion reservation (claim).
 * Strict access control: Only logged-in receivers and volunteers can claim from other donors.
 */
export async function createClaim(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Please sign in to reserve food.' });
    }

    const userRole = String(req.user.role || '').trim().toLowerCase();
    if (!ALLOWED_RECEIVER_ROLES.includes(userRole)) {
      return res.status(403).json({
        message: 'Only receiver and volunteer accounts can claim food donations. Donors cannot make reservations.',
      });
    }

    const { id: listingId } = req.params;
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Volunteers and receivers CANNOT claim their own listings!
    const currentUserId = String(req.user.id || req.user._id);
    const donorId = String(listing.donor?._id || listing.donor);
    if (currentUserId && donorId && currentUserId === donorId) {
      return res.status(403).json({
        message: 'You cannot claim your own food listing. You can only reserve food from other donors.',
      });
    }

    const receiverId = req.user.id || req.user._id;

    // Check listing status
    if (listing.status !== 'available') {
      return res.status(400).json({
        message: listing.status === 'claimed'
          ? 'This surplus food has already been fully claimed.'
          : 'This listing is not currently available for reservation.',
      });
    }

    // Check pickup deadline
    const deadline = listing.pickupDeadline || listing.pickupClosesAt;
    if (deadline && new Date(deadline).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'The pickup window for this listing has expired.' });
    }

    // Validate requested quantity
    const numQty = Number(req.body.quantity);
    if (!Number.isInteger(numQty) || numQty < 1) {
      return res.status(400).json({ message: 'Requested quantity must be a whole number of at least 1.' });
    }

    const currentClaimed = listing.claimedQuantity || 0;
    const remaining = Math.max(0, listing.quantity - currentClaimed);
    if (numQty > remaining) {
      return res.status(400).json({
        message: remaining === 0
          ? 'This food listing is fully claimed.'
          : `Only ${remaining} ${listing.portionUnit} remaining. Cannot reserve ${numQty}.`,
      });
    }

    // Optional estimated pickup time
    let estimatedDate = null;
    if (req.body.estimatedPickupAt) {
      const parsed = new Date(req.body.estimatedPickupAt);
      if (!Number.isFinite(parsed.getTime())) {
        return res.status(400).json({ message: 'Estimated pickup time is invalid.' });
      }
      if (parsed.getTime() < Date.now() - 5 * 60 * 1000) {
        return res.status(400).json({ message: 'Estimated pickup time cannot be in the past.' });
      }
      if (listing.pickupClosesAt && parsed.getTime() > new Date(listing.pickupClosesAt).getTime()) {
        return res.status(400).json({ message: 'Estimated pickup time cannot be after the pickup window closes.' });
      }
      estimatedDate = parsed;
    }

    // Update listing dynamic stock
    listing.claimedQuantity = currentClaimed + numQty;
    if (listing.claimedQuantity >= listing.quantity) {
      listing.status = 'claimed';
    }
    await listing.save();

    // Parse optional people fed
    const parsedPeopleFed = req.body.peopleFed !== undefined && req.body.peopleFed !== null && req.body.peopleFed !== ''
      ? Math.max(1, Number(req.body.peopleFed))
      : null;

    // Create the Claim record
    const claim = await Claim.create({
      listing: listing._id,
      receiver: receiverId,
      quantity: numQty,
      portionUnit: listing.portionUnit,
      status: 'reserved',
      recipientName: req.body.recipientName?.trim() || req.user?.name || 'Community Member',
      contactPhone: req.body.contactPhone?.trim() || '',
      peopleFed: parsedPeopleFed,
      hasContainers: req.body.hasContainers !== undefined ? Boolean(req.body.hasContainers) : true,
      reservationPurpose: req.body.reservationPurpose || 'household',
      estimatedPickupAt: estimatedDate,
      receiverNotes: req.body.receiverNotes?.trim() || '',
    });

    const populatedClaim = await Claim.findById(claim._id)
      .populate({
        path: 'listing',
        select: 'foodName photoUrl pickupLocation pickupOpensAt pickupClosesAt pickupDeadline status donor category',
        populate: { path: 'donor', select: 'name email role' },
      });

    return res.status(201).json({
      message: 'Food portion reserved successfully!',
      claim: populatedClaim,
      listing: {
        _id: listing._id,
        status: listing.status,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        remainingQuantity: Math.max(0, listing.quantity - listing.claimedQuantity),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * FR09: Fetch all reservations made by the logged-in receiver/volunteer.
 */
export async function getMyClaims(req, res, next) {
  try {
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    if (!['receiver', 'volunteer'].includes(userRole)) {
      return res.status(403).json({
        message: 'Only receiver and volunteer accounts can access reservations.',
      });
    }

    const claims = await Claim.find({ receiver: req.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'listing',
        select: 'foodName description photoUrl pickupLocation pickupOpensAt pickupClosesAt pickupDeadline category storageDetails foodCondition status quantity claimedQuantity donor',
        populate: { path: 'donor', select: 'name email role' },
      })
      .lean();

    return res.json({ claims });
  } catch (error) {
    next(error);
  }
}

/**
 * FR09: Cancel a reservation and return portions back to community feed.
 */
export async function cancelClaim(req, res, next) {
  try {
    const { id: claimId } = req.params;
    const claim = await Claim.findOne({ _id: claimId, receiver: req.user.id });
    if (!claim) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (claim.status === 'cancelled') {
      return res.status(400).json({ message: 'This reservation is already cancelled.' });
    }

    claim.status = 'cancelled';
    await claim.save();

    // Return claimed portions back to the listing
    const listing = await Listing.findById(claim.listing);
    if (listing) {
      listing.claimedQuantity = Math.max(0, (listing.claimedQuantity || 0) - claim.quantity);

      // If listing was 'claimed' and portions are now available, check if still within pickup window
      if (listing.status === 'claimed' && listing.claimedQuantity < listing.quantity) {
        const deadline = listing.pickupDeadline || listing.pickupClosesAt;
        const isExpired = deadline && new Date(deadline).getTime() <= Date.now();
        if (!isExpired) {
          listing.status = 'available';
        }
      }
      await listing.save();
    }

    return res.json({
      message: 'Reservation cancelled successfully. Food portion returned to community.',
      claim,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * FR09: Update an active food portion reservation (claim).
 * Allows modifying portions (recalculates listing stock & status), contact info, pickup time, notes.
 */
export async function updateClaim(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Please sign in to update reservation.' });
    }

    const userRole = String(req.user.role || '').trim().toLowerCase();
    if (!ALLOWED_RECEIVER_ROLES.includes(userRole)) {
      return res.status(403).json({
        message: 'Only receiver and volunteer accounts can manage reservations.',
      });
    }

    const { id: claimId } = req.params;
    const claim = await Claim.findOne({ _id: claimId, receiver: req.user.id });
    if (!claim) {
      return res.status(404).json({ message: 'Reservation not found or access denied.' });
    }

    if (claim.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot edit a cancelled reservation.' });
    }

    const listing = await Listing.findById(claim.listing);
    if (!listing) {
      return res.status(404).json({ message: 'Associated food listing not found.' });
    }

    // Handle portion quantity change if provided
    if (req.body.quantity !== undefined) {
      const newQty = Number(req.body.quantity);
      if (!Number.isInteger(newQty) || newQty < 1) {
        return res.status(400).json({ message: 'Portion quantity must be a whole number of at least 1.' });
      }

      const delta = newQty - claim.quantity;
      if (delta > 0) {
        // Checking if listing has enough remaining portions to satisfy increase
        const currentClaimed = listing.claimedQuantity || 0;
        const availableInListing = Math.max(0, listing.quantity - currentClaimed);
        if (delta > availableInListing) {
          return res.status(400).json({
            message: availableInListing === 0
              ? 'No additional portions are available for this food item.'
              : `Only ${availableInListing} additional ${listing.portionUnit || 'portions'} available. Cannot increase reservation by ${delta}.`,
          });
        }
      }

      if (delta !== 0) {
        listing.claimedQuantity = Math.max(0, (listing.claimedQuantity || 0) + delta);
        if (listing.claimedQuantity >= listing.quantity) {
          listing.status = 'claimed';
        } else if (listing.claimedQuantity < listing.quantity) {
          const deadline = listing.pickupDeadline || listing.pickupClosesAt;
          const isExpired = deadline && new Date(deadline).getTime() <= Date.now();
          if (!isExpired) {
            listing.status = 'available';
          }
        }
        await listing.save();
        claim.quantity = newQty;
      }
    }

    // Handle recipient name
    if (req.body.recipientName !== undefined) {
      claim.recipientName = req.body.recipientName.trim();
    }

    // Handle contact phone
    if (req.body.contactPhone !== undefined) {
      claim.contactPhone = req.body.contactPhone.trim();
    }

    // Handle estimated pickup date/time
    if (req.body.estimatedPickupAt !== undefined) {
      if (!req.body.estimatedPickupAt) {
        claim.estimatedPickupAt = null;
      } else {
        const parsed = new Date(req.body.estimatedPickupAt);
        if (!Number.isFinite(parsed.getTime())) {
          return res.status(400).json({ message: 'Estimated pickup time is invalid.' });
        }
        if (parsed.getTime() < Date.now() - 5 * 60 * 1000) {
          return res.status(400).json({ message: 'Estimated pickup time cannot be in the past.' });
        }
        if (listing.pickupClosesAt && parsed.getTime() > new Date(listing.pickupClosesAt).getTime()) {
          return res.status(400).json({ message: 'Estimated pickup time cannot be after the pickup window closes.' });
        }
        claim.estimatedPickupAt = parsed;
      }
    }

    // Handle people fed
    if (req.body.peopleFed !== undefined) {
      claim.peopleFed = req.body.peopleFed !== '' && req.body.peopleFed !== null
        ? Math.max(1, Number(req.body.peopleFed))
        : null;
    }

    // Handle hasContainers
    if (req.body.hasContainers !== undefined) {
      claim.hasContainers = Boolean(req.body.hasContainers);
    }

    // Handle reservationPurpose
    if (req.body.reservationPurpose !== undefined && req.body.reservationPurpose) {
      claim.reservationPurpose = req.body.reservationPurpose;
    }

    // Handle receiverNotes
    if (req.body.receiverNotes !== undefined) {
      claim.receiverNotes = req.body.receiverNotes.trim();
    }

    await claim.save();

    const populatedClaim = await Claim.findById(claim._id)
      .populate({
        path: 'listing',
        select: 'foodName description photoUrl pickupLocation pickupOpensAt pickupClosesAt pickupDeadline category storageDetails foodCondition status quantity claimedQuantity donor',
        populate: { path: 'donor', select: 'name email role' },
      })
      .lean();

    return res.json({
      message: 'Reservation updated successfully!',
      claim: populatedClaim,
      listingSummary: {
        _id: listing._id,
        status: listing.status,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        remainingQuantity: Math.max(0, listing.quantity - (listing.claimedQuantity || 0)),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * FR09: Allow listing donor to view claims for their food listing.
 */
export async function getListingClaims(req, res, next) {
  try {
    const { id: listingId } = req.params;
    const listing = await Listing.findOne({ _id: listingId, donor: req.user.id });
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or you are not the owner.' });
    }

    const claims = await Claim.find({ listing: listing._id })
      .sort({ createdAt: -1 })
      .populate('receiver', 'name email role')
      .lean();

    return res.json({
      claims,
      listingSummary: {
        _id: listing._id,
        foodName: listing.foodName,
        totalQuantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity || 0,
        remainingQuantity: Math.max(0, listing.quantity - (listing.claimedQuantity || 0)),
        portionUnit: listing.portionUnit,
        status: listing.status,
      },
    });
  } catch (error) {
    next(error);
  }
}
