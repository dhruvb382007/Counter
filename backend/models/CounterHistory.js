const mongoose = require('mongoose');

const CounterHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['increment', 'decrement', 'reset'], required: true },
  valueBefore: { type: Number, required: true },
  valueAfter: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('CounterHistory', CounterHistorySchema);
