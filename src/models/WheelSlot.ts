import mongoose, { Schema, Document } from 'mongoose';

export interface IWheelSlot extends Document {
  slotId: string;
  label: string;
  type: 'gold' | 'seeds' | 'cages' | 'xp';
  amount: number;
  weight: number; // Probability weight
  color: string; // Hex color for wheel wedge
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const WheelSlotSchema: Schema = new Schema(
  {
    slotId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['gold', 'seeds', 'cages', 'xp'], default: 'gold' },
    amount: { type: Number, required: true, default: 25 },
    weight: { type: Number, required: true, default: 10 },
    color: { type: String, default: '#f59e0b' },
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common',
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WheelSlot || mongoose.model<IWheelSlot>('WheelSlot', WheelSlotSchema);
