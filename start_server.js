// Production startup script for Labour Management System
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDB, getDB } = require('./src/db');

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

// Enhanced middleware configuration for production
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
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

// Serve frontend - Handle all non-API routes by serving index.html
// This is crucial for single-page applications to prevent 404 errors
app.get(/^(?!\/api\/).*$/, (req, res) => {
  // This regex matches any path that does not start with /api/
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and create default admin user
async function initializeApp() {
  try {
    await initDB();
    console.log('✅ Database initialized successfully');
    
    // Create default admin user if it doesn't exist
    const db = getDB();
    
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, existingUser) => {
      if (err) {
        console.error('❌ Error checking for admin user:', err.message);
        return;
      }
      
      if (!existingUser) {
        const adminPassword = 'admin123';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        
        db.run(
          'INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
          ['admin', hashedPassword, 'Administrator', 'admin@example.com', 'admin'],
          function (err) {
            if (err) {
              console.error('❌ Error creating admin user:', err.message);
            } else {
              console.log('✅ Default admin user created');
              console.log('   Username: admin');
              console.log('   Password: admin123');
            }
          }
        );
      } else {
        console.log('✅ Admin user already exists');
      }
      
      // Start the server
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Labour Management System running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Access the application at: http://${process.env.HOST || 'localhost'}:${PORT}`);
        console.log('Use admin/admin123 to login');
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
    });
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();