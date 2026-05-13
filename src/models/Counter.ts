/**
 * Counter Mongoose Model — one document per user.
 * Collection: counters
 */
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICounter extends Document {
  userId:    Types.ObjectId;
  value:     number;
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,   // one counter doc per user
      index:    true,
    },
    value: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

export default Counter;
