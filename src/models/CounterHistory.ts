/**
 * CounterHistory Mongoose Model — one doc per action per user.
 * Collection: counterhistories
 * Used for weekly statistics and charts.
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type CounterAction = 'increment' | 'decrement' | 'reset';

export interface ICounterHistory extends Document {
  userId:      Types.ObjectId;
  action:      CounterAction;
  valueBefore: number;
  valueAfter:  number;
  createdAt:   Date;
}

const CounterHistorySchema = new Schema<ICounterHistory>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    action: {
      type:     String,
      enum:     ['increment', 'decrement', 'reset'],
      required: true,
    },
    valueBefore: { type: Number, required: true },
    valueAfter:  { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only need createdAt
  },
);

// Index for fast date-range queries used in stats aggregations
CounterHistorySchema.index({ userId: 1, createdAt: -1 });

const CounterHistory: Model<ICounterHistory> =
  mongoose.models.CounterHistory ||
  mongoose.model<ICounterHistory>('CounterHistory', CounterHistorySchema);

export default CounterHistory;
