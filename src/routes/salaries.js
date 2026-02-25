
const express = require('express');
const mongoose = require('../db').mongoose;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const Salary = mongoose.model('Salary', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour' },
  month: String,
  basicSalary: Number,
  daysPresent: Number,
  overtimeHours: Number,
  overtimePay: Number,
  totalAdvance: Number,
  totalDeductions: Number,
  netSalary: Number,
  status: { type: String, default: 'pending' }
}, { timestamps: true }));

const Attendance = mongoose.model('Attendance');
const Advance = mongoose.model('Advance');
const Deduction = mongoose.model('Deduction');
const Labour = mongoose.model('Labour');

// Delete salary by id (user scoped)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const deleted = await Salary.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!deleted) {
    return res.status(404).json({ error: 'Salary record not found' });
  }
  res.json({ message: 'Salary deleted successfully' });
});

// Calculate and create salary record
router.post('/calculate', authenticateToken, async (req, res) => {
  const { labourId, month } = req.body;

  if (!labourId || !month) {
    return res.status(400).json({ error: 'Labour ID and month are required' });
  }

  // ensure labour belongs to user
  const labour = await Labour.findOne({ _id: labourId, userId: req.user.id });
  if (!labour) {
    return res.status(404).json({ error: 'Labour not found' });
  }

  // build date range for month
  const start = new Date(month + '-01');
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // gather attendance counts
  const statusCounts = await Attendance.aggregate([
    { $match: { labourId: mongoose.Types.ObjectId(labourId), userId: mongoose.Types.ObjectId(req.user.id), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  let fullDays = 0;
  let halfDays = 0;
  statusCounts.forEach(r => {
    if (r._id === 'present' || r._id === 'overtime') fullDays += r.count;
    else if (r._id === 'half-day') halfDays += r.count;
  });

  const workingDays = fullDays + halfDays * 0.5;
  const basicSalary = labour.dailyRate * workingDays;

  // total overtime hours
  const overtimeRows = await Attendance.find({
    labourId: mongoose.Types.ObjectId(labourId),
    userId: mongoose.Types.ObjectId(req.user.id),
    status: 'overtime',
    date: { $gte: start, $lt: end }
  }, 'hours');

  const STANDARD_HOURS_PER_DAY = 8;
  let totalOvertimeHours = 0;
  overtimeRows.forEach(r => {
    const worked = Number(r.hours) || 0;
    totalOvertimeHours += Math.max(worked - STANDARD_HOURS_PER_DAY, 0);
  });
  const hourlyRate = labour.dailyRate / STANDARD_HOURS_PER_DAY;
  const overtimePay = totalOvertimeHours * hourlyRate;

  // total advances
  const advanceData = await Advance.aggregate([
    { $match: { labourId: mongoose.Types.ObjectId(labourId), userId: mongoose.Types.ObjectId(req.user.id), status: 'pending', createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalAdvance = (advanceData[0] && advanceData[0].total) || 0;

  // total deductions
  const deductionData = await Deduction.aggregate([
    { $match: { labourId: mongoose.Types.ObjectId(labourId), userId: mongoose.Types.ObjectId(req.user.id), createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalDeductions = (deductionData[0] && deductionData[0].total) || 0;

  const netSalary = basicSalary + overtimePay - totalAdvance - totalDeductions;

  const salaryDoc = await Salary.findOneAndUpdate(
    { labourId, month, userId: req.user.id },
    { labourId, month, basicSalary, daysPresent: workingDays, overtimeHours: totalOvertimeHours, overtimePay, totalAdvance, totalDeductions, netSalary },
    { upsert: true, new: true }
  );

  res.status(201).json({
    message: 'Salary calculated successfully',
    salary: salaryDoc
  });
});

// Get salary for labour
router.get('/labour/:labourId', authenticateToken, async (req, res) => {
  const { labourId } = req.params;
  const salaries = await Salary.find({ labourId, userId: req.user.id }).sort({ month: -1 });
  res.json(salaries);
});

// Get all salaries for a month
router.get('/month/:month', authenticateToken, async (req, res) => {
  const { month } = req.params;
  const salaries = await Salary.find({ month, userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ 'labourId.name': 1 });
  res.json(salaries);
});

// Get all salaries
router.get('/', authenticateToken, async (req, res) => {
  const salaries = await Salary.find({ userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ month: -1, 'labourId.name': 1 });
  res.json(salaries);
});

// Get salary by id
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const salary = await Salary.findOne({ _id: id, userId: req.user.id }).populate('labourId', 'name');
  if (!salary) return res.status(404).json({ error: 'Salary record not found' });
  res.json(salary);
});

// Update salary status
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sal = await Salary.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!sal) return res.status(404).json({ error: 'Salary record not found' });
  res.json({ message: 'Salary status updated successfully' });
});

module.exports = router;
