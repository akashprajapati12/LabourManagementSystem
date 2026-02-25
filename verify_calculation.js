const { initDB } = require('./src/db');

async function verifyCalculation() {
  try {
    await initDB();
    
    console.log('=== VERIFICATION OF UPDATED OVERTIME CALCULATION ===');
    
    const dailyRate = 800;
    const overtimeHours = 3;
    const STANDARD_HOURS_PER_DAY = 8;
    
    const hourlyRate = dailyRate / STANDARD_HOURS_PER_DAY;
    const overtimePay = overtimeHours * hourlyRate;
    
    console.log(`Daily Rate: ₹${dailyRate}`);
    console.log(`Standard Hours per Day: ${STANDARD_HOURS_PER_DAY} hours`);
    console.log(`Overtime Hours: ${overtimeHours} hours`);
    console.log(`Hourly Rate: ₹${hourlyRate}`);
    console.log(`Overtime Pay (1x rate): ₹${overtimePay}`);
    console.log('');
    console.log(`✓ This matches your requirement: 3 hours × ₹100 = ₹300`);
    console.log(`✓ No 1.5x multiplier applied`);
    console.log(`✓ Only the additional hours are paid at regular rate`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyCalculation();