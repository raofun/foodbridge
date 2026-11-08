import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { cleanBangladeshiListings, seedBangladeshiListings } from './config/seedBangladeshiData.js';

async function run() {
  await connectDB();

  const isClean = process.argv.includes('--clean');
  const force = process.argv.includes('--force');

  if (isClean) {
    await cleanBangladeshiListings();
  } else {
    await seedBangladeshiListings({ force });
  }

  await mongoose.disconnect();
  console.log('Seeding process completed.');
}

run().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
