import Listing from '../models/Listing.js';

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
        const filter = { status: { $in: ['available', 'closed'] } };
        if (req.query.category && req.query.category !== 'all') {
            filter.category = req.query.category;
        }

        const listings = await Listing.find(filter)
            .sort({ createdAt: -1 })
            .populate('donor', 'name role email')
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
                preparedAt: item.preparedAt,
                useByAt: item.useByAt,
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

        // 1. Basic Details
        const foodName = req.body.foodName || req.body.title;
        const portionUnit = req.body.portionUnit || req.body.unit;
        const photoUrl = req.body.photoUrl !== undefined ? req.body.photoUrl : req.body.imageUrl;

        if (foodName !== undefined) {
            if (!foodName.trim()) return res.status(400).json({ message: 'Food name cannot be empty.' });
            if (foodName.trim().length > 120) return res.status(400).json({ message: 'Food name must be 120 characters or fewer.' });
            listing.foodName = foodName.trim();
        }

        if (req.body.description !== undefined) {
            const desc = String(req.body.description).trim();
            if (desc.length > 2000) return res.status(400).json({ message: 'Description must be 2000 characters or fewer.' });
            listing.description = desc;
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

        // 2. Food Safety & Storage Information
        if (req.body.preparedAt !== undefined) {
            if (!req.body.preparedAt) {
                listing.preparedAt = null;
            } else {
                const prepDate = new Date(req.body.preparedAt);
                if (isNaN(prepDate.getTime())) return res.status(400).json({ message: 'Preparation date and time must be valid.' });
                listing.preparedAt = prepDate;
            }
        }

        if (req.body.storageDetails !== undefined) {
            const clean = String(req.body.storageDetails).trim();
            if (clean.length > 500) return res.status(400).json({ message: 'Storage details must be 500 characters or fewer.' });
            listing.storageDetails = clean;
        }

        if (req.body.foodCondition !== undefined) {
            const validConditions = ['fresh', 'refrigerated', 'frozen', 'shelf-stable'];
            if (req.body.foodCondition && !validConditions.includes(req.body.foodCondition)) {
                return res.status(400).json({ message: 'Food condition must be fresh, refrigerated, frozen, or shelf-stable.' });
            }
            listing.foodCondition = req.body.foodCondition || 'fresh';
        }

        if (req.body.useByAt !== undefined) {
            if (!req.body.useByAt) {
                listing.useByAt = null;
            } else {
                const useByDate = new Date(req.body.useByAt);
                if (isNaN(useByDate.getTime())) return res.status(400).json({ message: 'Use-by date and time must be valid.' });
                if (listing.preparedAt && useByDate.getTime() <= listing.preparedAt.getTime()) {
                    return res.status(400).json({ message: 'Use-by time must be after preparation time.' });
                }
                listing.useByAt = useByDate;
            }
        }

        if (req.body.safetyNotes !== undefined) {
            const clean = String(req.body.safetyNotes).trim();
            if (clean.length > 1000) return res.status(400).json({ message: 'Safety notes must be 1000 characters or fewer.' });
            listing.safetyNotes = clean;
        }

        // 3. Pickup Schedule & Location
        if (req.body.pickupLocation !== undefined) {
            const clean = String(req.body.pickupLocation).trim();
            if (clean.length > 300) return res.status(400).json({ message: 'Pickup location must be 300 characters or fewer.' });
            listing.pickupLocation = clean;
        }

        if (req.body.pickupOpensAt !== undefined) {
            if (!req.body.pickupOpensAt) {
                listing.pickupOpensAt = null;
            } else {
                const opens = new Date(req.body.pickupOpensAt);
                if (isNaN(opens.getTime())) return res.status(400).json({ message: 'Pickup opening time must be valid.' });
                listing.pickupOpensAt = opens;
            }
        }

        const rawDeadline = req.body.pickupDeadline || req.body.pickupClosesAt || req.body.pickupWindowEnd;
        if (rawDeadline !== undefined) {
            if (!rawDeadline) {
                listing.pickupClosesAt = null;
                listing.pickupDeadline = null;
            } else {
                const deadline = new Date(rawDeadline);
                if (isNaN(deadline.getTime())) return res.status(400).json({ message: 'Pickup deadline must be a valid date and time.' });
                listing.pickupClosesAt = deadline;
                listing.pickupDeadline = deadline;
            }
        }

        if (listing.pickupOpensAt && listing.pickupClosesAt) {
            if (listing.pickupOpensAt.getTime() >= listing.pickupClosesAt.getTime()) {
                return res.status(400).json({ message: 'Pickup closing time must be after opening time.' });
            }
        }

        // 4. Status Handling
        if (req.body.status !== undefined) {
            const targetStatus = req.body.status;
            if (!['draft', 'available', 'closed'].includes(targetStatus)) {
                return res.status(400).json({ message: 'Status must be one of: draft, available, closed.' });
            }

            if (targetStatus === 'available') {
                const activeDeadline = listing.pickupClosesAt || listing.pickupDeadline;
                if (!activeDeadline || activeDeadline.getTime() <= Date.now()) {
                    return res.status(400).json({ message: 'To make this listing available, provide a future pickup closing deadline.' });
                }
                listing.status = 'available';
            } else {
                listing.status = targetStatus;
            }
        }

        await listing.save();
        await listing.populate('donor', 'name role email');
        res.json({ listing });
    } catch (error) {
        next(error);
    }
}

export async function closeListing(req, res, next) {
    try {
        if (req.user?.role === 'receiver') {
            return res.status(403).json({ message: 'Receivers are not permitted to manage food listings.' });
        }
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found.' });

        if (String(listing.donor) !== String(req.user.id)) {
            return res.status(403).json({ message: 'You are not authorized to close this listing.' });
        }

        listing.status = 'closed';
        await listing.save();
        await listing.populate('donor', 'name role email');
        res.json({ listing, message: 'Pickup closed successfully.' });
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
            .populate('donor', 'name role email')
            .lean();
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
