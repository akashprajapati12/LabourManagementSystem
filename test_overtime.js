console.warn('⚠️ test_overtime.js is deprecated. Rewrite using MongoDB models or remove this file.');
process.exit(0);

// const { initDB, getDB } = require('./src/db');

async function testOvertimeCalculation() {
  try {
    await initDB();
    const db = getDB();
    
    console.log('=== OVERTIME CALCULATION TEST ===');
    
    // Test with a sample labour
    const labourId = 5; // Akash Kumar
    const dailyRate = 800;
    const overtimeHours = 12;
    
    console.log(`Labour ID: ${labourId}`);
    console.log(`Daily Rate: ₹${dailyRate}`);
    console.log(`Overtime Hours: ${overtimeHours} hours`);
    
    // Calculate using the updated logic
    const STANDARD_HOURS_PER_DAY = 8;
    const hourlyRate = dailyRate / STANDARD_HOURS_PER_DAY;
    const overtimePay = overtimeHours * hourlyRate; // 1x rate for overtime
    
    console.log(`\nCalculation Details:`);
    console.log(`Standard Hours per Day: ${STANDARD_HOURS_PER_DAY} hours`);
    console.log(`Hourly Rate: ₹${hourlyRate.toFixed(2)}`);
    console.log(`Overtime Rate (1x): ₹${hourlyRate.toFixed(2)}`);
    console.log(`Overtime Pay: ₹${overtimePay.toFixed(2)}`);
        
    console.log(`\nFormula: ${overtimeHours} hours × (₹${dailyRate} ÷ ${STANDARD_HOURS_PER_DAY} hours) = ₹${overtimePay.toFixed(2)}`);
    
    // Verify with database calculation
    console.log('\n=== DATABASE VERIFICATION ===');
    db.get('SELECT * FROM salaries WHERE labourId = ? AND month = ?', [labourId, '2026-02'], (err, salary) => {
      if (err) {
        console.error('Database error:', err);
      } else if (salary) {
        console.log('Database record found:');
        console.log(`Basic Salary: ₹${salary.basicSalary}`);
        console.log(`Overtime Hours: ${salary.overtimeHours} hours`);
        console.log(`Overtime Pay: ₹${salary.overtimePay}`);
        console.log(`Net Salary: ₹${salary.netSalary}`);
      } else {
        console.log('No salary record found for this period');
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testOvertimeCalculation();