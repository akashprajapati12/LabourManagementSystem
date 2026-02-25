// script to ensure MongoDB collections/indexes are ready and create default admin
const { initDB, mongoose } = require('./src/db');

async function forceDatabaseInit() {
  try {
    console.log('🔧 Force MongoDB initialization...');
    await initDB();

    // ensure models are registered by requiring route files
    require('./src/routes/auth');
    require('./src/routes/labours');
    require('./src/routes/attendance');
    require('./src/routes/advances');
    require('./src/routes/deductions');
    require('./src/routes/leaves');
    require('./src/routes/salaries');

    const User = mongoose.model('User');
    const Labour = mongoose.model('Labour');
    const Attendance = mongoose.model('Attendance');
    const Advance = mongoose.model('Advance');
    const Deduction = mongoose.model('Deduction');
    const Leave = mongoose.model('Leave');
    const Salary = mongoose.model('Salary');

    // create indexes for unique fields
    await User.createIndexes();
    await Labour.createIndexes();
    await Attendance.createIndexes();
    await Advance.createIndexes();
    await Deduction.createIndexes();
    await Leave.createIndexes();
    await Salary.createIndexes();

    console.log('✅ Indexes ensured for all collections');

    // create default admin if missing
    const bcrypt = require('bcryptjs');
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      admin = new User({ username: 'admin', password: hash, role: 'admin' });
      await admin.save();
      console.log('✅ Default admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 MongoDB initialization completed successfully!');
  } catch (error) {
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('❌ Database initialization failed: cannot connect to MongoDB.');
      console.error('   Make sure MongoDB is running and MONGODB_URI is correct.');
      console.error('   You can start a local instance (e.g. `docker-compose up -d mongo` or install MongoDB).');
    } else {
      console.error('❌ Database initialization failed:', error.message);
    }
    process.exit(1);
  }
}

forceDatabaseInit();