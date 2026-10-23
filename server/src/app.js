import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';

const app = express();

// Security & Parsing Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'foodbridge-api' });
});

// Route Handlers
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// Centralized Error Handling
app.use(errorHandler);

const port = Number(process.env.PORT || 4000);

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set JWT_SECRET to a random value of at least 32 characters in server/.env.');
  }

  await connectDB();
  app.listen(port, () => console.log(`FoodBridge API running at http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Could not start FoodBridge API:', error.message);
  process.exit(1);
});
