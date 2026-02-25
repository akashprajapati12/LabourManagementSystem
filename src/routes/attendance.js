const express = require('express');
const mongoose = require('../db').mongoose;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Attendance schema
const Attendance = mongoose.model('Attendance', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour' },
  date: { type: Date },
  status: String,
  hours: Number,
  notes: String
}, { timestamps: true }));

// Mark attendance
router.post('/', authenticateToken, async (req, res) => {
  const { labourId, date, status, hours, notes } = req.body;

  if (!labourId || !date) {
    return res.status(400).json({ error: 'Labour ID and date are required' });
  }

  const attendance = new Attendance({
    userId: req.user.id,
    labourId,
    date,
    status: status || 'present',
    hours: hours || 8,
    notes
  });

  await attendance.save();
  res.status(201).json({ message: 'Attendance marked successfully' });
});

// Get attendance for labour (user scoped)
router.get('/labour/:labourId', authenticateToken, async (req, res) => {
  const { labourId } = req.params;
  const { month } = req.query;

  const filter = { labourId, userId: req.user.id };
  if (month) {
    // match year-month string
    const start = new Date(month + '-01');
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    filter.date = { $gte: start, $lt: end };
  }

  const records = await Attendance.find(filter).sort({ date: -1 });
  res.json(records);
});

// Get all attendance for current user
router.get('/', authenticateToken, async (req, res) => {
  const records = await Attendance.find({ userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ date: -1 });
  res.json(records);
});

// Get all attendance for a month (user scoped)
router.get('/month/:month', authenticateToken, async (req, res) => {
  const { month } = req.params;
  const start = new Date(month + '-01');
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const records = await Attendance.find({
    userId: req.user.id,
    date: { $gte: start, $lt: end }
  }).populate('labourId', 'name')
    .sort({ date: -1 });

  res.json(records);
});

// Delete attendance record (user scoped)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const result = await Attendance.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!result) {
    return res.status(404).json({ error: 'Attendance record not found' });
  }
  res.json({ message: 'Attendance record deleted successfully' });
});

module.exports = router;
