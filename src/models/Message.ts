import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  pigeonId: mongoose.Types.ObjectId;
  pigeonIds?: mongoose.Types.ObjectId[];
  isFlock?: boolean;
  flockSize?: number;
  content: string; // Max flockSize * 500 chars
  status: 'flying' | 'delivered' | 'waiting_for_pickup' | 'expired_lost' | 'returned_to_sender';
  
  // Coordinates for distance calculations
  startCoords: {
    lat: number;
    lng: number;
  };
  endCoords: {
    lat: number;
    lng: number;
  };
  distanceKm: number; // Calculated via Haversine

  // Physics engine calculations
  flightDurationMinutes: number; // Base 100km/h
  deathChance: number; // % chance based on distance and pigeon level
  lostChance: number; // % chance based on distance and pigeon level

  // Time mechanics
  dispatchedAt: Date;
  estimatedArrivalAt: Date;
  senderLocalTime: string; // Stored as ISO or specific timezone offset string
  recipientLocalTime: string; // Optional, might not know at dispatch
  pickupDeadline: Date; // When waiting_for_pickup, deadline before expiry
  isRead: boolean;
  deliveredNotified?: boolean;
  senderDeliveredNotified?: boolean;
  returnedNotified?: boolean;
  isOpenSkies?: boolean;
  attachedStampId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pigeonId: { type: Schema.Types.ObjectId, ref: 'Pigeon', required: true },
    pigeonIds: [{ type: Schema.Types.ObjectId, ref: 'Pigeon' }],
    isFlock: { type: Boolean, default: false },
    flockSize: { type: Number, default: 1 },
    content: { type: String, required: true, maxlength: 15000 },
    status: {
      type: String,
      enum: ['flying', 'delivered', 'waiting_for_pickup', 'expired_lost', 'returned_to_sender'],
      default: 'flying'
    },
    startCoords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    endCoords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    distanceKm: { type: Number, required: true },
    
    flightDurationMinutes: { type: Number, required: true },
    deathChance: { type: Number, required: true, default: 0 },
    lostChance: { type: Number, required: true, default: 0 },

    dispatchedAt: { type: Date, required: true, default: Date.now },
    estimatedArrivalAt: { type: Date, required: true },
    senderLocalTime: { type: String, required: true },
    recipientLocalTime: { type: String },
    pickupDeadline: { type: Date },
    isRead: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    deliveredNotified: { type: Boolean, default: false },
    senderDeliveredNotified: { type: Boolean, default: false },
    returnedNotified: { type: Boolean, default: false },
    returnDispatchedAt: { type: Date },
    returnEstimatedArrivalAt: { type: Date },
    returningStatus: { type: String, enum: ['idle', 'returning', 'held_by_recipient', 'returned'], default: 'idle' },
    heldByAction: { type: String, enum: ['none', 'fed_seeds', 'caged'], default: 'none' },
    heldUntil: { type: Date },
    isOpenSkies: { type: Boolean, default: false },
    attachedStampId: { type: String, default: null }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
