import Listing from '../models/Listing.js';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import {
  hashVerificationCode,
  decryptVerificationCode,
  sanitizeCode,
  isValidCodeFormat,
} from '../utils/verificationCode.js';

// Verify pickup collection for a specific listing using 6-character code
export async function verifyPickupByListing(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Please sign in to verify food pickup.' });
    }

    const { id: listingId } = req.params;
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Food listing not found.' });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const donorId = String(listing.donor?._id || listing.donor);
    const userRole = String(req.user.role || '').trim().toLowerCase();

    if (currentUserId !== donorId && userRole !== 'volunteer') {
      return res.status(403).json({
        message: 'Only the food donor who published this listing or a verified volunteer can confirm handovers.',
      });
    }

    const rawCode = req.body.verificationCode || req.body.code;
    const cleanCode = sanitizeCode(rawCode);

    if (!cleanCode || !isValidCodeFormat(cleanCode)) {
      return res.status(400).json({
        message: 'Please provide a valid 6-character alphanumeric pickup code.',
      });
    }

    const computedHash = hashVerificationCode(cleanCode);

    const claim = await Claim.findOne({
      listing: listing._id,
      verificationHash: computedHash,
    }).populate('receiver', 'name email role');

    if (!claim) {
      return res.status(404).json({
        message: 'Invalid verification code for this food listing. Please check the code presented by the recipient.',
      });
    }

    if (claim.status === 'cancelled') {
      return res.status(400).json({
        message: 'This reservation was previously cancelled by the recipient.',
      });
    }

    if (claim.status === 'completed') {
      const collectedTimeStr = claim.collectedAt
        ? new Date(claim.collectedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'earlier';
      return res.status(400).json({
        message: `This reservation was already collected and verified at ${collectedTimeStr}.`,
      });
    }

    // Complete handover and wipe secret tokens
    claim.status = 'completed';
    claim.collectedAt = new Date();
    claim.verifiedBy = req.user.id || req.user._id;
    claim.verificationHash = null;
    claim.verificationCode = null;
    await claim.save();

    // Check if entire listing is now completely collected
    const allListingClaims = await Claim.find({
      listing: listing._id,
      status: { $ne: 'cancelled' },
    });

    const totalCollected = allListingClaims
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    const totalReserved = allListingClaims
      .filter((c) => c.status === 'reserved')
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    let listingCompleted = false;
    // If all available portions are collected or no pending reservations left and fully claimed
    if (totalCollected >= listing.quantity || (totalReserved === 0 && listing.claimedQuantity >= listing.quantity)) {
      listing.status = 'completed';
      listing.completedAt = new Date();
      await listing.save();
      listingCompleted = true;
    }

    return res.status(200).json({
      success: true,
      message: 'Pickup handover verified and confirmed successfully!',
      claim: {
        _id: claim._id,
        quantity: claim.quantity,
        portionUnit: claim.portionUnit,
        status: claim.status,
        recipientName: claim.recipientName,
        contactPhone: claim.contactPhone,
        collectedAt: claim.collectedAt,
        peopleFed: claim.peopleFed,
        hasContainers: claim.hasContainers,
        reservationPurpose: claim.reservationPurpose,
        receiverNotes: claim.receiverNotes,
      },
      listing: {
        _id: listing._id,
        foodName: listing.foodName,
        description: listing.description,
        photoUrl: listing.photoUrl,
        category: listing.category,
        foodCondition: listing.foodCondition,
        storageDetails: listing.storageDetails,
        safetyNotes: listing.safetyNotes,
        pickupLocation: listing.pickupLocation,
        pickupOpensAt: listing.pickupOpensAt,
        pickupClosesAt: listing.pickupClosesAt,
        pickupDeadline: listing.pickupDeadline,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        portionUnit: listing.portionUnit,
        status: listing.status,
        donor: listing.donor,
        totalCollected,
        listingCompleted,
      },
      listingSummary: {
        _id: listing._id,
        foodName: listing.foodName,
        photoUrl: listing.photoUrl,
        category: listing.category,
        status: listing.status,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        totalCollected,
        listingCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Fetch donor listings that have active reservations waiting for collection
export async function getActivePickupListings(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const currentUserId = req.user.id || req.user._id;
    const query = req.user.role === 'volunteer'
      ? { status: { $in: ['available', 'claimed'] }, claimedQuantity: { $gt: 0 } }
      : { donor: currentUserId, status: { $in: ['available', 'claimed'] }, claimedQuantity: { $gt: 0 } };

    const listings = await Listing.find(query)
      .sort({ updatedAt: -1 })
      .select('foodName photoUrl category pickupLocation pickupOpensAt pickupClosesAt pickupDeadline quantity claimedQuantity portionUnit status foodCondition')
      .lean();

    // Attach pending claim counts
    const listingIds = listings.map((l) => l._id);
    const pendingClaims = await Claim.aggregate([
      {
        $match: {
          listing: { $in: listingIds },
          status: 'reserved',
        },
      },
      {
        $group: {
          _id: '$listing',
          pendingCount: { $sum: 1 },
          pendingQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    const countMap = new Map();
    pendingClaims.forEach((pc) => {
      countMap.set(String(pc._id), pc);
    });

    const enriched = listings.map((l) => {
      const stats = countMap.get(String(l._id));
      return {
        ...l,
        pendingReservationsCount: stats?.pendingCount || 0,
        pendingReservedQuantity: stats?.pendingQuantity || 0,
      };
    });

    return res.json({ listings: enriched });
  } catch (error) {
    next(error);
  }
}

// Universal direct verification across all donor listings
export async function verifyPickupDirect(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Please sign in to verify pickup code.' });
    }

    const rawCode = req.body.verificationCode || req.body.code;
    const cleanCode = sanitizeCode(rawCode);

    if (!cleanCode || !isValidCodeFormat(cleanCode)) {
      return res.status(400).json({
        message: 'Please enter a valid 6-character alphanumeric pickup code.',
      });
    }

    const computedHash = hashVerificationCode(cleanCode);

    // Look up active claim matching this hash
    const claim = await Claim.findOne({
      verificationHash: computedHash,
      status: 'reserved',
    })
      .populate({
        path: 'listing',
        populate: { path: 'donor', select: 'name email role' },
      })
      .populate('receiver', 'name email role');

    if (!claim || !claim.listing) {
      return res.status(404).json({
        message: 'No active reservation found matching this code. Please ask the recipient to confirm their code.',
      });
    }

    const listing = claim.listing;
    const currentUserId = String(req.user.id || req.user._id);
    const donorId = String(listing.donor?._id || listing.donor);
    const userRole = String(req.user.role || '').trim().toLowerCase();

    if (currentUserId !== donorId && userRole !== 'volunteer') {
      return res.status(403).json({
        message: 'You are not authorized to verify this reservation. Only the listing owner or a volunteer can confirm.',
      });
    }

    // Complete the claim and wipe verification secrets
    claim.status = 'completed';
    claim.collectedAt = new Date();
    claim.verifiedBy = req.user.id || req.user._id;
    claim.verificationHash = null;
    claim.verificationCode = null;
    await claim.save();

    // Check if listing is completed
    const allListingClaims = await Claim.find({
      listing: listing._id,
      status: { $ne: 'cancelled' },
    });

    const totalCollected = allListingClaims
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    const totalReserved = allListingClaims
      .filter((c) => c.status === 'reserved')
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    let listingCompleted = false;
    if (totalCollected >= listing.quantity || (totalReserved === 0 && listing.claimedQuantity >= listing.quantity)) {
      listing.status = 'completed';
      listing.completedAt = new Date();
      await listing.save();
      listingCompleted = true;
    }

    return res.status(200).json({
      success: true,
      message: 'Pickup handover verified and confirmed successfully!',
      claim: {
        _id: claim._id,
        quantity: claim.quantity,
        portionUnit: claim.portionUnit,
        status: claim.status,
        recipientName: claim.recipientName,
        contactPhone: claim.contactPhone,
        collectedAt: claim.collectedAt,
        peopleFed: claim.peopleFed,
        hasContainers: claim.hasContainers,
        reservationPurpose: claim.reservationPurpose,
        receiverNotes: claim.receiverNotes,
      },
      listing: {
        _id: listing._id,
        foodName: listing.foodName,
        description: listing.description,
        photoUrl: listing.photoUrl,
        category: listing.category,
        foodCondition: listing.foodCondition,
        storageDetails: listing.storageDetails,
        safetyNotes: listing.safetyNotes,
        pickupLocation: listing.pickupLocation,
        pickupOpensAt: listing.pickupOpensAt,
        pickupClosesAt: listing.pickupClosesAt,
        pickupDeadline: listing.pickupDeadline,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        portionUnit: listing.portionUnit,
        status: listing.status,
        donor: listing.donor,
        totalCollected,
        listingCompleted,
      },
      listingSummary: {
        _id: listing._id,
        foodName: listing.foodName,
        photoUrl: listing.photoUrl,
        category: listing.category,
        status: listing.status,
        quantity: listing.quantity,
        claimedQuantity: listing.claimedQuantity,
        totalCollected,
        listingCompleted,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Verification station data for specific listing (pending vs completed)
export async function getListingVerificationData(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const { id: listingId } = req.params;
    const listing = await Listing.findById(listingId).populate('donor', 'name email role');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const donorId = String(listing.donor?._id || listing.donor);
    const userRole = String(req.user.role || '').trim().toLowerCase();

    if (currentUserId !== donorId && userRole !== 'volunteer') {
      return res.status(403).json({ message: 'Access denied. You do not own this listing.' });
    }

    const claims = await Claim.find({ listing: listing._id })
      .sort({ createdAt: -1 })
      .populate('receiver', 'name email role')
      .populate('verifiedBy', 'name role')
      .lean();

    const pendingClaims = claims
      .filter((c) => c.status === 'reserved')
      .map((c) => {
        delete c.verificationHash;
        delete c.verificationCode; // Donors cannot see receiver codes in advance (preserves two-party handshake)
        return c;
      });

    const completedClaims = claims
      .filter((c) => c.status === 'completed')
      .map((c) => {
        delete c.verificationHash;
        delete c.verificationCode;
        return c;
      });

    const totalCollected = completedClaims.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
    const totalReserved = pendingClaims.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    return res.json({
      listing: {
        _id: listing._id,
        foodName: listing.foodName,
        category: listing.category,
        photoUrl: listing.photoUrl,
        quantity: listing.quantity,
        portionUnit: listing.portionUnit,
        claimedQuantity: listing.claimedQuantity || 0,
        totalCollected,
        totalReserved,
        pickupLocation: listing.pickupLocation,
        pickupOpensAt: listing.pickupOpensAt,
        pickupClosesAt: listing.pickupClosesAt,
        pickupDeadline: listing.pickupDeadline,
        status: listing.status,
        donor: listing.donor,
      },
      pendingClaims,
      completedClaims,
    });
  } catch (error) {
    next(error);
  }
}

// Digital pickup pass payload for authorized receiver
export async function getClaimPickupPass(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const { id: claimId } = req.params;
    const claim = await Claim.findById(claimId)
      .populate({
        path: 'listing',
        select: 'foodName description photoUrl pickupLocation pickupOpensAt pickupClosesAt pickupDeadline category foodCondition storageDetails safetyNotes status quantity portionUnit donor',
        populate: { path: 'donor', select: 'name email role' },
      })
      .populate('receiver', 'name email role');

    if (!claim) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const currentUserId = String(req.user.id || req.user._id);
    const receiverId = String(claim.receiver?._id || claim.receiver);
    const donorId = String(claim.listing?.donor?._id || claim.listing?.donor);
    const userRole = String(req.user.role || '').trim().toLowerCase();

    // Only receiver, donor of listing, or volunteer can inspect pass
    if (currentUserId !== receiverId && currentUserId !== donorId && userRole !== 'volunteer') {
      return res.status(403).json({ message: 'You are not authorized to view this pickup pass.' });
    }

    let decryptedCode = null;
    if (claim.status === 'reserved' && claim.verificationCode) {
      decryptedCode = decryptVerificationCode(claim.verificationCode);
    }

    // Build QR payload for external cameras: link to verification route with prefilled code
    let requestOrigin = req.headers.origin;
    if (!requestOrigin && req.headers.referer) {
      try {
        requestOrigin = new URL(req.headers.referer).origin;
      } catch (_) {}
    }

    const configuredOrigin = process.env.CLIENT_ORIGIN?.split(',')[0]?.trim();
    const isPlaceholder = configuredOrigin?.includes('your-foodbridge-name') ||
                          configuredOrigin?.includes('example.com') ||
                          configuredOrigin?.includes('your-domain');

    const clientOrigin = (!isPlaceholder && configuredOrigin)
      ? configuredOrigin
      : (requestOrigin || 'http://localhost:5173');

    const qrUrl = decryptedCode
      ? `${clientOrigin}/listings/${claim.listing?._id}/verify?code=${decryptedCode}`
      : null;

    return res.json({
      claim: {
        _id: claim._id,
        status: claim.status,
        verificationCode: decryptedCode, // Clean 6-char code for receiver
        quantity: claim.quantity,
        portionUnit: claim.portionUnit,
        recipientName: claim.recipientName,
        contactPhone: claim.contactPhone,
        peopleFed: claim.peopleFed,
        hasContainers: claim.hasContainers,
        reservationPurpose: claim.reservationPurpose,
        receiverNotes: claim.receiverNotes,
        estimatedPickupAt: claim.estimatedPickupAt,
        collectedAt: claim.collectedAt,
        createdAt: claim.createdAt,
      },
      receiver: claim.receiver
        ? {
            _id: claim.receiver._id,
            name: claim.receiver.name,
            email: claim.receiver.email,
            role: claim.receiver.role,
          }
        : null,
      listing: claim.listing,
      qrUrl,
    });
  } catch (error) {
    next(error);
  }
}
