const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Get notifications for current user
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [rows] = await db.query(
      'SELECT notification_id, message, is_read, created_at FROM Notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.post('/notifications/read', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const { notification_id } = req.body;
    if (!notification_id) {
      return res.status(400).json({ message: 'Missing notification id' });
    }

    await db.query(
      'UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?',
      [notification_id, userId]
    );

    res.json({ message: 'Notification marked read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
