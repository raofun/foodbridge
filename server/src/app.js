import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { seedBangladeshiListings } from './config/seedBangladeshiData.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';

const app = express();

// Security & Parsing Middleware
const rawOrigin = process.env.CLIENT_ORIGIN || '';
const configuredOrigins = rawOrigin.split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/+$/, '');

    const isAllowed =
      configuredOrigins.length === 0 ||
      configuredOrigins.includes('*') ||
      configuredOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.includes('localhost') ||
      cleanOrigin.includes('127.0.0.1');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  await seedBangladeshiListings();
  app.listen(port, () => console.log(`FoodBridge API running at http://localhost:${port}`));
}

start().catch((error) => {
  console.error('Could not start FoodBridge API:', error.message);
  process.exit(1);
});
