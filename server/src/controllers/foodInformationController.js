import Listing from '../models/Listing.js';

const conditions = ['fresh', 'refrigerated', 'frozen', 'shelf-stable'];

export async function getFoodInformation(req, res, next) {
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
      return res.status(403).json({ message: 'Access denied. Only the listing creator can access draft food information.' });
    }

    // Calculate status closed or not 
    const deadline = listing.pickupDeadline || listing.pickupClosesAt;
    const isDeadlinePassed = Boolean(deadline && new Date(deadline) <= new Date());
    const effectiveStatus = (listing.status === 'closed' || isDeadlinePassed) ? 'closed' : listing.status;

    res.json({
      listing: {
        ...listing,
        status: effectiveStatus,
      },
      isOwner,
      isDraft: listing.status === 'draft',
    });
  } catch (error) {
    next(error);
  }
}

// module 2 will be used in create listing to update food information and edit listing to update info
export async function saveFoodInformation(req, res, next) {
  try {
    if (req.user?.role === 'receiver') {
      return res.status(403).json({ message: 'Receivers are not permitted to manage food listings.' });
    }
    const listing = await Listing.findOne({ _id: req.params.id, donor: req.user.id });
    if (!listing) return res.status(404).json({ message: 'Listing not found.' });
    if (listing.status !== 'draft') return res.status(409).json({ message: 'Only draft listings can be updated in this step.' });

    const { preparedAt, storageDetails, foodCondition, useByAt, safetyNotes } = req.body;
    if (!preparedAt || !storageDetails?.trim() || !foodCondition) {
      return res.status(400).json({ message: 'Preparation time, storage details, and food condition are required.' });
    }
    if (!Number.isFinite(new Date(preparedAt).getTime())) return res.status(400).json({ message: 'Enter a valid preparation date and time.' });
    if (!conditions.includes(foodCondition)) return res.status(400).json({ message: 'Choose a valid food condition.' });
    if (storageDetails.length > 500) return res.status(400).json({ message: 'Storage details must be 500 characters or fewer.' });
    if (useByAt && !Number.isFinite(new Date(useByAt).getTime())) return res.status(400).json({ message: 'Enter a valid use-by date and time.' });
    if (useByAt && new Date(useByAt) <= new Date(preparedAt)) return res.status(400).json({ message: 'Use-by time must be after preparation time.' });
    if (safetyNotes && safetyNotes.length > 1000) return res.status(400).json({ message: 'Safety notes must be 1000 characters or fewer.' });

    listing.preparedAt = preparedAt;
    listing.storageDetails = storageDetails.trim();
    listing.foodCondition = foodCondition;
    listing.useByAt = useByAt || undefined;
    listing.safetyNotes = safetyNotes?.trim() || '';
    await listing.save();
    await listing.populate('donor', 'name role email');
    res.json({ listing });
  } catch (error) { next(error); }
}
