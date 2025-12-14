import { KIRProfile } from '../admin/KIRProfile.js';
import { FirebaseAuthService } from '../../services/frontend/FirebaseAuthService.js';
import { KIRService } from '../../services/backend/KIRService.js';
import { AIRService } from '../../services/backend/AIRService.js';
import { PasanganService } from '../../services/backend/PasanganService.js';
import { ProgramService } from '../../services/backend/ProgramService.js';

// User dashboard component
export function createUserSidebar(user) {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="admin-profile">
          <div class="profile-picture">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ccircle cx='20' cy='16' r='6' fill='%236366f1'/%3E%3Cpath d='M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%236366f1'/%3E%3C/svg%3E" alt="User Profile" />
          </div>
          <h2 class="sidebar-title">User Panel</h2>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" data-section="dashboard">
          <span class="nav-icon">📊</span>
          Dashboard
        </a>

        <a href="#" class="nav-item" data-section="kir-profile"
          <span class="nav-icon">🏠</span>
          My KIR Profile
        
        <a href="#" class="nav-item" data-section="settings">
          <span class="nav-icon">⚙️</span>
          Settings
        </a>
        <a href="#" class="nav-item logout-nav-item" id="logoutBtn">
          <span class="nav-icon">🚪</span>
          Logout
        </a>
      </nav>
    </aside>
  `;
}

export function createUserMainContent() {
  return `
    <style>
      .stats-grid .stat-meta {
        margin: 0;
        color: #94a3b8;
        font-size: 0.9rem;
      }
      .dashboard-status-message {
        display: none;
        margin: 1rem 0 0;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 0.95rem;
        background: #eef2ff;
        color: #312e81;
      }
      .dashboard-status-message.error {
        background: #fef2f2;
        color: #991b1b;
      }
      .dashboard-status-message.success {
        background: #ecfdf5;
        color: #065f46;
      }
      #user-settings-wrapper .setting-card {
        background: #fff;
        border-radius: 18px;
        padding: 24px;
        margin-top: 1.5rem;
        box-shadow: 0 15px 45px rgba(15, 23, 42, 0.08);
      }
      #user-settings-wrapper .setting-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 1rem;
      }
      #user-settings-wrapper .setting-header h4 {
        margin: 0;
      }
      #user-settings-wrapper .setting-icon {
        font-size: 1.5rem;
        color: #4f46e5;
      }
      #user-settings-wrapper .change-password-form .form-group {
        margin-bottom: 12px;
      }
      #user-settings-wrapper .change-password-form input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
      }
      #user-settings-wrapper .change-password-form button {
        width: 100%;
        margin-top: 10px;
      }
      #user-settings-wrapper .form-status {
        display: none;
        margin-top: 10px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 0.95rem;
      }
      #user-settings-wrapper .form-status.success {
        display: block;
        background: #ecfdf3;
        color: #065f46;
        border: 1px solid #6ee7b7;
      }
      #user-settings-wrapper .form-status.error {
        display: block;
        background: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
    </style>
    <div id="dashboard-content" class="content-section active">
      <div class="stats-grid">
        <div class="stat-card" id="stat-card-programs">
          <div class="stat-header">
            <h3 class="stat-title">Program Joined</h3>
            <span class="stat-icon"><i class="fas fa-calendar-check"></i></span>
          </div>
          <p class="stat-value" id="stat-programs-joined">-</p>
          <p class="stat-meta" id="stat-programs-meta">Memuatkan data...</p>
        </div>
        <div class="stat-card" id="stat-card-kir">
          <div class="stat-header">
            <h3 class="stat-title">KIR Record</h3>
            <span class="stat-icon"><i class="fas fa-id-card"></i></span>
          </div>
          <p class="stat-value" id="stat-kir-status">-</p>
          <p class="stat-meta" id="stat-kir-meta">Memuatkan data...</p>
        </div>
        <div class="stat-card" id="stat-card-pkir">
          <div class="stat-header">
            <h3 class="stat-title">PKIR Status</h3>
            <span class="stat-icon"><i class="fas fa-heart"></i></span>
          </div>
          <p class="stat-value" id="stat-pkir-status">-</p>
          <p class="stat-meta" id="stat-pkir-meta">Memuatkan data...</p>
        </div>
        <div class="stat-card" id="stat-card-air">
          <div class="stat-header">
            <h3 class="stat-title">Household Members</h3>
            <span class="stat-icon"><i class="fas fa-users"></i></span>
          </div>
          <p class="stat-value" id="stat-air-count">-</p>
          <p class="stat-meta" id="stat-air-meta">Memuatkan data...</p>
        </div>
      </div>
      <div id="dashboard-stats-status" class="dashboard-status-message"></div>
      <div class="quick-actions">
        <h3 class="section-title">Quick Actions</h3>
        <div class="action-buttons">
          <button class="action-btn">
            <span>👤</span>
            Edit Profile
          </button>
          <button class="action-btn">
            <span>📋</span>
            View Activity
          </button>
          <button class="action-btn">
            <span>⚙️</span>
            Settings
          </button>
        </div>
      </div>
    </div>
    
    <div id="kir-profile-content" class="content-section">
      <div class="quick-actions">
        <h3 class="section-title">My Household (KIR)</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem;">Kemaskini maklumat keluarga anda. Semua perubahan akan dikongsi dengan pentadbir.</p>
      </div>
      <div id="user-kir-profile-container" class="kir-profile-embed">
        <div class="empty-state">
          <p>Pilih tab ini untuk memuatkan profil KIR anda.</p>
        </div>
      </div>
    </div>
    
    <div id="profile-content" class="content-section">
      <div class="quick-actions">
        <h3 class="section-title">My Profile</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem;">Manage your personal information and preferences.</p>
        <div class="action-buttons">
          <button class="action-btn">
            <span>✏️</span>
            Edit Info
          </button>
          <button class="action-btn">
            <span>🔒</span>
            Change Password
          </button>
          <button class="action-btn">
            <span>📧</span>
            Email Settings
          </button>
        </div>
      </div>
    </div>
    
    <div id="activity-content" class="content-section">
      <div class="quick-actions">
        <h3 class="section-title">My Activity</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem;">View your recent activities and history.</p>
        <div class="action-buttons">
          <button class="action-btn">
            <span>📊</span>
            Activity Log
          </button>
          <button class="action-btn">
            <span>📈</span>
            Statistics
          </button>
          <button class="action-btn">
            <span>📅</span>
            Calendar
          </button>
        </div>
      </div>
    </div>
    
    <div id="settings-content" class="content-section">
      <div class="quick-actions">
        <h3 class="section-title">User Settings</h3>
        <p style="color: #64748b; margin-bottom: 1.5rem;">Configure your account settings and preferences.</p>
        <div class="action-buttons">
          <button class="action-btn">
            <span>🔔</span>
            Notifications
          </button>
          <button class="action-btn">
            <span>🎨</span>
            Theme
          </button>
          <button class="action-btn">
            <span>🔐</span>
            Privacy
          </button>
        </div>
      </div>
      <div id="user-settings-wrapper">
        <div class="setting-card">
          <div class="setting-header">
            <h4>Change Password</h4>
            <span class="setting-icon">dY"?</span>
          </div>
          <form id="userChangePasswordForm" class="change-password-form">
            <div class="form-group">
              <label for="userCurrentPassword">Current Password</label>
              <input type="password" id="userCurrentPassword" name="currentPassword" required placeholder="Enter current password">
            </div>
            <div class="form-group">
              <label for="userNewPassword">New Password</label>
              <input type="password" id="userNewPassword" name="newPassword" required placeholder="Enter new password" minlength="6">
            </div>
            <div class="form-group">
              <label for="userConfirmPassword">Confirm New Password</label>
              <input type="password" id="userConfirmPassword" name="confirmPassword" required placeholder="Confirm new password" minlength="6">
            </div>
            <div id="userChangePasswordStatus" class="form-status"></div>
            <button type="submit" class="auth-btn">Update Password</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function createUserDashboard(user) {
  const sidebar = createUserSidebar(user);
  const mainContent = createUserMainContent();
  
  return `
    <div class="admin-layout">
      ${sidebar}
      
      <main class="main-content">
        <div class="content-header">
          <h1 class="content-title">User Dashboard</h1>
          <p class="content-subtitle">Welcome, ${user.name} - Manage your account and activities</p>
        </div>
        
        ${mainContent}
      </main>
    </div>
  `;
}

