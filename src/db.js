const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// determine default DB location
// on Render the repository is read-only, writable storage is at /opt/render/project/data
let defaultDb = './database.sqlite';
if (process.env.RENDER || process.env.RENDER_SERVICE_ID) {
  defaultDb = '/opt/render/project/data/database.sqlite';
}

// allow overriding path via environment (useful for deployments)
const dbPath = path.resolve(process.env.DB_PATH || defaultDb);

// ensure containing directory exists (in case DB_PATH points to nested folder)
const dbDir = path.dirname(dbPath);
if (!require('fs').existsSync(dbDir)) {
  require('fs').mkdirSync(dbDir, { recursive: true });
}

console.log('Using SQLite database at:', dbPath);

let db = null;

const initDB = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables();
        resolve(db);
      }
    });
  });
};

const createTables = () => {
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
    `);

    // Labours table
    db.run(`
      CREATE TABLE IF NOT EXISTS labours (
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
      )
    `);
    
    // Add photo column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE labours ADD COLUMN photo LONGTEXT`, (err) => {
      if (err && !err.message.includes('duplicate')) {
        console.log('Note: photo column may already exist');
      }
    });

    // Attendance table
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        date DATE NOT NULL,
        status TEXT DEFAULT 'present',
        hours REAL DEFAULT 8,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id),
        UNIQUE(labourId, date)
      )
    `);

    // Advances table
    db.run(`
      CREATE TABLE IF NOT EXISTS advances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        amount REAL NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        dueDate DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )
    `);

    // Deductions table
    db.run(`
      CREATE TABLE IF NOT EXISTS deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )
    `);

    // Leaves table
    db.run(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        labourId INTEGER NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        type TEXT,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labourId) REFERENCES labours(id)
      )
    `);

    // Salary records table
    db.run(`
      CREATE TABLE IF NOT EXISTS salaries (
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
      )
    `);
  });
};

const getDB = () => db;

module.exports = {
  initDB,
  getDB
};
