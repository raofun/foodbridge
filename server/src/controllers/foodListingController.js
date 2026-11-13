import Listing from '../models/Listing.js';
import { buildFeedFilter } from '../utils/listingFilter.js';

const VALID_CATEGORIES = ['meals', 'bakery', 'produce', 'fruits', 'dairy', 'packaged', 'beverages', 'other'];

function normalizeCategory(category) {
    if (!category) return 'meals';
    const lower = String(category).trim().toLowerCase();
    if (VALID_CATEGORIES.includes(lower)) return lower;
    if (lower.includes('meal')) return 'meals';
    if (lower.includes('baker') || lower.includes('bread')) return 'bakery';
    if (lower.includes('fruit')) return 'fruits';
    if (lower.includes('produce') || lower.includes('veg')) return 'produce';
    if (lower.includes('dairy') || lower.includes('sweet') || lower.includes('milk')) return 'dairy';
    if (lower.includes('pack') || lower.includes('pantry') || lower.includes('canned')) return 'packaged';
    if (lower.includes('bev') || lower.includes('drink') || lower.includes('juice')) return 'beverages';
    return 'meals';
}

function validateListingBasics(body) {
    const foodName = body.foodName || body.title;
    const portionUnit = body.portionUnit || body.unit;
    const quantity = body.quantity;
    const photoUrl = body.photoUrl !== undefined ? body.photoUrl : body.imageUrl;
    const pickupDeadline = body.pickupDeadline || body.pickupClosesAt || body.pickupWindowEnd;

    if (!foodName?.trim() || !portionUnit?.trim() || quantity === undefined) {
        return 'Complete the food name, quantity, and portion unit.';
    }
    if (foodName.trim().length > 120) {
        return 'Food name must be 120 characters or fewer.';
    }
    if (body.description && body.description.length > 2000) {
        return 'Description must be 2000 characters or fewer.';
    }
    if (portionUnit.trim().length > 40) {
        return 'Portion unit must be 40 characters or fewer.';
    }
    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty < 1) {
        return 'Quantity must be a whole number of at least 1.';
    }
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

export async function getPublicFeed(req, res, next) {
    try {
        const filter = await buildFeedFilter(req.query);

        const listings = await Listing.find(filter)
            .select('foodName description photoUrl quantity portionUnit category foodCondition pickupLocation pickupDeadline pickupClosesAt status createdAt donor')
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
                pickupLocation: item.pickupLocation,
                pickupDeadline: deadline,
                status,
                createdAt: item.createdAt,
                donor: {
                    name: item.donor?.name || 'Community Donor',
                    role: item.donor?.role || 'Member',
                },
            };
        });

        publicListings.sort((a, b) => {
            const aExpired = a.status === 'closed';
            const bExpired = b.status === 'closed';
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;

            const aDeadline = new Date(a.pickupDeadline || a.pickupClosesAt || 0).getTime() || Infinity;
            const bDeadline = new Date(b.pickupDeadline || b.pickupClosesAt || 0).getTime() || Infinity;
            return aDeadline - bDeadline;
        });

        const allPublished = await Listing.find({ status: { $in: ['available', 'closed'] } })
            .select('status pickupDeadline pickupClosesAt')
            .lean();

        const globalTotalCount = allPublished.length;
        const globalActiveCount = allPublished.filter(item => {
            const deadline = item.pickupDeadline || item.pickupClosesAt;
            const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= now);
            return item.status === 'available' && !isDeadlinePassed;
        }).length;

        res.json({
            listings: publicListings,
            totalCount: globalTotalCount,
            activeCount: globalActiveCount,
        });
    } catch (error) {
        next(error);
    }
}

