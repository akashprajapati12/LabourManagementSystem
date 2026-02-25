const express = require('express');
const mongoose = require('../db').mongoose;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const Deduction = mongoose.model('Deduction', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Labour' },
  amount: Number,
  type: String,
  reason: String
}, { timestamps: true }));

// Add deduction
router.post('/', authenticateToken, async (req, res) => {
  const { labourId, amount, type, reason } = req.body;

  if (!labourId || !amount) {
    return res.status(400).json({ error: 'Labour ID and amount are required' });
  }

  const deduction = new Deduction({
    userId: req.user.id,
    labourId,
    amount,
    type,
    reason
  });

  await deduction.save();
  res.status(201).json({ message: 'Deduction added successfully', deductionId: deduction._id });
});

// Get deductions for labour (user scoped)
router.get('/labour/:labourId', authenticateToken, async (req, res) => {
  const { labourId } = req.params;
  const deductions = await Deduction.find({ labourId, userId: req.user.id }).sort({ createdAt: -1 });
  res.json(deductions);
});

// Get all deductions (user scoped)
router.get('/', authenticateToken, async (req, res) => {
  const deductions = await Deduction.find({ userId: req.user.id })
    .populate('labourId', 'name')
    .sort({ createdAt: -1 });
  res.json(deductions);
});

// Update deduction
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, type, reason } = req.body;

  const ded = await Deduction.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { amount, type, reason },
    { new: true }
  );
  if (!ded) return res.status(404).json({ error: 'Deduction not found' });
  res.json({ message: 'Deduction updated successfully' });
});

// Delete deduction
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ded = await Deduction.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!ded) return res.status(404).json({ error: 'Deduction not found' });
  res.json({ message: 'Deduction deleted successfully' });
});

module.exports = router;
