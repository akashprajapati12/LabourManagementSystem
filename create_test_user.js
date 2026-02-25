const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
console.warn('⚠️ create_test_user.js is deprecated. Rewrite using MongoDB models or remove this file.');
process.exit(0);

// const { initDB, getDB } = require('./src/db');

async function testSalaryAPI() {
  try {
    await initDB();
    const db = getDB();
    
    // First, login to get a token
    const username = 'akashKumar';
    const password = 'akash123'; // You'll need to use the correct password
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return;
      }
      
      if (!user) {
        console.error('User not found');
        return;
      }
      
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      
      if (!isPasswordValid) {
        console.error('Invalid password');
        // Let's try to create a test user with a known password
        const testPassword = 'test123';
        const hashedPassword = bcrypt.hashSync(testPassword, 10);
        
        db.run(
          'INSERT OR IGNORE INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
          ['testuser', hashedPassword, 'Test User', 'test@example.com'],
          function(err) {
            if (err) {
              console.error('Error creating test user:', err);
            } else {
              console.log('Test user created. Username: testuser, Password: test123');
            }
            
            // Now try to login with test user
            db.get('SELECT * FROM users WHERE username = ?', ['testuser'], (err, testUser) => {
              if (err || !testUser) {
                console.error('Could not create test user');
                process.exit(1);
              }
              
              const token = jwt.sign(
                { id: testUser.id, username: testUser.username, name: testUser.name },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
              );
              
              console.log('Test token:', token);
              console.log('\nYou can now test the salary calculation API with this token');
              console.log('Use this in your frontend or API calls');
              process.exit(0);
            });
          }
        );
      } else {
        const token = jwt.sign(
          { id: user.id, username: user.username, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        console.log('Login successful. Token:', token);
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSalaryAPI();