const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Counter = require('../models/Counter');

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    
    // Create counter
    await Counter.create({ userId: user._id, value: 0 });

    const token = jwt.sign({ userId: user._id, email, name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.status(201).json({ success: true, user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, email, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.json({ success: true, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ success: true });
});

router.get('/me', verifyToken, (req, res) => {
  res.json({ success: true, user: { id: req.user.userId, name: req.user.name, email: req.user.email } });
});

module.exports = {
  router,
  verifyToken
};
