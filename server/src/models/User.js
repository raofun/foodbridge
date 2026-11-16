import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, sparse: true, unique: true },
  role: { type: String, enum: ['member', 'donor', 'receiver', 'volunteer', 'community', 'admin'], default: 'member' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
