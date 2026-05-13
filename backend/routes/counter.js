const express = require('express');
const { verifyToken } = require('./auth');
const Counter = require('../models/Counter');
const CounterHistory = require('../models/CounterHistory');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let counter = await Counter.findOne({ userId: req.user.userId });
    if (!counter) {
      counter = await Counter.create({ userId: req.user.userId, value: 0 });
    }
    res.json({ success: true, data: { value: counter.value, updated_at: counter.updatedAt } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { action } = req.body;
  if (!['increment', 'decrement', 'reset'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }

  try {
    let counter = await Counter.findOne({ userId: req.user.userId });
    if (!counter) {
      counter = await Counter.create({ userId: req.user.userId, value: 0 });
    }

    const valueBefore = counter.value;
    let valueAfter = valueBefore;

    if (action === 'increment') valueAfter++;
    else if (action === 'decrement') valueAfter--;
    else if (action === 'reset') valueAfter = 0;

    counter.value = valueAfter;
    await counter.save();

    await CounterHistory.create({
      userId: req.user.userId,
      action,
      valueBefore,
      valueAfter
    });

    res.json({ success: true, data: { value: counter.value, updated_at: counter.updatedAt } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
