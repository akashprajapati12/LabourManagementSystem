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

// Robust database initialization
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    // Initialize database connection
    await initDB();
    console.log('✅ Database connection established');
    
    const db = getDB();
    
    // Create all tables with proper error handling
    const createTables = () => {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          // Users table
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT UNIQUE,
              role TEXT DEFAULT 'admin',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('❌ Error creating users table:', err.message);
              reject(err);
            } else {
              console.log('✅ Users table ready');
            }
          });
          
          // Other tables (simplified for brevity)
          const otherTables = [
            `CREATE TABLE IF NOT EXISTS labours (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT,
              phone TEXT,
              address TEXT,
              aadhar TEXT UNIQUE,
              bankAccount TEXT,
              dailyRate REAL DEFAULT 0,
              designation TEXT,
              photo LONGTEXT,
              joinDate DATETIME DEFAULT CURRENT_TIMESTAMP,
              status TEXT DEFAULT 'active',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS attendance (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              labourId INTEGER NOT NULL,
              date DATE NOT NULL,
              status TEXT DEFAULT 'present',
              hours REAL DEFAULT 8,
              notes TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (labourId) REFERENCES labours(id),
              UNIQUE(labourId, date)
            )`
          ];
          
          otherTables.forEach((tableSQL, index) => {
            db.run(tableSQL, (err) => {
              if (err) {
                console.error(`❌ Error creating table ${index + 2}:`, err.message);
              } else {
                console.log(`✅ Table ${index + 2} ready`);
              }
            });
          });
          
          // Create default admin user
          const adminPassword = 'admin123';
          const hashedPassword = bcrypt.hashSync(adminPassword, 10);
          
          db.run(
            'INSERT OR IGNORE INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
            ['admin', hashedPassword, 'Administrator', 'admin@example.com', 'admin'],
            function (err) {
              if (err) {
                console.error('❌ Error creating admin user:', err.message);
              } else {
                console.log('✅ Default admin user created/verified');
                console.log('   Username: admin');
                console.log('   Password: admin123');
              }
              resolve();
            }
          );
        });
      });
    };
    
    await createTables();
    console.log('🎉 Database initialization completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Initialize application
async function initializeApp() {
  try {
    const dbReady = await initializeDatabase();
    
    if (!dbReady) {
      console.error('❌ Failed to initialize database. Exiting...');
      process.exit(1);
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
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();