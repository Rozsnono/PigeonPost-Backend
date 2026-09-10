import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Pigeon from '@/models/Pigeon';
import Message from '@/models/Message';
import Log from '@/models/Log';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    // Check authorization (Bearer token format: "Bearer <ADMIN_SECRET>")
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Gather statistics
    const activeUsers = await User.countDocuments({ isDeleted: false });
    const flyingPigeons = await Pigeon.countDocuments({ status: 'flying' });
    
    // Count dead pigeons in the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const deadPigeons = await Pigeon.countDocuments({ 
      status: 'dead',
      updatedAt: { $gte: yesterday } 
    });

    // Aggregate total seeds in economy
    const userStats = await User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSeeds: { $sum: "$inventory.seeds" } } }
    ]);
    const seedEconomy = userStats.length > 0 ? userStats[0].totalSeeds : 0;

    // Fetch recent logs
    const recentLogs = await Log.find().sort({ createdAt: -1 }).limit(25).lean();

    // Format logs for the frontend
    const formattedLogs = recentLogs.map(log => ({
      id: log._id,
      timestamp: log.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      level: log.level,
      message: log.message,
      context: log.context
    }));

    // Generate mock logs if the DB is empty (for demo purposes based on the HTML prototype)
    const logsToReturn = formattedLogs.length > 0 ? formattedLogs : [
      { id: '1', timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19), level: 'error', message: 'Nominatim geocoding rate limit exceeded', context: 'GeocodeService' },
      { id: '2', timestamp: new Date(Date.now() - 150000).toISOString().replace('T', ' ').substring(0, 19), level: 'info', message: 'Pigeon #1024 arrived successfully (Distance: 450km)', context: 'PhysicsEngine' },
      { id: '3', timestamp: new Date(Date.now() - 350000).toISOString().replace('T', ' ').substring(0, 19), level: 'warn', message: 'High fatigue detected on flight MSG_8932', context: 'SurvivalCalc' },
      { id: '4', timestamp: new Date(Date.now() - 950000).toISOString().replace('T', ' ').substring(0, 19), level: 'info', message: 'New user registration (ID: USR_9921)', context: 'AuthService' }
    ];

    return NextResponse.json({
      stats: {
        activeUsers,
        flyingPigeons,
        deadPigeons,
        seedEconomy
      },
      logs: logsToReturn,
      serverTime: new Date().toISOString().substring(11, 19) + ' UTC'
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
