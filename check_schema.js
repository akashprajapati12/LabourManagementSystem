const { initDB, getDB } = require('./src/db');

async function checkTableStructure() {
  try {
    await initDB();
    const db = getDB();
    
    db.all("PRAGMA table_info(salaries)", (err, columns) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('Salaries table columns:');
        columns.forEach(col => {
          console.log(`- ${col.name} (${col.type})`);
        });
      }
      
      // Also check if overtimeHours column exists
      db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='salaries'", (err, result) => {
        if (err) {
          console.error('Error getting table schema:', err);
        } else {
          console.log('\nTable creation SQL:');
          console.log(result.sql);
        }
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTableStructure();