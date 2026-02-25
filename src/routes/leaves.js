const express = require('express');
const mongoose = require('../db').mongoose;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const Leave = mongoose.model('Leave', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour' },
  startDate: Date,
  endDate: Date,
  type: String,
  reason: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true }));

// Request leave
router.post('/', authenticateToken, async (req, res) => {
  const { labourId, startDate, endDate, type, reason } = req.body;

  if (!labourId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Labour ID, start date, and end date are required' });
  }

  const leave = new Leave({
    userId: req.user.id,
    labourId,
    startDate,
    endDate,
    type,
    reason
  });

  await leave.save();
  res.status(201).json({ message: 'Leave request submitted successfully', leaveId: leave._id });
});

// Get leaves for labour (user scoped)
router.get('/labour/:labourId', authenticateToken, async (req, res) => {
  const { labourId } = req.params;
  const leaves = await Leave.find({ labourId, userId: req.user.id }).sort({ startDate: -1 });
  res.json(leaves);
});

// Get all leave requests (user scoped)
router.get('/', authenticateToken, async (req, res) => {
  const leaves = await Leave.find({ userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ startDate: -1 });
  res.json(leaves);
});

// Approve/Reject leave (user scoped)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  const leave = await Leave.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });
  res.json({ message: `Leave request ${status} successfully` });
});

// Delete leave request
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const leave = await Leave.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });
  res.json({ message: 'Leave request deleted successfully' });
});

module.exports = router;
