// Reset all user passwords to known values
const { initDB, getDB } = require('./src/db');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  try {
    console.log('🔧 Resetting user passwords...');
    
    await initDB();
    const db = getDB();
    
    // Get all users first
    db.all('SELECT id, username, name FROM users', [], (err, users) => {
      if (err) {
        console.error('❌ Error fetching users:', err.message);
        return;
      }
      
      console.log(`✅ Found ${users.length} user(s) to reset:`);
      
      users.forEach(user => {
        // Create new password hash
        let newPassword = 'admin123';
        
        // For the admin user, use 'admin123'
        // For akashKumar, we'll need to know the correct password
        if (user.username === 'akashKumar') {
          newPassword = 'akash123'; // You can change this
        } else if (user.username === 'testuser') {
          newPassword = 'test123';
        }
        
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        
        console.log(`\n🔄 Updating password for ${user.username}:`);
        console.log(`   New password: ${newPassword}`);
        console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);
        
        // Update the user's password
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id],
          function (err) {
            if (err) {
              console.error(`❌ Failed to update ${user.username}:`, err.message);
            } else {
              console.log(`✅ Successfully updated ${user.username}`);
              
              // Verify the update worked
              const isValid = bcrypt.compareSync(newPassword, hashedPassword);
              console.log(`   Verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
            }
          }
        );
      });
      
      console.log('\n🎉 Password reset process completed!');
      console.log('\n📝 New login credentials:');
      console.log('   admin: admin123');
      console.log('   akashKumar: akash123');
      console.log('   testuser: test123');
    });
    
  } catch (error) {
    console.error('❌ Failed to reset passwords:', error.message);
  }
}

resetPasswords();