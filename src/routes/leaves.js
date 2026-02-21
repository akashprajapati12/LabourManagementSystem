const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Request leave
router.post('/', authenticateToken, (req, res) => {
  const { labourId, startDate, endDate, type, reason } = req.body;

  if (!labourId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Labour ID, start date, and end date are required' });
  }

  const db = getDB();

  db.run(
    `INSERT INTO leaves (labourId, startDate, endDate, type, reason) 
     VALUES (?, ?, ?, ?, ?)`,
    [labourId, startDate, endDate, type, reason],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Leave request submitted successfully', leaveId: this.lastID });
    }
  );
});

// Get leaves for labour
router.get('/labour/:labourId', authenticateToken, (req, res) => {
  const { labourId } = req.params;
  const db = getDB();

  db.all(
    `SELECT * FROM leaves WHERE labourId = ? ORDER BY startDate DESC`,
    [labourId],
    (err, leaves) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(leaves);
    }
  );
});

// Get all leave requests
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all(
    `SELECT l.*, la.name FROM leaves l 
     JOIN labours la ON l.labourId = la.id 
     ORDER BY l.startDate DESC`,
    (err, leaves) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(leaves);
    }
  );
});

// Approve/Reject leave
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  const db = getDB();

  db.run(
    `UPDATE leaves SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      res.json({ message: `Leave request ${status} successfully` });
    }
  );
});

// Delete leave request
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.run('DELETE FROM leaves WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json({ message: 'Leave request deleted successfully' });
  });
});

module.exports = router;
