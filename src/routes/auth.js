const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const router = express.Router();

// Register user
router.post('/register', (req, res) => {
  const { username, password, name, email } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  const db = getDB();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, name, email],
    function (err) {
      if (err) {
        console.error('Registration error:', err.message);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: 'Registration failed. Please try again.' });
      }
      console.log(`User registered successfully: ${username}`);
      res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
    }
  );
});

// Login user
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Login attempt received:', { 
    username, 
    passwordLength: password ? password.length : 0,
    timestamp: new Date().toISOString()
  });

  if (!username || !password) {
    console.log('❌ Login failed: Missing credentials');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = getDB();

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('❌ Database error during login:', err.message);
      return res.status(500).json({ error: 'Login service unavailable' });
    }

    console.log('🔍 User lookup result:', user ? 'User found' : 'User not found');

    if (!user) {
      console.log(`❌ Login failed: User not found - ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    try {
      console.log('🔐 Verifying password for user:', username);
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      console.log('🔐 Password verification result:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log(`❌ Login failed: Invalid password for user ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      console.log('✅ Password verified successfully for user:', username);
      
      const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: '24h' }
      );

      console.log(`✅ User logged in successfully: ${username} (ID: ${user.id})`);
      
      res.json({ 
        message: 'Login successful', 
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          email: user.email,
          role: user.role 
        }
      });
    } catch (bcryptError) {
      console.error('❌ Password comparison error:', bcryptError.message);
      return res.status(500).json({ error: 'Authentication service error' });
    }
  });
});

module.exports = router;
