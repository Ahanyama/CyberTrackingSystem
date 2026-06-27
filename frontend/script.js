const apiBase = '/api';

const state = {
  user: null,
  incidents: [],
  users: [],
};

const elements = {
  loginSection: document.getElementById('loginSection'),
  homeSection: document.getElementById('home'),
  reportSection: document.getElementById('report'),
  viewSection: document.getElementById('view'),
  adminSection: document.getElementById('admin'),
  userName: document.getElementById('userName'),
  userArea: document.getElementById('userArea'),
  logoutBtn: document.getElementById('logoutBtn'),
  navButtons: Array.from(document.querySelectorAll('.nav-btn')),
  toast: document.getElementById('toast'),
  incidentsList: document.getElementById('incidentsList'),
  filterSeverity: document.getElementById('filterSeverity'),
  filterStatus: document.getElementById('filterStatus'),
  applyFilters: document.getElementById('applyFilters'),
  totalIncidents: document.getElementById('totalIncidents'),
  pendingIncidents: document.getElementById('pendingIncidents'),
  inProgressIncidents: document.getElementById('inProgressIncidents'),
  resolvedIncidents: document.getElementById('resolvedIncidents'),
  notificationsCard: document.getElementById('notificationsCard'),
  notificationsList: document.getElementById('notificationsList'),
  usersTable: document.getElementById('usersTable'),
  assignForm: document.getElementById('assignForm'),
  assignIncident: document.getElementById('assignIncident'),
  assignInvestigator: document.getElementById('assignInvestigator'),
  adminIncidents: document.getElementById('adminIncidents'),
  registerForm: document.getElementById('registerForm'),
  showRegister: document.getElementById('showRegister'),
  showLogin: document.getElementById('showLogin'),
};

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 2200);
}

async function request(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.message || 'Request failed';
    throw new Error(msg);
  }
  return json;
}

function setActiveNav(target) {
  elements.navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.target === target);
  });
}

function updateNavForRole(role) {
  elements.navButtons.forEach((btn) => {
    const target = btn.dataset.target;
    let visible = false;

    if (role === 'Admin') {
      visible = ['home', 'view', 'admin'].includes(target);
    } else if (role === 'Reporter') {
      visible = ['home', 'report', 'view'].includes(target);
    } else if (role === 'Investigator') {
      visible = ['home', 'view'].includes(target);
    }

    btn.style.display = visible ? 'inline-flex' : 'none';
  });
}

function showSection(name) {
  const sections = [
    elements.homeSection,
    elements.reportSection,
    elements.viewSection,
    elements.adminSection,
    elements.loginSection,
  ];
  sections.forEach((sec) => sec.classList.add('hidden'));

  if (name === 'login') {
    elements.loginSection.classList.remove('hidden');
    return;
  }

  if (name === 'admin' && state.user?.role !== 'Admin') {
    showToast('Admin panel is only available to Admin users.');
    name = 'home';
  }

  setActiveNav(name);
  if (name === 'home') elements.homeSection.classList.remove('hidden');
  if (name === 'report') elements.reportSection.classList.remove('hidden');
  if (name === 'view') elements.viewSection.classList.remove('hidden');
  if (name === 'admin') elements.adminSection.classList.remove('hidden');
}

function updateUserDisplay() {
  const nav = document.querySelector('.nav');

  if (!state.user) {
    elements.userArea.style.display = 'none';
    if (nav) nav.style.display = 'none';
    return;
  }

  elements.userArea.style.display = 'flex';
  elements.userName.textContent = `${state.user.name} (${state.user.role})`;
  if (nav) nav.style.display = 'flex';

  updateNavForRole(state.user.role);
  updateRoleIntro(state.user.role);
}

