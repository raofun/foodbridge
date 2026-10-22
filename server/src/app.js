import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'foodbridge-api' });
});
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
});

const port = Number(process.env.PORT || 4000);
async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env.');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Set JWT_SECRET to a random value of at least 32 characters.');
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`FoodBridge API listening on port ${port}`));
}

start().catch((error) => {
  console.error('Could not start FoodBridge API:', error.message);
  process.exit(1);
});
