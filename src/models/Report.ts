import mongoose, { Schema, Document } from 'mongoose';

export const REPORT_REASONS = ['spam', 'abuse', 'inappropriate', 'impersonation', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId | null;
  reason: ReportReason;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  resolvedAt?: Date | null;
  createdAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: '', maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
    resolutionNote: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