function updateRoleIntro(role) {
  const intro = document.getElementById('roleIntro');
  if (!intro) return;

  if (role === 'Admin') {
    intro.innerHTML = `
      <p>You are logged in as <strong>Admin</strong>. You can view all users, assign investigators, and manage incidents.</p>
      <ul>
        <li>Use the <strong>Users</strong> tab to view current users.</li>
        <li>Use the <strong>Assignments</strong> tab to assign investigators to incidents.</li>
        <li>Use <strong>All Incidents</strong> to monitor and update status.</li>
      </ul>
    `;
  } else if (role === 'Reporter') {
    intro.innerHTML = `
      <p>You are logged in as a <strong>Reporter</strong>. Report incidents and track their status here.</p>
      <ul>
        <li>Use <strong>Report Incident</strong> to create new reports.</li>
        <li>Use <strong>View Incidents</strong> to monitor your reported incidents.</li>
        <li>Check the notifications panel for updates when incidents are resolved.</li>
      </ul>
    `;
  } else if (role === 'Investigator') {
    intro.innerHTML = `
      <p>You are logged in as an <strong>Investigator</strong>. View and resolve assigned incidents.</p>
      <ul>
        <li>Use <strong>View Incidents</strong> to see your assigned cases.</li>
        <li>Add resolution notes to mark incidents resolved.</li>
      </ul>
    `;
  } else {
    intro.innerHTML = `<p>Welcome! Use the navigation to access your dashboard.</p>`;
  }
}

function formatDate(dt) {
  const d = new Date(dt);
  return d.toLocaleString();
}

function createTag(text, className) {
  const span = document.createElement('span');
  span.className = `tag ${className}`;
  span.textContent = text;
  return span;
}

function renderIncidentCard(incident, options = {}) {
  const card = document.createElement('div');
  card.className = 'incident-card';

  const title = document.createElement('h4');
  title.textContent = incident.title;
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'incident-meta';
  meta.innerHTML = `
    <strong>Reported by:</strong> ${incident.reported_by_name || 'Unknown'}<br>
    <strong>Date:</strong> ${formatDate(incident.date_reported)}
  `;
  card.appendChild(meta);

  const severityTag = createTag(incident.severity_level, incident.severity_level.toLowerCase());
  const statusTag = createTag(incident.status, incident.status.toLowerCase().replace(' ', '-'));
  const tagWrap = document.createElement('div');
  tagWrap.style.display = 'flex';
  tagWrap.style.gap = '10px';
  tagWrap.appendChild(severityTag);
  tagWrap.appendChild(statusTag);
  card.appendChild(tagWrap);

  const desc = document.createElement('p');
  desc.style.marginTop = '12px';
  desc.textContent = incident.description;
  card.appendChild(desc);

  if (incident.investigator_name) {
    const assigned = document.createElement('div');
    assigned.style.marginTop = '10px';
    assigned.style.fontSize = '0.85rem';
    assigned.style.color = 'rgba(220, 230, 255, 0.8)';
    assigned.innerHTML = `<strong>Assigned to:</strong> ${incident.investigator_name}`;
    card.appendChild(assigned);
  }

  // Investigator actions
  if (state.user?.role === 'Investigator' && options.allowResolve) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.textContent = 'Add resolution note';
    btn.style.marginTop = '12px';
    btn.addEventListener('click', () => openResolutionModal(incident));
    card.appendChild(btn);
  }

  // Show solution notes to reporter and admin
  if (incident.resolution_notes && (state.user.role === 'Reporter' || state.user.role === 'Admin')) {
    const solution = document.createElement('div');
    solution.style.marginTop = '14px';
    solution.style.padding = '12px';
    solution.style.border = '1px solid rgba(255,255,255,0.12)';
    solution.style.borderRadius = '14px';
    solution.style.background = 'rgba(255,255,255,0.04)';

    solution.innerHTML = `
      <strong>Solution notes:</strong>
      <p style="margin: 8px 0 0;">${incident.resolution_notes}</p>
    `;

    card.appendChild(solution);
  }

  // Investigator action: change status in card
  if (state.user?.role === 'Investigator' && options.allowStatusUpdate) {
    const statusWrapper = document.createElement('div');
    statusWrapper.style.marginTop = '12px';
    statusWrapper.style.display = 'flex';
    statusWrapper.style.gap = '10px';
    statusWrapper.style.alignItems = 'center';

    const select = document.createElement('select');
    ['', 'Pending', 'In Progress', 'Resolved'].forEach((value) => {
      if (!value) return;
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = value;
      select.appendChild(opt);
    });
    select.value = incident.status;

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Update status';
    saveBtn.addEventListener('click', async () => {
      try {
        await request('/incident-status', {
          method: 'POST',
          body: JSON.stringify({
            incident_id: incident.incident_id,
            status: select.value,
          }),
        });
        showToast('Status updated (refreshing list)');
        await loadIncidents();
      } catch (err) {
        showToast(err.message);
      }
    });

    statusWrapper.appendChild(select);
    statusWrapper.appendChild(saveBtn);
    card.appendChild(statusWrapper);
  }

  return card;
}

