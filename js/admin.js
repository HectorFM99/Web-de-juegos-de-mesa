/* global module */
const API_BASE = 'http://localhost:3000';
let allUsers = [];

function getToken() {
  return localStorage.getItem('sobremesa_token');
}

function getUser() {
  const userStr = localStorage.getItem('sobremesa_user');
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

async function checkAdminAuth() {
  const user = getUser();
  const token = getToken();

  const isAdmin = user && (user.role === 'ADMIN' || user.email === 'admin@lasobremesa.local');

  if (!user || !isAdmin || !token) {
    alert('Acceso restringido. Por favor, inicia sesión con la cuenta de administrador.');
    window.location.href = 'auth.html';
    return;
  }

  document.getElementById('admin-user-info').innerHTML = `Conectado como <strong>${user.username || user.email}</strong> <span class="badge badge-admin">ADMIN</span>`;

  await loadAdminData();
  await loadDebugInfo();
}

async function loadAdminData() {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok && data.users) {
      allUsers = data.users;
      renderUsers(allUsers);
      updateStats(allUsers);
    } else {
      alert(data.message || 'Error al cargar usuarios.');
    }
  } catch (err) {
    console.error('Error de conexión con el backend:', err);
    alert('No se pudo conectar con el servidor backend en http://localhost:3000');
  }
}

function updateStats(users) {
  const total = users.length;
  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const banned = users.filter((u) => u.banned).length;
  
  document.getElementById('stat-users').textContent = total;
  document.getElementById('stat-admins').textContent = admins;
  document.getElementById('stat-banned').textContent = banned;
  
  fetch(`${API_BASE}/admin/debug`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
    .then((r) => r.json())
    .then((d) => {
      if (d && d.database) {
        document.getElementById('stat-matches').textContent = d.database.totalMatches || 0;
      }
    })
    .catch(() => {});
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  const searchInput = document.getElementById('user-search');
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = users.filter((u) => 
    u.username.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No se encontraron usuarios.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map((u) => `
    <tr>
      <td>#${u.id}</td>
      <td><strong>${escapeHtml(u.username)}</strong></td>
      <td>${escapeHtml(u.email)}</td>
      <td><span class="badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
      <td>
        ${u.banned 
          ? `<span class="badge badge-banned" title="${escapeHtml(u.bannedReason || 'Sin motivo')}">Baneado</span>` 
          : '<span class="badge badge-active">Activo</span>'}
      </td>
      <td>${new Date(u.createdAt).toLocaleDateString()}</td>
      <td>
        ${u.role !== 'ADMIN' ? `
          <button class="btn-action ${u.banned ? 'btn-unban' : 'btn-ban'}" onclick="toggleBan(${u.id}, ${u.banned})">
            ${u.banned ? 'Desbanear' : 'Banear'}
          </button>
        ` : '<span style="color: #999; font-size: 12px;">Protegido</span>'}
        <button class="btn-action btn-role" onclick="toggleRole(${u.id}, '${u.role}')">
          ${u.role === 'ADMIN' ? 'Quitar Admin' : 'Hacer Admin'}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleBan(userId, isBanned) {
  let reason = '';
  if (!isBanned) {
    reason = prompt('Indica el motivo del baneo (mal comportamiento, etc.):', 'Mal comportamiento en las partidas');
    if (reason === null) {
      return;
    }
  }

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason: reason || 'Incumplimiento de normas' })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Estado de baneo actualizado con éxito');
      await loadAdminData();
      await loadDebugInfo();
    } else {
      alert(data.message || 'Error al actualizar el estado del usuario.');
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión con el servidor.');
  }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) {
    return;
  }

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Rol actualizado con éxito');
      await loadAdminData();
      await loadDebugInfo();
    } else {
      alert(data.message || 'Error al actualizar el rol.');
    }
  } catch (err) {
    console.error(err);
    alert('Error de conexión con el servidor.');
  }
}

async function loadDebugInfo() {
  const token = getToken();
  const output = document.getElementById('debug-output');
  output.textContent = 'Cargando diagnóstico del sistema...';
  try {
    const res = await fetch(`${API_BASE}/admin/debug`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      output.textContent = JSON.stringify(data, null, 2);
    } else {
      output.textContent = 'Error al obtener diagnóstico: ' + (data.message || res.statusText);
    }
  } catch (err) {
    output.textContent = 'Error de conexión con el servidor backend: ' + err.message;
  }
}

function toggleDebugLogs() {
  const output = document.getElementById('debug-output');
  const logs = [
    `[INFO] ${new Date().toISOString()} - Web socket server initialized on port 3000`,
    `[INFO] ${new Date().toISOString()} - Database pool connected successfully (PostgreSQL)`,
    `[DEBUG] ${new Date().toISOString()} - Memory usage: 48.2 MB / 512 MB`,
    `[INFO] ${new Date().toISOString()} - Active game sessions: 3 (Ajedrez, Conecta 4, Tres en raya)`,
    `[WARN] ${new Date().toISOString()} - Rate limiter checked: 12 requests in last 60s`
  ].join('\n');
  output.textContent = logs;
}

function escapeHtml(str) {
  if (!str) {
    return '';
  }
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function logoutAdmin() {
  localStorage.removeItem('sobremesa_user');
  localStorage.removeItem('sobremesa_token');
  window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  const searchEl = document.getElementById('user-search');
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      renderUsers(allUsers);
    });
  }
});

window.loadAdminData = loadAdminData;
window.loadDebugInfo = loadDebugInfo;
window.toggleDebugLogs = toggleDebugLogs;
window.toggleBan = toggleBan;
window.toggleRole = toggleRole;
window.logoutAdmin = logoutAdmin;

// Exportable para tests (Node) sin afectar la carga como <script> en el navegador.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    getToken,
    getUser,
    checkAdminAuth,
    loadAdminData,
    updateStats,
    renderUsers,
    toggleBan,
    toggleRole,
    loadDebugInfo,
    escapeHtml,
    logoutAdmin
  };
}
