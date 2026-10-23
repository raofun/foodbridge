import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  foodName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  photoUrl: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  portionUnit: { type: String, required: true, trim: true, maxlength: 40 },
  category: { type: String, enum: ['meals', 'bakery', 'produce', 'other'], default: 'meals' },
  preparedAt: { type: Date },
  storageDetails: { type: String, trim: true, maxlength: 500 },
  foodCondition: { type: String, enum: ['fresh', 'refrigerated', 'frozen', 'shelf-stable'] },
  useByAt: { type: Date },
  safetyNotes: { type: String, trim: true, maxlength: 500 },
  pickupLocation: { type: String, trim: true, maxlength: 300 },
  pickupOpensAt: { type: Date },
  pickupClosesAt: { type: Date },
  status: { type: String, enum: ['draft', 'available', 'closed'], default: 'draft' },
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);
