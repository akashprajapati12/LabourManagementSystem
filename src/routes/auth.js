const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { mongoose } = require("../db");

const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  name: String,
  email: { type: String, unique: true, sparse: true },
  role: { type: String, default: 'user' }
}));

// Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = new User({ username, password: hash });
  await user.save();

  res.json({ message: "User registered" });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).send("Invalid");

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send("Invalid");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secretkey");

  // return user info along with token
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});


// Update profile (authenticated)
router.put('/profile', authenticateToken, async (req, res) => {
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.email) updates.email = req.body.email;
  if (req.body.password) {
    updates.password = await bcrypt.hash(req.body.password, 10);
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({ message: 'Profile updated', user: {
    id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role
  }});
});

module.exports = router;