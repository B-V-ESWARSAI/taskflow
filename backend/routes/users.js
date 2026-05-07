const express = require('express');
const { readDB } = require('../db');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - list all users (admin only)
router.get('/', auth, requireAdmin, (req, res) => {
  const db = readDB();
  const users = db.users.map(({ password, ...u }) => u);
  res.json(users);
});

// GET /api/users/all - all users for member assignment (any auth user)
router.get('/all', auth, (req, res) => {
  const db = readDB();
  const users = db.users.map(({ password, ...u }) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  res.json(users);
});

module.exports = router;
