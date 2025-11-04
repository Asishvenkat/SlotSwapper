import mongoose, { Document, Schema } from 'mongoose';

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export interface ISwapRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  requesterSlotId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  targetSlotId: mongoose.Types.ObjectId;
  status: SwapRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const swapRequestSchema = new Schema<ISwapRequest>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetSlotId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SwapRequestStatus),
      default: SwapRequestStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
swapRequestSchema.index({ requesterId: 1, status: 1 });
swapRequestSchema.index({ targetUserId: 1, status: 1 });
swapRequestSchema.index({ status: 1 });

export default mongoose.model<ISwapRequest>('SwapRequest', swapRequestSchema);