let userKIRProfileInstance = null;
let userDashboardStatsPromise = null;

export function setupUserDashboardFeatures(user) {
  setupUserKIRProfileSection(user);
  initializeUserDashboardStats(user);
  initializeUserChangePasswordForm();
}


async function initializeUserDashboardStats(user) {
  showDashboardStatsLoadingState();

  if (!user || !user.kir_id) {
    setDashboardStatusMessage('Akaun anda belum dipautkan kepada rekod KIR. Hubungi pentadbir untuk bantuan.', 'error');
    setStatValue('stat-kir-status', 'Tiada KIR');
    setStatMeta('stat-kir-meta', 'Pautkan akaun kepada rekod KIR untuk melihat data.');
    setStatValue('stat-programs-joined', '0');
    setStatMeta('stat-programs-meta', 'Tiada program yang direkodkan.');
    setStatValue('stat-pkir-status', 'Tiada Rekod');
    setStatMeta('stat-pkir-meta', 'Rekod pasangan belum tersedia.');
    setStatValue('stat-air-count', '0');
    setStatMeta('stat-air-meta', 'Tiada ahli isi rumah berdaftar.');
    return;
  }

  if (userDashboardStatsPromise) {
    return userDashboardStatsPromise;
  }

  const pending = (async () => {
    try {
      const [kirData, pkirData, airList, attendanceRecords] = await Promise.all([
        KIRService.getKIRById(user.kir_id),
        PasanganService.getPKIRByKirId(user.kir_id).catch(() => null),
        AIRService.listAIR(user.kir_id),
        ProgramService.listKehadiranByKir(user.kir_id)
      ]);

      const success = applyDashboardStats({
        kirData,
        pkirData,
        airList: Array.isArray(airList) ? airList : [],
        attendanceRecords: Array.isArray(attendanceRecords) ? attendanceRecords : []
      });

      if (success) {
        setDashboardStatusMessage('');
      }
    } catch (error) {
      console.error('Failed to load user dashboard stats:', error);
      setDashboardStatusMessage(error.message || 'Gagal memuatkan data papan pemuka.', 'error');
    } finally {
      userDashboardStatsPromise = null;
    }
  })();

  userDashboardStatsPromise = pending;
  return pending;
}

