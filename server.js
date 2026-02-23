require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDB } = require('./src/db');

// Import routes
const authRoutes = require('./src/routes/auth');
const laboursRoutes = require('./src/routes/labours');
const attendanceRoutes = require('./src/routes/attendance');
const advancesRoutes = require('./src/routes/advances');
const deductionsRoutes = require('./src/routes/deductions');
const leavesRoutes = require('./src/routes/leaves');
const salariesRoutes = require('./src/routes/salaries');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/labours', laboursRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advances', advancesRoutes);
app.use('/api/deductions', deductionsRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/salaries', salariesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDB().then(() => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Labour Management System running on http://localhost:${PORT}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
