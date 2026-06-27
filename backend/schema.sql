-- Cyber Incident Reporting & Tracking System schema
-- Run this file in MySQL to create the database and tables.

CREATE DATABASE IF NOT EXISTS cyber_incidents;
USE cyber_incidents;

-- Users table: reporters, investigators, admins
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('Reporter', 'Admin', 'Investigator') NOT NULL DEFAULT 'Reporter'
);

-- Incidents reported by users
CREATE TABLE IF NOT EXISTS Incidents (
  incident_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity_level ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
  reported_by INT NOT NULL,
  date_reported DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Pending', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (reported_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Many-to-many relationship between incidents and investigators via assignments
CREATE TABLE IF NOT EXISTS Assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  investigator_id INT NOT NULL,
  assigned_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_assignment (incident_id, investigator_id),
  FOREIGN KEY (incident_id) REFERENCES Incidents(incident_id) ON DELETE CASCADE,
  FOREIGN KEY (investigator_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Resolution log for incidents; a new log entry marks a resolution
CREATE TABLE IF NOT EXISTS Resolution_Log (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  resolution_notes TEXT NOT NULL,
  resolved_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES Incidents(incident_id) ON DELETE CASCADE
);

-- Notifications for users (e.g., when an incident is resolved)
CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Trigger: When a resolution is logged, mark the incident as Resolved
DELIMITER $$
CREATE TRIGGER trg_after_resolution
AFTER INSERT ON Resolution_Log
FOR EACH ROW
BEGIN
  UPDATE Incidents
  SET status = 'Resolved'
  WHERE incident_id = NEW.incident_id;
END$$
DELIMITER ;

-- Sample data for quick testing (optional)
INSERT IGNORE INTO Users (name, email, password, role) VALUES
  ('Alice Reporter', 'alice@example.com', 'password', 'Reporter'),
  ('Bob Investigator', 'bob@example.com', 'password', 'Investigator'),
  ('Clara Admin', 'clara@example.com', 'password', 'Admin');

-- SQL Queries (for reference)
-- 1. Show all high severity incidents
-- SELECT * FROM Incidents WHERE severity_level = 'High';

-- 2. Count incidents per investigator
-- SELECT u.user_id, u.name, COUNT(a.incident_id) AS incident_count
-- FROM Users u
-- LEFT JOIN Assignments a ON u.user_id = a.investigator_id
-- WHERE u.role = 'Investigator'
-- GROUP BY u.user_id, u.name;

-- 3. List unresolved incidents
-- SELECT * FROM Incidents WHERE status <> 'Resolved';

-- 4. Join Users and Incidents (to see reporter info)
-- SELECT i.*, u.name AS reporter_name, u.email AS reporter_email
-- FROM Incidents i
-- JOIN Users u ON i.reported_by = u.user_id;

-- 5. Update status after resolution (alternative to trigger)
-- UPDATE Incidents SET status = 'Resolved' WHERE incident_id = ?;