function applyDashboardStats({ kirData, pkirData, airList, attendanceRecords }) {
  if (!kirData) {
    setStatValue('stat-kir-status', 'Tiada Rekod');
    setStatMeta('stat-kir-meta', 'Rekod KIR tidak ditemui.');
    setDashboardStatusMessage('Rekod KIR tidak ditemui. Sila hubungi pentadbir.', 'error');
    return false;
  }

  const kirName = kirData.nama_penuh || kirData.nama || 'Rekod KIR';
  const kirStatus = kirData.status_rekod || 'Tidak diketahui';
  const kirUpdated = formatDisplayDate(kirData.tarikh_kemas_kini || kirData.tarikh_cipta);
  setStatValue('stat-kir-status', kirStatus);
  setStatMeta('stat-kir-meta', kirUpdated ? `${kirName} | Dikemas kini ${kirUpdated}` : kirName);

  const joinedRecords = attendanceRecords.filter(record => record && record.kehadiran_id);
  const programsJoined = joinedRecords.length;
  const programsAttended = joinedRecords.filter(record => record.hadir).length;
  setStatValue('stat-programs-joined', formatNumber(programsJoined));
  const nextProgram = getNextUpcomingProgram(joinedRecords);
  if (programsJoined === 0) {
    setStatMeta('stat-programs-meta', 'Tiada program yang disertai lagi.');
  } else {
    const attendanceSummary = `${formatNumber(programsAttended)}/${formatNumber(programsJoined)} hadir`;
    if (nextProgram) {
      const nextProgramName = nextProgram.nama_program || nextProgram.nama || 'Program seterusnya';
      const nextProgramDate = nextProgram.startDate ? ` (${formatDisplayDate(nextProgram.startDate)})` : '';
      setStatMeta('stat-programs-meta', `${attendanceSummary} | Seterusnya: ${nextProgramName}${nextProgramDate}`);
    } else {
      setStatMeta('stat-programs-meta', attendanceSummary);
    }
  }

  const pkirExists = Boolean(pkirData);
  setStatValue('stat-pkir-status', pkirExists ? 'Berdaftar' : 'Tiada Rekod');
  if (pkirExists) {
    const pkirName = pkirData.asas?.nama || pkirData.nama || 'Pasangan';
    const pkirUpdated = formatDisplayDate(pkirData.tarikh_kemas_kini || pkirData.tarikh_cipta);
    setStatMeta('stat-pkir-meta', pkirUpdated ? `${pkirName} | Dikemas kini ${pkirUpdated}` : pkirName);
  } else {
    setStatMeta('stat-pkir-meta', 'Cipta rekod pasangan dalam profil KIR.');
  }

  const airCount = airList.length;
  setStatValue('stat-air-count', formatNumber(airCount));
  if (airCount === 0) {
    setStatMeta('stat-air-meta', 'Tiada ahli isi rumah berdaftar.');
  } else {
    const latestAIR = getLatestRecord(airList);
    const latestName = latestAIR?.nama || latestAIR?.nama_penuh || 'Ahli Isi Rumah';
    const latestUpdate = formatDisplayDate(latestAIR?.tarikh_kemas_kini || latestAIR?.tarikh_cipta);
    setStatMeta('stat-air-meta', latestUpdate ? `${latestName} | Dikemas kini ${latestUpdate}` : `${latestName} disenaraikan.`);
  }

  return true;
}

