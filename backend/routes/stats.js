const express = require('express');
const { verifyToken } = require('./auth');
const CounterHistory = require('../models/CounterHistory');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 6);

    const weekStart = new Date(today);
    weekStart.setUTCDate(today.getUTCDate() - today.getUTCDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

    const [dailyStats, [weeklyAgg]] = await Promise.all([
      CounterHistory.aggregate([
        { $match: { userId: req.user.userId, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            max_value: { $max: '$valueAfter' },
            min_value: { $min: '$valueAfter' },
            increments: { $sum: { $cond: [{ $eq: ['$action', 'increment'] }, 1, 0] } },
            decrements: { $sum: { $cond: [{ $eq: ['$action', 'decrement'] }, 1, 0] } },
            total_actions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      CounterHistory.aggregate([
        { $match: { userId: req.user.userId, createdAt: { $gte: weekStart, $lt: weekEnd } } },
        {
          $group: {
            _id: null,
            max_value: { $max: '$valueAfter' },
            min_value: { $min: '$valueAfter' },
            total_increments: { $sum: { $cond: [{ $eq: ['$action', 'increment'] }, 1, 0] } },
            total_decrements: { $sum: { $cond: [{ $eq: ['$action', 'decrement'] }, 1, 0] } },
            total_actions: { $sum: 1 }
          }
        }
      ])
    ]);

    const daily = dailyStats.map(d => ({
      day: d._id, max_value: d.max_value, min_value: d.min_value,
      increments: d.increments, decrements: d.decrements, total_actions: d.total_actions
    }));

    const ws = weeklyAgg || {};
    const weekly = {
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      max_value: ws.max_value ?? 0,
      min_value: ws.min_value ?? 0,
      total_increments: ws.total_increments ?? 0,
      total_decrements: ws.total_decrements ?? 0,
      total_actions: ws.total_actions ?? 0
    };

    res.json({ success: true, data: { daily, weekly } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
