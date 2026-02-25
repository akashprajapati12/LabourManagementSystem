console.warn('⚠️ recalculate_salary.js is deprecated after migrating to MongoDB');
process.exit(0);

// const { initDB, getDB } = require('./src/db');

async function recalculateSalary() {
  try {
    await initDB();
    const db = getDB();
    
    console.log('=== RECALCULATING SALARY WITH NEW OVERTIME RATE ===');
    
    const labourId = 5;
    const month = '2026-02';
    
    // Get labour details
    db.get('SELECT * FROM labours WHERE id = ?', [labourId], (err, labour) => {
      if (err) {
        console.error('Error fetching labour:', err);
        return;
      }
      
      console.log(`Labour: ${labour.name}, Daily Rate: ₹${labour.dailyRate}`);
      
      // Count attendance
      db.all(
        `SELECT status, COUNT(*) as count FROM attendance 
         WHERE labourId = ? AND strftime("%Y-%m", date) = ?
         GROUP BY status`,
        [labourId, month],
        (err, statusCounts) => {
          if (err) {
            console.error('Error:', err);
            return;
          }
          
          let fullDays = 0;
          let halfDays = 0;
          
          statusCounts.forEach(row => {
            if (row.status === 'present' || row.status === 'overtime') {
              fullDays += row.count;
            } else if (row.status === 'half-day') {
              halfDays += row.count;
            }
          });
          
          const workingDays = fullDays + (halfDays * 0.5);
          const basicSalary = labour.dailyRate * workingDays;
          
          console.log(`Working days: ${workingDays}`);
          console.log(`Basic Salary: ₹${basicSalary}`);
          
          // Get overtime hours
          db.get(
            `SELECT COALESCE(SUM(CAST(hours AS REAL)), 0) as totalOvertimeHours FROM attendance 
             WHERE labourId = ? AND status = 'overtime' AND strftime("%Y-%m", date) = ?`,
            [labourId, month],
            (err, overtimeData) => {
              if (err) {
                console.error('Error:', err);
                return;
              }
              
              const totalOvertimeHours = overtimeData.totalOvertimeHours || 0;
              const STANDARD_HOURS_PER_DAY = 8;
              const hourlyRate = labour.dailyRate / STANDARD_HOURS_PER_DAY;
              const overtimePay = totalOvertimeHours * hourlyRate; // 1x rate
              
              console.log(`Overtime Hours: ${totalOvertimeHours}`);
              console.log(`Hourly Rate: ₹${hourlyRate}`);
              console.log(`Overtime Pay (1x): ₹${overtimePay}`);
              
              // Get advances
              db.get(
                `SELECT COALESCE(SUM(amount), 0) as totalAdvance FROM advances 
                 WHERE labourId = ? AND status = 'pending' AND strftime("%Y-%m", date) = ?`,
                [labourId, month],
                (err, advanceData) => {
                  if (err) {
                    console.error('Error:', err);
                    return;
                  }
                  
                  const totalAdvance = advanceData.totalAdvance || 0;
                  const totalDeductions = 0; // No deductions in this example
                  const netSalary = basicSalary + overtimePay - totalAdvance - totalDeductions;
                  
                  console.log(`\n=== NEW CALCULATION SUMMARY ===`);
                  console.log(`Basic Salary: ₹${basicSalary}`);
                  console.log(`Overtime Pay: ₹${overtimePay}`);
                  console.log(`Total Advance: ₹${totalAdvance}`);
                  console.log(`Total Deductions: ₹${totalDeductions}`);
                  console.log(`Net Salary: ₹${netSalary}`);
                  
                  // Insert new record
                  db.run(
                    `INSERT OR REPLACE INTO salaries 
                     (labourId, month, basicSalary, daysPresent, overtimeHours, overtimePay, totalAdvance, totalDeductions, netSalary) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [labourId, month, basicSalary, workingDays, totalOvertimeHours, overtimePay, totalAdvance, totalDeductions, netSalary],
                    function (err) {
                      if (err) {
                        console.error('Database error:', err);
                      } else {
                        console.log(`\nNew salary record created with ID: ${this.lastID}`);
                      }
                      process.exit(0);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recalculateSalary();