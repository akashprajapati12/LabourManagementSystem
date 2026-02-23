const { initDB, getDB } = require('./src/db');

async function checkOvertimeRecords() {
  try {
    await initDB();
    const db = getDB();
    
    db.all('SELECT labourId, date, status, hours FROM attendance WHERE status = "overtime"', (err, records) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('Overtime records:');
        records.forEach(record => {
          console.log(`Labour ${record.labourId} on ${record.date}: ${record.hours} hours`);
        });
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkOvertimeRecords();