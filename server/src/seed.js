import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { seedBangladeshiListings } from './config/seedBangladeshiData.js';

async function run() {
  await connectDB();
  await seedBangladeshiListings();
  await mongoose.disconnect();
  console.log('Seeding process completed.');
}

run().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
