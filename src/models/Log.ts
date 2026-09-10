import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  level: 'info' | 'warn' | 'error';
  message: string;
  context: string; // The service or module (e.g., 'AuthService', 'PhysicsEngine')
  metadata?: any; // Additional data as JSON
  createdAt: Date;
}

const LogSchema: Schema = new Schema(
  {
    level: { type: String, enum: ['info', 'warn', 'error'], required: true },
    message: { type: String, required: true },
    context: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only need when it was created
    capped: { size: 10485760, max: 10000, autoIndexId: true } // Capped collection: max 10MB or 10000 docs
  }
);

export default mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
