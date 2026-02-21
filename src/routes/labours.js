const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create labour
router.post('/', authenticateToken, (req, res) => {
  const { name, email, phone, address, aadhar, bankAccount, dailyRate, designation } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Labour name is required' });
  }

  const db = getDB();

  db.run(
    `INSERT INTO labours (name, email, phone, address, aadhar, bankAccount, dailyRate, designation) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, phone, address, aadhar, bankAccount, dailyRate || 0, designation],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Aadhar already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Labour added successfully', labourId: this.lastID });
    }
  );
});

// Get all labours
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all('SELECT * FROM labours ORDER BY createdAt DESC', (err, labours) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(labours);
  });
});

// Get single labour
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.get('SELECT * FROM labours WHERE id = ?', [id], (err, labour) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!labour) {
      return res.status(404).json({ error: 'Labour not found' });
    }
    res.json(labour);
  });
});

// Update labour
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, bankAccount, dailyRate, designation, status } = req.body;
  const db = getDB();

  db.run(
    `UPDATE labours SET name = ?, email = ?, phone = ?, address = ?, bankAccount = ?, 
     dailyRate = ?, designation = ?, status = ? WHERE id = ?`,
    [name, email, phone, address, bankAccount, dailyRate, designation, status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Labour not found' });
      }
      res.json({ message: 'Labour updated successfully' });
    }
  );
});

// Delete labour
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM labours WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Labour not found' });
    }
    res.json({ message: 'Labour deleted successfully' });
  });
});

module.exports = router;
