import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  foodName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  photoUrl: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  portionUnit: { type: String, required: true, trim: true, maxlength: 40 },
  pickupLocation: { type: String, required: true, trim: true, maxlength: 300 },
  pickupOpensAt: { type: Date, required: true },
  pickupClosesAt: { type: Date, required: true },
  status: { type: String, enum: ['available', 'closed'], default: 'available' },
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);
