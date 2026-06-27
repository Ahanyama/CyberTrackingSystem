# Cyber Incident Reporting & Tracking System

A simple full-stack web application for reporting, managing, and resolving cybersecurity incidents.

## 📦 Project Structure

- `frontend/` – HTML/CSS/JS UI
- `backend/` – Node.js + Express API
- `backend/schema.sql` – MySQL schema, constraints, trigger, and reference queries

---

## 🚀 Quick Start (Local Development)

### 1) Setup MySQL

1. Install MySQL and start the server.
2. Create the database schema:

   1) Copy the example env file:

   ```bash
   cd backend
   copy .env.example .env
   ```

   2) Edit `backend/.env` and set `DB_PASSWORD` to the password you use for MySQL root.

   3) Run the schema script (uses the credentials in `.env`):

   ```bash
   & "C:\Program Files\MySQL\MySQL Server 9.6\bin\mysql.exe" -u %DB_USER% -p -e "source schema.sql"
   ```

> You can also run the schema from inside the MySQL prompt (see sections above). If you use a different MySQL user than root, update `DB_USER` and `DB_PASSWORD`.

### 2) Start the backend server

```bash
cd backend
npm install
npm start
```

By default, the server runs on **http://localhost:4000**.

### 3) Open the frontend

Open `frontend/index.html` in your browser, or visit **http://localhost:4000** after starting the backend.

---

## ✅ Features Implemented

- User registration & login (Reporter / Investigator / Admin)
- Report incidents with severity
- View and filter incidents
- Admin panel: assign investigators, view users, and update status
- Investigator view: see assigned incidents, add resolution notes
- Database constraints: primary keys, foreign keys, enums
- Trigger: marking incident as **Resolved** when a resolution log is added

---

## 🗄️ Database Concepts Demonstrated

- **Primary Keys & Auto Increment**: `Users.user_id`, `Incidents.incident_id`, etc.
- **Foreign Keys**: `Incidents.reported_by -> Users.user_id`, `Assignments.investigator_id -> Users.user_id`
- **One-to-many**: User → Incidents
- **Many-to-many**: Incident ↔ Investigator via `Assignments`
- **Enums + Constraints**: `severity_level`, `status`, `role`
- **Trigger**: `trg_after_resolution` updates incident status after logging resolution.

---

## 📌 Useful SQL Queries

Refer to `backend/schema.sql` for example queries, including:

- Show all high severity incidents
- Count incidents per investigator
- List unresolved incidents
- Join users and incidents
- Update status after resolution
