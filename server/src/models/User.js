import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  googleId: { type: String, sparse: true, unique: true },
  role: { type: String, enum: ['donor', 'receiver', 'volunteer'], required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
