console.warn('⚠️ debug_db.js is deprecated after migrating to MongoDB');
process.exit(0);

// const { initDB, getDB } = require('./src/db');

async function debugDatabase() {
  try {
    await initDB();
    const db = getDB();
    
    // Check labours
    console.log('=== Labours ===');
    db.all('SELECT * FROM labours', (err, labours) => {
      if (err) {
        console.error('Error fetching labours:', err);
      } else {
        console.log('Labours count:', labours.length);
        labours.forEach(l => {
          console.log(`ID: ${l.id}, Name: ${l.name}, Daily Rate: ${l.dailyRate}`);
        });
      }
      
      // Check attendance
      console.log('\n=== Attendance ===');
      db.all('SELECT * FROM attendance', (err, attendance) => {
        if (err) {
          console.error('Error fetching attendance:', err);
        } else {
          console.log('Attendance count:', attendance.length);
          attendance.forEach(a => {
            console.log(`Labour ID: ${a.labourId}, Date: ${a.date}, Status: ${a.status}, Hours: ${a.hours}`);
          });
        }
        
        // Check salaries
        console.log('\n=== Salaries ===');
        db.all('SELECT * FROM salaries', (err, salaries) => {
          if (err) {
            console.error('Error fetching salaries:', err);
          } else {
            console.log('Salaries count:', salaries.length);
            salaries.forEach(s => {
              console.log(`ID: ${s.id}, Labour ID: ${s.labourId}, Month: ${s.month}, Basic: ${s.basicSalary}, Net: ${s.netSalary}`);
            });
          }
          
          // Check advances
          console.log('\n=== Advances ===');
          db.all('SELECT * FROM advances', (err, advances) => {
            if (err) {
              console.error('Error fetching advances:', err);
            } else {
              console.log('Advances count:', advances.length);
              advances.forEach(a => {
                console.log(`Labour ID: ${a.labourId}, Amount: ${a.amount}, Status: ${a.status}`);
              });
            }
            
            // Check deductions
            console.log('\n=== Deductions ===');
            db.all('SELECT * FROM deductions', (err, deductions) => {
              if (err) {
                console.error('Error fetching deductions:', err);
              } else {
                console.log('Deductions count:', deductions.length);
                deductions.forEach(d => {
                  console.log(`Labour ID: ${d.labourId}, Amount: ${d.amount}, Type: ${d.type}`);
                });
              }
              process.exit(0);
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

debugDatabase();