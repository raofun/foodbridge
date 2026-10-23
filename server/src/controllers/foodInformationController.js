import Listing from '../models/Listing.js';

const conditions = ['fresh', 'refrigerated', 'frozen', 'shelf-stable'];

export async function saveFoodInformation(req, res, next) {
  try {
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
    if (safetyNotes && safetyNotes.length > 500) return res.status(400).json({ message: 'Safety notes must be 500 characters or fewer.' });

    // Optionally update core food fields if provided in this step
    if (req.body.foodName?.trim()) listing.foodName = req.body.foodName.trim();
    if (req.body.category) listing.category = req.body.category;
    if (req.body.description?.trim()) listing.description = req.body.description.trim();
    if (req.body.quantity && Number(req.body.quantity) >= 1) listing.quantity = Number(req.body.quantity);
    if (req.body.portionUnit?.trim()) listing.portionUnit = req.body.portionUnit.trim();
    if (req.body.photoUrl !== undefined) {
      if (req.body.photoUrl && !/^https?:\/\//i.test(req.body.photoUrl) && !/^data:image\//i.test(req.body.photoUrl)) {
        return res.status(400).json({ message: 'Photo must be a valid image or URL.' });
      }
      listing.photoUrl = req.body.photoUrl.trim();
    }

    if (req.body.pickupDeadline || req.body.pickupClosesAt) {
      const deadline = new Date(req.body.pickupDeadline || req.body.pickupClosesAt);
      if (!Number.isFinite(deadline.getTime())) {
        return res.status(400).json({ message: 'Enter a valid pickup deadline date and time.' });
      }
      if (deadline.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Pickup deadline cannot be in the past.' });
      }
      listing.pickupDeadline = deadline;
      listing.pickupClosesAt = deadline;
    }

    listing.preparedAt = preparedAt;
    listing.storageDetails = storageDetails.trim();
    listing.foodCondition = foodCondition;
    listing.useByAt = useByAt || undefined;
    listing.safetyNotes = safetyNotes?.trim() || '';
    await listing.save();
    res.json({ listing });
  } catch (error) { next(error); }
}
