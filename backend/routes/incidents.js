const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to ensure user is logged in
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Report a new incident (Reporter role)
router.post('/report-incident', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const { title, description, severity_level } = req.body;

    if (!title || !description || !severity_level) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const validSeverities = ['Low', 'Medium', 'High'];
    if (!validSeverities.includes(severity_level)) {
      return res.status(400).json({ message: 'Invalid severity level' });
    }

    await db.query(
      'INSERT INTO Incidents (title, description, severity_level, reported_by, date_reported, status) VALUES (?, ?, ?, ?, NOW(), ?)',
      [title, description, severity_level, user.user_id, 'Pending']
    );

    res.status(201).json({ message: 'Incident reported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get incidents with optional filters
router.get('/incidents', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const { severity, status, assigned } = req.query;

    // Build query
    const conditions = [];
    const params = [];

    if (severity) {
      conditions.push('i.severity_level = ?');
      params.push(severity);
    }

    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }

    // If an investigator requests assigned incidents
    if (assigned === 'true' && user.role === 'Investigator') {
      conditions.push('a.investigator_id = ?');
      params.push(user.user_id);
    }

    // Non-admins should only see their own reports or assigned incidents
    if (user.role === 'Reporter') {
      conditions.push('i.reported_by = ?');
      params.push(user.user_id);
    }

    // Build WHERE clause
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    // Join tables to include reporter and assignment info
    const query = `
      SELECT
        i.incident_id,
        i.title,
        i.description,
        i.severity_level,
        i.status,
        i.date_reported,
        u.name AS reported_by_name,
        u.email AS reported_by_email,
        a.investigator_id,
        iv.name AS investigator_name,
        iv.email AS investigator_email,
        r.resolution_notes,
        r.resolved_date
      FROM Incidents i
      LEFT JOIN Users u ON i.reported_by = u.user_id
      LEFT JOIN Assignments a ON i.incident_id = a.incident_id
      LEFT JOIN Users iv ON a.investigator_id = iv.user_id
      LEFT JOIN (
        SELECT incident_id, resolution_notes, resolved_date
        FROM Resolution_Log
        WHERE (incident_id, resolved_date) IN (
          SELECT incident_id, MAX(resolved_date) FROM Resolution_Log GROUP BY incident_id
        )
      ) r ON r.incident_id = i.incident_id
      ${whereClause}
      ORDER BY i.date_reported DESC
    `;

    const [results] = await db.query(query, params);
    res.json({ incidents: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign an investigator (Admin only)
router.post('/assign', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { incident_id, investigator_id } = req.body;
    if (!incident_id || !investigator_id) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Ensure investigator exists
    const [invRows] = await db.query('SELECT user_id FROM Users WHERE user_id = ? AND role = ?', [investigator_id, 'Investigator']);
    if (!invRows.length) {
      return res.status(400).json({ message: 'Investigator not found' });
    }

    // Upsert assignment
    await db.query(
      `INSERT INTO Assignments (incident_id, investigator_id, assigned_date)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE investigator_id = VALUES(investigator_id), assigned_date = VALUES(assigned_date)`,
      [incident_id, investigator_id]
    );

    res.json({ message: 'Investigator assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update incident status (Investigator only)
router.post('/incident-status', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'Investigator') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { incident_id, status } = req.body;
    if (!incident_id || !status) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const validStatus = ['Pending', 'In Progress', 'Resolved'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Ensure investigator is assigned to this incident
    const [assignRows] = await db.query(
      'SELECT * FROM Assignments WHERE incident_id = ? AND investigator_id = ?',
      [incident_id, user.user_id]
    );

    if (!assignRows.length) {
      return res.status(403).json({ message: 'You are not assigned to this incident' });
    }

    await db.query('UPDATE Incidents SET status = ? WHERE incident_id = ?', [status, incident_id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add resolution note (Investigator)
router.post('/resolve', requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    if (user.role !== 'Investigator') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { incident_id, resolution_notes } = req.body;
    if (!incident_id || !resolution_notes) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Ensure the investigator is assigned to this incident
    const [assignRows] = await db.query(
      'SELECT * FROM Assignments WHERE incident_id = ? AND investigator_id = ?',
      [incident_id, user.user_id]
    );

    if (!assignRows.length) {
      return res.status(403).json({ message: 'You are not assigned to this incident' });
    }

    await db.query(
      'INSERT INTO Resolution_Log (incident_id, resolution_notes, resolved_date) VALUES (?, ?, NOW())',
      [incident_id, resolution_notes]
    );

    // Notify the reporter and all admins that the incident is resolved
    const [incRows] = await db.query('SELECT reported_by, title FROM Incidents WHERE incident_id = ?', [incident_id]);
    if (incRows.length) {
      const reporterId = incRows[0].reported_by;
      const incidentTitle = incRows[0].title;
      const message = `Your incident (${incidentTitle}) has been marked as resolved.`;
      await db.query('INSERT INTO Notifications (user_id, message) VALUES (?, ?)', [reporterId, message]);

      const [adminRows] = await db.query('SELECT user_id FROM Users WHERE role = ?', ['Admin']);
      const adminInserts = adminRows.map((a) => [a.user_id, `Incident resolved: ${incidentTitle}`]);
      if (adminInserts.length) {
        await db.query(
          'INSERT INTO Notifications (user_id, message) VALUES ?',
          [adminInserts]
        );
      }
    }

    // Trigger in DB will update the incident status to Resolved
    res.json({ message: 'Resolution logged (incident marked as Resolved)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
