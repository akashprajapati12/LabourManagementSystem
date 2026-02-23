// Create default admin user for the application
const { initDB, getDB } = require('./src/db');
const bcrypt = require('bcryptjs');

async function createDefaultUser() {
  try {
    console.log('Creating default admin user...');
    
    // Initialize database
    await initDB();
    console.log('✅ Database initialized');
    
    const db = getDB();
    
    // Check if admin user already exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, existingUser) => {
      if (err) {
        console.error('❌ Error checking for existing admin:', err.message);
        return;
      }
      
      if (existingUser) {
        console.log('✅ Admin user already exists');
        console.log('Username: admin');
        console.log('Password: admin123');
        return;
      }
      
      // Create default admin user
      const adminPassword = 'admin123';
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      
      db.run(
        'INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', hashedPassword, 'Administrator', 'admin@example.com', 'admin'],
        function (err) {
          if (err) {
            console.error('❌ Error creating admin user:', err.message);
            return;
          }
          console.log('✅ Default admin user created successfully!');
          console.log('Login credentials:');
          console.log('Username: admin');
          console.log('Password: admin123');
          console.log('\nYou can now login to your Labour Management System with these credentials.');
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Failed to create default user:', error.message);
  }
}

// Run the function
createDefaultUser();