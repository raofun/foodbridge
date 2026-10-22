import Listing from '../models/Listing.js';

function validateListing(body) {
  const { foodName, description, quantity, portionUnit, pickupLocation, pickupOpensAt, pickupClosesAt, photoUrl } = body;
  if (!foodName?.trim() || !description?.trim() || !portionUnit?.trim() || !pickupLocation?.trim() || !pickupOpensAt || !pickupClosesAt || quantity === undefined) {
    return 'Complete all required food and pickup details.';
  }
  if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) return 'Quantity must be at least 1.';
  if (!Number.isInteger(Number(quantity))) return 'Quantity must be a whole number.';
  if (!Number.isFinite(new Date(pickupOpensAt).getTime()) || !Number.isFinite(new Date(pickupClosesAt).getTime())) return 'Enter valid pickup opening and closing times.';
  if (new Date(pickupOpensAt) >= new Date(pickupClosesAt)) return 'Pickup closing time must be after opening time.';
  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) return 'Photo must be a valid http or https URL.';
  return null;
}

export async function createListing(req, res, next) {
  try {
    if (req.user.role !== 'donor') return res.status(403).json({ message: 'Only donor accounts can create food listings.' });
    const error = validateListing(req.body);
    if (error) return res.status(400).json({ message: error });
    const listing = await Listing.create({ ...req.body, quantity: Number(req.body.quantity), donor: req.user.id });
    res.status(201).json({ listing });
  } catch (error) { next(error); }
}

export async function myListings(req, res, next) {
  try {
    const listings = await Listing.find({ donor: req.user.id }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) { next(error); }
}

export async function updateListing(req, res, next) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, donor: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    const allowed = ['foodName', 'description', 'photoUrl', 'quantity', 'portionUnit', 'pickupLocation', 'pickupOpensAt', 'pickupClosesAt'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const error = validateListing({ ...listing.toObject(), ...updates });
    if (error) return res.status(400).json({ message: error });
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    Object.assign(listing, updates);
    await listing.save();
    res.json({ listing });
  } catch (error) { next(error); }
}

export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, donor: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ message: 'Listing deleted.' });
  } catch (error) { next(error); }
}
