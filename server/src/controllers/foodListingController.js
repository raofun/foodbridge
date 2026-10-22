import Listing from '../models/Listing.js';

function validateListingBasics(body) {
  const { foodName, description, quantity, portionUnit, photoUrl } = body;
  if (!foodName?.trim() || !description?.trim() || !portionUnit?.trim() || quantity === undefined) {
    return 'Complete the food name, description, quantity, and portion unit.';
  }
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) return 'Quantity must be a whole number of at least 1.';
  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) return 'Photo must be a valid http or https URL.';
  return null;
}

export async function createListing(req, res, next) {
  try {
    if (req.user.role !== 'donor') return res.status(403).json({ message: 'Only donor accounts can create food listings.' });
    const error = validateListingBasics(req.body);
    if (error) return res.status(400).json({ message: error });
    const listing = await Listing.create({
      foodName: req.body.foodName,
      description: req.body.description,
      photoUrl: req.body.photoUrl || '',
      quantity: Number(req.body.quantity),
      portionUnit: req.body.portionUnit,
      donor: req.user.id,
      status: 'draft',
    });
    res.status(201).json({ listing });
  } catch (error) { next(error); }
}

export async function myListings(req, res, next) {
  try {
    const listings = await Listing.find({ donor: req.user.id }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) { next(error); }
}

export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, donor: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
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
