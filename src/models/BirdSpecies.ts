import mongoose, { Schema, Document } from 'mongoose';

export interface IBirdSpecies extends Document {
  speciesId: string; // Unique id e.g. 'pigeon', 'starling', 'snowy_owl'
  name: string; // Display name e.g. 'Postagalamb'
  subtitle: string; // Description/subtitle
  speedKmH: number; // Flight speed in km/h
  priceGold: number; // Purchase price in gold
  minLevel: number; // Min required user level
  requirementText: string; // e.g. 'Alapértelmezett' or '1,400 arany'
  avatarBase64?: string; // Profile image data URI or URL
  flyingBase64?: string; // Flying map marker data URI or URL
  sizeRank: number; // Flock sizing/leader rank (1-10)
  isActive: boolean; // Soft delete / visibility toggle
  createdAt: Date;
  updatedAt: Date;
}

const BirdSpeciesSchema: Schema = new Schema(
  {
    speciesId: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    speedKmH: { type: Number, required: true, min: 10, default: 80 },
    priceGold: { type: Number, required: true, min: 0, default: 0 },
    minLevel: { type: Number, default: 1, min: 1 },
    requirementText: { type: String, default: '' },
    avatarBase64: { type: String, default: '' },
    flyingBase64: { type: String, default: '' },
    sizeRank: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.BirdSpecies || mongoose.model<IBirdSpecies>('BirdSpecies', BirdSpeciesSchema);