function showDashboardStatsLoadingState() {
  ['stat-programs-joined', 'stat-kir-status', 'stat-pkir-status', 'stat-air-count'].forEach(id => {
    setStatValue(id, '...');
  });
  ['stat-programs-meta', 'stat-kir-meta', 'stat-pkir-meta', 'stat-air-meta'].forEach(id => {
    setStatMeta(id, 'Memuatkan data...');
  });
  setDashboardStatusMessage('');
}

function setDashboardStatusMessage(message, type = 'info') {
  const element = document.getElementById('dashboard-stats-status');
  if (!element) return;
  if (!message) {
    element.style.display = 'none';
    element.textContent = '';
    element.classList.remove('error', 'success');
    return;
  }
  element.style.display = 'block';
  element.textContent = message;
  element.classList.remove('error', 'success');
  if (type && type !== 'info') {
    element.classList.add(type);
  }
}

function setStatValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value ?? '-';
  }
}

function setStatMeta(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value ?? '';
  }
}

function getNextUpcomingProgram(records = []) {
  const now = new Date();
  return records
    .map(record => ({
      ...record,
      startDate: normalizeDateInput(record.tarikh_mula || record.startDate || record.tarikh_kehadiran)
    }))
    .filter(record => record.startDate && record.startDate >= now && !record.hadir)
    .sort((a, b) => a.startDate - b.startDate)[0] || null;
}

function getLatestRecord(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }
  return [...records].sort((a, b) => {
    const dateB = normalizeDateInput(b.tarikh_kemas_kini || b.tarikh_cipta);
    const dateA = normalizeDateInput(a.tarikh_kemas_kini || a.tarikh_cipta);
    return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
  })[0];
}

function normalizeDateInput(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return Number.isNaN(date?.getTime()) ? null : date;
    }
    if (typeof value.seconds === 'number') {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value) {
  const date = normalizeDateInput(value);
  if (!date) return '';
  return date.toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-MY') : value;
}

function setupUserKIRProfileSection(user) {
  const navItem = document.querySelector('[data-section="kir-profile"]');
  const container = document.getElementById('user-kir-profile-container');
  
  if (!navItem || !container) return;
  
  if (!user?.kir_id) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Rekod KIR belum dipautkan</h3>
        <p>Sila hubungi pentadbir untuk memautkan akaun anda kepada rekod KIR.</p>
      </div>
    `;
    return;
  }
  
  let isInitialized = false;
  
  const initializeProfile = async () => {
    if (isInitialized) return;
    isInitialized = true;
    
    container.innerHTML = `
      <div class="loading-text">Memuatkan profil KIR anda...</div>
    `;
    
    if (!userKIRProfileInstance) {
      userKIRProfileInstance = new KIRProfile();
    }
    
    window.kirProfile = userKIRProfileInstance;
    
    try {
      await userKIRProfileInstance.init(user.kir_id, 'maklumat-asas', {
        mode: 'self-service',
        containerId: 'user-kir-profile-container',
        allowNavigation: false,
        hideAdminActions: true,
        disableURLSync: true
      });
    } catch (error) {
      console.error('Failed to initialize user KIR profile:', error);
      container.innerHTML = `
        <div class="empty-state">
          <h3>Ralat memuatkan profil</h3>
          <p>${error.message || 'Sila cuba lagi atau hubungi pentadbir.'}</p>
        </div>
      `;
    }
  };
  
  navItem.addEventListener('click', () => {
    setTimeout(() => initializeProfile(), 150);
  });
}

function initializeUserChangePasswordForm() {
  const form = document.getElementById('userChangePasswordForm');
  if (!form || form.dataset.listenerAttached === 'true') return;
  form.dataset.listenerAttached = 'true';
  const statusElement = document.getElementById('userChangePasswordStatus');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = form.querySelector('#userCurrentPassword')?.value.trim();
    const newPassword = form.querySelector('#userNewPassword')?.value.trim();
    const confirmPassword = form.querySelector('#userConfirmPassword')?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setUserFormStatus(statusElement, 'Please fill in all fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setUserFormStatus(statusElement, 'New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      setUserFormStatus(statusElement, 'Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }
      setUserFormStatus(statusElement, 'Updating password...', '');
      await FirebaseAuthService.changePasswordWithCurrentPassword(currentPassword, newPassword);
      setUserFormStatus(statusElement, 'Password updated successfully.', 'success');
      form.reset();
    } catch (error) {
      setUserFormStatus(statusElement, error.message || 'Unable to change password.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
      }
    }
  });
}

function setUserFormStatus(element, message, type = '') {
  if (!element) return;
  element.style.display = message ? 'block' : 'none';
  element.textContent = message || '';
  element.classList.remove('success', 'error');
  if (type) {
    element.classList.add(type);
  }
}
