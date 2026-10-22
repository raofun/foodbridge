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

    listing.preparedAt = preparedAt;
    listing.storageDetails = storageDetails.trim();
    listing.foodCondition = foodCondition;
    listing.useByAt = useByAt || undefined;
    listing.safetyNotes = safetyNotes?.trim() || '';
    await listing.save();
    res.json({ listing });
  } catch (error) { next(error); }
}
