import mongoose, { Schema, Document } from 'mongoose';

export interface IExpeditionStamp {
  id: string;
  code: string;
  name: string;
  country: string;
  image?: string;
}

export interface IExpedition extends Document {
  userId: mongoose.Types.ObjectId;
  pigeonId: mongoose.Types.ObjectId;
  destinationName: string;
  cityId?: string;
  distanceKm?: number;
  durationMinutes: number;
  dispatchedAt: Date;
  estimatedReturnAt: Date;
  rewardGold: number;
  rewardSeeds: number;
  rewardCages?: number;
  rewardStamp?: IExpeditionStamp;
  rewardStampId?: string;
  status: 'exploring' | 'completed' | 'claimed';
  createdAt: Date;
  updatedAt: Date;
}

const ExpeditionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pigeonId: { type: Schema.Types.ObjectId, ref: 'Pigeon', required: true },
    destinationName: { type: String, required: true },
    cityId: { type: String, default: null },
    distanceKm: { type: Number, default: 50 },
    durationMinutes: { type: Number, required: true },
    dispatchedAt: { type: Date, required: true },
    estimatedReturnAt: { type: Date, required: true },
    rewardGold: { type: Number, default: 0 },
    rewardSeeds: { type: Number, default: 0 },
    rewardCages: { type: Number, default: 0 },
    rewardStamp: {
      id: { type: String },
      code: { type: String },
      name: { type: String },
      country: { type: String },
      image: { type: String },
    },
    rewardStampId: { type: String, default: null },
    status: {
      type: String,
      enum: ['exploring', 'completed', 'claimed'],
      default: 'exploring',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Expedition || mongoose.model<IExpedition>('Expedition', ExpeditionSchema);
