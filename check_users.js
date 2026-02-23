// Check all users in the database
const { initDB, getDB } = require('./src/db');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    
    await initDB();
    const db = getDB();
    
    db.all('SELECT id, username, name, email, role, createdAt FROM users', [], (err, users) => {
      if (err) {
        console.error('❌ Error fetching users:', err.message);
        return;
      }
      
      console.log(`✅ Found ${users.length} user(s) in database:`);
      
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email || 'Not set'}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${user.createdAt}`);
      });
      
      // Test password verification for each user
      console.log('\n🔐 Testing password verification:');
      users.forEach(user => {
        const testPasswords = ['admin123', 'password', '123456', user.username];
        
        testPasswords.forEach(pwd => {
          try {
            const isValid = bcrypt.compareSync(pwd, user.password);
            console.log(`  ${user.username} + "${pwd}" = ${isValid ? '✅ VALID' : '❌ INVALID'}`);
          } catch (error) {
            console.log(`  ${user.username} + "${pwd}" = ERROR: ${error.message}`);
          }
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to check users:', error.message);
  }
}

checkUsers();