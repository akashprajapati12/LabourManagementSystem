const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add advance
router.post('/', authenticateToken, (req, res) => {
  const { labourId, amount, reason, dueDate } = req.body;

  if (!labourId || !amount) {
    return res.status(400).json({ error: 'Labour ID and amount are required' });
  }

  const db = getDB();

  db.run(
    `INSERT INTO advances (labourId, amount, reason, dueDate) 
     VALUES (?, ?, ?, ?)`,
    [labourId, amount, reason, dueDate],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Advance added successfully', advanceId: this.lastID });
    }
  );
});

// Get advances for labour
router.get('/labour/:labourId', authenticateToken, (req, res) => {
  const { labourId } = req.params;
  const db = getDB();

  db.all(
    `SELECT * FROM advances WHERE labourId = ? ORDER BY date DESC`,
    [labourId],
    (err, advances) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(advances);
    }
  );
});

// Get all advances
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all(
    `SELECT a.*, l.name FROM advances a 
     JOIN labours l ON a.labourId = l.id 
     ORDER BY a.date DESC`,
    (err, advances) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(advances);
    }
  );
});

// Update advance status
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();

  db.run(
    `UPDATE advances SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Advance not found' });
      }
      res.json({ message: 'Advance updated successfully' });
    }
  );
});

// Delete advance
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM advances WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Advance not found' });
    }
    res.json({ message: 'Advance deleted successfully' });
  });
});

module.exports = router;
