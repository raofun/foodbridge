import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required. Please set it in server/.env.');
  }

  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB Atlas successfully!');
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
    console.error('Tip: If running on Render, verify that MongoDB Atlas Network Access has IP 0.0.0.0/0 (allow from anywhere) enabled.');
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnecting...');
  });
}
