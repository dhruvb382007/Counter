require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Routes
const { router: authRoutes } = require('./routes/auth');
const counterRoutes = require('./routes/counter');
const statsRoutes = require('./routes/stats');

// Initialize Express app
const app = express();

// Middleware
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/counter', counterRoutes);
app.use('/api/stats', statsRoutes);

// Initialize Scheduler
require('./scheduler');

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
