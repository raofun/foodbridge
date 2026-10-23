import Listing from '../models/Listing.js';

function validateListingBasics(body) {
    const { foodName, description, quantity, portionUnit, photoUrl, pickupDeadline } = body;
    if (!foodName?.trim() || !description?.trim() || !portionUnit?.trim() || quantity === undefined) {
        return 'Complete the food name, description, quantity, and portion unit.';
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) return 'Quantity must be a whole number of at least 1.';
    if (photoUrl && !/^https?:\/\//i.test(photoUrl) && !/^data:image\//i.test(photoUrl)) {
        return 'Photo must be a valid http or https URL or uploaded image.';
    }
    if (pickupDeadline) {
        const deadline = new Date(pickupDeadline);
        if (isNaN(deadline.getTime())) return 'Pickup deadline must be a valid date and time.';
        if (deadline.getTime() <= Date.now()) return 'Pickup deadline cannot be in the past.';
    }
    return null;
}

// Public: Get all available surplus food listings from database (Community Feed)

export async function getPublicFeed(req, res, next) {
    try {
        const filter = { status: { $in: ['available', 'closed'] } };
        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        const listings = await Listing.find(filter)
            .sort({ createdAt: -1 })
            .populate('donor', 'name role')
            .lean();

        const now = new Date();

        const publicListings = listings.map(item => {
            const deadline = item.pickupDeadline || item.pickupClosesAt;
            const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= now);
            const status = (item.status === 'closed' || isDeadlinePassed) ? 'closed' : item.status;

            return {
                _id: item._id,
                foodName: item.foodName,
                description: item.description,
                photoUrl: item.photoUrl,
                quantity: item.quantity,
                portionUnit: item.portionUnit,
                category: item.category || 'meals',
                foodCondition: item.foodCondition,
                storageDetails: item.storageDetails,
                safetyNotes: item.safetyNotes,
                pickupLocation: item.pickupLocation,
                pickupOpensAt: item.pickupOpensAt,
                pickupClosesAt: item.pickupClosesAt,
                pickupDeadline: deadline,
                status,
                createdAt: item.createdAt,
                donor: {
                    name: item.donor?.name || 'Community Donor',
                    role: item.donor?.role || 'Member',
                },
            };
        });

        res.json({ listings: publicListings });
    } catch (error) {
        next(error);
    }
}

// Authenticated Donor / Member operations:
export async function createListing(req, res, next) {
    try {
        const error = validateListingBasics(req.body);
        if (error) return res.status(400).json({ message: error });
        const listing = await Listing.create({
            foodName: req.body.foodName,
            description: req.body.description,
            photoUrl: req.body.photoUrl || '',
            quantity: Number(req.body.quantity),
            portionUnit: req.body.portionUnit,
            category: req.body.category || 'meals',
            donor: req.user.id,
            status: 'draft',
            pickupDeadline: req.body.pickupDeadline ? new Date(req.body.pickupDeadline) : undefined,
            pickupClosesAt: req.body.pickupDeadline ? new Date(req.body.pickupDeadline) : undefined,
        });
        res.status(201).json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function myListings(req, res, next) {
    try {
        const listings = await Listing.find({ donor: req.user.id }).sort({ createdAt: -1 });
        res.json({ listings });
    } catch (error) {
        next(error);
    }
}

export async function getListing(req, res, next) {
    try {
        const listing = await Listing.findOne({ _id: req.params.id, donor: req.user.id });
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });
        res.json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function deleteListing(req, res, next) {
    try {
        const listing = await Listing.findOneAndDelete({ _id: req.params.id, donor: req.user.id });
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });
        res.json({ message: 'Listing deleted.' });
    } catch (error) {
        next(error);
    }
}
