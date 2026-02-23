
const express = require('express');
const { getDB } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Delete salary by id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.run('DELETE FROM salaries WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Salary record not found' });
    }
    res.json({ message: 'Salary deleted successfully' });
  });
});

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

    // Count full days (present), half days (half-day), and overtime separately
    db.all(
      `SELECT status, COUNT(*) as count FROM attendance 
       WHERE labourId = ? AND strftime("%Y-%m", date) = ?
       GROUP BY status`,
      [labourId, month],
      (err, statusCounts) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        let fullDays = 0;
        let halfDays = 0;

        // Count full and half days
        statusCounts.forEach(row => {
          if (row.status === 'present' || row.status === 'overtime') {
            fullDays += row.count;
          } else if (row.status === 'half-day') {
            halfDays += row.count;
          }
        });

        // Calculate working days: full days + (half days * 0.5)
        const workingDays = fullDays + (halfDays * 0.5);
        const basicSalary = labour.dailyRate * workingDays;

        // Get total overtime hours for the month
        db.all(
          `SELECT hours FROM attendance 
           WHERE labourId = ? AND status = 'overtime' AND strftime("%Y-%m", date) = ?`,
          [labourId, month],
          (err, overtimeRows) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            const STANDARD_HOURS_PER_DAY = 8; // Standard workday hours
            let totalOvertimeHours = 0;
            overtimeRows.forEach(row => {
              const workedHours = Number(row.hours) || 0;
              totalOvertimeHours += Math.max(workedHours - STANDARD_HOURS_PER_DAY, 0);
            });
            const hourlyRate = labour.dailyRate / STANDARD_HOURS_PER_DAY;
            const overtimePay = totalOvertimeHours * hourlyRate; // 1x rate for overtime hours

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
                    const netSalary = basicSalary + overtimePay - totalAdvance - totalDeductions;

                    // Create salary record
                    db.run(
                      `INSERT OR REPLACE INTO salaries 
                       (labourId, month, basicSalary, daysPresent, overtimeHours, overtimePay, totalAdvance, totalDeductions, netSalary) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [labourId, month, basicSalary, workingDays, totalOvertimeHours, overtimePay, totalAdvance, totalDeductions, netSalary],
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
                            daysPresent: workingDays,
                            overtimeHours: totalOvertimeHours,
                            overtimePay,
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

// Get salary by id
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDB();

  db.get(
    `SELECT s.*, l.name FROM salaries s JOIN labours l ON s.labourId = l.id WHERE s.id = ?`,
    [id],
    (err, salary) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!salary) {
        return res.status(404).json({ error: 'Salary record not found' });
      }
      res.json(salary);
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
