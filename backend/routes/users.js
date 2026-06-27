const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Get all users (Admin only)
router.get('/users', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [rows] = await db.query('SELECT user_id, name, email, role FROM Users ORDER BY user_id');
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
