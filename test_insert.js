const { initDB, getDB } = require('./src/db');

async function testInsert() {
  try {
    await initDB();
    const db = getDB();
    
    db.run(
      'INSERT OR REPLACE INTO salaries (labourId, month, basicSalary, daysPresent, overtimeHours, overtimePay, totalAdvance, totalDeductions, netSalary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [5, '2026-02', 4000, 5, 12, 1800, 200, 0, 5600],
      function(err) {
        if (err) {
          console.error('Insert error:', err);
        } else {
          console.log('Success! Inserted salary record with ID:', this.lastID);
        }
        process.exit(0);
      }
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testInsert();