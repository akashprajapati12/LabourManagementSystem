// deprecated test script – now uses mongoose
const { initDB, mongoose } = require('./src/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAuth() {
  try {
    console.log('Running mongoose authentication checks...');

    await initDB();
    console.log('✅ MongoDB connected');

    const User = mongoose.model('User');

    const testUser = {
      username: 'testuser',
      password: 'testpassword123',
      name: 'Test User',
      email: 'test@example.com'
    };

    // create or find user
    let user = await User.findOne({ username: testUser.username });
    if (!user) {
      const hash = await bcrypt.hash(testUser.password, 10);
      user = new User({ username: testUser.username, password: hash });
      await user.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user already exists');
    }

    // verify password
    const valid = await bcrypt.compare(testUser.password, user.password);
    if (!valid) throw new Error('Password validation failed');
    console.log('✅ Password verification succeeded');

    // JWT generation
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret_for_testing', { expiresIn: '24h' });
    console.log('✅ JWT generated,', token.substring(0,50) + '...');

    console.log('\n🎉 Authentication sanity check passed');
  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

testAuth();