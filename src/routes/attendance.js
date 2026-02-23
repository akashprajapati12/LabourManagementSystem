const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Mark attendance
router.post('/', authenticateToken, (req, res) => {
  const { labourId, date, status, hours, notes } = req.body;

  if (!labourId || !date) {
    return res.status(400).json({ error: 'Labour ID and date are required' });
  }

  const db = getDB();

  db.run(
    `INSERT OR REPLACE INTO attendance (labourId, date, status, hours, notes) 
     VALUES (?, ?, ?, ?, ?)`,
    [labourId, date, status || 'present', hours || 8, notes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Attendance marked successfully' });
    }
  );
});

// Get attendance for labour
router.get('/labour/:labourId', authenticateToken, (req, res) => {
  const { labourId } = req.params;
  const { month } = req.query;
  const db = getDB();

  let query = 'SELECT * FROM attendance WHERE labourId = ?';
  const params = [labourId];

  if (month) {
    query += ' AND strftime("%Y-%m", date) = ?';
    params.push(month);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(records);
  });
});

// Get all attendance
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all(
    `SELECT a.*, l.name FROM attendance a 
     JOIN labours l ON a.labourId = l.id 
     ORDER BY a.date DESC`,
    [],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(records);
    }
  );
});

// Get all attendance for a month
router.get('/month/:month', authenticateToken, (req, res) => {
  const { month } = req.params;
  const db = getDB();

  db.all(
    `SELECT a.*, l.name FROM attendance a 
     JOIN labours l ON a.labourId = l.id 
     WHERE strftime("%Y-%m", a.date) = ? 
     ORDER BY a.date DESC`,
    [month],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(records);
    }
  );
});

// Delete attendance record
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM attendance WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    res.json({ message: 'Attendance record deleted successfully' });
  });
});

module.exports = router;
