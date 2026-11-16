import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true,
    index: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  portionUnit: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['reserved', 'cancelled'],
    default: 'reserved',
    index: true,
  },
  estimatedPickupAt: {
    type: Date,
  },
  recipientName: {
    type: String,
    trim: true,
    maxlength: 100,
    default: '',
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: 25,
    default: '',
  },
  peopleFed: {
    type: Number,
    min: 1,
    default: null,
  },
  hasContainers: {
    type: Boolean,
    default: true,
  },
  reservationPurpose: {
    type: String,
    enum: ['household', 'community_sharing', 'charity_shelter', 'elderly_care', 'other'],
    default: 'household',
  },
  receiverNotes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
}, { timestamps: true });

claimSchema.index({ receiver: 1, createdAt: -1 });
claimSchema.index({ listing: 1, status: 1 });

export default mongoose.model('Claim', claimSchema);
