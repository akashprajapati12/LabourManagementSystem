// Force database initialization and table creation
const { initDB, getDB } = require('./src/db');

async function forceDatabaseInit() {
  try {
    console.log('🔧 Force database initialization...');
    
    // Initialize database
    await initDB();
    console.log('✅ Database connection established');
    
    const db = getDB();
    
    // Force create all tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'admin',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        dueDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        type TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS salaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        month DATE NOT NULL,
        basicSalary REAL NOT NULL,
        daysPresent INTEGER DEFAULT 0,
        overtimeHours REAL DEFAULT 0,
        overtimePay REAL DEFAULT 0,
        totalAdvance REAL DEFAULT 0,
        totalDeductions REAL DEFAULT 0,
        netSalary REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id),
        UNIQUE(labourId, month)
      )`
    ];
    
    // Create each table
    for (let i = 0; i < tables.length; i++) {
      try {
        await new Promise((resolve, reject) => {
          db.run(tables[i], function(err) {
            if (err) {
              console.error(`❌ Error creating table ${i + 1}:`, err.message);
              reject(err);
            } else {
              console.log(`✅ Table ${i + 1} created successfully`);
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`Failed to create table:`, error.message);
      }
    }
    
    // Create default admin user
    const bcrypt = require('bcryptjs');
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
        }
      }
    );
    
    // Verify tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error('❌ Error checking tables:', err.message);
      } else {
        console.log('📋 Database tables:');
        rows.forEach(row => console.log(`  - ${row.name}`));
      }
    });
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

forceDatabaseInit();