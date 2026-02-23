const { initDB, getDB } = require('./src/db');

async function updateSalariesTable() {
  try {
    await initDB();
    const db = getDB();
    
    console.log('Adding missing columns to salaries table...');
    
    // Add overtimeHours column
    db.run(`ALTER TABLE salaries ADD COLUMN overtimeHours REAL DEFAULT 0`, (err) => {
      if (err) {
        console.log('overtimeHours column may already exist or error:', err.message);
      } else {
        console.log('Added overtimeHours column');
      }
      
      // Add overtimePay column
      db.run(`ALTER TABLE salaries ADD COLUMN overtimePay REAL DEFAULT 0`, (err) => {
        if (err) {
          console.log('overtimePay column may already exist or error:', err.message);
        } else {
          console.log('Added overtimePay column');
        }
        
        // Verify the columns were added
        db.all("PRAGMA table_info(salaries)", (err, columns) => {
          if (err) {
            console.error('Error checking table info:', err);
          } else {
            console.log('\nUpdated salaries table columns:');
            columns.forEach(col => {
              console.log(`- ${col.name} (${col.type})`);
            });
          }
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSalariesTable();