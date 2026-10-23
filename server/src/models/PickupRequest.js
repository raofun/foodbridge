import mongoose from 'mongoose';

const pickupRequestSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reservationCode: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  pickupNotes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
}, { timestamps: true });

// Prevent duplicate pickup claims on the same listing by the same receiver
pickupRequestSchema.index({ listing: 1, receiver: 1 }, { unique: true });

export default mongoose.model('PickupRequest', pickupRequestSchema);
