require('dotenv').config();
const { initDB, getDB } = require('./src/db');

async function directSalaryTest() {
  try {
    await initDB();
    const db = getDB();
    
    const labourId = 5;
    const month = '2026-02';
    
    console.log('=== DIRECT SALARY CALCULATION TEST ===');
    
    // Get labour
    const labour = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM labours WHERE id = ?', [labourId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!labour) {
      console.log('Labour not found');
      return;
    }
    
    console.log(`Labour: ${labour.name}, Daily Rate: ${labour.dailyRate}`);
    
    // Get attendance counts
    const statusCounts = await new Promise((resolve, reject) => {
      db.all(
        `SELECT status, COUNT(*) as count FROM attendance 
         WHERE labourId = ? AND strftime("%Y-%m", date) = ?
         GROUP BY status`,
        [labourId, month],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    console.log('Attendance counts:', statusCounts);
    
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
    
    console.log(`Working days: ${workingDays}, Basic salary: ${basicSalary}`);
    
    // Get overtime hours
    const overtimeData = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(CAST(hours AS REAL)), 0) as totalOvertimeHours FROM attendance 
         WHERE labourId = ? AND status = 'overtime' AND strftime("%Y-%m", date) = ?`,
        [labourId, month],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    const totalOvertimeHours = overtimeData.totalOvertimeHours || 0;
    const STANDARD_HOURS_PER_DAY = 8; // Standard workday hours
    const hourlyRate = labour.dailyRate / STANDARD_HOURS_PER_DAY;
    const overtimePay = totalOvertimeHours * hourlyRate; // 1x rate for overtime hours
    
    console.log(`Overtime hours: ${totalOvertimeHours}, Overtime pay: ${overtimePay}`);
    
    // Get advances
    const advanceData = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(amount), 0) as totalAdvance FROM advances 
         WHERE labourId = ? AND status = 'pending' AND strftime("%Y-%m", date) = ?`,
        [labourId, month],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    const totalAdvance = advanceData.totalAdvance || 0;
    console.log(`Total advances: ${totalAdvance}`);
    
    // Get deductions
    const deductionData = await new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(amount), 0) as totalDeductions FROM deductions 
         WHERE labourId = ? AND strftime("%Y-%m", date) = ?`,
        [labourId, month],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    const totalDeductions = deductionData.totalDeductions || 0;
    console.log(`Total deductions: ${totalDeductions}`);
    
    const netSalary = basicSalary + overtimePay - totalAdvance - totalDeductions;
    
    console.log('\n=== FINAL CALCULATION ===');
    console.log(`Labour: ${labour.name}`);
    console.log(`Month: ${month}`);
    console.log(`Working Days: ${workingDays}`);
    console.log(`Basic Salary: ${basicSalary}`);
    console.log(`Overtime Pay: ${overtimePay}`);
    console.log(`Total Advances: ${totalAdvance}`);
    console.log(`Total Deductions: ${totalDeductions}`);
    console.log(`Net Salary: ${netSalary}`);
    
    // Try to insert into database
    console.log('\n=== INSERTING INTO DATABASE ===');
    db.run(
      `INSERT OR REPLACE INTO salaries 
       (labourId, month, basicSalary, daysPresent, overtimeHours, overtimePay, totalAdvance, totalDeductions, netSalary) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [labourId, month, basicSalary, workingDays, totalOvertimeHours, overtimePay, totalAdvance, totalDeductions, netSalary],
      function (err) {
        if (err) {
          console.error('Database insert error:', err);
        } else {
          console.log('Salary record inserted successfully. ID:', this.lastID);
        }
        process.exit(0);
      }
    );
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

directSalaryTest();