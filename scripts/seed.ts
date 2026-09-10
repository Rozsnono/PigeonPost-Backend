import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import User from '../src/models/User';
import Pigeon from '../src/models/Pigeon';
import Message from '../src/models/Message';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pigeonpost';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Pigeon.deleteMany({});
    await Message.deleteMany({});
    console.log('Cleared existing data.');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Users — pre-friended so they can message each other immediately
    const bela = await User.create({
      username: 'KovacsBela',
      email: 'bela@example.com',
      passwordHash,
      avatar: 'pigeon-brown',
      level: 5,
      inventory: { seeds: 1500, cages: 4 },
      stats: { sentCount: 3, receivedCount: 2, deadPigeonsCount: 0, maxDistance: 160 },
    });

    const anna = await User.create({
      username: 'NagyAnna',
      email: 'anna@example.com',
      passwordHash,
      avatar: 'pigeon-white',
      level: 3,
      inventory: { seeds: 800, cages: 2 },
      stats: { sentCount: 1, receivedCount: 3, deadPigeonsCount: 0, maxDistance: 80 },
    });

    // Make them mutual friends
    await User.findByIdAndUpdate(bela._id, { $addToSet: { friends: anna._id } });
    await User.findByIdAndUpdate(anna._id, { $addToSet: { friends: bela._id } });
    console.log('Users created and friended.');


    // Create Pigeons for Bela
    const p1 = await Pigeon.create({
      ownerId: bela._id,
      name: 'Barnaby',
      identifier: '#1024',
      level: 1,
      status: 'idle',
      fatigue: 0
    });

    const p2 = await Pigeon.create({
      ownerId: bela._id,
      name: 'Silverwing',
      identifier: '#8842',
      level: 2,
      status: 'flying',
      fatigue: 45
    });

    const p3 = await Pigeon.create({
      ownerId: bela._id,
      name: 'Archangel',
      identifier: '#9999',
      level: 3,
      status: 'resting',
      fatigue: 90
    });

    console.log('Pigeons created.');

    // Create Messages
    await Message.create({
      senderId: bela._id,
      recipientId: anna._id,
      pigeonId: p2._id,
      content: 'Hello Anna! Hope this letter reaches you well. The harvest was good this year.',
      status: 'flying',
      startCoords: { lat: 47.4979, lng: 19.0402 }, // Budapest
      endCoords: { lat: 46.2530, lng: 20.1414 }, // Szeged
      distanceKm: 160,
      flightDurationMinutes: 96,
      deathChance: 1.6,
      lostChance: 3.2,
      dispatchedAt: new Date(Date.now() - 40 * 60000), // 40 mins ago
      estimatedArrivalAt: new Date(Date.now() + 56 * 60000), // in 56 mins
      senderLocalTime: new Date().toISOString(),
      isRead: false
    });

    console.log('Messages created.');
    console.log('Database seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
