import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  foodName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  photoUrl: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  portionUnit: { type: String, required: true, trim: true, maxlength: 40 },
  category: { type: String, enum: ['meals', 'bakery', 'produce', 'fruits', 'dairy', 'packaged', 'beverages', 'other'], default: 'meals' },
  preparedAt: { type: Date },
  storageDetails: { type: String, trim: true, maxlength: 500 },
  foodCondition: { type: String, enum: ['fresh', 'refrigerated', 'frozen', 'shelf-stable'] },
  useByAt: { type: Date },
  safetyNotes: { type: String, trim: true, maxlength: 1000 },
  pickupLocation: { type: String, trim: true, maxlength: 300 },
  pickupOpensAt: { type: Date },
  pickupClosesAt: { type: Date },
  pickupDeadline: { type: Date },
  claimedQuantity: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'available', 'claimed', 'closed'], default: 'draft' },
}, { timestamps: true });

listingSchema.index({ donor: 1, createdAt: -1 });
listingSchema.index({ donor: 1, status: 1 });
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ status: 1, pickupDeadline: 1 });
listingSchema.index({ status: 1, category: 1, createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
