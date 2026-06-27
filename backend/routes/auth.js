const express = require('express');
const router = express.Router();
const db = require('../db');

// register a new user (Reporter/Investigator/Admin)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Basic role validation
    const validRoles = ['Reporter', 'Admin', 'Investigator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const [existing] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const [result] = await db.query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );

    return res.status(201).json({ userId: result.insertId, message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const [rows] = await db.query('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.json({ user: req.session.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// current user
router.get('/me', (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  res.json({ user });
});

module.exports = router;
