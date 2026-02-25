console.warn('⚠️ test_salary.js is deprecated. Rewrite using MongoDB models or remove this file.');
process.exit(0);

// const { initDB, getDB } = require('./src/db');

async function testSalaryCalculation() {
  try {
    await initDB();
    const db = getDB();
    
    const labourId = 5; // Akash Kumar
    const month = '2026-02';
    
    console.log(`Testing salary calculation for Labour ID: ${labourId}, Month: ${month}`);
    
    // Get labour details
    db.get('SELECT * FROM labours WHERE id = ?', [labourId], (err, labour) => {
      if (err) {
        console.error('Error fetching labour:', err);
        return;
      }
      if (!labour) {
        console.error('Labour not found');
        return;
      }
      
      console.log(`Labour: ${labour.name}, Daily Rate: ${labour.dailyRate}`);
      
      // Count attendance by status
      db.all(
        `SELECT status, COUNT(*) as count FROM attendance 
         WHERE labourId = ? AND strftime("%Y-%m", date) = ?
         GROUP BY status`,
        [labourId, month],
        (err, statusCounts) => {
          if (err) {
            console.error('Error fetching attendance counts:', err);
            return;
          }
          
          console.log('Attendance by status:', statusCounts);
          
          let fullDays = 0;
          let halfDays = 0;
          
          statusCounts.forEach(row => {
            if (row.status === 'present' || row.status === 'overtime') {
              fullDays += row.count;
            } else if (row.status === 'half-day') {
              halfDays += row.count;
            }
          });
          
          console.log(`Full days: ${fullDays}, Half days: ${halfDays}`);
          
          const workingDays = fullDays + (halfDays * 0.5);
          const basicSalary = labour.dailyRate * workingDays;
          
          console.log(`Working days: ${workingDays}, Basic salary: ${basicSalary}`);
          
          // Get overtime hours
          db.get(
            `SELECT COALESCE(SUM(CAST(hours AS REAL)), 0) as totalOvertimeHours FROM attendance 
             WHERE labourId = ? AND status = 'overtime' AND strftime("%Y-%m", date) = ?`,
            [labourId, month],
            (err, overtimeData) => {
              if (err) {
                console.error('Error fetching overtime data:', err);
                return;
              }
              
              const totalOvertimeHours = overtimeData.totalOvertimeHours || 0;
              const STANDARD_HOURS_PER_DAY = 8; // Standard workday hours
              const hourlyRate = labour.dailyRate / STANDARD_HOURS_PER_DAY;
              const overtimePay = totalOvertimeHours * hourlyRate; // 1x rate for overtime hours
              
              console.log(`Overtime hours: ${totalOvertimeHours}, Overtime pay: ${overtimePay}`);
              
              // Get advances
              db.get(
                `SELECT COALESCE(SUM(amount), 0) as totalAdvance FROM advances 
                 WHERE labourId = ? AND status = 'pending' AND strftime("%Y-%m", date) = ?`,
                [labourId, month],
                (err, advanceData) => {
                  if (err) {
                    console.error('Error fetching advances:', err);
                    return;
                  }
                  
                  const totalAdvance = advanceData.totalAdvance || 0;
                  console.log(`Total advances: ${totalAdvance}`);
                  
                  // Get deductions
                  db.get(
                    `SELECT COALESCE(SUM(amount), 0) as totalDeductions FROM deductions 
                     WHERE labourId = ? AND strftime("%Y-%m", date) = ?`,
                    [labourId, month],
                    (err, deductionData) => {
                      if (err) {
                        console.error('Error fetching deductions:', err);
                        return;
                      }
                      
                      const totalDeductions = deductionData.totalDeductions || 0;
                      console.log(`Total deductions: ${totalDeductions}`);
                      
                      const netSalary = basicSalary + overtimePay - totalAdvance - totalDeductions;
                      
                      console.log(`\n=== CALCULATION SUMMARY ===`);
                      console.log(`Labour: ${labour.name}`);
                      console.log(`Daily Rate: ${labour.dailyRate}`);
                      console.log(`Working Days: ${workingDays}`);
                      console.log(`Basic Salary: ${basicSalary}`);
                      console.log(`Overtime Hours: ${totalOvertimeHours}`);
                      console.log(`Overtime Pay: ${overtimePay}`);
                      console.log(`Total Advances: ${totalAdvance}`);
                      console.log(`Total Deductions: ${totalDeductions}`);
                      console.log(`Net Salary: ${netSalary}`);
                      
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
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

testSalaryCalculation();