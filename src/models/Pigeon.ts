import mongoose, { Schema, Document } from 'mongoose';

export interface IPigeon extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  identifier: string; // E.g., #1024
  level: number; // 1, 2, 3+ (affects color, speed, survival rate)
  status: 'idle' | 'flying' | 'returning' | 'resting' | 'dead';
  fatigue: number; // 0 to 100
  cooldownUntil?: Date; // When it finishes resting
  createdAt: Date;
  updatedAt: Date;
}

const PigeonSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    identifier: { type: String, required: true },
    level: { type: Number, default: 1 },
    status: { type: String, enum: ['idle', 'flying', 'returning', 'resting', 'dead'], default: 'idle' },
    fatigue: { type: Number, default: 0, min: 0, max: 100 },
    cooldownUntil: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Pigeon || mongoose.model<IPigeon>('Pigeon', PigeonSchema);