function openResolutionModal(incident) {
  const notes = prompt('Enter resolution notes for this incident:');
  if (!notes) return;
  request('/resolve', {
    method: 'POST',
    body: JSON.stringify({ incident_id: incident.incident_id, resolution_notes: notes }),
  })
    .then(() => {
      showToast('Resolution logged');
      loadIncidents();
    })
    .catch((err) => showToast(err.message));
}

async function loadIncidents() {
  const severity = elements.filterSeverity.value;
  const status = elements.filterStatus.value;

  const query = new URLSearchParams();
  if (severity) query.set('severity', severity);
  if (status) query.set('status', status);

  if (state.user?.role === 'Investigator') {
    query.set('assigned', 'true');
  }

  const url = `/incidents?${query.toString()}`;
  const { incidents } = await request(url);
  state.incidents = incidents;

  elements.incidentsList.innerHTML = '';
  elements.adminIncidents.innerHTML = '';

  incidents.forEach((incident) => {
    const card = renderIncidentCard(incident, {
      allowResolve: state.user?.role === 'Investigator',
      allowStatusUpdate: state.user?.role === 'Investigator',
    });
    elements.incidentsList.appendChild(card);

    if (state.user?.role === 'Admin') {
      elements.adminIncidents.appendChild(card.cloneNode(true));
    }
  });

  updateStats(incidents);
}

function updateStats(incidents) {
  elements.totalIncidents.textContent = incidents.length;
  elements.pendingIncidents.textContent = incidents.filter((i) => i.status === 'Pending').length;
  elements.inProgressIncidents.textContent = incidents.filter((i) => i.status === 'In Progress').length;
  elements.resolvedIncidents.textContent = incidents.filter((i) => i.status === 'Resolved').length;
}

async function loadNotifications() {
  if (!state.user || state.user.role !== 'Reporter') {
    elements.notificationsCard.classList.add('hidden');
    return;
  }

  try {
    const { notifications } = await request('/notifications');
    elements.notificationsCard.classList.remove('hidden');

    if (!notifications.length) {
      elements.notificationsList.textContent = 'No new notifications.';
      return;
    }

    elements.notificationsList.innerHTML = '';
    notifications.forEach((note) => {
      const row = document.createElement('div');
      row.className = 'notification-row';
      row.innerHTML = `
        <div class="notification-text">${note.message}</div>
        <div class="notification-meta">${new Date(note.created_at).toLocaleString()}</div>
      `;

      if (!note.is_read) {
        const markBtn = document.createElement('button');
        markBtn.className = 'btn btn-secondary';
        markBtn.textContent = 'Mark read';
        markBtn.addEventListener('click', async () => {
          await request('/notifications/read', {
            method: 'POST',
            body: JSON.stringify({ notification_id: note.notification_id }),
          });
          await loadNotifications();
        });
        row.appendChild(markBtn);
      }

      elements.notificationsList.appendChild(row);
    });
  } catch (err) {
    elements.notificationsCard.classList.add('hidden');
  }
}

