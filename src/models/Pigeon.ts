import mongoose, { Schema, Document } from 'mongoose';

export interface IPigeon extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  identifier: string; // E.g., #1024
  level: number; // 1, 2, 3+ (affects color, speed, survival rate)
  xp: number;
  species: string; // pigeon, starling, raven, barn_owl, golden_eagle, peregrine, falcon_express, phoenix_express, turtle_dove
  speedKmH: number; // 80, 92, 96, 102, 160, 170, 240, 300, 88
  journeysCount: number;
  status: 'idle' | 'flying' | 'returning' | 'resting' | 'dead' | 'stray';
  fatigue: number; // 0 to 100
  satiety: number; // 0 to 100 (100 = full, 0 = starving)
  cooldownUntil?: Date; // When it finishes resting
  lastLoftTickAt?: Date;
  starvingSince?: Date;
  straySince?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PigeonSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    identifier: { type: String, required: true },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    species: { type: String, default: 'pigeon' },
    speedKmH: { type: Number, default: 80 },
    journeysCount: { type: Number, default: 0 },
    status: { type: String, enum: ['idle', 'flying', 'returning', 'resting', 'dead', 'stray'], default: 'idle' },
    fatigue: { type: Number, default: 0, min: 0, max: 100 },
    satiety: { type: Number, default: 100, min: 0, max: 100 },
    cooldownUntil: { type: Date, default: null },
    lastLoftTickAt: { type: Date, default: null },
    starvingSince: { type: Date, default: null },
    straySince: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Pigeon || mongoose.model<IPigeon>('Pigeon', PigeonSchema);
