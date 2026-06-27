const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const db = require('./db');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow frontend (served from local file system or another host) to call API
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cyber-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

app.use('/api', authRoutes);
app.use('/api', incidentRoutes);
app.use('/api', usersRoutes);
app.use('/api', notificationsRoutes);

// Ensure the Notifications table exists for in-app notifications
async function ensureDbSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS Notifications (
      notification_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
    )
  `);
}

ensureDbSchema().catch((err) => {
  console.error('Failed to ensure database schema:', err);
});

// Serve frontend files
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