async function loadUsers() {
  if (state.user?.role !== 'Admin') return;
  const { users } = await request('/users');
  state.users = users;

  const table = document.createElement('table');
  const header = document.createElement('tr');
  ['ID', 'Name', 'Email', 'Role'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    header.appendChild(th);
  });
  table.appendChild(header);

  users.forEach((u) => {
    const row = document.createElement('tr');
    [u.user_id, u.name, u.email, u.role].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  elements.usersTable.innerHTML = '';
  elements.usersTable.appendChild(table);
}

async function prepareAssignmentOptions() {
  if (state.user.role !== 'Admin') return;

  // Populate incident list and investigator list
  const { incidents } = await request('/incidents');
  state.incidents = incidents;

  elements.assignIncident.innerHTML = '';
  incidents.forEach((incident) => {
    const opt = document.createElement('option');
    opt.value = incident.incident_id;
    opt.textContent = `${incident.incident_id} - ${incident.title}`;
    elements.assignIncident.appendChild(opt);
  });

  const { users } = await request('/users');
  const investigators = users.filter((u) => u.role === 'Investigator');
  elements.assignInvestigator.innerHTML = '';
  investigators.forEach((inv) => {
    const opt = document.createElement('option');
    opt.value = inv.user_id;
    opt.textContent = `${inv.name} (${inv.email})`;
    elements.assignInvestigator.appendChild(opt);
  });
}

async function init() {
  bindEvents();
  setActiveNav('home');

  try {
    const { user } = await request('/me');
    state.user = user;
    updateUserDisplay();
    showSection('home');
    await loadIncidents();
    await loadNotifications();

    if (state.user.role === 'Admin') {
      await loadUsers();
      await prepareAssignmentOptions();
    }
  } catch (err) {
    showSection('login');
  }
}

function bindEvents() {
  elements.navButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = btn.dataset.target;
      if (!state.user) {
        showToast('Please log in first');
        return;
      }
      showSection(target);

      if (target === 'home') {
        await loadIncidents();
        await loadNotifications();
      }
      if (target === 'view') {
        await loadIncidents();
      }
      if (target === 'admin') {
        await loadUsers();
        await prepareAssignmentOptions();
        await loadIncidents();
      }
    });
  });

  elements.showRegister.addEventListener('click', () => {
    elements.loginSection.querySelector('#loginForm').classList.add('hidden');
    elements.loginSection.querySelector('#registerForm').classList.remove('hidden');
  });

  elements.showLogin.addEventListener('click', () => {
    elements.loginSection.querySelector('#registerForm').classList.add('hidden');
    elements.loginSection.querySelector('#loginForm').classList.remove('hidden');
  });

  document.getElementById('loginForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
      const { user } = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      state.user = user;
      updateUserDisplay();
      showSection('home');
      await loadIncidents();
      await loadNotifications();
      if (state.user.role === 'Admin') {
        await loadUsers();
        await prepareAssignmentOptions();
      }
      showToast('Login successful');
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const role = document.getElementById('regRole').value;

    try {
      await request('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      showToast('Account created, please log in');

      // Switch back to login view
      elements.loginSection.querySelector('#registerForm').classList.add('hidden');
      elements.loginSection.querySelector('#loginForm').classList.remove('hidden');

      document.getElementById('regName').value = '';
      document.getElementById('regEmail').value = '';
      document.getElementById('regPassword').value = '';
    } catch (err) {
      showToast(err.message);
    }
  });

  elements.logoutBtn.addEventListener('click', async () => {
    try {
      await request('/logout', { method: 'POST' });
      state.user = null;
      updateUserDisplay();
      showSection('login');
      showToast('Logged out');
    } catch (err) {
      showToast(err.message);
    }
  });

  document.getElementById('reportForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const title = document.getElementById('incidentTitle').value.trim();
    const description = document.getElementById('incidentDescription').value.trim();
    const severity = document.getElementById('incidentSeverity').value;

    try {
      await request('/report-incident', {
        method: 'POST',
        body: JSON.stringify({ title, description, severity_level: severity }),
      });
      showToast('Incident reported');
      document.getElementById('reportForm').reset();
    } catch (err) {
      showToast(err.message);
    }
  });

  elements.applyFilters.addEventListener('click', async () => {
    await loadIncidents();
  });

  elements.assignForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const incident_id = elements.assignIncident.value;
    const investigator_id = elements.assignInvestigator.value;

    try {
      await request('/assign', {
        method: 'POST',
        body: JSON.stringify({ incident_id, investigator_id }),
      });
      showToast('Investigator assigned');
      await loadIncidents();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach((el) => el.classList.add('hidden'));
      document.getElementById(target).classList.remove('hidden');
    });
  });
}

init();
