import Listing from '../models/Listing.js';

function extractLocationString(pickupLocation) {
  if (!pickupLocation) return '';
  if (typeof pickupLocation === 'object' && pickupLocation !== null) {
    const { address, city, instructions } = pickupLocation;
    const parts = [address, city].filter(Boolean).join(', ');
    return instructions ? `${parts} (${instructions})` : parts;
  }
  return String(pickupLocation).trim();
}

export async function getPickupSchedule(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('donor', 'name role email')
      .lean();

    if (!listing) {
      return res.status(404).json({ message: 'Food listing not found.' });
    }

    const donorId = String(listing.donor?._id || listing.donor);
    const userId = req.user?.id ? String(req.user.id) : null;
    const isOwner = Boolean(userId && donorId === userId);

    if (listing.status === 'draft' && !isOwner) {
      return res.status(403).json({ message: 'Access denied. Only the listing creator can access draft pickup schedule.' });
    }

    const deadline = listing.pickupDeadline || listing.pickupClosesAt;
    const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= new Date());
    const effectiveStatus = (listing.status === 'closed' || isDeadlinePassed) ? 'closed' : listing.status;

    res.json({
      listing: {
        ...listing,
        status: effectiveStatus,
      },
      pickupLocation: listing.pickupLocation || '',
      pickupOpensAt: listing.pickupOpensAt,
      pickupClosesAt: listing.pickupClosesAt,
      pickupDeadline: deadline,
      status: effectiveStatus,
      isOwner,
    });
  } catch (error) {
    next(error);
  }
}

export async function savePickupSchedule(req, res, next) {
  try {
    if (req.user?.role === 'receiver') {
      return res.status(403).json({ message: 'Receivers are not permitted to schedule pickup listings.' });
    }
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });

    if (String(listing.donor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'You are not authorized to update this listing schedule.' });
    }

    if (listing.status === 'closed') {
      return res.status(409).json({ message: 'Cannot schedule pickup for a closed listing.' });
    }

    if (!listing.preparedAt || !listing.storageDetails || !listing.foodCondition) {
      return res.status(409).json({ message: 'Complete the food information step before scheduling pickup.' });
    }

    const locationStr = extractLocationString(req.body.pickupLocation);
    const rawOpens = req.body.pickupOpensAt || req.body.pickupWindowStart;
    const rawCloses = req.body.pickupClosesAt || req.body.pickupWindowEnd || req.body.pickupDeadline;

    if (!locationStr || !rawOpens || !rawCloses) {
      return res.status(400).json({ message: 'Pickup location, opening time, and closing time are required.' });
    }

    if (locationStr.length > 300) {
      return res.status(400).json({ message: 'Pickup location must be 300 characters or fewer.' });
    }

    const opensDate = new Date(rawOpens);
    const closesDate = new Date(rawCloses);

    if (!Number.isFinite(opensDate.getTime()) || !Number.isFinite(closesDate.getTime())) {
      return res.status(400).json({ message: 'Enter valid pickup opening and closing times.' });
    }

    if (opensDate.getTime() >= closesDate.getTime()) {
      return res.status(400).json({ message: 'Pickup closing time must be after opening time.' });
    }

    if (closesDate.getTime() <= Date.now()) {
      return res.status(400).json({ message: 'Pickup closing time cannot be in the past. Select a future date and time.' });
    }

    listing.pickupLocation = locationStr;
    listing.pickupOpensAt = opensDate;
    listing.pickupClosesAt = closesDate;
    listing.pickupDeadline = closesDate;
    listing.status = 'available';

    await listing.save();
    await listing.populate('donor', 'name role email');

    res.json({ listing });
  } catch (error) {
    next(error);
  }
}
