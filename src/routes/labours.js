const express = require("express");
const { mongoose } = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const Labour = mongoose.model("Labour", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  email: String,
  phone: String,
  address: String,
  aadhar: String,
  bankAccount: String,
  dailyRate: Number,
  designation: String,
  photo: String,
  status: { type: String, default: "active" }
}, { timestamps: true }));

// Add Labour
router.post("/", authenticateToken, async (req, res) => {
  const labour = new Labour({
    ...req.body,
    userId: req.user.id
  });

  await labour.save();
  res.json({ message: "Labour added" });
});

// Get ONLY user's labours
router.get("/", authenticateToken, async (req, res) => {
  const data = await Labour.find({ userId: req.user.id });
  res.json(data);
});

// Update (secure 🔐)
router.put("/:id", authenticateToken, async (req, res) => {
  await Labour.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body
  );
  res.json({ message: "Updated" });
});

// Delete (secure 🔐)
router.delete("/:id", authenticateToken, async (req, res) => {
  await Labour.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  });
  res.json({ message: "Deleted" });
});

module.exports = router;