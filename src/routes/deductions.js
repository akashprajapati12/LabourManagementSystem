const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Add deduction
router.post('/', authenticateToken, (req, res) => {
  const { labourId, amount, type, reason } = req.body;

  if (!labourId || !amount) {
    return res.status(400).json({ error: 'Labour ID and amount are required' });
  }

  const db = getDB();

  db.run(
    `INSERT INTO deductions (labourId, amount, type, reason) 
     VALUES (?, ?, ?, ?)`,
    [labourId, amount, type, reason],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Deduction added successfully', deductionId: this.lastID });
    }
  );
});

// Get deductions for labour
router.get('/labour/:labourId', authenticateToken, (req, res) => {
  const { labourId } = req.params;
  const db = getDB();

  db.all(
    `SELECT * FROM deductions WHERE labourId = ? ORDER BY date DESC`,
    [labourId],
    (err, deductions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(deductions);
    }
  );
});

// Get all deductions
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all(
    `SELECT d.*, l.name FROM deductions d 
     JOIN labours l ON d.labourId = l.id 
     ORDER BY d.date DESC`,
    (err, deductions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(deductions);
    }
  );
});

// Update deduction
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount, type, reason } = req.body;
  const db = getDB();

  db.run(
    `UPDATE deductions SET amount = ?, type = ?, reason = ? WHERE id = ?`,
    [amount, type, reason, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Deduction not found' });
      }
      res.json({ message: 'Deduction updated successfully' });
    }
  );
});

// Delete deduction
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM deductions WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Deduction not found' });
    }
    res.json({ message: 'Deduction deleted successfully' });
  });
});

module.exports = router;
