// Test script to verify authentication functionality
const express = require('express');
const { initDB, getDB } = require('./src/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAuth() {
  try {
    console.log('Testing authentication system...');
    
    // Initialize database
    await initDB();
    console.log('✅ Database initialized');
    
    const db = getDB();
    
    // Test 1: Check if users table exists
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        console.error('❌ Error checking users table:', err);
        return;
      }
      if (row) {
        console.log('✅ Users table exists');
      } else {
        console.log('❌ Users table does not exist');
      }
      
      // Test 2: Try to register a test user
      const testUser = {
        username: 'testuser',
        password: 'testpassword123',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      const hashedPassword = bcrypt.hashSync(testUser.password, 10);
      
      db.run(
        'INSERT OR IGNORE INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
        [testUser.username, hashedPassword, testUser.name, testUser.email],
        function (err) {
          if (err) {
            console.error('❌ Error creating test user:', err.message);
            return;
          }
          console.log('✅ Test user created/already exists');
          
          // Test 3: Try to login with test user
          db.get('SELECT * FROM users WHERE username = ?', [testUser.username], (err, user) => {
            if (err) {
              console.error('❌ Error fetching user:', err.message);
              return;
            }
            
            if (!user) {
              console.log('❌ User not found');
              return;
            }
            
            const isPasswordValid = bcrypt.compareSync(testUser.password, user.password);
            
            if (isPasswordValid) {
              console.log('✅ Password verification successful');
              
              // Test 4: Generate JWT token
              try {
                const token = jwt.sign(
                  { id: user.id, username: user.username, name: user.name },
                  process.env.JWT_SECRET || 'default_secret_for_testing',
                  { expiresIn: '24h' }
                );
                console.log('✅ JWT token generated successfully');
                console.log('Token:', token.substring(0, 50) + '...');
                console.log('\n🎉 All authentication tests passed!');
              } catch (jwtErr) {
                console.error('❌ JWT token generation failed:', jwtErr.message);
              }
            } else {
              console.log('❌ Password verification failed');
            }
          });
        }
      );
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuth();