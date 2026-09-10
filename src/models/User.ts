import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  level: number;
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
  pendingFriendRequests: mongoose.Types.ObjectId[]; // requests received
  sentFriendRequests: mongoose.Types.ObjectId[];    // requests sent
  role: 'user' | 'admin';
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
    avatar: { type: String, default: 'pigeon-basic' },
    level: { type: Number, default: 1 },
    inventory: {
      seeds: { type: Number, default: 10 },
      cages: { type: Number, default: 1 },
    },
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
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
