const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  value: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Counter', CounterSchema);
