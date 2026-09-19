import mongoose, { Schema, Document } from 'mongoose';

export interface IUserLanguage {
  code: string;
  name: string;
  isNative?: boolean;
}

export interface IUserStamp {
  id: string;
  code: string;
  name: string;
  country: string;
  count: number;
  image?: string;
  unlockedAt?: Date;
}

export interface IMessagePreferences {
  replyPace: string;
  messageLength: string;
  writingAssistance: string;
  hereFor: string;
}

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  level: number;
  xp: number;
  inventory: {
    seeds: number;
    cages: number;
  };
  stats: {
    sentCount: number;
    receivedCount: number;
    deadPigeonsCount: number;
    maxDistance: number;
  };
  friends: mongoose.Types.ObjectId[];
  pendingFriendRequests: mongoose.Types.ObjectId[];
  sentFriendRequests: mongoose.Types.ObjectId[];
  role: 'user' | 'admin';
  expoPushToken?: string;
  location?: {
    city: string;
    lat: number;
    lng: number;
    updatedAt?: Date;
  };
  hasCompletedOnboarding?: boolean;

  // New profile, social and aviary fields
  bio?: string;
  birthday?: Date;
  zodiac?: string;
  isLocationPrivate?: boolean;
  pinColor?: string;
  blockedUsers?: mongoose.Types.ObjectId[];
  languages?: IUserLanguage[];
  interests?: string[];
  messagePreferences?: IMessagePreferences;
  gold: number;
  stamps: IUserStamp[];
  ownedBirds: string[];
  activeBird: string;
  openSkiesQuota: {
    remaining: number;
    max: number;
    resetAt?: Date;
  };
  dailyRewards?: {
    lastDailyClaimAt?: Date;
    dailyStreak: number;
    lastGambleAt?: Date;
    questsCompletedToday?: string[];
  };
  claimedMilestones?: string[];
  totalKmExplored?: number;
  feederSeeds?: number; // Seeds currently in the loft's trough

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: 'feather' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    inventory: {
      seeds: { type: Number, default: 10 },
      cages: { type: Number, default: 1 },
    },
    feederSeeds: { type: Number, default: 0, min: 0 },
    stats: {
      sentCount: { type: Number, default: 0 },
      receivedCount: { type: Number, default: 0 },
      deadPigeonsCount: { type: Number, default: 0 },
      maxDistance: { type: Number, default: 0 },
    },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    sentFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    expoPushToken: { type: String, default: null },
    location: {
      city: { type: String, default: 'Budapest' },
      lat: { type: Number, default: 47.4979 },
      lng: { type: Number, default: 19.0402 },
      updatedAt: { type: Date, default: Date.now },
    },
    hasCompletedOnboarding: { type: Boolean, default: false },

    bio: { type: String, default: '' },
    birthday: { type: Date, default: null },
    zodiac: { type: String, default: '' },
    gender: { type: String, default: 'Prefer not to say' },
    isLocationPrivate: { type: Boolean, default: false },
    pinColor: { type: String, default: '#818cf8' },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    languages: {
      type: [
        {
          code: { type: String, required: true },
          name: { type: String, required: true },
          isNative: { type: Boolean, default: false },
        },
      ],
      default: [{ code: 'hu', name: 'Hungarian', isNative: true }],
    },
    interests: { type: [String], default: [] },
    messagePreferences: {
      replyPace: { type: String, default: 'No preference' },
      messageLength: { type: String, default: 'Any length' },
      writingAssistance: { type: String, default: 'Prefer not to say' },
      hereFor: { type: String, default: 'Friendship' },
    },
    gold: { type: Number, default: 5 },
    stamps: {
      type: [
        {
          id: { type: String, required: true },
          code: { type: String, required: true },
          name: { type: String, required: true },
          country: { type: String, required: true },
          count: { type: Number, default: 1 },
          image: { type: String },
          unlockedAt: { type: Date, default: Date.now },
        },
      ],
      default: [
        {
          id: 'stamp_hu_01',
          code: 'HU PP-01',
          name: 'Budapest Parliament',
          country: 'Hungary',
          count: 1,
        },
      ],
    },
    ownedBirds: { type: [String], default: ['pigeon'] },
    activeBird: { type: String, default: 'pigeon' },
    openSkiesQuota: {
      remaining: { type: Number, default: 20 },
      max: { type: Number, default: 20 },
      resetAt: { type: Date, default: Date.now },
    },
    dailyRewards: {
      lastDailyClaimAt: { type: Date, default: null },
      dailyStreak: { type: Number, default: 0 },
      lastGambleAt: { type: Date, default: null },
      questsCompletedToday: { type: [String], default: [] },
    },
    claimedMilestones: { type: [String], default: [] },
    totalKmExplored: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