export async function createListing(req, res, next) {
    try {
        if (req.user?.role === 'receiver') {
            return res.status(403).json({ message: 'Receivers are not permitted to create food listings.' });
        }
        const error = validateListingBasics(req.body);
        if (error) return res.status(400).json({ message: error });

        const foodName = (req.body.foodName || req.body.title)?.trim();
        const portionUnit = (req.body.portionUnit || req.body.unit)?.trim();
        const photoUrl = (req.body.photoUrl !== undefined ? req.body.photoUrl : req.body.imageUrl) || '';
        const rawDeadline = req.body.pickupDeadline || req.body.pickupClosesAt || req.body.pickupWindowEnd;
        const deadlineDate = rawDeadline ? new Date(rawDeadline) : undefined;

        const listing = await Listing.create({
            foodName,
            description: req.body.description?.trim() || '',
            photoUrl: String(photoUrl).trim(),
            quantity: Number(req.body.quantity),
            portionUnit,
            category: normalizeCategory(req.body.category),
            donor: req.user.id,
            status: 'draft',
            pickupDeadline: deadlineDate,
            pickupClosesAt: deadlineDate,
        });

        await listing.populate('donor', 'name role email');
        res.status(201).json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function updateListing(req, res, next) {
    try {
        if (req.user?.role === 'receiver') {
            return res.status(403).json({ message: 'Receivers are not permitted to manage food listings.' });
        }
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });

        if (String(listing.donor) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You are not authorized to update this listing.' });
        }
        if (listing.status === 'closed') {
            return res.status(409).json({ message: 'Cannot update a closed listing.' });
        }

        const foodName = req.body.foodName || req.body.title;
        const portionUnit = req.body.portionUnit || req.body.unit;
        const photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : req.body.imageUrl;
        const rawDeadline = req.body.pickupDeadline || req.body.pickupClosesAt || req.body.pickupWindowEnd;

        if (foodName !== undefined) {
            if (!foodName.trim()) return res.status(400).json({ message: 'Food name cannot be empty.' });
            if (foodName.trim().length > 120) return res.status(400).json({ message: 'Food name must be 120 characters or fewer.' });
            listing.foodName = foodName.trim();
        }
        if (req.body.description !== undefined) {
            if (req.body.description.length > 2000) return res.status(400).json({ message: 'Description must be 2000 characters or fewer.' });
            listing.description = req.body.description.trim();
        }
        if (portionUnit !== undefined) {
            if (!portionUnit.trim()) return res.status(400).json({ message: 'Portion unit cannot be empty.' });
            if (portionUnit.trim().length > 40) return res.status(400).json({ message: 'Portion unit must be 40 characters or fewer.' });
            listing.portionUnit = portionUnit.trim();
        }
        if (req.body.quantity !== undefined) {
            const numQty = Number(req.body.quantity);
            if (!Number.isInteger(numQty) || numQty < 1) return res.status(400).json({ message: 'Quantity must be a whole number of at least 1.' });
            listing.quantity = numQty;
        }
        if (req.body.category !== undefined) {
            listing.category = normalizeCategory(req.body.category);
        }
        if (photoUrl !== undefined) {
            const clean = String(photoUrl).trim();
            if (clean && !/^https?:\/\//i.test(clean) && !/^data:image\//i.test(clean)) {
                return res.status(400).json({ message: 'Photo must be a valid http or https URL or uploaded image.' });
            }
            listing.photoUrl = clean;
        }
        if (rawDeadline !== undefined) {
            const deadline = new Date(rawDeadline);
            if (isNaN(deadline.getTime())) return res.status(400).json({ message: 'Pickup deadline must be a valid date and time.' });
            if (deadline.getTime() <= Date.now()) return res.status(400).json({ message: 'Pickup deadline cannot be in the past.' });
            listing.pickupDeadline = deadline;
            listing.pickupClosesAt = deadline;
        }

        await listing.save();
        await listing.populate('donor', 'name role email');
        res.json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function myListings(req, res, next) {
    try {
        if (req.user?.role === 'receiver') {
            return res.status(403).json({ message: 'Receivers do not manage donor listings.' });
        }
        const listings = await Listing.find({ donor: req.user.id })
            .sort({ createdAt: -1 })
            .populate('donor', 'name role email');
        res.json({ listings });
    } catch (error) {
        next(error);
    }
}

export async function getListing(req, res, next) {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('donor', 'name role email');
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });

        const isOwner = Boolean(req.user && String(listing.donor?._id || listing.donor) === String(req.user.id));
        if (listing.status === 'draft' && !isOwner) {
            return res.status(403).json({ message: 'Access denied. Only the listing creator can access draft details.' });
        }

        res.json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function deleteListing(req, res, next) {
    try {
        if (req.user?.role === 'receiver') {
            return res.status(403).json({ message: 'Receivers are not permitted to delete food listings.' });
        }
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });

        if (String(listing.donor) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You are not authorized to delete this listing.' });
        }

        await listing.deleteOne();
        res.json({ success: true, message: 'Listing removed successfully.' });
    } catch (error) {
        next(error);
    }
}
