import mongoose, { Schema, Document } from 'mongoose';

export interface IExpedition extends Document {
  userId: mongoose.Types.ObjectId;
  pigeonId: mongoose.Types.ObjectId;
  destinationName: string;
  durationMinutes: number; // 30, 60, 120, 240
  dispatchedAt: Date;
  estimatedReturnAt: Date;
  rewardGold: number;
  rewardSeeds: number;
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
    durationMinutes: { type: Number, required: true },
    dispatchedAt: { type: Date, required: true },
    estimatedReturnAt: { type: Date, required: true },
    rewardGold: { type: Number, default: 0 },
    rewardSeeds: { type: Number, default: 0 },
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
