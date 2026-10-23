import Listing from '../models/Listing.js';

export async function savePickupSchedule(req, res, next) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, donor: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.status !== 'draft') return res.status(409).json({ message: 'This listing has already been scheduled.' });
    if (!listing.preparedAt || !listing.storageDetails || !listing.foodCondition) {
      return res.status(409).json({ message: 'Complete the food information step before scheduling pickup.' });
    }

    const { pickupLocation, pickupOpensAt, pickupClosesAt } = req.body;
    if (!pickupLocation?.trim() || !pickupOpensAt || !pickupClosesAt) {
      return res.status(400).json({ message: 'Pickup location, opening time, and closing time are required.' });
    }
    if (!Number.isFinite(new Date(pickupOpensAt).getTime()) || !Number.isFinite(new Date(pickupClosesAt).getTime())) {
      return res.status(400).json({ message: 'Enter valid pickup opening and closing times.' });
    }
    if (new Date(pickupOpensAt) >= new Date(pickupClosesAt)) {
      return res.status(400).json({ message: 'Pickup closing time must be after opening time.' });
    }

    listing.pickupLocation = pickupLocation.trim();
    listing.pickupOpensAt = pickupOpensAt;
    listing.pickupClosesAt = pickupClosesAt;
    listing.pickupDeadline = pickupClosesAt;
    listing.status = 'available';
    await listing.save();
    res.json({ listing });
  } catch (error) { next(error); }
}
