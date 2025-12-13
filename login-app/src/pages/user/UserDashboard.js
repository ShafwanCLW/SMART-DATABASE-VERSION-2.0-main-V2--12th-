import { KIRProfile } from '../admin/KIRProfile.js';

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
        <a href="#" class="nav-item" data-section="profile">
          <span class="nav-icon">👤</span>
          My Profile
        </a>
        <a href="#" class="nav-item" data-section="activity">
        <a href="#" class="nav-item" data-section="kir-profile"
          <span class="nav-icon">dY"<</span>
          My KIR Profile
        </a>
          <span class="nav-icon">📋</span>
          My Activity
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
    <div id="dashboard-content" class="content-section active">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">My Activities</h3>
            <span class="stat-icon">📋</span>
          </div>
          <p class="stat-value">24</p>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">Completed Tasks</h3>
            <span class="stat-icon">✅</span>
          </div>
          <p class="stat-value">18</p>
        </div>
        <div class="stat-card">
          <div class="stat-header">
            <h3 class="stat-title">Profile Score</h3>
            <span class="stat-icon">⭐</span>
          </div>
          <p class="stat-value">95%</p>
        </div>
      </div>
      
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

export function setupUserDashboardFeatures(user) {
  setupUserKIRProfileSection(user);
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
