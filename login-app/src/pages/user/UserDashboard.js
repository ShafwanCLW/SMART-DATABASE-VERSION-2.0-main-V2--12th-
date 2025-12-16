import { KIRProfile } from '../admin/KIRProfile.js';
import { FirebaseAuthService } from '../../services/frontend/FirebaseAuthService.js';
import { KIRService } from '../../services/backend/KIRService.js';
import { AIRService } from '../../services/backend/AIRService.js';
import { PasanganService } from '../../services/backend/PasanganService.js';
import { ProgramService } from '../../services/backend/ProgramService.js';
import { normalizeNoKP } from '../../services/database/collections.js';

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

        <a href="#" class="nav-item" data-section="kir-profile">
          <span class="nav-icon">🏠</span>
          My KIR Profile
        </a>
        
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
      .dashboard-hero {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }
      .dashboard-hero .hero-card {
        border-radius: 26px;
        background: linear-gradient(135deg, #4338ca, #7c3aed);
        color: #fff;
        padding: clamp(20px, 3vw, 36px);
        position: relative;
        overflow: hidden;
        box-shadow: 0 24px 48px rgba(67, 56, 202, 0.4);
      }
      .dashboard-hero .hero-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.22), transparent 55%);
        pointer-events: none;
      }
      .dashboard-hero .hero-card > * {
        position: relative;
        z-index: 1;
      }
      .dashboard-hero .hero-eyebrow {
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        opacity: 0.8;
      }
      .dashboard-hero .hero-title {
        margin: 0.3rem 0 0.5rem;
        font-size: clamp(1.8rem, 3vw, 2.6rem);
      }
      .dashboard-hero .hero-meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.95rem;
      }
      .dashboard-hero .hero-stat-group {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 1rem;
        margin-top: 1.5rem;
      }
      .dashboard-hero .mini-stat {
        background: rgba(255, 255, 255, 0.14);
        padding: 0.75rem 1rem;
        border-radius: 16px;
        backdrop-filter: blur(4px);
      }
      .dashboard-hero .mini-stat span {
        display: block;
        font-size: 0.8rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        opacity: 0.8;
      }
      .dashboard-hero .mini-stat strong {
        font-size: 1.6rem;
      }
      .dashboard-hero .hero-side-card {
        background: #fff;
        border-radius: 22px;
        padding: 1.75rem;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
        border: 1px solid #ede9fe;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .layer-card {
        background: #fff;
        border-radius: 24px;
        padding: 1.75rem;
        box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
        border: 1px solid #eff1f7;
        margin-top: 1.75rem;
      }
      .layer-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .layer-eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.8rem;
        color: #a5b4fc;
      }
      .layer-card-header h4 {
        margin: 0.25rem 0 0;
      }
      .insight-chip {
        background: #eef2ff;
        color: #4338ca;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .household-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
      }
      .summary-card {
        border-radius: 18px;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        background: linear-gradient(120deg, #f8fafc, #ffffff);
      }
      .summary-card h4 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
      }
      .summary-card p {
        margin: 0;
        color: #475569;
      }
      .participant-switcher {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
      }
      .participant-chip {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        min-width: 180px;
        transition: all 0.2s ease;
      }
      .participant-chip.active {
        border-color: #7c3aed;
        background: #ede9fe;
        box-shadow: 0 10px 20px rgba(124, 58, 237, 0.15);
      }
      .participant-chip span {
        font-size: 0.8rem;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .participant-chip strong {
        font-size: 1rem;
        color: #0f172a;
      }
      .participant-chip .chip-meta {
        font-size: 0.82rem;
        color: #475569;
      }
      .participant-program-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .program-row {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 0.9rem 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        background: #fdfbff;
      }
      .program-row .program-info h5 {
        margin: 0 0 0.25rem;
        font-size: 1rem;
      }
      .program-row .program-info p {
        margin: 0;
        color: #64748b;
      }
      .program-status {
        text-align: right;
        min-width: 160px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .status-attended {
        background: #dcfce7;
        color: #166534;
      }
      .status-upcoming {
        background: #eef2ff;
        color: #312e81;
      }
      .status-missed {
        background: #fee2e2;
        color: #991b1b;
      }
      .timeline-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .timeline-item {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      .timeline-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-top: 0.25rem;
        background: #7c3aed;
        flex-shrink: 0;
      }
      .timeline-content h5 {
        margin: 0;
        font-size: 1rem;
      }
      .timeline-content p {
        margin: 0.15rem 0 0;
        color: #475569;
      }
      .empty-state-card {
        border: 1px dashed #cbd5f5;
        border-radius: 16px;
        padding: 1rem;
        text-align: center;
        color: #475569;
        background: #f8fafc;
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
      <div class="dashboard-hero">
        <div class="hero-card">
          <p class="hero-eyebrow">Isi Rumah</p>
          <h2 class="hero-title" id="dashboard-hero-title">Selamat Datang</h2>
          <p class="hero-meta" id="dashboard-hero-meta">Memuatkan maklumat isi rumah anda...</p>
          <div class="hero-stat-group">
            <div class="mini-stat">
              <span>Program Dihadiri</span>
              <strong id="hero-stat-attended">-</strong>
            </div>
            <div class="mini-stat">
              <span>Kadar Kehadiran</span>
              <strong id="hero-stat-rate">-</strong>
            </div>
            <div class="mini-stat">
              <span>Ahli Isi Rumah</span>
              <strong id="hero-stat-members">-</strong>
            </div>
          </div>
        </div>
        <div class="hero-side-card">
          <p class="layer-eyebrow">Program Seterusnya</p>
          <h4 id="hero-next-program-name">Memuatkan...</h4>
          <p id="hero-next-program-date" style="margin: 0; color: #475569;">-</p>
          <div class="insight-chip" id="hero-next-program-status">---</div>
          <p id="hero-next-program-note" style="margin: 0; color: #94a3b8; font-size: 0.9rem;">Kemaskini maklumat program untuk melihat perkembangan terkini.</p>
        </div>
      </div>
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
            <span>dY&#96;</span>
            Edit Profile
          </button>
          <button class="action-btn">
            <span>dY"<</span>
            View Activity
          </button>
          <button class="action-btn">
            <span>?sT?,?</span>
            Settings
          </button>
        </div>
      </div>
      <div class="layer-card" id="household-summary-card">
        <div class="layer-card-header">
          <div>
            <p class="layer-eyebrow">Isi Rumah</p>
            <h4>Ringkasan KIR, PKIR & AIR</h4>
          </div>
          <div class="insight-chip" id="household-summary-chip">Memuatkan...</div>
        </div>
        <div id="household-summary-grid" class="household-summary-grid">
          <div class="empty-state-card">Memuatkan maklumat isi rumah...</div>
        </div>
      </div>
      <div class="layer-card" id="household-participation-card">
        <div class="layer-card-header">
          <div>
            <p class="layer-eyebrow">Program Participation</p>
            <h4>Penjejakan Kehadiran Isi Rumah</h4>
          </div>
          <div class="insight-chip" id="participation-summary-chip">Memuatkan...</div>
        </div>
        <div id="household-participant-switcher" class="participant-switcher"></div>
        <div id="household-participation-container" class="participant-program-list">
          <div class="empty-state-card">Memuatkan rekod program...</div>
        </div>
      </div>
      <div class="layer-card" id="attendance-history-card">
        <div class="layer-card-header">
          <div>
            <p class="layer-eyebrow">Rekod Terkini</p>
            <h4>Sejarah Kehadiran</h4>
          </div>
          <div class="insight-chip" id="attendance-history-chip">Memuatkan...</div>
        </div>
        <div id="attendance-timeline" class="timeline-list">
          <div class="empty-state-card">Memuatkan sejarah kehadiran...</div>
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
let householdParticipationState = null;

export function setupUserDashboardFeatures(user) {
  setupUserKIRProfileSection(user);
  initializeUserDashboardStats(user);
  setupParticipationSwitcher();
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
      const [kirData, pkirData, airListRaw, kirProgramParticipation] = await Promise.all([
        KIRService.getKIRById(user.kir_id),
        PasanganService.getPKIRByKirId(user.kir_id).catch(() => null),
        AIRService.listAIR(user.kir_id),
        ProgramService.listKehadiranByKir(user.kir_id)
      ]);

      const airList = Array.isArray(airListRaw) ? airListRaw : [];
      const participants = buildHouseholdParticipants({ user, kirData, pkirData, airList });

      let basePrograms = normalizeProgramList(kirProgramParticipation);
      if (!basePrograms.length) {
        const fallbackPrograms = await ProgramService.listProgram().catch(() => []);
        basePrograms = normalizeProgramList(fallbackPrograms);
      }

      const additionalParticipants = participants.filter(participant => participant.type !== 'KIR' && participant.id);
      const attendanceMap = await fetchHouseholdAttendance(additionalParticipants);
      const householdParticipation = buildHouseholdParticipation({
        participants,
        basePrograms,
        kirPrograms: Array.isArray(kirProgramParticipation) ? kirProgramParticipation : [],
        attendanceMap
      });

      householdParticipationState = householdParticipation;

      const success = applyDashboardStats({
        kirData,
        pkirData,
        airList,
        attendanceRecords: Array.isArray(kirProgramParticipation) ? kirProgramParticipation : [],
        householdParticipation
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


function applyDashboardStats({ kirData, pkirData, airList, attendanceRecords, householdParticipation }) {
  if (!kirData) {
    setStatValue('stat-kir-status', 'Tiada Rekod');
    setStatMeta('stat-kir-meta', 'Rekod KIR tidak ditemui.');
    setDashboardStatusMessage('Rekod KIR tidak ditemui. Sila hubungi pentadbir.', 'error');
    return false;
  }
  
  const kirParticipation = householdParticipation?.participants?.find(participant => participant.type === 'KIR');
  const kirEntries = kirParticipation?.entries || [];
  const joinedRecords = kirParticipation
    ? kirEntries.filter(entry => entry.hadir)
    : (attendanceRecords || []).filter(record => record && record.kehadiran_id && record.hadir);
  const programsJoined = joinedRecords.length;
  const programsAttended = joinedRecords.filter(record => record.hadir).length;
  const totalProgramsTracked = kirParticipation
    ? kirEntries.length
    : (attendanceRecords || []).filter(record => record && record.kehadiran_id).length;
  const nextProgram = kirParticipation ? getNextUpcomingProgram(kirEntries) : getNextUpcomingProgram(attendanceRecords || []);
  
  const kirName = kirData.nama_penuh || kirData.nama || 'Rekod KIR';
  const kirStatus = kirData.status_rekod || 'Tidak diketahui';
  const kirUpdated = formatDisplayDate(kirData.tarikh_kemas_kini || kirData.tarikh_cipta);
  setStatValue('stat-kir-status', kirStatus);
  setStatMeta('stat-kir-meta', kirUpdated ? `${kirName} | Dikemas kini ${kirUpdated}` : kirName);

  setStatValue('stat-programs-joined', formatNumber(programsJoined));
  if (programsJoined === 0) {
    setStatMeta('stat-programs-meta', 'Tiada program yang disertai lagi.');
  } else {
    const denominator = totalProgramsTracked || programsJoined;
    const attendanceSummary = `${formatNumber(programsAttended)}/${formatNumber(denominator)} hadir`;
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

  const airListSafe = Array.isArray(airList) ? airList : [];
  const airCount = airListSafe.length;
  setStatValue('stat-air-count', formatNumber(airCount));
  if (airCount === 0) {
    setStatMeta('stat-air-meta', 'Tiada ahli isi rumah berdaftar.');
  } else {
    const latestAIR = getLatestRecord(airListSafe);
    const latestName = latestAIR?.nama || latestAIR?.nama_penuh || 'Ahli Isi Rumah';
    const latestUpdate = formatDisplayDate(latestAIR?.tarikh_kemas_kini || latestAIR?.tarikh_cipta);
    setStatMeta('stat-air-meta', latestUpdate ? `${latestName} | Dikemas kini ${latestUpdate}` : `${latestName} disenaraikan.`);
  }

  updateHeroSection({
    kirName,
    programsJoined,
    programsAttended,
    totalProgramsTracked,
    airCount,
    nextProgram,
    householdParticipation
  });

  if (householdParticipation) {
    renderHouseholdSummary(householdParticipation.participants || []);
    renderParticipationMatrix(householdParticipation);
    renderAttendanceTimeline(householdParticipation);
  } else {
    renderHouseholdSummary(buildHouseholdParticipants({ kirData, pkirData, airList }));
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

function buildHouseholdParticipants({ user = {}, kirData = {}, pkirData = null, airList = [] } = {}) {
  const participants = [];
  const kirId = user?.kir_id || kirData?.id || '';
  const kirIndexId = normalizeNoKP(kirData?.no_kp || kirData?.no_kp_raw || user?.no_kp);

  if (kirId) {
    participants.push({
      id: kirId,
      type: 'KIR',
      label: 'KIR',
      name: kirData.nama_penuh || kirData.nama || user.name || 'Ketua Isi Rumah',
      statusText: kirData.status_rekod || 'Tidak diketahui',
      meta: kirData.telefon_utama ? `Tel: ${kirData.telefon_utama}` : (kirData.negeri ? `Negeri: ${kirData.negeri}` : 'Ketua Isi Rumah'),
      indexId: kirIndexId,
      noKP: kirData.no_kp || kirData.no_kp_raw || user.no_kp || ''
    });
  }

  if (pkirData && pkirData.id) {
    const pkirIndexId = normalizeNoKP(pkirData.asas?.no_kp || pkirData.no_kp);
    participants.push({
      id: pkirData.id,
      type: 'PKIR',
      label: 'PKIR',
      name: pkirData.asas?.nama || pkirData.nama || 'Pasangan',
      statusText: pkirData.asas?.status_pasangan || 'Aktif',
      meta: pkirData.asas?.no_kp ? `No. KP: ${pkirData.asas.no_kp}` : 'Pasangan isi rumah',
      indexId: pkirIndexId,
      noKP: pkirData.asas?.no_kp || pkirData.no_kp || ''
    });
  }

  if (Array.isArray(airList)) {
    airList.forEach((air, index) => {
      if (!air?.id) return;
      const airIndexId = normalizeNoKP(air.no_kp || air.no_kp_display);
      participants.push({
        id: air.id,
        type: 'AIR',
        label: air.hubungan || `AIR ${index + 1}`,
        name: air.nama || air.nama_penuh || `Ahli Isi Rumah ${index + 1}`,
        statusText: air.status || 'Aktif',
        meta: air.tarikh_lahir ? `Lahir: ${formatDisplayDate(air.tarikh_lahir)}` : (air.jantina || 'Ahli Isi Rumah'),
        indexId: airIndexId,
        noKP: air.no_kp || air.no_kp_display || ''
      });
    });
  }

  return participants;
}

async function fetchHouseholdAttendance(participants = []) {
  if (!participants.length) {
    return new Map();
  }
  
  const attendanceResults = await Promise.all(participants.map(async (participant) => {
    let records = [];
    
    try {
      records = await ProgramService.listAttendanceByParticipant(participant.id, { participantType: participant.type });
    } catch (error) {
      console.error('Failed to load attendance for participant', participant.id, error);
    }
    
    if ((!records || records.length === 0) && participant.indexId) {
      try {
        records = await ProgramService.listAttendanceByParticipantIndex(participant.indexId);
      } catch (fallbackError) {
        console.error('Failed to load attendance via participant index', participant.indexId, fallbackError);
      }
    }
    
    return { participantId: participant.id, records: records || [] };
  }));
  
  const map = new Map();
  attendanceResults.forEach(({ participantId, records }) => {
    map.set(participantId, records || []);
  });
  return map;
}

function buildHouseholdParticipation({ participants = [], basePrograms = [], kirPrograms = [], attendanceMap = new Map() }) {
  const programList = normalizeProgramList(basePrograms.length ? basePrograms : kirPrograms);
  const kirAttendance = extractAttendanceRecordsFromProgramView(kirPrograms);

  const participantEntries = participants.map(participant => {
    const attendanceRecords = participant.type === 'KIR'
      ? kirAttendance
      : attendanceMap.get(participant.id) || [];
    const attendanceByProgram = buildAttendanceMap(attendanceRecords);

    const entries = programList.map(program => mergeProgramWithAttendance(program, attendanceByProgram.get(program.id)));
    const attendedCount = entries.filter(entry => entry.hadir).length;
    const lastAttendedAt = entries.reduce((latest, entry) => {
      if (!entry.hadir) return latest;
      const ts = normalizeDateInput(entry.lastAttendedAt || entry.tarikh_kehadiran || entry.tarikh_tamat || entry.tarikh_mula);
      if (!ts) return latest;
      if (!latest || ts > latest) return ts;
      return latest;
    }, null);

    return {
      ...participant,
      entries,
      totalPrograms: entries.length,
      attendedCount,
      lastAttendedAt
    };
  });

  const attendanceEvents = participantEntries.flatMap(participant =>
    participant.entries
      .filter(entry => entry.hadir)
      .map(entry => ({
        participantId: participant.id,
        participantName: participant.name,
        participantLabel: participant.label,
        programName: entry.nama_program,
        attendedAt: normalizeDateInput(entry.lastAttendedAt || entry.tarikh_kehadiran || entry.tarikh_tamat || entry.tarikh_mula),
        status: entry.status
      }))
  ).filter(event => event.attendedAt);

  return {
    participants: participantEntries,
    programs: programList,
    attendanceEvents
  };
}

function normalizeProgramList(programs = []) {
  return programs
    .map(program => {
      const start = normalizeDateInput(program.tarikh_mula || program.startDate || program.tarikh);
      const end = normalizeDateInput(program.tarikh_tamat || program.endDate);
      return {
        id: program.id || program.program_id || program.programId,
        nama_program: program.nama_program || program.nama || program.name || 'Program',
        kategori: program.kategori || program.category || 'Program',
        lokasi: program.lokasi || program.location || '',
        tarikh_mula: start,
        tarikh_tamat: end,
        status: determineProgramStatusForUser(start, end),
        durationDays: calculateDurationDaysForProgram(start, end)
      };
    })
    .filter(program => program.id);
}

function determineProgramStatusForUser(startDate, endDate, now = new Date()) {
  if (startDate && now < startDate) {
    return 'upcoming';
  }
  if (startDate && endDate && now >= startDate && (!endDate || now <= endDate)) {
    return 'active';
  }
  if (!startDate && endDate && now <= endDate) {
    return 'active';
  }
  return 'completed';
}

function calculateDurationDaysForProgram(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function extractAttendanceRecordsFromProgramView(programs = []) {
  return programs
    .filter(program => program && program.id)
    .map(program => ({
      program_id: program.id,
      hadir: Boolean(program.hadir),
      catatan: program.catatan || '',
      tarikh_kehadiran: program.tarikh_kehadiran || program.tarikh || null,
      tarikh_kemas_kini: program.tarikh_kemas_kini || null
    }));
}

function buildAttendanceMap(records = []) {
  const map = new Map();
  records.forEach(record => {
    const programId = record.program_id || record.programId || record.id;
    if (!programId) return;
    map.set(programId, {
      hadir: Boolean(record.hadir),
      catatan: record.catatan || record.notes || '',
      tarikh_kehadiran: record.tarikh_kehadiran || record.tarikh || record.timestamp || record.tarikh_kemas_kini || null,
      lastAttendedAt: record.tarikh_kehadiran || record.tarikh || record.timestamp || record.tarikh_kemas_kini || null
    });
  });
  return map;
}

function mergeProgramWithAttendance(program, attendance = {}) {
  return {
    ...program,
    hadir: Boolean(attendance.hadir),
    catatan: attendance.catatan || '',
    tarikh_kehadiran: attendance.tarikh_kehadiran || null,
    lastAttendedAt: attendance.lastAttendedAt || null
  };
}

function renderHouseholdSummary(participants = []) {
  const grid = document.getElementById('household-summary-grid');
  const chip = document.getElementById('household-summary-chip');
  if (!grid) return;

  if (!participants.length) {
    grid.innerHTML = '<div class="empty-state-card">Tiada maklumat isi rumah untuk dipaparkan.</div>';
    if (chip) chip.textContent = 'Tiada data';
    return;
  }

  if (chip) {
    chip.textContent = `${participants.length} ahli isi rumah`;
  }

  grid.innerHTML = participants.map(participant => `
    <div class="summary-card">
      <p style="text-transform: uppercase; letter-spacing: 0.08em; margin: 0; color: #94a3b8;">${participant.label}</p>
      <h4>${participant.name}</h4>
      <p>${participant.statusText || ''}</p>
      <p style="margin-top: 0.35rem; font-size: 0.85rem; color: #94a3b8;">${participant.meta || ''}</p>
    </div>
  `).join('');
}

function updateHeroSection({ kirName, programsJoined, programsAttended, totalProgramsTracked, airCount, nextProgram, householdParticipation }) {
  const heroTitle = kirName ? `Selamat Datang, ${kirName}` : 'Selamat Datang';
  setElementText('dashboard-hero-title', heroTitle);
  const householdSize = householdParticipation?.participants?.length || (airCount + 1);
  setElementText('dashboard-hero-meta', `Pantau penyertaan ${householdSize} ahli isi rumah dan pastikan semua program direkodkan.`);
  setElementText('hero-stat-attended', formatNumber(programsAttended));
  const rateDenominator = typeof totalProgramsTracked === 'number' && totalProgramsTracked > 0
    ? totalProgramsTracked
    : programsJoined;
  const attendanceRate = rateDenominator
    ? `${Math.round((programsAttended / Math.max(rateDenominator, 1)) * 100)}%`
    : '0%';
  setElementText('hero-stat-rate', attendanceRate);
  setElementText('hero-stat-members', formatNumber(householdSize));

  if (nextProgram) {
    const nextProgramName = nextProgram.nama_program || nextProgram.nama || 'Program seterusnya';
    const dateRange = formatProgramDateRange(nextProgram.startDate || nextProgram.tarikh_mula, nextProgram.endDate || nextProgram.tarikh_tamat);
    setElementText('hero-next-program-name', nextProgramName);
    setElementText('hero-next-program-date', dateRange || 'Tarikh belum ditetapkan');
    setElementText('hero-next-program-status', nextProgram.hadir ? 'Ditandakan hadir' : 'Belum disahkan');
    setElementText('hero-next-program-note', nextProgram.hadir ? 'Kehadiran telah direkodkan.' : 'Semak rekod program anda dan sahkan kehadiran.');
  } else {
    setElementText('hero-next-program-name', 'Tiada program dijadualkan');
    setElementText('hero-next-program-date', 'Tambah program baharu atau hubungi urusetia.');
    setElementText('hero-next-program-status', 'Rehat');
    setElementText('hero-next-program-note', 'Tiada acara akan datang direkodkan buat masa ini.');
  }
}

function renderParticipationMatrix(state) {
  const switcher = document.getElementById('household-participant-switcher');
  const container = document.getElementById('household-participation-container');
  const chip = document.getElementById('participation-summary-chip');
  if (!switcher || !container) return;

  if (!state?.participants?.length) {
    container.innerHTML = '<div class="empty-state-card">Tiada program untuk dipaparkan.</div>';
    switcher.innerHTML = '';
    if (chip) chip.textContent = 'Tiada data';
    return;
  }

  householdParticipationState = state;

  const totalAttendance = state.participants.reduce((sum, participant) => sum + (participant.attendedCount || 0), 0);
  if (chip) {
    chip.textContent = `${formatNumber(totalAttendance)} kehadiran direkodkan`;
  }

  switcher.innerHTML = state.participants.map((participant, index) => `
    <button type="button" class="participant-chip ${index === 0 ? 'active' : ''}" data-participant-id="${participant.id}">
      <span>${participant.label}</span>
      <strong>${participant.name}</strong>
      <span class="chip-meta">${participant.attendedCount}/${participant.totalPrograms || 0} hadir</span>
    </button>
  `).join('');

  setupParticipationSwitcher();
  renderParticipantProgramList(state.participants[0]?.id);
}

function setupParticipationSwitcher() {
  const switcher = document.getElementById('household-participant-switcher');
  if (!switcher || switcher.dataset.listenerAttached === 'true') return;
  switcher.dataset.listenerAttached = 'true';

  switcher.addEventListener('click', (event) => {
    const chip = event.target.closest('.participant-chip');
    if (!chip || !householdParticipationState) return;
    const participantId = chip.dataset.participantId;
    setActiveParticipantChip(participantId);
    renderParticipantProgramList(participantId);
  });
}

function setActiveParticipantChip(participantId) {
  const switcher = document.getElementById('household-participant-switcher');
  if (!switcher) return;
  switcher.querySelectorAll('.participant-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.participantId === participantId);
  });
}

function renderParticipantProgramList(participantId) {
  const container = document.getElementById('household-participation-container');
  if (!container || !householdParticipationState) return;

  const participant = householdParticipationState.participants.find(item => item.id === participantId) || householdParticipationState.participants[0];
  if (!participant) {
    container.innerHTML = '<div class="empty-state-card">Tiada data program untuk dipaparkan.</div>';
    return;
  }

  if (!participant.entries.length) {
    container.innerHTML = '<div class="empty-state-card">Tiada program yang direkodkan buat masa ini.</div>';
    return;
  }

  container.innerHTML = participant.entries.map(entry => {
    const statusMeta = getParticipationStatusMeta(entry);
    const dateRange = formatProgramDateRange(entry.tarikh_mula, entry.tarikh_tamat);
    return `
      <div class="program-row">
        <div class="program-info">
          <h5>${entry.nama_program}</h5>
          <p>${dateRange || 'Tarikh tidak ditetapkan'}${entry.kategori ? ` ? ${entry.kategori}` : ''}</p>
        </div>
        <div class="program-status">
          <span class="${statusMeta.className}">${statusMeta.text}</span>
          <p style="margin: 0.35rem 0 0; color: #94a3b8; font-size: 0.85rem;">${entry.catatan || 'Tiada catatan'}</p>
        </div>
      </div>
    `;
  }).join('');
}

function getParticipationStatusMeta(entry) {
  if (entry.hadir) {
    return { text: 'Hadir', className: 'status-pill status-attended' };
  }
  if (entry.status === 'completed') {
    return { text: 'Tidak Hadir', className: 'status-pill status-missed' };
  }
  return { text: 'Akan Datang', className: 'status-pill status-upcoming' };
}

function renderAttendanceTimeline(state) {
  const timeline = document.getElementById('attendance-timeline');
  const chip = document.getElementById('attendance-history-chip');
  if (!timeline) return;

  const events = (state?.attendanceEvents || [])
    .map(event => ({ ...event, attendedAt: normalizeDateInput(event.attendedAt) }))
    .filter(event => event.attendedAt)
    .sort((a, b) => b.attendedAt - a.attendedAt)
    .slice(0, 6);

  if (chip) {
    chip.textContent = `${events.length} rekod terbaru`;
  }

  if (!events.length) {
    timeline.innerHTML = '<div class="empty-state-card">Tiada rekod kehadiran lagi. Sertai program untuk melihat perkembangan anda.</div>';
    return;
  }

  timeline.innerHTML = events.map(event => `
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <div class="timeline-content">
        <h5>${event.programName}</h5>
        <p>${formatDisplayDate(event.attendedAt)} ? ${event.participantName} (${event.participantLabel})</p>
      </div>
    </div>
  `).join('');
}

function setElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

function formatProgramDateRange(start, end) {
  const startDate = normalizeDateInput(start);
  const endDate = normalizeDateInput(end);
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  }
  if (startDate) {
    return formatDisplayDate(startDate);
  }
  if (endDate) {
    return formatDisplayDate(endDate);
  }
  return '';
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
