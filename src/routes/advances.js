const express = require('express');
const mongoose = require('../db').mongoose;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const Advance = mongoose.model('Advance', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour' },
  amount: Number,
  reason: String,
  dueDate: Date,
  status: { type: String, default: 'pending' }
}, { timestamps: true }));

// Add advance
router.post('/', authenticateToken, async (req, res) => {
  const { labourId, amount, reason, dueDate } = req.body;

  if (!labourId || !amount) {
    return res.status(400).json({ error: 'Labour ID and amount are required' });
  }

  const advance = new Advance({
    userId: req.user.id,
    labourId,
    amount,
    reason,
    dueDate
  });

  await advance.save();
  res.status(201).json({ message: 'Advance added successfully', advanceId: advance._id });
});

// Get advances for labour (user scoped)
router.get('/labour/:labourId', authenticateToken, async (req, res) => {
  const { labourId } = req.params;
  const advances = await Advance.find({ labourId, userId: req.user.id }).sort({ createdAt: -1 });
  res.json(advances);
});

// Get all advances (user scoped)
router.get('/', authenticateToken, async (req, res) => {
  const advances = await Advance.find({ userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ createdAt: -1 });
  res.json(advances);
});

// Update advance status
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const adv = await Advance.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { status },
    { new: true }
  );
  if (!adv) return res.status(404).json({ error: 'Advance not found' });
  res.json({ message: 'Advance updated successfully' });
});

// Delete advance
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const adv = await Advance.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!adv) return res.status(404).json({ error: 'Advance not found' });
  res.json({ message: 'Advance deleted successfully' });
});

module.exports = router;
