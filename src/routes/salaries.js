const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Calculate and create salary record
router.post('/calculate', authenticateToken, (req, res) => {
  const { labourId, month } = req.body;

  if (!labourId || !month) {
    return res.status(400).json({ error: 'Labour ID and month are required' });
  }

  const db = getDB();

  // Get labour details
  db.get('SELECT * FROM labours WHERE id = ?', [labourId], (err, labour) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!labour) {
      return res.status(404).json({ error: 'Labour not found' });
    }

    // Count days present in the month
    db.get(
      `SELECT COUNT(*) as daysPresent FROM attendance 
       WHERE labourId = ? AND status = 'present' AND strftime("%Y-%m", date) = ?`,
      [labourId, month],
      (err, attendanceData) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const daysPresent = attendanceData.daysPresent || 0;
        const basicSalary = labour.dailyRate * daysPresent;

        // Get total advances
        db.get(
          `SELECT COALESCE(SUM(amount), 0) as totalAdvance FROM advances 
           WHERE labourId = ? AND status = 'pending' AND strftime("%Y-%m", date) = ?`,
          [labourId, month],
          (err, advanceData) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            const totalAdvance = advanceData.totalAdvance || 0;

            // Get total deductions
            db.get(
              `SELECT COALESCE(SUM(amount), 0) as totalDeductions FROM deductions 
               WHERE labourId = ? AND strftime("%Y-%m", date) = ?`,
              [labourId, month],
              (err, deductionData) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                const totalDeductions = deductionData.totalDeductions || 0;
                const netSalary = basicSalary - totalAdvance - totalDeductions;

                // Create salary record
                db.run(
                  `INSERT OR REPLACE INTO salaries 
                   (labourId, month, basicSalary, daysPresent, totalAdvance, totalDeductions, netSalary) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [labourId, month, basicSalary, daysPresent, totalAdvance, totalDeductions, netSalary],
                  function (err) {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json({
                      message: 'Salary calculated successfully',
                      salary: {
                        labourId,
                        month,
                        basicSalary,
                        daysPresent,
                        totalAdvance,
                        totalDeductions,
                        netSalary
                      }
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Get salary for labour
router.get('/labour/:labourId', authenticateToken, (req, res) => {
  const { labourId } = req.params;
  const db = getDB();

  db.all(
    `SELECT * FROM salaries WHERE labourId = ? ORDER BY month DESC`,
    [labourId],
    (err, salaries) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(salaries);
    }
  );
});

// Get all salaries for a month
router.get('/month/:month', authenticateToken, (req, res) => {
  const { month } = req.params;
  const db = getDB();

  db.all(
    `SELECT s.*, l.name FROM salaries s 
     JOIN labours l ON s.labourId = l.id 
     WHERE s.month = ? 
     ORDER BY l.name`,
    [month],
    (err, salaries) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(salaries);
    }
  );
});

// Get all salaries
router.get('/', authenticateToken, (req, res) => {
  const db = getDB();

  db.all(
    `SELECT s.*, l.name FROM salaries s 
     JOIN labours l ON s.labourId = l.id 
     ORDER BY s.month DESC, l.name`,
    (err, salaries) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(salaries);
    }
  );
});

// Update salary status
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDB();

  db.run(
    `UPDATE salaries SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Salary record not found' });
      }
      res.json({ message: 'Salary status updated successfully' });
    }
  );
});

module.exports = router;
