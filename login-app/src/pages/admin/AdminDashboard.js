// Import Firebase service for user management
import { FirebaseAuthService } from '../../services/frontend/FirebaseAuthService.js';
import { createRegistrationFormMarkup } from '../auth/LoginForm.js';
import { normalizeNoKP } from '../../services/database/collections.js';
import { KIRService } from '../../services/backend/KIRService.js';
import { formatICWithDashes } from './KIRProfile/components/shared/icUtils.js';

let currentAddUserContext = null;
let currentEditingUser = null;
let cachedUserList = [];
let userManagementToastTimer = null;

function formatDisplayNoKP(noKp) {
  if (!noKp) return '-';
  const formatted = formatICWithDashes(noKp);
  return formatted || noKp;
}
// Note: Firebase functions are dynamically imported in the code

// Admin dashboard creation functions
export function createAdminSidebar(user) {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="admin-profile">
          <div class="profile-picture">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e2e8f0'/%3E%3Ccircle cx='20' cy='16' r='6' fill='%236366f1'/%3E%3Cpath d='M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12' fill='%236366f1'/%3E%3C/svg%3E" alt="Admin Profile" />
          </div>
          <h2 class="sidebar-title">Admin Panel</h2>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" data-section="dashboard">
          <span class="nav-icon">📊</span>
          Dashboard
        </a>
        <a href="#" class="nav-item" data-section="user-management">
          <span class="nav-icon">👥</span>
          Pengurusan Pengguna
        </a>
        
        <a href="#" class="nav-item" data-section="senarai-kir-new">
          <span class="nav-icon">📋</span>
          Senarai KIR
        </a>
       
        <a href="#" class="nav-item" data-section="program-kehadiran-newest">
          <span class="nav-icon">📅</span>
          Program & Kehadiran
        </a>
        <a href="#" class="nav-item" data-section="financial-tracking-newest">
            <span class="nav-icon">💰</span>
            Penjejakan Kewangan
        </a>
        <a href="#" class="nav-item" data-section="reports">
          <span class="nav-icon">📈</span>
          Laporan
        </a>
        <a href="#" class="nav-item" data-section="settings">
          <span class="nav-icon">⚙️</span>
          Tetapan 
        </a>
        <a href="#" class="nav-item logout-nav-item" id="logoutBtn">
          <span class="nav-icon">🚪</span>
          Log Keluar
        </a>
      </nav>
    </aside>
  `;
}

export function createAdminMainContent() {
  return `
    <style>
    /* Modal Styles */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0, 0, 0, 0.4);
    }
    
    .modal-content {
      background-color: #fefefe;
      margin: 5% auto;
      padding: 0;
      border: 1px solid #888;
      border-radius: 8px;
      width: 80%;
      max-width: 900px;
    }
    
    /* Primary Action Button Styles */
    .action-btn.primary-action {
      background-color: #6366f1;
      color: #fff;
      font-weight: bold;
      font-size: 1.1em;
      padding: 12px 20px;
      margin-right: 15px;
      margin-bottom: 15px;
    }
    
    .action-btn.primary-action:hover {
      background-color: #4f46e5;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    /* Action Button Styles */
    .action-btn {
      margin-right: 15px;
      margin-bottom: 20px;
      padding: 12px 18px;
    }
    
    /* Back Button Styles */
    .back-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 8px 12px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    .back-btn:hover {
      background-color: #e0e0e0;
      transform: translateX(-2px);
    }
    
    .modal-content {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    .modal-header {
      padding: 15px 20px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }
    
    .close-modal {
      color: #aaa;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    
    .close-modal:hover,
    .close-modal:focus {
      color: #333;
      text-decoration: none;
    }
    
    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .add-user-modal .modal-content {
      width: 100%;
      max-width: 560px;
    }
    
    .admin-add-user-status {
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.95rem;
      display: none;
      margin-bottom: 10px;
    }
    
    .admin-add-user-status.success {
      display: block;
      background: #ecfdf3;
      color: #047857;
      border: 1px solid #6ee7b7;
    }
    
    .admin-add-user-status.error {
      display: block;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    
    .admin-add-user-hint {
      font-size: 0.9rem;
      color: #475569;
      background: #f8fafc;
      border-radius: 6px;
      padding: 12px;
      border: 1px dashed #cbd5f5;
    }
    
    .admin-add-user-hint button {
      margin-top: 8px;
    }
    
    .quick-kir-modal .modal-content {
      max-width: 420px;
    }
    
    .user-management-toast {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      display: none;
      font-size: 0.95rem;
      border: 1px solid transparent;
    }
    
    .user-management-toast.info {
      display: block;
      background: #eef2ff;
      color: #4338ca;
      border-color: #c7d2fe;
    }
    
    .user-management-toast.success {
      display: block;
      background: #ecfdf3;
      color: #065f46;
      border-color: #6ee7b7;
    }
    
    .user-management-toast.error {
      display: block;
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    
    .edit-user-modal .modal-content,
    .view-user-modal .modal-content {
      max-width: 520px;
    }
    
    .change-password-form .form-group {
      margin-bottom: 12px;
    }
    
    .change-password-form input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    
    .change-password-form button {
      margin-top: 8px;
    }
    
    .form-status {
      display: none;
      margin-top: 10px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    
    .form-status.success {
      display: block;
      background: #ecfdf3;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }
    
    .form-status.error {
      display: block;
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    
    .admin-add-user-step {
      margin-bottom: 20px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
    }
    
    .admin-add-user-step h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 1.1rem;
      color: #1f2937;
    }
    
    .admin-verified-info {
      padding: 12px;
      background: #eef2ff;
      border-radius: 8px;
      margin-bottom: 15px;
      font-size: 0.95rem;
      color: #4338ca;
    }
    
    .admin-verified-info span {
      font-weight: 600;
    }
    
    /* Transactions Styles */
    .transactions-container {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .transactions-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .transactions-filters select,
    .transactions-filters input {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .transactions-filters button {
      padding: 8px 12px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .transactions-filters button:hover {
      background-color: #e0e0e0;
    }
    
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .transaction-item {
      display: flex;
      padding: 15px;
      border-radius: 8px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      gap: 15px;
      transition: transform 0.2s;
    }
    
    .transaction-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .income-transaction {
      border-left: 4px solid #28a745;
    }
    
    .expense-transaction {
      border-left: 4px solid #dc3545;
    }
    
    .transaction-icon {
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: #f8f9fa;
      border-radius: 50%;
    }
    
    .transaction-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .transaction-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .transaction-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    
    .transaction-date {
      font-size: 14px;
      color: #666;
    }
    
    .transaction-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .transaction-category {
      font-size: 14px;
      color: #666;
      background-color: #f0f0f0;
      padding: 2px 8px;
      border-radius: 12px;
    }
    
    .transaction-amount {
      font-weight: 600;
      font-size: 16px;
    }
    
    .income-transaction .transaction-amount {
      color: #28a745;
    }
    
    .expense-transaction .transaction-amount {
      color: #dc3545;
    }
    
    .loading-text, .error-text, .empty-text {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    
    .error-text {
      color: #dc3545;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      padding-bottom: 10px;
    }
    
    .stats-grid .stat-card {
      min-width: auto;
      padding: 16px;
    }

    .dashboard-hero-layer {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
      gap: 24px;
      margin-bottom: 32px;
      align-items: stretch;
    }

    .hero-primary {
      position: relative;
      border-radius: 28px;
      padding: clamp(20px, 3vw, 36px);
      background: linear-gradient(135deg, #4c1d95, #6d28d9 60%, #a855f7);
      color: #fff;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(76, 29, 149, 0.45);
    }

    .hero-primary::after {
      content: '';
      position: absolute;
      width: 360px;
      height: 360px;
      background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%);
      top: -120px;
      right: -60px;
      z-index: 0;
      pointer-events: none;
    }

    .hero-eyebrow {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      opacity: 0.7;
      margin-bottom: 0.5rem;
      display: inline-block;
    }

    .hero-title {
      font-size: clamp(1.8rem, 3.2vw, 2.75rem);
      margin: 0;
      z-index: 1;
      position: relative;
    }

    .hero-copy {
      margin: 12px 0 28px;
      color: rgba(255, 255, 255, 0.86);
      max-width: 620px;
      line-height: 1.6;
      position: relative;
      z-index: 1;
    }

    .hero-quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      position: relative;
      z-index: 1;
    }

    .hero-stat-card {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 18px;
      box-shadow: none;
      backdrop-filter: blur(6px);
      color: #fff;
      text-align: left;
      transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
      position: relative;
      overflow: hidden;
    }

    .hero-stat-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.18), transparent 55%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .hero-stat-card:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 18px 32px rgba(15, 23, 42, 0.18);
    }

    .hero-stat-card:hover::after {
      opacity: 1;
    }

    .hero-stat-card .stat-value {
      color: #fff;
      font-size: 2rem;
    }

    .hero-stat-card .stat-label {
      color: rgba(255, 255, 255, 0.82);
    }

    .hero-stat-card .stat-helper-text {
      color: rgba(255, 255, 255, 0.75);
    }

    .hero-insight-card {
      background: #fff;
      border-radius: 24px;
      padding: 26px;
      box-shadow: 0 24px 42px rgba(15, 23, 42, 0.12);
      border: 1px solid #ede9fe;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
    }

    .hero-insight-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.2), transparent 55%);
      pointer-events: none;
    }

    .hero-insight-card > * {
      position: relative;
      z-index: 1;
    }

    .hero-insight-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
    }

    .hero-balance {
      font-size: clamp(2rem, 3vw, 2.8rem);
      margin: 0;
      font-weight: 700;
      color: #0f172a;
    }

    .balance-helper {
      margin: 0;
      color: #475569;
      font-size: 0.9rem;
    }

    .insight-chip {
      padding: 6px 12px;
      border-radius: 999px;
      background: #ede9fe;
      color: #5b21b6;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .insight-divider {
      width: 100%;
      height: 1px;
      background: #e2e8f0;
      margin: 8px 0;
    }

    .next-program-snippet .snippet-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 6px;
    }

    .snippet-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .snippet-meta {
      color: #475569;
      font-size: 0.95rem;
    }

    .layered-stat-grid {
      display: block;
      margin-bottom: 30px;
    }

    .layer-card {
      background: #fff;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
      border: 1px solid #ede9fe;
    }

    .layer-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 18px;
    }

    .layer-card-header h4 {
      margin: 4px 0 0;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .layer-card-body {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .subtle-stat-card {
      background: #f8f7ff;
      border: 1px dashed #ddd6fe;
      border-radius: 16px;
      box-shadow: none;
      text-align: left;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }

    .subtle-stat-card:hover {
      transform: translateY(-4px);
      border-color: #c4b5fd;
      background: #f1edff;
      box-shadow: 0 18px 28px rgba(15, 23, 42, 0.12);
    }

    .layer-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 999px;
      background: #ede9fe;
      color: #5b21b6;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .layer-card.compact,
    .layer-chip-row,
    .layer-copy {
      display: none;
    }
    
    .dashboard-analytics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 24px;
      margin: 30px 0;
    }
    
    .chart-card {
      background: #fff;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08);
    }
    
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .chart-subtitle {
      font-size: 13px;
      color: #94a3b8;
    }
    
    .chart-body {
      position: relative;
      min-height: 240px;
    }
    
    .chart-body canvas {
      width: 100%;
      height: 240px;
    }
    
    .attendance-leaders {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    
    .leaders-column h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    
    .leader-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .leader-item {
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e2e8f0;
    }
    
    .leader-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .leader-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 14px;
    }
    
    .leader-meta {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .leader-score {
      font-weight: 700;
      font-size: 16px;
    }
    
    .leader-score.positive {
      color: #16a34a;
    }
    
    .leader-score.negative {
      color: #dc2626;
    }
    
    .chart-empty-state {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 14px;
    }
    
    .system-report-dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .system-report-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }
    
    .system-report-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    
    .system-report-card {
      background: #fff;
      border-radius: 14px;
      padding: 18px;
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.05);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .system-report-card .label {
      font-size: 13px;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    
    .system-report-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .system-report-card .helper {
      font-size: 13px;
      color: #64748b;
    }
    
    .report-sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      grid-auto-flow: row dense;
      align-items: stretch;
    }
    
    .report-section-card {
      background: #fff;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 15px 35px rgba(15, 23, 42, 0.04);
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 280px;
    }

    .report-section-card.span-2 {
      grid-column: span 2;
    }

    .report-section-card.span-full {
      grid-column: 1 / -1;
    }

    @media (max-width: 1400px) {
      .report-section-card.span-2 {
        grid-column: span 1;
      }
    }
    
    .report-section-card header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    
    .report-section-card header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
    }
    
    .report-section-card table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .report-section-card table th,
    .report-section-card table td {
      padding: 10px 8px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      font-size: 13px;
    }
    
    .report-section-card table th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }
    
    .report-section-card table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .report-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .report-list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .report-list-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .report-list-item strong {
      font-size: 14px;
      color: #0f172a;
    }
    
    .report-list-item span {
      font-size: 13px;
      color: #475569;
    }
    
    .report-financial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    
    .report-financial-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .report-financial-card .label {
      font-size: 12px;
      text-transform: uppercase;
      color: #94a3b8;
    }
    
    .report-financial-card .value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .report-financial-card .delta {
      font-size: 13px;
      color: #10b981;
    }
    
    .report-financial-card.expense .delta {
      color: #ef4444;
    }
    
    .report-chart {
      position: relative;
      min-height: 240px;
    }
    
    .report-empty {
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
      padding: 30px 10px;
    }
    
    @media print {
      body {
        background: #fff;
      }
      .content-section {
        display: none !important;
      }
      #reports-content {
        display: block !important;
      }
      .print-hide {
        display: none !important;
      }
      #reports-content {
        box-shadow: none !important;
        border: none !important;
        margin: 0;
        padding: 0 12px;
      }
    }
    
      :root {
        --warna-utama: #6d28d9;
        --warna-utama-gelap: #5b21b6;
        --warna-utama-muda: #ede9fe;
        --warna-teks-utama: #111322;
        --warna-teks-sekunder: #4c4f6b;
        --warna-latar: #f8f7ff;
        --warna-sempadan: #e4dffd;
        --radius-butang: 10px;
        --bayang-butang: 0 8px 20px rgba(109, 40, 217, 0.25);
      }

      body {
        background: var(--warna-latar);
        color: var(--warna-teks-utama);
      }

      button,
      .btn {
        font-family: inherit;
      }

      .btn,
      button.btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: var(--radius-butang);
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        letter-spacing: 0.01em;
        background: var(--warna-utama);
        color: #fff;
        box-shadow: var(--bayang-butang);
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(109, 40, 217, 0.35);
      }

      .btn:disabled,
      .btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }

      .btn.btn-primary,
      .btn-primary {
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        color: #fff;
      }

      .btn.btn-secondary,
      .btn-secondary {
        background: #fff;
        color: var(--warna-utama);
        border: 1px solid var(--warna-utama);
        box-shadow: none;
      }

      .btn.btn-secondary:hover,
      .btn-secondary:hover {
        background: var(--warna-utama-muda);
        color: var(--warna-utama);
      }

      .btn-outline,
      .btn-outline-primary {
        background: transparent;
        border: 1px solid var(--warna-sempadan);
        color: var(--warna-teks-sekunder);
        box-shadow: none;
      }

      .btn-outline:hover,
      .btn-outline-primary:hover {
        background: var(--warna-utama-muda);
        color: var(--warna-utama);
        border-color: var(--warna-utama);
      }

      .btn-success {
        background: linear-gradient(135deg, #16a34a, #15803d);
        box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
      }

      .btn-warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
      }

      .btn-danger {
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
      }

      .btn-info {
        background: linear-gradient(135deg, #0ea5e9, #0369a1);
        box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
      }

      .btn-sm,
      button.btn-sm {
        padding: 8px 14px;
        font-size: 13px;
        border-radius: 8px;
        box-shadow: none;
      }

      .btn-icon {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--warna-utama-muda);
        color: var(--warna-utama);
        border: none;
        box-shadow: none;
      }

      .btn-icon:hover {
        background: var(--warna-utama);
        color: #fff;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 20px;
        border-radius: 12px;
        border: 1px solid var(--warna-sempadan);
        background: #fff;
        color: var(--warna-teks-utama);
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      }

      .action-btn:hover {
        border-color: var(--warna-utama);
        color: var(--warna-utama);
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(109, 40, 217, 0.12);
      }

      .content-section {
        width: 100%;
        max-width: 1920px;
        margin: 0 auto 12px;
        padding: 26px clamp(10px, 2.2vw, 28px);
        box-sizing: border-box;
      }

      .sub-content-section {
        padding: 24px clamp(12px, 2.4vw, 28px);
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
        border: 1px solid var(--warna-sempadan);
        margin-bottom: 16px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }

      .section-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        color: var(--warna-teks-utama);
      }

      .section-description {
        margin: 4px 0 0;
        color: var(--warna-teks-sekunder);
        font-size: 15px;
      }

      .stats-grid,
      .program-kehadiran-grid,
      .reports-grid,
      .settings-grid {
        gap: 12px;
        align-items: stretch;
        margin-bottom: 16px;
      }

      .table-container {
        margin-top: 10px;
      }

      .filters-container,
      .action-bar,
      .reports-content,
      .reports-dashboard,
      .reports-grid {
        gap: 12px;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .setting-card {
        background: #fff;
        border-radius: 18px;
        border: 1px solid var(--warna-sempadan);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.05);
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .setting-card.full-width {
        grid-column: 1 / -1;
      }

      .setting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .setting-header h4 {
        margin: 0;
        font-size: 18px;
        color: var(--warna-teks-utama);
      }

      .setting-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--warna-utama-muda);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--warna-utama);
        font-size: 18px;
      }

      .setting-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .setting-option {
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid var(--warna-sempadan);
        background: #fdfbff;
        font-size: 14px;
        color: var(--warna-teks-sekunder);
      }

      .setting-option input {
        width: 18px;
        height: 18px;
        accent-color: var(--warna-utama);
      }

      .change-password-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px 20px;
      }

      .change-password-form .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .change-password-form label {
        font-weight: 600;
        color: var(--warna-teks-utama);
      }

      .change-password-form input {
        border: 1px solid var(--warna-sempadan);
        border-radius: 10px;
        padding: 12px;
        background: #f8f7ff;
        font-size: 14px;
      }

    .change-password-form button {
      margin-top: 4px;
      grid-column: 1 / -1;
      justify-self: flex-start;
    }

    @media (max-width: 1024px) {
      .dashboard-hero-layer,
      .hero-primary,
      .hero-insight-card,
      .layer-card {
        border-radius: 20px;
      }
    }
    </style>
    
    <div id="dashboard-content" class="content-section active">
      <section class="dashboard-hero-layer">
        <div class="hero-primary">
          
          <h2 class="hero-title">Paparan Keseluruhan</h2>
          <p class="hero-copy">Pantau pendaftaran, program, dan aliran tunai dalam lapisan supaya data tidak terasa sesak.</p>
          <div class="hero-quick-stats">
            <div class="stat-card hero-stat-card">
              <div class="stat-label">Jumlah Pengguna</div>
              <div class="stat-value" id="dashboard-total-users">-</div>
              <div class="stat-helper-text">Akaun berdaftar</div>
            </div>
            <div class="stat-card hero-stat-card">
              <div class="stat-label">Jumlah Program</div>
              <div class="stat-value" id="dashboard-total-programs">-</div>
              <div class="stat-helper-text">Semua program yang dijadualkan</div>
            </div>
            <div class="stat-card hero-stat-card">
              <div class="stat-label">Rekod Isi Rumah</div>
              <div class="stat-value" id="dashboard-total-household-records">-</div>
              <div class="stat-helper-text">KIR + PKIR + AIR</div>
            </div>
          </div>
        </div>
        <div class="hero-insight-card">
          <div class="hero-insight-header">
            <span>Baki Akaun</span>
            <span class="insight-chip">Pendapatan vs Perbelanjaan</span>
          </div>
          <p class="hero-balance" id="dashboard-current-balance">RM 0.00</p>
          <p class="balance-helper">Dikemas kini secara automatik dari penjejak kewangan</p>
          <div class="insight-divider"></div>
          <div class="next-program-snippet">
            <div class="snippet-label">Program Seterusnya</div>
            <div class="snippet-title" id="dashboard-upcoming-program-name">Memuatkan...</div>
            <div class="snippet-meta" id="dashboard-upcoming-program-date">Sila tunggu</div>
          </div>
        </div>
      </section>

      <section class="layered-stat-grid">
        <div class="layer-card households-card">
          <div class="layer-card-header">
            <div>
              <span class="hero-eyebrow">Isi Rumah</span>
              <h4>Gambaran Keseluruhan Keluarga</h4>
            </div>
            <span class="layer-chip">Data Terkini</span>
          </div>
          <div class="layer-card-body">
            <div class="stat-card subtle-stat-card">
              <div class="stat-label">Jumlah KIR</div>
              <div class="stat-value" id="dashboard-total-kir">-</div>
              <div class="stat-helper-text">Ketua Isi Rumah</div>
            </div>
            <div class="stat-card subtle-stat-card">
              <div class="stat-label">Jumlah PKIR</div>
              <div class="stat-value" id="dashboard-total-pkir">-</div>
              <div class="stat-helper-text">Pasangan Ketua Isi Rumah</div>
            </div>
            <div class="stat-card subtle-stat-card">
              <div class="stat-label">Jumlah AIR</div>
              <div class="stat-value" id="dashboard-total-air">-</div>
              <div class="stat-helper-text">Ahli Isi Rumah</div>
            </div>
          </div>
        </div>
      </section>

      <div class="dashboard-analytics">
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <div>Graf Kewangan</div>
              <div class="chart-subtitle">Pendapatan vs Perbelanjaan (6 bulan terakhir)</div>
            </div>
            <span class="chart-period">Bulanan</span>
          </div>
          <div class="chart-body">
            <canvas id="financial-trend-chart"></canvas>
            <div class="chart-empty-state" id="financial-trend-empty">Loading financial data...</div>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <div>Gambaran Status Program</div>
            </div>
            <span class="chart-period">Data Terkini</span>
          </div>
          <div class="chart-body">
            <canvas id="program-status-chart"></canvas>
            <div class="chart-empty-state" id="program-status-empty">Loading program data...</div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="user-management-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Pengurusan Pengguna</h3>
        <button class="btn btn-primary" id="addUserBtn">
          <span class="btn-icon">➕</span>
          Tambah Pengguna
        </button>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <!-- Users will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
    
    <div id="cipta-kir-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Cipta KIR Baru</h3>
        <p class="section-description">Create a new KIR record with comprehensive information</p>
      </div>
      
      <div class="wizard-container">
        <div class="wizard-progress">
          <div class="progress-step active" data-step="1" data-slug="maklumat-asas">
            <div class="step-number">1</div>
            <div class="step-label">Maklumat Asas</div>
          </div>
          <div class="progress-step" data-step="2" data-slug="maklumat-keluarga">
            <div class="step-number">2</div>
            <div class="step-label">Maklumat Keluarga</div>
          </div>
          <div class="progress-step" data-step="3" data-slug="kafa">
            <div class="step-number">3</div>
            <div class="step-label">Pendidikan Agama (KAFA)</div>
          </div>
          <div class="progress-step" data-step="4" data-slug="pendidikan">
            <div class="step-number">4</div>
            <div class="step-label">Pendidikan</div>
          </div>
          <div class="progress-step" data-step="5" data-slug="pekerjaan">
            <div class="step-number">5</div>
            <div class="step-label">Maklumat Pekerjaan</div>
          </div>
          <div class="progress-step" data-step="6" data-slug="kesihatan">
            <div class="step-number">6</div>
            <div class="step-label">Maklumat Kesihatan</div>
          </div>
          <div class="progress-step" data-step="7" data-slug="ekonomi">
            <div class="step-number">7</div>
            <div class="step-label">Ekonomi</div>
          </div>
          <div class="progress-step" data-step="8" data-slug="semak">
            <div class="step-number">8</div>
            <div class="step-label">Semakan & Pengesahan</div>
          </div>
        </div>
        
        <form id="ciptaKIRForm" class="wizard-form">
          <!-- Step 1: Maklumat Asas -->
          <div class="wizard-step active" data-step="1">
            <div class="info-card">
              <div class="section-header">
                <div class="section-icon">
                  <i class="fas fa-user"></i>
                </div>
                <span>Maklumat Peribadi</span>
              </div>
              
              <div class="form-grid">
                <div class="form-group full-width">
                  <label for="gambar_profil">Gambar Profil (Opsional)</label>
                  <input type="file" id="gambar_profil" name="gambar_profil" accept="image/*">
                </div>
                
                <div class="form-group">
                  <label for="nama_penuh">Nama Penuh *</label>
                  <input type="text" id="nama_penuh" name="nama_penuh" required>
                </div>
                
                <div class="form-group">
                  <label for="no_kp">No. KP *</label>
                  <input type="text" id="no_kp" name="no_kp" required pattern="[0-9]{12}" placeholder="123456789012" maxlength="12">
                </div>
                
                <div class="form-group">
                  <label for="tarikh_lahir">Tarikh Lahir *</label>
                  <input type="date" id="tarikh_lahir" name="tarikh_lahir" required>
                </div>
                
                <div class="form-group">
                  <label for="umur">Umur</label>
                  <input type="number" id="umur" name="umur" readonly>
                </div>
                
                <div class="form-group">
                  <label for="jantina">Jantina *</label>
                  <select id="jantina" name="jantina" required>
                    <option value="">Pilih Jantina</option>
                    <option value="Lelaki">Lelaki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="bangsa">Bangsa *</label>
                  <select id="bangsa" name="bangsa" required>
                    <option value="">Pilih Bangsa</option>
                    <option value="Melayu">Melayu</option>
                    <option value="Cina">Cina</option>
                    <option value="India">India</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="agama">Agama *</label>
                  <select id="agama" name="agama" required>
                    <option value="">Pilih Agama</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristian">Kristian</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                

                
                <div class="form-group">
                  <label for="telefon_utama">Telefon Utama *</label>
                  <input type="tel" id="telefon_utama" name="telefon_utama" required pattern="[0-9+\-\s]+">
                </div>
                
                <div class="form-group">
                  <label for="telefon_kecemasan">Telefon Kecemasan</label>
                  <input type="tel" id="telefon_kecemasan" name="telefon_kecemasan" pattern="[0-9+\-\s]+">
                </div>
              </div>
              
              <div class="form-group">
                <label for="alamat">Alamat *</label>
                <textarea id="alamat" name="alamat" rows="3" required></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="poskod">Poskod *</label>
                  <input type="text" id="poskod" name="poskod" required>
                </div>
                
                <div class="form-group">
                  <label for="bandar">Bandar *</label>
                  <input type="text" id="bandar" name="bandar" required>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="negeri">Negeri *</label>
                  <select id="negeri" name="negeri" required>
                    <option value="">Pilih Negeri</option>
                    <option value="Johor">Johor</option>
                    <option value="Kedah">Kedah</option>
                    <option value="Kelantan">Kelantan</option>
                    <option value="Melaka">Melaka</option>
                    <option value="Negeri Sembilan">Negeri Sembilan</option>
                    <option value="Pahang">Pahang</option>
                    <option value="Perak">Perak</option>
                    <option value="Perlis">Perlis</option>
                    <option value="Pulau Pinang">Pulau Pinang</option>
                    <option value="Sabah">Sabah</option>
                    <option value="Sarawak">Sarawak</option>
                    <option value="Selangor">Selangor</option>
                    <option value="Terengganu">Terengganu</option>
                    <option value="Wilayah Persekutuan Kuala Lumpur">Wilayah Persekutuan Kuala Lumpur</option>
                    <option value="Wilayah Persekutuan Labuan">Wilayah Persekutuan Labuan</option>
                    <option value="Wilayah Persekutuan Putrajaya">Wilayah Persekutuan Putrajaya</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="tempat_lahir">Tempat Lahir</label>
                  <input type="text" id="tempat_lahir" name="tempat_lahir">
                </div>
              </div>
            </div>
            
            <div class="form-section">
              <h3>Maklumat Keluarga</h3>
              <div class="form-group">
                <label for="bilangan_adik_beradik">Bilangan Adik Beradik</label>
                <input type="number" id="bilangan_adik_beradik" name="bilangan_adik_beradik" min="0">
              </div>
              
              <h5>Senarai Adik Beradik (Opsional)</h5>
              <div id="adik-beradik-container">
                <div class="adik-beradik-item form-grid">
                  <div class="form-group">
                    <label>Nama</label>
                    <input type="text" name="senarai_adik_beradik[0][nama]">
                  </div>
                  <div class="form-group">
                    <label>Umur</label>
                    <input type="number" name="senarai_adik_beradik[0][umur]">
                  </div>
                  <div class="form-group">
                    <label>Status</label>
                    <select name="senarai_adik_beradik[0][status]">
                      <option value="">Pilih Status</option>
                      <option value="Hidup">Hidup</option>
                      <option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="button" id="add-adik-beradik" class="btn-secondary">Tambah Adik Beradik</button>
            </div>
            
            <div class="form-section">
              <h3>Maklumat Ibu Bapa</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="ibu_nama">Nama Ibu</label>
                <input type="text" id="ibu_nama" name="ibu_nama">
              </div>
              
              <div class="form-group">
                <label for="ibu_negeri">Negeri Ibu</label>
                <select id="ibu_negeri" name="ibu_negeri">
                  <option value="">Pilih Negeri</option>
                  <option value="Johor">Johor</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Melaka">Melaka</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Perak">Perak</option>
                  <option value="Perlis">Perlis</option>
                  <option value="Pulau Pinang">Pulau Pinang</option>
                  <option value="Sabah">Sabah</option>
                  <option value="Sarawak">Sarawak</option>
                  <option value="Selangor">Selangor</option>
                  <option value="Terengganu">Terengganu</option>
                  <option value="WP Kuala Lumpur">WP Kuala Lumpur</option>
                  <option value="WP Labuan">WP Labuan</option>
                  <option value="WP Putrajaya">WP Putrajaya</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="ayah_nama">Nama Ayah</label>
                <input type="text" id="ayah_nama" name="ayah_nama">
              </div>
              
              <div class="form-group">
                <label for="ayah_negeri">Negeri Ayah</label>
                <select id="ayah_negeri" name="ayah_negeri">
                  <option value="">Pilih Negeri</option>
                  <option value="Johor">Johor</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Melaka">Melaka</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Perak">Perak</option>
                  <option value="Perlis">Perlis</option>
                  <option value="Pulau Pinang">Pulau Pinang</option>
                  <option value="Sabah">Sabah</option>
                  <option value="Sarawak">Sarawak</option>
                  <option value="Selangor">Selangor</option>
                  <option value="Terengganu">Terengganu</option>
                  <option value="WP Kuala Lumpur">WP Kuala Lumpur</option>
                  <option value="WP Labuan">WP Labuan</option>
                  <option value="WP Putrajaya">WP Putrajaya</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="no_kwsp">No. KWSP</label>
                <input type="text" id="no_kwsp" name="no_kwsp">
              </div>
              
              <div class="form-group">
                <label for="no_perkeso">No. PERKESO</label>
                <input type="text" id="no_perkeso" name="no_perkeso">
        </div>
      </div>
    </div>
  </div>
          
          <!-- Step 2: Maklumat Keluarga -->
          <div class="wizard-step" data-step="2">
            <h4 class="step-title">Maklumat Keluarga</h4>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="status_perkahwinan">Status Perkahwinan *</label>
                <select id="status_perkahwinan" name="status_perkahwinan" required>
                  <option value="">Pilih Status</option>
                  <option value="Bujang">Bujang</option>
                  <option value="Berkahwin">Berkahwin</option>
                  <option value="Bercerai">Bercerai</option>
                  <option value="Balu/Duda">Balu/Duda</option>
                </select>
              </div>
            </div>
            
            <!-- A. Ringkasan Pasangan (PKIR) -->
            <div id="ringkasan-pasangan-section" style="display: none;">
              <div class="form-section">
                <h5>A. Ringkasan Pasangan (PKIR)</h5>
                <p class="form-help">Wajib jika Berkahwin. Maklumat ringkas untuk cipta/validasi hubungan. Profil penuh pasangan akan diurus di Profil KIR → PKIR.</p>
                
                <div class="form-grid">
                  <div class="form-group">
                    <label for="nama_pasangan">Nama Pasangan *</label>
                    <input type="text" id="nama_pasangan" name="nama_pasangan">
                  </div>
                  
                  <div class="form-group">
                    <label for="pasangan_no_kp">No. KP Pasangan *</label>
                    <input type="text" id="pasangan_no_kp" name="pasangan_no_kp" pattern="[0-9]{12}" maxlength="12" placeholder="123456789012">
                  </div>
                  
                  <div class="form-group">
                    <label for="pasangan_status">Status Pasangan *</label>
                    <select id="pasangan_status" name="pasangan_status">
                      <option value="">Pilih Status</option>
                      <option value="Hidup">Hidup</option>
                      <option value="Meninggal">Meninggal</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="tarikh_nikah">Tarikh Nikah *</label>
                    <input type="date" id="tarikh_nikah" name="tarikh_nikah">
                  </div>
                  
                  <div class="form-group">
                    <label for="tarikh_cerai">Tarikh Cerai</label>
                    <input type="date" id="tarikh_cerai" name="tarikh_cerai">
                    <small class="form-help">Jika berkenaan; mesti ≥ Tarikh Nikah</small>
                  </div>
                </div>
                
                <div class="form-group full-width">
                  <label for="pasangan_alamat">Alamat Pasangan</label>
                  <textarea id="pasangan_alamat" name="pasangan_alamat" rows="3" placeholder="Jika berasingan dari alamat KIR"></textarea>
                  <small class="form-help">Opsional - isi jika alamat pasangan berbeza dari alamat KIR</small>
                </div>
              </div>
            </div>
            
            <!-- B. Ahli Isi Rumah (Ringkas) -->
            <div id="ahli-isi-rumah-section" style="display: block;">
              <div class="form-section">
                <div class="section-header-with-action">
                  <h5>B. Ahli Isi Rumah (Ringkas)</h5>
                  <button type="button" id="toggle-air-section" class="btn btn-secondary btn-sm">
                    <i class="fas fa-plus"></i> Tambah AIR (Ringkas)
                  </button>
                </div>
                <p class="form-help">Opsional. Maklumat ringkas ahli isi rumah. Butiran penuh boleh diurus kemudian di Profil KIR.</p>
                
                <div id="air-container" style="display: block;">
                  <style>
                    .air-grid-header {
                      display: grid;
                      grid-template-columns: 1.5fr 2fr 1fr 1.2fr 1.2fr 0.8fr 1.5fr 0.8fr;
                      gap: 10px;
                      padding: 10px;
                      background-color: #f8f9fa;
                      border: 1px solid #dee2e6;
                      font-weight: bold;
                      margin-bottom: 5px;
                    }
                    .air-grid-row {
                      display: grid;
                      grid-template-columns: 1.5fr 2fr 1fr 1.2fr 1.2fr 0.8fr 1.5fr 0.8fr;
                      gap: 10px;
                      padding: 10px;
                      border: 1px solid #dee2e6;
                      margin-bottom: 5px;
                      background-color: white;
                    }
                    .air-cell {
                      display: flex;
                      flex-direction: column;
                      gap: 2px;
                    }
                    .air-cell input, .air-cell select {
                      width: 100%;
                      padding: 5px;
                      border: 1px solid #ccc;
                      border-radius: 3px;
                      font-size: 12px;
                    }
                    .air-remove-btn {
                      background-color: #dc3545;
                      color: white;
                      border: none;
                      padding: 5px 8px;
                      border-radius: 3px;
                      cursor: pointer;
                      font-size: 12px;
                    }
                    .air-remove-btn:hover {
                      background-color: #c82333;
                    }
                  </style>
                  <div class="air-header">
                    <div class="air-grid-header">
                      <span>Nama *</span>
                      <span>No. KP / Tarikh Lahir *</span>
                      <span>Jantina *</span>
                      <span>Hubungan *</span>
                      <span>Status *</span>
                      <span>OKU</span>
                      <span>Pendapatan/Sekolah</span>
                      <span>Tindakan</span>
                    </div>
                  </div>
                  
                  <div id="air-rows">
                    <!-- Dynamic AIR rows will be added here -->
                  </div>
                  
                  <button type="button" id="add-air-row" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-plus"></i> Tambah Ahli
                  </button>
                </div>
              </div>
            </div>
            
            <div class="info-note">
              <p><strong>Nota:</strong> Maklumat ini akan disimpan sementara sehingga KIR dicipta. Selepas itu, maklumat akan dipindahkan ke jadual yang sesuai.</p>
            </div>
          </div>
          
          <!-- Step 3: Pendidikan Agama (KAFA) -->
          <div class="wizard-step" data-step="3">
            <h4 class="step-title">Pendidikan Agama (KAFA)</h4>
            
            <div class="form-section">
              <div class="form-group">
                <label for="sumber_pengetahuan">Sumber Pengetahuan Agama</label>
                <textarea id="sumber_pengetahuan" name="sumber_pengetahuan" rows="3" placeholder="Nyatakan sumber pengetahuan agama seperti sekolah agama, kelas mengaji, dll."></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="tahap_iman">Tahap Iman *</label>
                  <select id="tahap_iman" name="tahap_iman" required>
                    <option value="">Pilih Tahap</option>
                    <option value="1">1 - Sangat Lemah</option>
                    <option value="2">2 - Lemah</option>
                    <option value="3">3 - Sederhana</option>
                    <option value="4">4 - Baik</option>
                    <option value="5">5 - Sangat Baik</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="tahap_islam">Tahap Islam *</label>
                  <select id="tahap_islam" name="tahap_islam" required>
                    <option value="">Pilih Tahap</option>
                    <option value="1">1 - Sangat Lemah</option>
                    <option value="2">2 - Lemah</option>
                    <option value="3">3 - Sederhana</option>
                    <option value="4">4 - Baik</option>
                    <option value="5">5 - Sangat Baik</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="tahap_fatihah">Tahap Al-Fatihah</label>
                  <select id="tahap_fatihah" name="tahap_fatihah">
                    <option value="">Pilih Tahap</option>
                    <option value="1">1 - Sangat Lemah</option>
                    <option value="2">2 - Lemah</option>
                    <option value="3">3 - Sederhana</option>
                    <option value="4">4 - Baik</option>
                    <option value="5">5 - Sangat Baik</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="tahap_taharah_wuduk_solat">Tahap Taharah/Wuduk/Solat</label>
                  <select id="tahap_taharah_wuduk_solat" name="tahap_taharah_wuduk_solat">
                    <option value="">Pilih Tahap</option>
                    <option value="1">1 - Sangat Lemah</option>
                    <option value="2">2 - Lemah</option>
                    <option value="3">3 - Sederhana</option>
                    <option value="4">4 - Baik</option>
                    <option value="5">5 - Sangat Baik</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="tahap_puasa_fidyah_zakat">Tahap Puasa/Fidyah/Zakat</label>
                  <select id="tahap_puasa_fidyah_zakat" name="tahap_puasa_fidyah_zakat">
                    <option value="">Pilih Tahap</option>
                    <option value="1">1 - Sangat Lemah</option>
                    <option value="2">2 - Lemah</option>
                    <option value="3">3 - Sederhana</option>
                    <option value="4">4 - Baik</option>
                    <option value="5">5 - Sangat Baik</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="kafa_skor">Skor KAFA (Auto-calculated)</label>
                  <input type="number" id="kafa_skor" name="kafa_skor" readonly min="0" max="5" step="0.01" placeholder="Akan dikira secara automatik">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Step 4: Pendidikan -->
          <div class="wizard-step" data-step="4">
            <h4 class="step-title">Pendidikan</h4>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="tahap_pendidikan">Tahap Pendidikan</label>
                <select id="tahap_pendidikan" name="tahap_pendidikan">
                  <option value="">Pilih Tahap</option>
                  <option value="Tidak Bersekolah">Tidak Bersekolah</option>
                  <option value="Sekolah Rendah">Sekolah Rendah</option>
                  <option value="Sekolah Menengah">Sekolah Menengah</option>
                  <option value="SPM/SPMV">SPM/SPMV</option>
                  <option value="STPM/Diploma">STPM/Diploma</option>
                  <option value="Ijazah Sarjana Muda">Ijazah Sarjana Muda</option>
                  <option value="Ijazah Sarjana">Ijazah Sarjana</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="nama_sekolah">Nama Sekolah/Institusi</label>
                <input type="text" id="nama_sekolah" name="nama_sekolah">
              </div>
              
              <div class="form-group">
                <label for="tahun_tamat">Tahun Tamat</label>
                <input type="number" id="tahun_tamat" name="tahun_tamat" min="1950" max="2030" placeholder="YYYY">
              </div>
              
              <div class="form-group">
                <label for="bidang_pengajian">Bidang Pengajian</label>
                <input type="text" id="bidang_pengajian" name="bidang_pengajian">
              </div>
            </div>
          </div>
          
          <!-- Step 5: Maklumat Pekerjaan -->
          <div class="wizard-step" data-step="5">
            <h4 class="step-title">Maklumat Pekerjaan</h4>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="status_pekerjaan">Status Pekerjaan</label>
                <select id="status_pekerjaan" name="status_pekerjaan">
                  <option value="">Pilih Status</option>
                  <option value="Bekerja">Bekerja</option>
                  <option value="Tidak Bekerja">Tidak Bekerja</option>
                  <option value="Bersara">Bersara</option>
                  <option value="OKU">OKU</option>
                </select>
              </div>
              
              <div class="form-group" id="jenis_pekerjaan_group">
                <label for="jenis_pekerjaan">Jenis Pekerjaan</label>
                <input type="text" id="jenis_pekerjaan" name="jenis_pekerjaan">
              </div>
              
              <div class="form-group" id="nama_majikan_group">
                <label for="nama_majikan">Nama Majikan</label>
                <input type="text" id="nama_majikan" name="nama_majikan">
              </div>
              
              <div class="form-group" id="gaji_bulanan_group">
                <label for="gaji_bulanan">Gaji Bulanan (RM)</label>
                <input type="number" id="gaji_bulanan" name="gaji_bulanan" step="0.01" min="0">
              </div>
              
              <div class="form-group" id="alamat_kerja_group">
                <label for="alamat_kerja">Alamat Kerja</label>
                <textarea id="alamat_kerja" name="alamat_kerja" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="pengalaman_kerja">Pengalaman Kerja (Tahun)</label>
                <input type="number" id="pengalaman_kerja" name="pengalaman_kerja" min="0">
              </div>
              
              <div class="form-group full-width">
                <label for="kemahiran">Kemahiran</label>
                <textarea id="kemahiran" name="kemahiran" rows="3" placeholder="Senaraikan kemahiran yang dimiliki"></textarea>
              </div>
            </div>
          </div>
          
          <!-- Step 6: Maklumat Kesihatan -->
          <div class="wizard-step" data-step="6">
            <h4 class="step-title">Maklumat Kesihatan</h4>
            
            <div class="form-grid">
              <div class="form-group">
                <label for="ringkasan_kesihatan">Ringkasan Kesihatan</label>
                <select id="ringkasan_kesihatan" name="ringkasan_kesihatan">
                  <option value="">Pilih Status Kesihatan</option>
                  <option value="Sihat">Sihat</option>
                  <option value="Kurang Sihat">Kurang Sihat</option>
                  <option value="Sakit Kronik">Sakit Kronik</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="kumpulan_darah">Kumpulan Darah</label>
                <select id="kumpulan_darah" name="kumpulan_darah">
                  <option value="">Pilih Kumpulan Darah</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label>Penyakit Kronik</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Diabetes">
                  <span>Diabetes</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Hipertensi">
                  <span>Hipertensi</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Penyakit Jantung">
                  <span>Penyakit Jantung</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Asma">
                  <span>Asma</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Penyakit Buah Pinggang">
                  <span>Penyakit Buah Pinggang</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="penyakit_kronik" value="Lain-lain">
                  <span>Lain-lain</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label for="catatan_kesihatan">Catatan Kesihatan</label>
              <textarea id="catatan_kesihatan" name="catatan_kesihatan" rows="4" placeholder="Catatan tambahan mengenai kesihatan..."></textarea>
            </div>
          </div>
          
          <!-- Step 7: Ekonomi -->
          <div class="wizard-step" data-step="7">
            <h4 class="step-title">Ekonomi (Pendapatan/Perbelanjaan/Bantuan)</h4>
            
            <h5>A) Pendapatan Tetap</h5>
            <div id="pendapatan-tetap-container">
              <div class="pendapatan-tetap-item form-grid">
                <div class="form-group">
                  <label>Sumber</label>
                  <input type="text" name="pendapatan_tetap[0][sumber]">
                </div>
                <div class="form-group">
                  <label>Jumlah (RM)</label>
                  <input type="number" name="pendapatan_tetap[0][jumlah]" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label>Catatan</label>
                  <input type="text" name="pendapatan_tetap[0][catatan]">
                </div>
              </div>
            </div>
            <button type="button" id="add-pendapatan-tetap" class="btn-secondary">Tambah Pendapatan Tetap</button>
            
            <h5>B) Pendapatan Tidak Tetap</h5>
            <div id="pendapatan-tidak-tetap-container">
              <div class="pendapatan-tidak-tetap-item form-grid">
                <div class="form-group">
                  <label>Sumber</label>
                  <input type="text" name="pendapatan_tidak_tetap[0][sumber]">
                </div>
                <div class="form-group">
                  <label>Jumlah (RM)</label>
                  <input type="number" name="pendapatan_tidak_tetap[0][jumlah]" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label>Catatan</label>
                  <input type="text" name="pendapatan_tidak_tetap[0][catatan]">
                </div>
              </div>
            </div>
            <button type="button" id="add-pendapatan-tidak-tetap" class="btn-secondary">Tambah Pendapatan Tidak Tetap</button>
            
            <div class="total-display">
              <strong>Jumlah Pendapatan: RM <span id="jumlah-pendapatan">0.00</span></strong>
            </div>
            
            <h5>C) Perbelanjaan</h5>
            <div id="perbelanjaan-container">
              <div class="perbelanjaan-item form-grid">
                <div class="form-group">
                  <label>Kategori</label>
                  <select name="perbelanjaan[0][kategori]">
                    <option value="">Pilih Kategori</option>
                    <option value="Utiliti-Air">Utiliti-Air</option>
                    <option value="Utiliti-Elektrik">Utiliti-Elektrik</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Ansuran">Ansuran</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Sekolah-Anak">Sekolah-Anak</option>
                    <option value="Rawatan">Rawatan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Jumlah (RM)</label>
                  <input type="number" name="perbelanjaan[0][jumlah]" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label>Catatan</label>
                  <input type="text" name="perbelanjaan[0][catatan]">
                </div>
              </div>
            </div>
            <button type="button" id="add-perbelanjaan" class="btn-secondary">Tambah Perbelanjaan</button>
            
            <div class="total-display">
              <strong>Jumlah Perbelanjaan: RM <span id="jumlah-perbelanjaan">0.00</span></strong>
            </div>
            
            <h5>D) Bantuan Bulanan</h5>
            <div id="bantuan-bulanan-container">
              <div class="bantuan-bulanan-item form-grid">
                <div class="form-group">
                  <label>Tarikh Mula</label>
                  <input type="date" name="bantuan_bulanan[0][tarikh_mula]">
                </div>
                <div class="form-group">
                  <label>Agensi</label>
                  <input type="text" name="bantuan_bulanan[0][agensi]">
                </div>
                <div class="form-group">
                  <label>Kadar (RM)</label>
                  <input type="number" name="bantuan_bulanan[0][kadar]" step="0.01" min="0">
                </div>
                <div class="form-group">
                  <label>Kekerapan</label>
                  <select name="bantuan_bulanan[0][kekerapan]">
                    <option value="">Pilih Kekerapan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Harian">Harian</option>
                    <option value="Suku-Tahunan">Suku-Tahunan</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Sekali">Sekali</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Cara Terima</label>
                  <input type="text" name="bantuan_bulanan[0][cara_terima]">
                </div>
                <div class="form-group">
                  <label>Catatan</label>
                  <input type="text" name="bantuan_bulanan[0][catatan]">
                </div>
              </div>
            </div>
            <button type="button" id="add-bantuan-bulanan" class="btn-secondary">Tambah Bantuan Bulanan</button>
            
            <div class="total-display">
              <strong>Anggaran Bulanan: RM <span id="anggaran-bulanan">0.00</span></strong>
            </div>
          </div>
          
          <!-- Step 8: Semakan & Pengesahan -->
          <div class="wizard-step" data-step="8">
            <h4 class="step-title">Semakan & Pengesahan</h4>
            
            <div class="review-section">
              <div class="completion-status">
                <h5>Status Kelengkapan: <span id="completion-percentage">0%</span></h5>
                <div class="progress-bar">
                  <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                </div>
              </div>
              
              <div class="review-grid" id="reviewContent">
                <!-- Review content will be populated by JavaScript -->
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="confirm_accuracy" name="confirm_accuracy" required>
                  Saya mengesahkan bahawa semua maklumat yang diberikan adalah tepat dan benar.
                </label>
              </div>
            </div>
          </div>
          
          <div class="wizard-navigation">
            <button type="button" id="prevBtn" class="btn btn-secondary" style="display: none;">Sebelumnya</button>
            <button type="button" id="nextBtn" class="btn btn-primary">Seterusnya</button>
            <button type="button" id="saveAsDraftBtn" class="btn btn-outline">Simpan Draf</button>
            <button type="submit" id="submitBtn" class="btn btn-success" style="display: none;">Hantar</button>
          </div>
        </form>
      </div>
    </div>
    
    <div id="senarai-kir-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Senarai KIR</h3>
        <p class="section-description">Lihat dan urus semua rekod KIR</p>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>KIR ID</th>
              <th>Nama</th>
              <th>Nombor IC</th>
              <th>Status</th>
              <th>Tarikh Dicipta</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody id="senariKirTableBody">
            <!-- KIRs will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Senarai KIR (New) Content Section -->
    <div id="senarai-kir-new-content" class="content-section">
      <!-- Content will be dynamically loaded by SenaraiKIR.js component -->
    </div>

    
    <div id="program-kehadiran-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Program & Kehadiran</h3>
        <p class="section-description">Manage programs and attendance records</p>
      </div>
      
      <!-- Main Program & Kehadiran Overview -->
      <div id="program-kehadiran-overview" class="sub-content-section active">
        <div class="program-kehadiran-grid">
          <div class="program-card">
            <div class="program-header">
              <h4>Program Management</h4>
              <span class="program-icon">📅</span>
            </div>
            <p class="program-description">Create and manage community programs</p>
            <button class="btn btn-primary" id="manage-programs-btn">Manage Programs</button>
          </div>
          <div class="program-card">
            <div class="program-header">
              <h4>Attendance Tracking</h4>
              <span class="program-icon">✅</span>
            </div>
            <p class="program-description">Track participant attendance</p>
            <button class="btn btn-primary" id="view-attendance-btn">View Attendance</button>
          </div>
          <div class="program-card">
            <div class="program-header">
              <h4>Program Reports</h4>
              <span class="program-icon">📊</span>
            </div>
            <p class="program-description">Generate program participation reports</p>
            <button class="btn btn-primary" id="generate-reports-btn">Generate Reports</button>
          </div>
        </div>
      </div>
      
      <!-- Program Management Sub-section -->
      <div id="program-management-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="program-management-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Program Management</h3>
          </div>
          <p class="section-description">Create, edit, and manage community programs</p>
        </div>
        
        <div class="action-bar">
          <button class="btn btn-secondary" id="create-test-program-btn">
            <span>🧪</span> Create Test Program
          </button>
          <button class="btn btn-primary" id="add-program-btn">
            <span>➕</span> Add New Program
          </button>
        </div>
        
        <div class="table-container">
          <table class="data-table" id="programs-table">
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="programs-table-body">
              <!-- Programs will be loaded here -->
              <tr>
                <td colspan="7" class="loading-text">Loading programs...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Attendance Tracking Sub-section -->
      <div id="attendance-tracking-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="attendance-tracking-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Attendance Tracking</h3>
          </div>
          <p class="section-description">Track attendance for all participants</p>
        </div>
        
        <div class="filters-container">
          <div class="filter-group">
            <label for="program-filter">Program:</label>
            <select id="program-filter" class="form-select">
              <option value="">All Programs</option>
              <!-- Programs will be loaded here -->
            </select>
          </div>
          
          <div class="filter-group">
            <label for="attendance-date-filter">Date:</label>
            <input type="date" id="attendance-date-filter" class="form-input">
          </div>
          
          <button class="btn btn-secondary" id="apply-attendance-filters">
            Apply Filters
          </button>
          
          <button class="btn btn-outline" id="reset-attendance-filters">
            Reset
          </button>
        </div>
        
        <div class="table-container">
          <table class="data-table" id="attendance-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Type</th>
                <th>Present</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="attendance-table-body">
              <!-- Attendance records will be loaded here -->
              <tr>
                <td colspan="6" class="loading-text">Loading attendance records...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Program Reports Sub-section -->
      <div id="program-reports-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="program-reports-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Program Reports</h3>
          </div>
          <p class="section-description">View attendance statistics and reports</p>
        </div>
        
        <div class="reports-grid">
          <div class="report-card">
            <div class="report-header">
              <h4>Attendance Summary</h4>
              <span class="report-icon">📊</span>
            </div>
            <div class="report-content" id="attendance-summary-report">
              <p class="loading-text">Loading attendance summary...</p>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-header">
              <h4>Top Participants</h4>
              <span class="report-icon">🏆</span>
            </div>
            <div class="report-content" id="top-participants-report">
              <p class="loading-text">Loading top participants...</p>
            </div>
          </div>
          
          <div class="report-card">
            <div class="report-header">
              <h4>Program Participation</h4>
              <span class="report-icon">👥</span>
            </div>
            <div class="report-content" id="program-participation-report">
              <p class="loading-text">Loading program participation data...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="financial-tracking-newest-content" class="content-section">
      <!-- Content will be dynamically loaded by FinancialTrackingNewest.js component -->
    </div>

    <div id="program-kehadiran-newest-content" class="content-section">
      <!-- Content will be dynamically loaded by ProgramKehadiranNewest.js component -->
    </div>


    <div id="reports-content" class="content-section">
      <div class="section-header">
        <div>
          <h3 class="section-title">Laporan Menyeluruh</h3>
          <p class="section-description">One-stop view of program performance, participants, and finances</p>
        </div>
        <div class="system-report-actions print-hide">
          <button class="btn btn-secondary" id="reports-refresh-btn">Refresh Data</button>
          <button class="btn btn-primary" id="reports-download-btn">Save as PDF</button>
        </div>
      </div>
      
      <div id="reports-status-bar">
        <div id="reports-loading" class="loading-text">Loading consolidated report...</div>
        <div id="reports-error" class="error-text" style="display: none;"></div>
      </div>
      
      <div id="reports-dashboard" class="system-report-dashboard" style="display: none;">
        <div class="system-report-grid">
          <div class="system-report-card">
            <span class="label">Total Programs</span>
            <span class="value" id="report-total-programs">-</span>
            <span class="helper" id="report-program-meta">Active / Upcoming</span>
          </div>
          <div class="system-report-card">
            <span class="label">Attendance Rate</span>
            <span class="value" id="report-attendance-rate">-</span>
            <span class="helper" id="report-attendance-meta">Attendance records processed</span>
          </div>
          <div class="system-report-card">
            <span class="label">Participants</span>
            <span class="value" id="report-total-participants">-</span>
            <span class="helper">Unique attendees tracked</span>
          </div>
          <div class="system-report-card">
            <span class="label">Net Balance</span>
            <span class="value" id="report-net-balance">-</span>
            <span class="helper" id="report-financial-meta">Income - Expenses</span>
          </div>
        </div>
        
        <div class="report-sections-grid">
          <section class="report-section-card span-2">
            <header>
              <h4>Program Performance</h4>
              <span id="report-program-summary" class="helper"></span>
            </header>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Status</th>
                    <th>Participants</th>
                    <th>Attendance</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody id="report-program-table-body"></tbody>
              </table>
            </div>
          </section>
          
          <section class="report-section-card">
            <header>
              <h4>Attendance Trend</h4>
              <span class="helper">Last 6 months</span>
            </header>
            <div class="report-chart">
              <canvas id="report-attendance-chart"></canvas>
            </div>
          </section>
          
          <section class="report-section-card">
            <header>
              <h4>Top Participants</h4>
              <span class="helper">Most consistent attendees</span>
            </header>
            <div id="report-top-participants" class="report-list"></div>
          </section>
          
          <section class="report-section-card span-full">
            <header>
              <h4>Financial Snapshot</h4>
              <span class="helper">Income, expenses, and recent activity</span>
            </header>
            <div class="report-financial-grid">
              <div class="report-financial-card">
                <span class="label">Total Income</span>
                <span class="value" id="report-income-total">-</span>
              </div>
              <div class="report-financial-card expense">
                <span class="label">Total Expenses</span>
                <span class="value" id="report-expense-total">-</span>
              </div>
              <div class="report-financial-card">
                <span class="label">Surplus</span>
                <span class="value" id="report-surplus-value">-</span>
                <span class="delta" id="report-surplus-helper"></span>
              </div>
            </div>
            <div>
              <h5>Recent Transactions</h5>
              <div id="report-financial-list" class="report-list"></div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <div id="settings-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Tetapan Sistem</h3>
        <p class="section-description">Sesuaikan keutamaan aplikasi dan keselamatan pentadbir</p>
      </div>
      
      <div class="settings-grid">
       
        
        <div class="setting-card full-width">
          <div class="setting-header">
            <h4>Tukar Kata Laluan</h4>
            <span class="setting-icon">??</span>
          </div>
          <form id="adminChangePasswordForm" class="change-password-form">
            <div class="form-group">
              <label for="adminCurrentPassword">Kata laluan semasa</label>
              <input type="password" id="adminCurrentPassword" name="currentPassword" required placeholder="Masukkan kata laluan semasa">
            </div>
            <div class="form-group">
              <label for="adminNewPassword">Kata laluan baharu</label>
              <input type="password" id="adminNewPassword" name="newPassword" required placeholder="Masukkan kata laluan baharu" minlength="6">
            </div>
            <div class="form-group">
              <label for="adminConfirmPassword">Sahkan kata laluan baharu</label>
              <input type="password" id="adminConfirmPassword" name="confirmPassword" required placeholder="Ulang kata laluan baharu" minlength="6">
            </div>
            <div id="adminChangePasswordStatus" class="form-status"></div>
            <button type="submit" class="btn btn-primary">Kemaskini Kata Laluan</button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Program & Kehadiran (New) Content -->
    <div id="program-kehadiran-new-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Program & Kehadiran (New)</h3>
        <p class="section-description">Enhanced program and attendance management system</p>
      </div>
      
      <!-- Main Program & Kehadiran (New) Overview -->
      <div id="program-kehadiran-new-overview" class="sub-content-section active">
        <div class="program-kehadiran-grid">
          <div class="program-card">
            <div class="program-header">
              <h4>Enhanced Program Management</h4>
              <span class="program-icon">📅</span>
            </div>
            <p class="program-description">Advanced program creation and management with improved features</p>
            <button class="btn btn-primary" id="manage-programs-new-btn">Manage Programs</button>
          </div>
          <div class="program-card">
            <div class="program-header">
              <h4>Smart Attendance Tracking</h4>
              <span class="program-icon">✅</span>
            </div>
            <p class="program-description">Real-time attendance tracking with analytics</p>
            <button class="btn btn-primary" id="view-attendance-new-btn">View Attendance</button>
          </div>
          <div class="program-card">
            <div class="program-header">
              <h4>Advanced Reports</h4>
              <span class="program-icon">📊</span>
            </div>
            <p class="program-description">Comprehensive analytics and reporting dashboard</p>
            <button class="btn btn-primary" id="generate-reports-new-btn">Generate Reports</button>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Program Management Sub-section -->
      <div id="program-management-new-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="program-management-new-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Enhanced Program Management</h3>
          </div>
          <p class="section-description">Create, edit, and manage community programs with advanced features</p>
        </div>
        
        <div class="action-bar">
          <button class="btn btn-secondary" id="import-programs-btn">
            <span>📥</span> Import Programs
          </button>
          <button class="btn btn-secondary" id="export-programs-btn">
            <span>📤</span> Export Programs
          </button>
          <button class="btn btn-primary" id="add-program-new-btn">
            <span>➕</span> Add New Program
          </button>
        </div>
        
        <div class="table-container">
          <table class="data-table" id="programs-new-table">
            <thead>
              <tr>
                <th>Program Name</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Category</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="programs-new-table-body">
              <!-- Enhanced programs will be loaded here -->
              <tr>
                <td colspan="8" class="loading-text">Loading enhanced programs...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Smart Attendance Tracking Sub-section -->
      <div id="attendance-tracking-new-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="attendance-tracking-new-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Smart Attendance Tracking</h3>
          </div>
          <p class="section-description">Real-time attendance tracking with advanced analytics</p>
        </div>
        
        <div class="filters-container">
          <div class="filter-group">
            <label for="program-new-filter">Program:</label>
            <select id="program-new-filter" class="form-select">
              <option value="">All Programs</option>
              <!-- Programs will be loaded here -->
            </select>
          </div>
          <div class="filter-group">
            <label for="date-range-new-filter">Date Range:</label>
            <input type="date" id="start-date-new-filter" class="form-input">
            <span>to</span>
            <input type="date" id="end-date-new-filter" class="form-input">
          </div>
          <button class="btn btn-secondary" id="apply-filters-new-btn">Apply Filters</button>
          <button class="btn btn-primary" id="export-attendance-new-btn">
            <span>📤</span> Export Data
          </button>
        </div>
        
        <div class="table-container">
          <table class="data-table" id="attendance-new-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Type</th>
                <th>Present</th>
                <th>Attendance Rate</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="attendance-new-table-body">
              <!-- Enhanced attendance data will be loaded here -->
              <tr>
                <td colspan="7" class="loading-text">Loading attendance data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <div id="financial-tracking-content" class="content-section">
      <div class="section-header">
        <h3 class="section-title">Financial Tracking</h3>
        <p class="section-description">Monitor and analyze financial data across all KIR records</p>
      </div>
      
      <!-- Financial Overview Sub-tab -->
      <div id="financial-overview-content" class="sub-content-section active spacing">
        <div class="financial-stats-grid">
          <div class="stat-card financial-card">
            <div class="stat-header">
              <h3 class="stat-title">Jumlah Terkumpul</h3>
              <span class="stat-icon">💵</span>
            </div>
            <p class="stat-value" id="total-income">RM 0.00</p>
            <p class="stat-change positive">+5.2% from last month</p>
          
          </div>
          <div class="stat-card financial-card">
            <div class="stat-header">
              <h3 class="stat-title">Baki Semasa</h3>
              <span class="stat-icon">💸</span>
            </div>
            <p class="stat-value" id="total-expenses">RM 0.00</p>
            <p class="stat-change negative">+2.1% from last month</p>
          </div>
          <!-- Transaksi Terkini card removed as requested -->
          <div class="stat-card financial-card" style="display: none;">
            <div class="stat-header">
              <h3 class="stat-title">Pending Income</h3>
              <span class="stat-icon">⚖️</span>
            </div>
            <p class="stat-value" id="net-balance">RM 0.00</p>
            <p class="stat-change" id="balance-change">Calculated automatically</p>
          </div>
        </div>
        
        <!-- Financial charts container removed as requested -->
        
        <div class="financial-actions">
          <div class="action-buttons" style="display: flex; flex-wrap: wrap; gap: 25px; margin: 30px 0;">
            <button class="action-btn primary-action" id="money-in-btn">
              <span>💵</span>
              Money In
            </button>
            <button class="action-btn primary-action" id="money-out-btn">
              <span>💸</span>
              Money Out
            </button>
            
            <div style="width: 100%; height: 15px;"></div>
            
            <button class="action-btn" id="generate-income-report">
            <button class="action-btn" id="generate-expense-report">
              <span>📈</span>
              Generate Expense Report
            </button>
            
            <button class="action-btn" id="export-financial-data">
              <span>📤</span>
              Export Financial Data
            </button>
            <button class="action-btn" id="show-all-transactions">
              <span>📋</span>
              Show All Transactions
            </button>
          </div>
        </div>
        
        <!-- All Transactions Modal -->
        <div id="all-transactions-modal" class="modal">
          <div class="modal-content">
            <div class="modal-header">
              <h2>All Transactions</h2>
              <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
              <div class="transactions-container">
                <div class="transactions-filters">
                  <select id="transaction-type-filter">
                    <option value="all">All Transactions</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expenses Only</option>
                  </select>
                  <input type="date" id="transaction-date-filter">
                  <button id="reset-transaction-filters">Reset Filters</button>
                </div>
                <div class="transactions-list" id="all-transactions-list">
                  <p class="loading-text">Loading transactions...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Money In Sub-tab -->
      <div id="financial-money-in-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="money-in-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Money In - Add Income Entry</h3>
          </div>
          <p class="section-description">Record new income sources and amounts</p>
        </div>
        
        <div class="form-container">
          <form id="income-entry-form" class="income-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="income-date" class="form-label">Date</label>
                <input type="date" id="income-date" name="date" class="form-input" required>
              </div>
              
              <div class="form-group">
                <label for="income-source" class="form-label">Income Source</label>
                <input type="text" id="income-source" name="source" class="form-input" 
                       placeholder="e.g., Client Name, Government Grant, etc." required>
              </div>
              
              <div class="form-group">
                <label for="income-category" class="form-label">Category</label>
                <select id="income-category" name="category" class="form-select" required>
                  <option value="">Select Category</option>
                  <option value="sales-revenue">Sales Revenue</option>
                  <option value="service-income">Service Income</option>
                  <option value="grants-funding">Grants & Funding</option>
                  <option value="donations">Donations</option>
                  <option value="investment-returns">Investment Returns</option>
                  <option value="other-revenue">Other Revenue</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="income-amount" class="form-label">Amount (RM)</label>
                <input type="number" id="income-amount" name="amount" class="form-input" 
                       placeholder="0.00" step="0.01" min="0" required>
              </div>
              
              <div class="form-group full-width">
                <label for="income-description" class="form-label">Description</label>
                <textarea id="income-description" name="description" class="form-textarea" 
                          placeholder="Additional details about this income entry..." rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="income-reference" class="form-label">Reference Number (Optional)</label>
                <input type="text" id="income-reference" name="reference" class="form-input" 
                       placeholder="Invoice/Receipt number">
              </div>
              
              <div class="form-group">
                <label for="income-payment-method" class="form-label">Payment Method</label>
                <select id="income-payment-method" name="paymentMethod" class="form-select" required>
                  <option value="">Select Payment Method</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online-payment">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" id="clear-form-btn" class="btn btn-secondary">
                <span class="btn-icon">🔄</span>
                Clear Form
              </button>
              <button type="submit" id="submit-income-btn" class="btn btn-primary">
                <span class="btn-icon">💾</span>
                Save Income Entry
              </button>
            </div>
          </form>
          
          <div id="form-message" class="form-message" style="display: none;"></div>
        </div>
      </div>
      
      <!-- Money Out Sub-tab -->
      <div id="financial-money-out-content" class="sub-content-section">
        <div class="section-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="back-btn" id="money-out-back-btn">
              <span>⬅️</span>
              Back to Overview
            </button>
            <h3 class="section-title">Money Out - Add Expense Entry</h3>
          </div>
          <p class="section-description">Record new company expenses and outgoing payments</p>
        </div>
        
        <div class="form-container">
          <form id="expense-entry-form" class="expense-form">
            <div class="form-grid">
              <div class="form-group">
                <label for="expense-date" class="form-label">Date</label>
                <input type="date" id="expense-date" name="date" class="form-input" required>
              </div>
              
              <div class="form-group">
                <label for="expense-vendor" class="form-label">Vendor/Payee</label>
                <input type="text" id="expense-vendor" name="vendor" class="form-input" 
                       placeholder="e.g., Office Supplies Co, TNB, Staff Member" required>
              </div>
              
              <div class="form-group">
                <label for="expense-category" class="form-label">Category</label>
                <select id="expense-category" name="category" class="form-select" required>
                  <option value="">Select Category</option>
                  <option value="operating-expenses">Operating Expenses</option>
                  <option value="staff-salaries">Staff Salaries</option>
                  <option value="equipment-supplies">Equipment & Supplies</option>
                  <option value="marketing-advertising">Marketing & Advertising</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent-facilities">Rent & Facilities</option>
                  <option value="professional-services">Professional Services</option>
                  <option value="travel-transport">Travel & Transport</option>
                  <option value="maintenance-repairs">Maintenance & Repairs</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="expense-amount" class="form-label">Amount (RM)</label>
                <input type="number" id="expense-amount" name="amount" class="form-input" 
                       step="0.01" min="0" placeholder="0.00" required>
              </div>
              
              <div class="form-group full-width">
                <label for="expense-description" class="form-label">Description</label>
                <textarea id="expense-description" name="description" class="form-textarea" 
                          rows="3" placeholder="Additional details about this expense..."></textarea>
              </div>
              
              <div class="form-group">
                <label for="expense-reference" class="form-label">Reference Number</label>
                <input type="text" id="expense-reference" name="reference" class="form-input" 
                       placeholder="Invoice/Receipt number">
              </div>
              
              <div class="form-group">
                <label for="expense-payment-method" class="form-label">Payment Method</label>
                <select id="expense-payment-method" name="paymentMethod" class="form-select" required>
                  <option value="">Select Payment Method</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="online-payment">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" id="clear-expense-form-btn" class="btn btn-secondary">
                <span class="btn-icon">🔄</span>
                Clear Form
              </button>
              <button type="submit" id="submit-expense-btn" class="btn btn-primary">
                <span class="btn-icon">💾</span>
                Save Expense Entry
              </button>
            </div>
          </form>
          
          <div id="expense-form-message" class="form-message" style="display: none;"></div>
        </div>
      </div>
    </div>
    
    <!-- Income Entry Modal -->
    <div id="income-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Revenue Entry</h3>
          <span class="close-modal" id="close-income-modal">&times;</span>
        </div>
        <form id="income-form" class="modal-form">
          <div class="form-group">
            <label for="income-date">Date *</label>
            <input type="date" id="income-date" name="date" required>
          </div>
          
          <div class="form-group">
            <label for="income-source">Revenue Source *</label>
            <input type="text" id="income-source" name="source" placeholder="e.g., Client Payment, Product Sales, Service Contract" required>
          </div>
          
          <div class="form-group">
            <label for="income-category">Category *</label>
            <select id="income-category" name="category" required>
              <option value="">Select Category</option>
              <option value="sales-revenue">Sales Revenue</option>
              <option value="service-income">Service Income</option>
              <option value="consulting-fees">Consulting Fees</option>
              <option value="grants-funding">Grants & Funding</option>
              <option value="investment-returns">Investment Returns</option>
              <option value="rental-income">Rental Income</option>
              <option value="partnership-income">Partnership Income</option>
              <option value="licensing-fees">Licensing Fees</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="income-amount">Amount (RM) *</label>
            <input type="number" id="income-amount" name="amount" step="0.01" min="0" placeholder="0.00" required>
          </div>
          
          <div class="form-group">
            <label for="income-description">Description</label>
            <textarea id="income-description" name="description" rows="3" placeholder="Additional details about this revenue..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="income-recurring">Recurring Revenue</label>
            <select id="income-recurring" name="recurring">
              <option value="no">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-income">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Revenue</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Expense Entry Modal -->
    <div id="expense-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Expense Entry</h3>
          <span class="close-modal" id="close-expense-modal">&times;</span>
        </div>
        <form id="expense-form" class="modal-form">
          <div class="form-group">
            <label for="expense-date">Date *</label>
            <input type="date" id="expense-date" name="date" required>
          </div>
          
          <div class="form-group">
            <label for="expense-vendor">Vendor/Payee *</label>
            <input type="text" id="expense-vendor" name="vendor" placeholder="e.g., Office Supplies Co, Utility Company, Staff Member" required>
          </div>
          
          <div class="form-group">
            <label for="expense-category">Category *</label>
            <select id="expense-category" name="category" required>
              <option value="">Select Category</option>
              <option value="operating-expenses">Operating Expenses</option>
              <option value="staff-salaries">Staff Salaries</option>
              <option value="equipment-supplies">Equipment & Supplies</option>
              <option value="marketing-advertising">Marketing & Advertising</option>
              <option value="utilities">Utilities</option>
              <option value="rent-facilities">Rent & Facilities</option>
              <option value="professional-services">Professional Services</option>
              <option value="travel-transport">Travel & Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="expense-amount">Amount (RM) *</label>
            <input type="number" id="expense-amount" name="amount" step="0.01" min="0" placeholder="0.00" required>
          </div>
          
          <div class="form-group">
            <label for="expense-description">Description</label>
            <textarea id="expense-description" name="description" rows="3" placeholder="Additional details about this expense..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="expense-recurring">Recurring Expense</label>
            <select id="expense-recurring" name="recurring">
              <option value="no">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-expense">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function createAdminDashboard(user) {
  const sidebar = createAdminSidebar(user);
  const mainContent = createAdminMainContent();
  
  return `
    <div class="admin-layout">
      <button class="mobile-menu-toggle" id="mobileMenuToggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      ${sidebar}
      
      <main class="main-content">
        <div class="content-header">
          <h1 class="content-title">eMAS-SMART</h1>
          <p class="content-subtitle">Electronic Mapping and Analytics - System Maklumat Asnaf Real Time</p>
        </div>
        
        ${mainContent}
      </main>
    </div>
  `;
}

let dashboardStatsLoadingPromise = null;
let financialTrendLoadingPromise = null;
let attendanceLeaderLoadingPromise = null;
let chartModulePromise = null;
let financialTrendChartInstance = null;
let programStatusChartInstance = null;

export function initializeDashboardStats() {
  loadDashboardStats();
  loadFinancialTrendChart();
  
  const dashboardNavItem = document.querySelector('.nav-item[data-section="dashboard"]');
  if (dashboardNavItem && !dashboardNavItem.dataset.dashboardStatsBound) {
    dashboardNavItem.dataset.dashboardStatsBound = 'true';
    dashboardNavItem.addEventListener('click', () => {
      loadDashboardStats();
      loadFinancialTrendChart();
      loadAttendanceLeaderList();
    });
  }
  
  loadAttendanceLeaderList();
}

// User Management functionality
export async function initializeUserManagement() {
  const usersTableBody = document.getElementById('usersTableBody');
  
  // Load users from Firebase
  let users = [];
  try {
    users = await FirebaseAuthService.getAllUsers();
    // Format the data for display
    users = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      role: user.role || 'user',
      status: user.status || 'active',
      lastLogin: user.lastLogin ? formatLastLogin(user.lastLogin) : 'Never',
      noKp: user.no_kp || user.noKp || '',
      noKpDisplay: user.no_kp_display || user.no_kp || user.noKpDisplay || ''
    }));
    cachedUserList = users;
  } catch (error) {
    console.error('Error loading users:', error);
    // Fallback to mock data if Firebase fails
    users = [
      { id: 1, name: 'Administrator', email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: '2 hours ago' },
      { id: 2, name: 'Regular User', email: 'user@example.com', role: 'user', status: 'active', lastLogin: '1 day ago' },
      { id: 3, name: 'John Smith', email: 'john.smith@example.com', role: 'moderator', status: 'inactive', lastLogin: '1 week ago' },
      { id: 4, name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'user', status: 'pending', lastLogin: 'Never' },
      { id: 5, name: 'Mike Wilson', email: 'mike.wilson@example.com', role: 'user', status: 'active', lastLogin: '3 days ago' }
    ];
    showUserManagementError('Failed to load users from database. Showing sample data.');
    cachedUserList = users;
  }

  // Helper function to format last login date
  function formatLastLogin(date) {
    if (!date) return 'Never';
    const now = new Date();
    const loginDate = date.toDate ? date.toDate() : new Date(date);
    const diffMs = now - loginDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return loginDate.toLocaleDateString();
  }

  // Helper function to show error messages
  function showUserManagementError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'user-management-error';
    errorDiv.style.cssText = 'background: #fee; color: #c53030; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #feb2b2;';
    errorDiv.textContent = message;
    
    const userManagementSection = document.getElementById('users-content');
    if (userManagementSection) {
      userManagementSection.insertBefore(errorDiv, userManagementSection.firstChild);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }
  
  function renderUsers(filteredUsers = users) {
    if (!usersTableBody) return;
    
    usersTableBody.innerHTML = filteredUsers.map(user => `
      <tr class="user-row">
        <td>
          <div class="user-info">
            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <span class="user-name">${user.name}</span>
          </div>
        </td>
        <td class="user-email">${user.email}</td>
        <td><span class="role-badge ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
        <td><span class="status-badge ${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
        <td class="last-login">${user.lastLogin}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit User" data-action="edit" data-id="${user.id}">Edit</button>
            <button class="action-menu-btn" title="View Details" data-action="view" data-id="${user.id}">View</button>
            <button class="action-menu-btn danger" title="Delete User" data-action="delete" data-id="${user.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Update table info
    const tableInfo = document.querySelector('.table-info');
    if (tableInfo) {
      const total = filteredUsers.length;
      tableInfo.innerHTML = `<span>Showing <strong>${total}</strong> of <strong>${users.length}</strong> users</span>`;
    }
    
    attachUserActionListeners();
  }
  
  function filterUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredUsers = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                          user.email.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || user.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
    
    renderUsers(filteredUsers);
  }
  
  // Add event listeners for search and filter
  const searchInput = document.getElementById('userSearch');
  const statusFilterSelect = document.getElementById('statusFilter');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
  }
  
  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', filterUsers);
  }
  
  // Initialize
  renderUsers();
  setupAddUserButton();
}

function setupAddUserButton() {
  const addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn && !addUserBtn.dataset.listenerAttached) {
    addUserBtn.dataset.listenerAttached = 'true';
    addUserBtn.addEventListener('click', () => openAddUserModal());
  }
}

function openAddUserModal(prefill = {}) {
  closeAddUserModal();
  resetAddUserContext();
  
  const modal = document.createElement('div');
  modal.className = 'modal add-user-modal';
  modal.id = 'add-user-modal';
  modal.innerHTML = getAddUserModalTemplate();
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const closeBtn = modal.querySelector('#close-add-user-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAddUserModal);
  }
  
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeAddUserModal();
    }
  });
  
  const form = modal.querySelector('#adminAddUserForm');
  if (form) {
    form.addEventListener('submit', handleAdminAddUser);
    
    if (prefill.name) {
      const nameInput = form.querySelector('#adminRegisterName');
      if (nameInput) nameInput.value = prefill.name;
    }
    
    if (prefill.email) {
      const emailInput = form.querySelector('#adminRegisterEmail');
      if (emailInput) emailInput.value = prefill.email;
    }
  }
  
  const noKpForm = modal.querySelector('#adminNoKPCheckForm');
  if (noKpForm) {
    noKpForm.addEventListener('submit', handleAdminNoKPCheck);
  }
  
  const noKpInput = modal.querySelector('#adminNoKPInput');
  if (noKpInput) {
    if (prefill.noKp) {
      noKpInput.value = formatICWithDashes(prefill.noKp);
    }
    noKpInput.addEventListener('input', (event) => {
      event.target.value = formatICWithDashes(event.target.value);
    });
  }
}

function closeAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (modal) {
    modal.remove();
  }
  resetAddUserContext();
}

function getAddUserModalTemplate() {
  const roleFieldHTML = `
    <div class="form-group">
      <label for="adminRegisterRole">Role</label>
      <select id="adminRegisterRole" name="role" required>
        <option value="user" selected>User</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  `;
  
  const formMarkup = createRegistrationFormMarkup({
    formId: 'adminAddUserForm',
    formClass: 'auth-form register-form admin-add-user-form',
    visible: true,
    includeGoogleButton: false,
    submitButtonId: 'admin-add-user-submit',
    submitButtonText: 'Create User',
    errorMessageId: 'admin-add-user-error',
    successMessageId: 'admin-add-user-success',
    idPrefix: 'adminRegister',
    roleFieldHTML
  });
  
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Tambah Akaun Pengguna</h2>
        <span class="close-modal" id="close-add-user-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div id="admin-add-user-status" class="admin-add-user-status"></div>
        
        <div id="adminNoKPStep" class="admin-add-user-step">
          <h3>Langkah 1: Sahkan No. Kad Pengenalan</h3>
          <form id="adminNoKPCheckForm">
            <div class="form-group">
              <label for="adminNoKPInput">No. Kad Pengenalan</label>
              <input 
                type="text" 
                id="adminNoKPInput" 
                name="no_kp" 
                required 
                maxlength="14" 
                inputmode="numeric" 
                pattern="\\d{6}-\\d{2}-\\d{4}"
                placeholder="123456-12-1234">
              <small class="form-help">Gunakan format standard: 123456-12-1234</small>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Semak No. KP</button>
            </div>
          </form>
          <div class="admin-add-user-hint">
            <p>Sistem akan menyemak koleksi <code>index_nokp</code>. Jika No. KP belum berdaftar, borang KIR baharu akan dibuka terlebih dahulu.</p>
          </div>
        </div>
        
        <div id="adminUserFormStep" class="admin-add-user-step" style="display: none;">
          <h3>Langkah 2: Cipta Akaun Pengguna</h3>
          <div class="admin-verified-info">
            <p>No. KP disahkan: <span id="adminVerifiedNoKP">-</span></p>
            <p>Nama KIR: <span id="adminVerifiedName">-</span></p>
          </div>
          ${formMarkup}
        </div>
      </div>
    </div>
  `;
}

function resetAddUserContext() {
  currentAddUserContext = null;
}

function setAddUserStatus(message, type = 'info') {
  const statusElement = document.getElementById('admin-add-user-status');
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.style.display = 'block';
  statusElement.className = 'admin-add-user-status';
  statusElement.style.background = '';
  statusElement.style.color = '';
  statusElement.style.border = '';
  
  if (type === 'success') {
    statusElement.classList.add('success');
  } else if (type === 'error') {
    statusElement.classList.add('error');
  } else {
    statusElement.style.background = '#eef2ff';
    statusElement.style.color = '#4338ca';
    statusElement.style.border = '1px solid #c7d2fe';
  }
}

function attachUserActionListeners() {
  const buttons = document.querySelectorAll('#usersTableBody .action-menu-btn');
  buttons.forEach(button => {
    button.addEventListener('click', (event) => {
      const action = event.currentTarget.dataset.action;
      const userId = event.currentTarget.dataset.id;
      if (!action || !userId) return;
      const user = cachedUserList.find(u => String(u.id) === String(userId));
      if (!user) {
        showUserManagementToast('Pengguna tidak ditemui.', 'error');
        return;
      }
      handleUserRowAction(action, user);
    });
  });
}

function handleUserRowAction(action, user) {
  if (!action || !user) return;
  if (action === 'edit') {
    openEditUserModal(user);
  } else if (action === 'view') {
    openUserDetailsModal(user);
  } else if (action === 'delete') {
    handleDeleteUser(user);
  }
}

function showUserManagementToast(message, type = 'info') {
  const container = document.getElementById('user-management-content');
  if (!container) return;
  
  let toast = container.querySelector('.user-management-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'user-management-toast';
    container.insertBefore(toast, container.firstChild);
  }
  
  toast.textContent = message;
  toast.className = `user-management-toast ${type}`;
  toast.style.display = 'block';
  
  if (userManagementToastTimer) {
    clearTimeout(userManagementToastTimer);
  }
  
  userManagementToastTimer = setTimeout(() => {
    if (toast) {
      toast.style.display = 'none';
    }
  }, 4000);
}

async function handleAdminNoKPCheck(event) {
  event.preventDefault();
  const modal = document.getElementById('add-user-modal');
  if (!modal) return;
  
  const noKpInput = modal.querySelector('#adminNoKPInput');
  if (!noKpInput) return;
  
  const rawValue = noKpInput.value.trim();
  const normalizedNoKP = normalizeNoKP(rawValue);
  
  if (!normalizedNoKP || normalizedNoKP.length !== 12) {
    setAddUserStatus('Sila masukkan No. KP yang sah (12 digit).', 'error');
    return;
  }
  
  try {
    setAddUserStatus('Menyemak No. KP dengan index...', 'info');
    let indexRecord = await KIRService.getNoKPIndex(normalizedNoKP);
    
    if (indexRecord && (indexRecord.kir_id || indexRecord.owner_id)) {
      showUserFormStep({
        indexRecord,
        normalizedNoKP,
        displayNoKP: indexRecord.no_kp_display || formatDisplayNoKP(rawValue || normalizedNoKP)
      });
      setAddUserStatus('No. KP disahkan. Sila lengkapkan maklumat pengguna.', 'success');
      return;
    }
    
    setAddUserStatus('No. KP tidak dijumpai. Membuka borang KIR baharu...', 'info');
    const createdRecord = await openQuickKIRCreationModal({
      prefillNoKP: normalizedNoKP
    });
    
    if (createdRecord && createdRecord.indexRecord) {
      showUserFormStep({
        indexRecord: createdRecord.indexRecord,
        normalizedNoKP: createdRecord.indexRecord.no_kp || normalizedNoKP,
        displayNoKP: createdRecord.indexRecord.no_kp_display || formatDisplayNoKP(normalizedNoKP),
        fallbackName: createdRecord.kirName
      });
      setAddUserStatus('KIR baharu berjaya dicipta. Sila lengkapkan maklumat pengguna.', 'success');
    } else {
      setAddUserStatus('KIR tidak dicipta. Sila cuba lagi.', 'error');
    }
    
  } catch (error) {
    console.error('No. KP check failed:', error);
    setAddUserStatus(error.message || 'Gagal menyemak No. KP.', 'error');
  }
}

function showUserFormStep({ indexRecord, normalizedNoKP, displayNoKP, fallbackName = '' }) {
  const modal = document.getElementById('add-user-modal');
  if (!modal) return;
  
  const stepOne = modal.querySelector('#adminNoKPStep');
  const stepTwo = modal.querySelector('#adminUserFormStep');
  if (stepOne) stepOne.style.display = 'none';
  if (stepTwo) stepTwo.style.display = 'block';
  
  const nameValue = indexRecord?.nama || fallbackName || '';
  const verifiedNoKP = modal.querySelector('#adminVerifiedNoKP');
  const verifiedName = modal.querySelector('#adminVerifiedName');
  const nameInput = modal.querySelector('#adminRegisterName');
  
  if (verifiedNoKP) {
    verifiedNoKP.textContent = displayNoKP || normalizedNoKP;
  }
  if (verifiedName) {
    verifiedName.textContent = nameValue || '(Tiada nama dalam rekod)';
  }
  if (nameInput) {
    nameInput.value = nameValue;
  }
  
  const emailInput = modal.querySelector('#adminRegisterEmail');
  if (emailInput) {
    setTimeout(() => emailInput.focus(), 150);
  }
  
  currentAddUserContext = {
    normalizedNoKP,
    displayNoKP: displayNoKP || normalizedNoKP,
    indexRecord: indexRecord || null,
    kirId: indexRecord?.kir_id || indexRecord?.owner_id || '',
    inferredName: nameValue
  };
}

async function handleAdminAddUser(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector('#admin-add-user-submit');
  const originalText = submitButton?.innerHTML;
  
  if (!currentAddUserContext) {
    setAddUserStatus('Sila sahkan No. KP terlebih dahulu.', 'error');
    return;
  }
  
  const formData = new FormData(form);
  const name = (formData.get('name') || '').trim();
  const email = (formData.get('email') || '').trim();
  const password = formData.get('password') || '';
  const confirmPassword = formData.get('confirmPassword') || '';
  const role = formData.get('role') || 'user';
  
  if (!name || !email || !password || !confirmPassword) {
    setAddUserStatus('Sila lengkapkan semua medan yang diperlukan.', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    setAddUserStatus('Kata laluan dan pengesahan tidak sepadan.', 'error');
    return;
  }
  
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<div class="loading-spinner white"></div>Memproses...';
    }
    
    setAddUserStatus('Mengesahkan No. KP dengan index_nokp...', 'info');
    let indexRecord = currentAddUserContext.indexRecord;
    const normalizedNoKP = currentAddUserContext.normalizedNoKP;
    const displayNoKP = currentAddUserContext.displayNoKP;
    
    setAddUserStatus('Mencipta akaun pengguna dan memautkan KIR...', 'info');
    
    const adminUser = FirebaseAuthService.getCurrentUser();
    const extraProfile = {
      createdBy: 'admin',
      createdByUid: adminUser?.uid || '',
      createdByEmail: adminUser?.email || '',
      no_kp: normalizedNoKP,
      no_kp_display: displayNoKP,
      kir_id: currentAddUserContext.kirId || indexRecord?.kir_id || indexRecord?.owner_id || '',
      linked_kir_name: name,
      index_owner_type: indexRecord?.owner_type || 'KIR',
      index_owner_id: indexRecord?.owner_id || indexRecord?.kir_id || ''
    };
    
    await FirebaseAuthService.register(email, password, name, role, extraProfile);
    
    setAddUserStatus('Akaun pengguna berjaya dicipta dan dipautkan kepada KIR.', 'success');
    
    setTimeout(() => {
      closeAddUserModal();
      initializeUserManagement();
    }, 1200);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    setAddUserStatus(error.message || 'Gagal mencipta pengguna.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText || 'Create User';
    }
  }
}

async function openQuickKIRCreationModal({ prefillName = '', prefillNoKP = '' } = {}) {
  if (document.getElementById('quick-kir-modal')) {
    return null;
  }
  
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal quick-kir-modal';
    modal.id = 'quick-kir-modal';
    modal.innerHTML = getQuickKIRModalTemplate(prefillName, prefillNoKP);
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    const closeModal = () => {
      modal.remove();
      resolve(null);
    };
    
    const closeBtn = modal.querySelector('#close-quick-kir-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    
    const cancelBtn = modal.querySelector('#cancel-quick-kir');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    const form = modal.querySelector('#quickKirForm');
    const statusElement = modal.querySelector('#quick-kir-status');
    const nameInput = modal.querySelector('#quickKirName');
    const icInput = modal.querySelector('#quickKirNoKP');
    
    if (nameInput && prefillName) nameInput.value = prefillName;
    if (icInput) {
      if (prefillNoKP) icInput.value = prefillNoKP;
      icInput.addEventListener('input', (event) => {
        event.target.value = normalizeNoKP(event.target.value).slice(0, 12);
      });
    }
    
    const setStatus = (message, type = 'info') => {
      statusElement.textContent = message;
      statusElement.style.display = 'block';
      statusElement.className = 'admin-add-user-status';
      if (type === 'success') {
        statusElement.classList.add('success');
      } else if (type === 'error') {
        statusElement.classList.add('error');
      } else {
        statusElement.style.background = '#eef2ff';
        statusElement.style.color = '#4338ca';
        statusElement.style.border = '1px solid #c7d2fe';
      }
    };
    
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('#quickKirSubmit');
        const originalText = submitBtn?.innerHTML;
        
        const kirName = (nameInput?.value || '').trim();
        const kirNoKpRaw = (icInput?.value || '').trim();
        const kirNoKp = normalizeNoKP(kirNoKpRaw);
        
        if (!kirName || kirName.length < 2) {
          setStatus('Nama penuh diperlukan.', 'error');
          return;
        }
        
        if (!kirNoKp || kirNoKp.length !== 12) {
          setStatus('No. KP mesti 12 digit nombor.', 'error');
          return;
        }
        
        try {
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="loading-spinner white"></div>Mencipta...';
          }
          
          setStatus('Mencipta rekod KIR baharu...', 'info');
          
          const result = await KIRService.createKIR({
            nama_penuh: kirName,
            no_kp: kirNoKp,
            status_rekod: 'Draf'
          });
          
          const indexRecord = await KIRService.getNoKPIndex(kirNoKp);
          
          setStatus('KIR berjaya dicipta.', 'success');
          setTimeout(() => {
            modal.remove();
            resolve({ kirId: result.id, indexRecord, kirName });
          }, 600);
          
        } catch (error) {
          console.error('Quick KIR creation failed:', error);
          setStatus(error.message || 'Gagal mencipta KIR.', 'error');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText || 'Cipta KIR';
          }
        }
      });
    }
  });
}

function getQuickKIRModalTemplate(prefillName, prefillNoKP) {
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Tambah KIR Baharu</h2>
        <span class="close-modal" id="close-quick-kir-modal">&times;</span>
      </div>
      <div class="modal-body">
        <p class="admin-add-user-hint">No. KP tidak ditemui dalam index. Sila cipta rekod KIR ringkas untuk meneruskan.</p>
        <div id="quick-kir-status" class="admin-add-user-status"></div>
        <form id="quickKirForm">
          <div class="form-group">
            <label for="quickKirName">Nama Penuh</label>
            <input type="text" id="quickKirName" name="nama_penuh" required placeholder="Masukkan nama penuh" value="${prefillName || ''}">
          </div>
          <div class="form-group">
            <label for="quickKirNoKP">No. Kad Pengenalan</label>
            <input type="text" id="quickKirNoKP" name="no_kp" required maxlength="12" placeholder="123456789012" value="${prefillNoKP || ''}">
            <small class="form-help">12 digit nombor sahaja, tanpa jarak atau tanda.</small>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-quick-kir">Batal</button>
            <button type="submit" class="btn btn-primary" id="quickKirSubmit">Cipta KIR</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function openEditUserModal(user) {
  closeEditUserModal();
  currentEditingUser = user;
  
  const modal = document.createElement('div');
  modal.className = 'modal edit-user-modal';
  modal.id = 'edit-user-modal';
  modal.innerHTML = getEditUserModalTemplate(user);
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const closeBtn = modal.querySelector('#close-edit-user-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeEditUserModal);
  
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeEditUserModal();
    }
  });
  
  const form = modal.querySelector('#editUserForm');
  if (form) {
    form.addEventListener('submit', handleEditUserSubmit);
  }
  
  const cancelBtn = modal.querySelector('#cancel-edit-user');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditUserModal);
  }
}

function closeEditUserModal() {
  const modal = document.getElementById('edit-user-modal');
  if (modal) {
    modal.remove();
  }
  currentEditingUser = null;
}

function getEditUserModalTemplate(user) {
  const statusOptions = ['active', 'pending', 'inactive', 'pending_verification'];
  const roleOptions = ['user', 'admin'];
  const formattedNoKP = formatDisplayNoKP(user?.noKpDisplay || user?.noKp || '');
  
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Kemaskini Pengguna</h2>
        <span class="close-modal" id="close-edit-user-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div id="edit-user-status" class="admin-add-user-status"></div>
        <form id="editUserForm" class="modal-form">
          <div class="form-group">
            <label>No. Kad Pengenalan</label>
            <input type="text" value="${formattedNoKP}" readonly>
          </div>
          <div class="form-group">
            <label for="editUserName">Nama</label>
            <input type="text" id="editUserName" name="name" required value="${user.name || ''}">
          </div>
          <div class="form-group">
            <label for="editUserEmail">Email</label>
            <input type="email" id="editUserEmail" value="${user.email || ''}" readonly>
          </div>
          <div class="form-group">
            <label for="editUserRole">Role</label>
            <select id="editUserRole" name="role" required>
              ${roleOptions.map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role.charAt(0).toUpperCase() + role.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="editUserStatus">Status</label>
            <select id="editUserStatus" name="status" required>
              ${statusOptions.map(status => `<option value="${status}" ${user.status === status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="cancel-edit-user">Batal</button>
            <button type="submit" class="btn btn-primary" id="edit-user-submit">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function setEditUserStatus(message, type = 'info') {
  const statusElement = document.getElementById('edit-user-status');
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.style.display = 'block';
  statusElement.className = 'admin-add-user-status';
  if (type === 'success') {
    statusElement.classList.add('success');
  } else if (type === 'error') {
    statusElement.classList.add('error');
  }
}

async function handleEditUserSubmit(event) {
  event.preventDefault();
  if (!currentEditingUser) return;
  
  const form = event.target;
  const submitButton = form.querySelector('#edit-user-submit');
  const formData = new FormData(form);
  const name = (formData.get('name') || '').trim();
  const role = formData.get('role');
  const status = formData.get('status');
  
  if (!name) {
    setEditUserStatus('Nama diperlukan.', 'error');
    return;
  }
  
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Menyimpan...';
    }
    setEditUserStatus('Mengemas kini pengguna...', 'info');
    
    await FirebaseAuthService.updateUser(currentEditingUser.id, {
      name,
      role,
      status
    });
    
    showUserManagementToast('Maklumat pengguna berjaya dikemaskini.', 'success');
    closeEditUserModal();
    await initializeUserManagement();
  } catch (error) {
    console.error('Error updating user:', error);
    setEditUserStatus(error.message || 'Gagal mengemas kini pengguna.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Simpan Perubahan';
    }
  }
}

function openUserDetailsModal(user) {
  closeUserDetailsModal();
  const modal = document.createElement('div');
  modal.className = 'modal view-user-modal';
  modal.id = 'view-user-modal';
  modal.innerHTML = getUserDetailsModalTemplate(user);
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  const closeBtn = modal.querySelector('#close-view-user-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeUserDetailsModal);
  const closePrimary = modal.querySelector('#close-view-user-btn');
  if (closePrimary) closePrimary.addEventListener('click', closeUserDetailsModal);
  
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeUserDetailsModal();
    }
  });
}

function closeUserDetailsModal() {
  const modal = document.getElementById('view-user-modal');
  if (modal) {
    modal.remove();
  }
}

function getUserDetailsModalTemplate(user) {
  const formattedNoKP = formatDisplayNoKP(user?.noKpDisplay || user?.noKp || '');
  return `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Maklumat Pengguna</h2>
        <span class="close-modal" id="close-view-user-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="user-details-grid">
          <p><strong>Nama:</strong> ${user.name || '-'}</p>
          <p><strong>Email:</strong> ${user.email || '-'}</p>
          <p><strong>No. Kad Pengenalan:</strong> ${formattedNoKP}</p>
          <p><strong>Role:</strong> ${user.role || '-'}</p>
          <p><strong>Status:</strong> ${user.status || '-'}</p>
          <p><strong>Last Login:</strong> ${user.lastLogin || '-'}</p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="close-view-user-btn">Tutup</button>
        </div>
      </div>
    </div>
  `;
}

async function handleDeleteUser(user) {
  if (!user) return;
  const confirmed = confirm(`Adakah anda pasti ingin memadam pengguna ${user.name}? Tindakan ini tidak boleh dibatalkan.`);
  if (!confirmed) return;
  
  try {
    showUserManagementToast('Memadam pengguna...', 'info');
    await FirebaseAuthService.deleteUser(user.id);
    showUserManagementToast('Pengguna berjaya dipadam.', 'success');
    await initializeUserManagement();
  } catch (error) {
    console.error('Error deleting user:', error);
    showUserManagementToast(error.message || 'Gagal memadam pengguna.', 'error');
  }
}

// KIR Management functionality
export function initializeKIRManagement(tableBodyId = 'kirTableBody') {
  const kirTableBody = document.getElementById(tableBodyId);
  
  // State management
  let currentKIRData = [];
  let currentPage = 1;
  let pageSize = 10;
  let totalRecords = 0;
  let currentFilters = {
    search: '',
    status: 'all',
    negeri: 'all',
    nama: '',
    nokp: ''
  };
  
  // Debug state
  let debugState = {
    lastError: null,
    lastParams: null,
    hasNextCursor: false,
    hasPrevCursor: false,
    isDebugVisible: false
  };
  
  async function loadKIRData() {
    try {
      showLoadingState();
      
      const params = {
        search: currentFilters.search,
        status: currentFilters.status === 'all' ? '' : mapStatusToDatabase(currentFilters.status),
        daerah: currentFilters.negeri === 'all' ? '' : currentFilters.negeri,
        pageCursor: null, // For now, we'll implement simple pagination
        pageSize: pageSize
      };
      
      // Store params for debug
      debugState.lastParams = { ...params };
      debugState.lastError = null;
      
      const result = await KIRService.getKIRList(params);
      
      currentKIRData = result.items || [];
      totalRecords = result.items ? result.items.length : 0; // Approximate total for now
      
      // Update debug cursor state
      debugState.hasNextCursor = result.hasMore || false;
      debugState.hasPrevCursor = currentPage > 1;
      
      renderKIRTable();
      await updateSummaryCardsWithRealData();
      updatePagination(result);
      updateDebugBar();
      
    } catch (error) {
      console.error('Error loading KIR data:', error);
      
      // Store error for debug
      debugState.lastError = {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      };
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
        showErrorMessage('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      } else {
        showErrorMessage('Ralat memuatkan data KIR. Sila cuba lagi.');
      }
      
      updateDebugBar();
    } finally {
      hideLoadingState();
    }
  }
  
  function renderKIRTable() {
    if (!kirTableBody) return;
    
    // Show empty state hint box if no data
    const tableContainer = document.querySelector('.kir-table-container');
    let hintBox = document.querySelector('.empty-state-hint');
    
    if (currentKIRData.length === 0) {
      // Create hint box if it doesn't exist
      if (!hintBox) {
        hintBox = document.createElement('div');
        hintBox.className = 'empty-state-hint';
        tableContainer.insertBefore(hintBox, tableContainer.firstChild);
      }
      
      hintBox.innerHTML = `
        <div class="hint-content">
          <h4>📋 Tiada data KIR dijumpai</h4>
          <p>Beberapa tips untuk menyelesaikan masalah ini:</p>
          <ul>
            <li>🔍 Kosongkan penapis carian dan cuba lagi</li>
            <li>🔒 Semak peraturan Firestore untuk akses data</li>
            <li>📁 Pastikan nama koleksi 'kir' adalah betul</li>
            <li>🌐 Periksa sambungan internet anda</li>
          </ul>
        </div>
      `;
      hintBox.style.display = 'block';
      
      kirTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
            Tiada data KIR dijumpai.
          </td>
        </tr>
      `;
      return;
    } else {
      // Hide hint box if data exists
      if (hintBox) {
        hintBox.style.display = 'none';
      }
    }
    
    kirTableBody.innerHTML = currentKIRData.map(kir => `
      <tr class="kir-row">
        <td>
          <div class="user-info">
            <div class="user-avatar">${(kir.nama_penuh || 'N').charAt(0).toUpperCase()}</div>
            <div class="user-details">
              <span class="user-name">${kir.nama_penuh || 'Tiada Nama'}</span>
              <span class="user-email">${kir.email || 'Tiada Email'}</span>
            </div>
          </div>
        </td>
        <td class="nokp">${kir.no_kp || 'Tiada No. KP'}</td>
        <td class="daerah">${kir.negeri || 'Tiada Daerah'}</td>
        <td><span class="status-badge ${mapDatabaseStatusToUI(kir.status_rekod)}">${getStatusText(kir.status_rekod)}</span></td>
        <td class="date">${formatDate(kir.tarikh_cipta)}</td>
        <td class="date">${formatDate(kir.tarikh_kemas_kini)}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Lihat Maklumat" data-action="view" data-id="${kir.id}">👁️</button>
            <button class="action-menu-btn" title="Edit KIR" data-action="edit" data-id="${kir.id}">✏️</button>
            <button class="action-menu-btn" title="Padam KIR" data-action="delete" data-id="${kir.id}">🗑️</button>
            <button class="action-menu-btn" title="Tambah AIR" data-action="add-air" data-id="${kir.id}">📋</button>
            <button class="action-menu-btn" title="Kemas Kini Kesihatan" data-action="update-health" data-id="${kir.id}">🏥</button>
          </div>
        </td>
      </tr>
    `).join('');
    
    // Update table info
    const tableInfo = document.querySelector('#senarai-kir-content .table-info');
    if (tableInfo) {
      const startIndex = (currentPage - 1) * pageSize + 1;
      const endIndex = Math.min(currentPage * pageSize, totalRecords);
      tableInfo.innerHTML = `<span>Menunjukkan <strong>${startIndex}-${endIndex}</strong> daripada <strong>${totalRecords}</strong> rekod KIR</span>`;
    }
    
    // Add action listeners
    addKIRActionListeners();
  }
  
  // Centralized status mapping - keep all status mappings in one place
  const STATUS_MAPPINGS = {
    // Database status to UI status mapping
    DB_TO_UI: {
      'Draf': 'pending',
      'Dihantar': 'pending', 
      'Disahkan': 'aktif',
      'Tidak Aktif': 'tidak-aktif'
    },
    // UI status to database status mapping
    UI_TO_DB: {
      'aktif': 'Disahkan',
      'pending': 'Dihantar',
      'tidak-aktif': 'Tidak Aktif',
      'expired': 'Tidak Aktif'
    },
    // Status display text mapping
    DISPLAY_TEXT: {
      'Draf': 'Draf',
      'Dihantar': 'Dihantar',
      'Disahkan': 'Disahkan', 
      'Tidak Aktif': 'Tidak Aktif',
      'aktif': 'Aktif',
      'pending': 'Menunggu',
      'expired': 'Tamat Tempoh',
      'tidak-aktif': 'Tidak Aktif'
    }
  };
  
  function getStatusText(status) {
    return STATUS_MAPPINGS.DISPLAY_TEXT[status] || status;
  }
  
  function mapDatabaseStatusToUI(dbStatus) {
    return STATUS_MAPPINGS.DB_TO_UI[dbStatus] || 'pending';
  }
  
  function mapStatusToDatabase(uiStatus) {
    return STATUS_MAPPINGS.UI_TO_DB[uiStatus] || uiStatus;
  }
  
  function formatDate(timestamp) {
    if (!timestamp) return 'Tiada Tarikh';
    
    let date;
    if (timestamp.toDate) {
      // Firestore timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  }
  
  function filterKIRData() {
    const searchTerm = document.getElementById('kirSearch')?.value || '';
    const statusFilter = document.getElementById('statusKirFilter')?.value || 'all';
    const negeriFilter = document.getElementById('negeriFilter')?.value || 'all';
    const namaFilter = document.getElementById('namaFilter')?.value || '';
    const nokpFilter = document.getElementById('nokpFilter')?.value || '';
    
    currentFilters = {
      search: searchTerm,
      status: statusFilter,
      negeri: negeriFilter,
      nama: namaFilter,
      nokp: nokpFilter
    };
    
    currentPage = 1; // Reset to first page when filtering
    loadKIRData();
  }
  
  function addKIRActionListeners() {
    const actionButtons = document.querySelectorAll('#senarai-kir-content .action-menu-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const id = e.target.getAttribute('data-id');
        handleKIRAction(action, id);
      });
    });
  }
  
  // Debug Bar Functions
  function updateDebugBar() {
    if (!debugState.isDebugVisible) return;
    
    // Update filters info
    const debugFilters = document.getElementById('debugFilters');
    if (debugFilters) {
      debugFilters.innerHTML = `
        <div><strong>Search:</strong> "${currentFilters.search || '(empty)'}"</div>
        <div><strong>Status:</strong> ${currentFilters.status}</div>
        <div><strong>Negeri:</strong> ${currentFilters.negeri}</div>
        <div><strong>Nama Filter:</strong> "${currentFilters.nama || '(empty)'}"</div>
        <div><strong>No. KP Filter:</strong> "${currentFilters.nokp || '(empty)'}"</div>
        <div><strong>Params sent to KIRService:</strong></div>
        <pre>${JSON.stringify(debugState.lastParams, null, 2)}</pre>
      `;
    }
    
    // Update cursor state
    const debugCursor = document.getElementById('debugCursor');
    if (debugCursor) {
      debugCursor.innerHTML = `
        <div><strong>Has Next Cursor:</strong> ${debugState.hasNextCursor ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Has Prev Cursor:</strong> ${debugState.hasPrevCursor ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Current Page:</strong> ${currentPage}</div>
        <div><strong>Page Size:</strong> ${pageSize}</div>
      `;
    }
    
    // Update data state
    const debugData = document.getElementById('debugData');
    if (debugData) {
      debugData.innerHTML = `
        <div><strong>Items Rendered:</strong> ${currentKIRData.length}</div>
        <div><strong>Total Records:</strong> ${totalRecords}</div>
        <div><strong>Last Updated:</strong> ${new Date().toLocaleTimeString()}</div>
      `;
    }
    
    // Update error state
    const debugError = document.getElementById('debugError');
    if (debugError) {
      if (debugState.lastError) {
        debugError.innerHTML = `
          <div style="color: #ef4444;"><strong>Error:</strong> ${debugState.lastError.message}</div>
          <div><strong>Code:</strong> ${debugState.lastError.code || 'N/A'}</div>
          <div><strong>Time:</strong> ${new Date(debugState.lastError.timestamp).toLocaleString()}</div>
        `;
      } else {
        debugError.innerHTML = '<div style="color: #10b981;">No errors</div>';
      }
    }
  }
  
  function toggleDebugBar() {
    const debugBar = document.getElementById('debugBar');
    const debugToggle = document.getElementById('debugToggle');
    
    if (debugBar && debugToggle) {
      debugState.isDebugVisible = !debugState.isDebugVisible;
      debugBar.style.display = debugState.isDebugVisible ? 'block' : 'none';
      debugToggle.classList.toggle('active', debugState.isDebugVisible);
      
      if (debugState.isDebugVisible) {
        updateDebugBar();
      }
    }
  }
  
  function resetFilters() {
    // Reset all filter inputs
    const kirSearch = document.getElementById('kirSearch');
    const statusKirFilter = document.getElementById('statusKirFilter');
    const negeriFilter = document.getElementById('negeriFilter');
    const namaFilter = document.getElementById('namaFilter');
    const nokpFilter = document.getElementById('nokpFilter');
    
    if (kirSearch) kirSearch.value = '';
    if (statusKirFilter) statusKirFilter.value = 'all';
    if (negeriFilter) negeriFilter.value = 'all';
    if (namaFilter) namaFilter.value = '';
    if (nokpFilter) nokpFilter.value = '';
    
    // Reset state
    currentFilters = {
      search: '',
      status: 'all',
      negeri: 'all',
      nama: '',
      nokp: ''
    };
    
    currentPage = 1;
    loadKIRData();
  }
  
  // Enhanced Summary Cards with Real Data
  async function updateSummaryCardsWithRealData() {
    try {
      // Fetch data for each status to get real counts
      const [aktifResult, menungguResult, draftResult] = await Promise.all([
        KIRService.getKIRList({ status: 'Disahkan', pageSize: 1 }),
        KIRService.getKIRList({ status: 'Dihantar', pageSize: 1 }),
        KIRService.getKIRList({ status: 'Draf', pageSize: 1 })
      ]);
      
      // Calculate counts
      const aktifCount = aktifResult.total || 0;
      const menungguCount = (menungguResult.total || 0) + (draftResult.total || 0);
      const tamatTempohCount = 0; // Set to 0 as requested
      const jumlahCount = totalRecords || (aktifCount + menungguCount);
      
      // Update summary cards
      const summaryCards = document.querySelectorAll('#senarai-kir-content .summary-card');
      if (summaryCards.length >= 4) {
        summaryCards[0].querySelector('.summary-count').textContent = aktifCount;
        summaryCards[1].querySelector('.summary-count').textContent = menungguCount;
        summaryCards[2].querySelector('.summary-count').textContent = tamatTempohCount;
        summaryCards[3].querySelector('.summary-count').textContent = jumlahCount;
      }
      
    } catch (error) {
      console.error('Error updating summary cards:', error);
      // Fallback to showing subset indicator
      const summaryCards = document.querySelectorAll('#senarai-kir-content .summary-card');
      summaryCards.forEach(card => {
        const countElement = card.querySelector('.summary-count');
        if (countElement && !countElement.textContent.includes('(subset)')) {
          countElement.textContent += ' (subset)';
        }
      });
    }
  }
  
  async function handleKIRAction(action, id) {
    const kir = currentKIRData.find(k => k.id === id);
    if (!kir) {
      showErrorMessage('KIR tidak dijumpai.');
      return;
    }
    
    switch (action) {
      case 'view':
      case 'edit':
        // Log URL before navigation for debugging
        const viewUrl = `/admin/kir/${id}${action === 'edit' ? '?mode=edit' : ''}`;
        console.log('🔗 Navigating to KIR Profile:', viewUrl);
        navigateToKIRProfile(id, action === 'edit');
        break;
      case 'delete':
        await handleDeleteKIR(kir);
        break;
      case 'add-air':
        // Log URL before navigation for debugging
        const airUrl = `/admin/kir/${id}?tab=air`;
        console.log('🔗 Navigating to KIR AIR tab:', airUrl);
        navigateToKIRProfile(id, false, 'air');
        break;
      case 'update-health':
        // Log URL before navigation for debugging
        const healthUrl = `/admin/kir/${id}?tab=kesihatan`;
        console.log('🔗 Navigating to KIR Health tab:', healthUrl);
        navigateToKIRProfile(id, false, 'kesihatan');
        break;
    }
  }
  
  function navigateToKIRProfile(kirId, editMode = false, tab = 'maklumat-asas') {
    // Map tab parameter for KIR Profile route
    let profileTab = 'maklumat-asas';
    if (tab === 'air') {
      profileTab = 'air';
    } else if (tab === 'kesihatan') {
      profileTab = 'kesihatan';
    } else if (['maklumat-asas', 'kafa', 'pendidikan', 'pekerjaan', 'kekeluargaan', 'pkir'].includes(tab)) {
      profileTab = tab;
    }
    
    // Navigate to KIR Profile route
    window.location.hash = `#/admin/kir/${kirId}?tab=${profileTab}`;
  }
  
  async function handleDeleteKIR(kir) {
    const confirmMessage = `Adakah anda pasti ingin memadam KIR untuk:\n\nNama: ${kir.nama_penuh}\nNo. KP: ${kir.no_kp}\n\nTindakan ini tidak boleh dibatalkan.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      showLoadingState();
      await KIRService.deleteKIR(kir.id);
      showSuccessMessage(`KIR untuk ${kir.nama_penuh} telah berjaya dipadam.`);
      
      // Refresh the table
      await loadKIRData();
    } catch (error) {
      console.error('Error deleting KIR:', error);
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
        showErrorMessage('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      } else {
        showErrorMessage('Ralat memadam KIR. Sila cuba lagi.');
      }
    } finally {
      hideLoadingState();
    }
  }
  
  // Helper functions for UI states
  function showLoadingState() {
    if (kirTableBody) {
      // Add CSS animation if not already present
      if (!document.querySelector('#loading-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'loading-spinner-style';
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      kirTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <div style="width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              Memuatkan data KIR...
            </div>
          </td>
        </tr>
      `;
    }
  }
  
  function hideLoadingState() {
    // Loading state will be replaced by renderKIRTable()
  }
  
  function showErrorMessage(message) {
    showMessage(message, 'error');
  }
  
  function showSuccessMessage(message) {
    showMessage(message, 'success');
  }
  
  function showMessage(message, type = 'info') {
    // Create or update message element
    let messageEl = document.querySelector('.kir-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'kir-message';
      const kirHeader = document.querySelector('.senarai-kir-header');
      if (kirHeader) {
        kirHeader.appendChild(messageEl);
      }
    }
    
    messageEl.className = `kir-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 8px;
      font-weight: 500;
      ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : ''}
      ${type === 'error' ? 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;' : ''}
      ${type === 'info' ? 'background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;' : ''}
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (messageEl && messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, 5000);
  }
  
  async function updateSummaryCards() {
    // Update summary cards with real data
    try {
      const statusCounts = {
        aktif: 0,
        pending: 0,
        expired: 0,
        total: totalRecords
      };
      
      currentKIRData.forEach(kir => {
        const uiStatus = mapDatabaseStatusToUI(kir.status_rekod);
        if (uiStatus === 'aktif') statusCounts.aktif++;
        else if (uiStatus === 'pending') statusCounts.pending++;
        else if (uiStatus === 'expired' || uiStatus === 'tidak-aktif') statusCounts.expired++;
      });
      
      // Update summary card counts
      const summaryCards = document.querySelectorAll('.summary-card .summary-count');
      if (summaryCards.length >= 4) {
        summaryCards[0].textContent = statusCounts.aktif;
        summaryCards[1].textContent = statusCounts.pending;
        summaryCards[2].textContent = statusCounts.expired;
        summaryCards[3].textContent = statusCounts.total;
      }
    } catch (error) {
      console.error('Error updating summary cards:', error);
    }
  }
  
  function updatePagination(result) {
    const paginationInfo = document.querySelector('#senarai-kir-content .pagination-info');
    const prevBtn = document.querySelector('#senarai-kir-content .pagination-btn:first-child');
    const nextBtn = document.querySelector('#senarai-kir-content .pagination-btn:last-child');
    
    if (paginationInfo) {
      paginationInfo.textContent = `Halaman ${currentPage} daripada ${result.totalPages || 1}`;
    }
    
    if (prevBtn) {
      prevBtn.disabled = currentPage <= 1;
      prevBtn.onclick = () => {
        if (currentPage > 1) {
          currentPage--;
          loadKIRData();
        }
      };
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentPage >= (result.totalPages || 1);
      nextBtn.onclick = () => {
        if (currentPage < (result.totalPages || 1)) {
          currentPage++;
          loadKIRData();
        }
      };
    }
  }
  
  // Add event listeners for filters - ensure all filter input IDs match DOM
  const filterInputs = [
    'kirSearch', 'statusKirFilter', 'negeriFilter', 'namaFilter', 'nokpFilter'
  ];
  
  filterInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      // Use debounce for text inputs, immediate for select inputs
      if (input.type === 'text') {
        input.addEventListener('input', debounce(filterKIRData, 500));
      } else {
        input.addEventListener('change', filterKIRData);
      }
    }
  });
  
  // Debounce function for search input
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Add Cipta KIR button listener
  const ciptaKIRBtn = document.getElementById('ciptaKIRBtn');
  if (ciptaKIRBtn) {
    ciptaKIRBtn.addEventListener('click', () => {
      // Navigate to Cipta KIR tab
      const ciptaKIRNav = document.querySelector('[data-section="cipta-kir"]');
      if (ciptaKIRNav) {
        ciptaKIRNav.click();
      }
    });
  }
  
  // Add debug functionality event listeners
  const debugToggle = document.getElementById('debugToggle');
  if (debugToggle) {
    debugToggle.addEventListener('click', toggleDebugBar);
  }
  
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }
  
  const reloadDataBtn = document.getElementById('reloadDataBtn');
  if (reloadDataBtn) {
    reloadDataBtn.addEventListener('click', () => {
      loadKIRData();
    });
  }
  
  // Initialize table
  loadKIRData();
  
  // Expose loadKIRData globally for other components
  window.loadKIRData = loadKIRData;
  
  // Listen for custom refresh events from other components
  window.addEventListener('kirListNeedsRefresh', (event) => {
    console.log('KIR list refresh requested:', event.detail);
    loadKIRData();
  });
}

// Function to close the enhanced add program modal
function closeAddProgramNewModal() {
  const modal = document.getElementById('add-program-new-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// Function to save a new program in the enhanced tab
async function saveProgramNew() {
  try {
    // Get form values
    const name = document.getElementById('program-name-new').value.trim();
    const description = document.getElementById('program-description-new').value.trim();
    const startDate = document.getElementById('program-start-date-new').value;
    const endDate = document.getElementById('program-end-date-new').value;
    const category = document.getElementById('program-category-new').value;
    const location = document.getElementById('program-location-new').value.trim();
    const participants = document.getElementById('program-participants-new').value;
    const budget = document.getElementById('program-budget-new').value;
    const objectives = document.getElementById('program-objectives-new').value.trim();
    
    // Validate required fields
    if (!name || !description || !startDate || !endDate || !category) {
      alert('Please fill in all required fields (Name, Description, Start Date, End Date, Category).');
      return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      alert('End date must be after start date.');
      return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#add-program-new-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    // Create enhanced program object
    const program = {
      nama_program: name,
      nama: name, // Alternative field name for compatibility
      deskripsi: description,
      description: description, // Alternative field name for compatibility
      tarikh_mula: new Date(startDate),
      tarikh_tamat: new Date(endDate),
      kategori: category,
      category: category, // Alternative field name for compatibility
      lokasi: location || '',
      location: location || '', // Alternative field name for compatibility
      participants: parseInt(participants) || 0,
      budget: parseFloat(budget) || 0,
      objectives: objectives || '',
      status: 'upcoming', // Default status
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Save program to the database
    await ProgramService.createProgram(program);
    
    // Close the modal
    closeAddProgramNewModal();
    
    // Reload programs in the enhanced tab
    await loadProgramsNew();
    
    // Show success message
    alert('Program created successfully!');
    
  } catch (error) {
    console.error('Error saving program:', error);
    alert('Failed to save program. Please try again.');
    
    // Reset button state
    const submitBtn = document.querySelector('#add-program-new-form button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Program';
      submitBtn.disabled = false;
    }
  }
}

// Initialize user management when users section is activated
export function setupUserManagementListeners() {
  const selectors = ['[data-section="user-management"]', '[data-section="users"]'];
  const navElements = selectors
    .map(selector => document.querySelector(selector))
    .filter(Boolean);
  
  navElements.forEach(navEl => {
    if (navEl.dataset.userManagementBound) return;
    navEl.dataset.userManagementBound = 'true';
    navEl.addEventListener('click', () => {
      setTimeout(() => {
        initializeUserManagement();
      }, 120);
    });
  });
  
  // Initialize immediately if section already rendered/active
  const section = document.getElementById('user-management-content');
  if (section && !section.dataset.userManagementInitialized) {
    section.dataset.userManagementInitialized = 'true';
    setTimeout(() => {
      initializeUserManagement();
    }, 50);
  }
}

// Setup listeners for new sidebar sections
export function setupSenariKIRListeners() {
  const senariKirNav = document.querySelector('[data-section="senarai-kir"]');
  if (senariKirNav) {
    senariKirNav.addEventListener('click', () => {
      setTimeout(() => {
        // Initialize KIR management for Senarai KIR section
        const senariKirTableBody = document.getElementById('senariKirTableBody');
        if (senariKirTableBody) {
          // Use the same KIR management functionality but with different table
          initializeKIRManagement('senariKirTableBody');
        }
      }, 100);
    });
  }

  // Setup listener for new Senarai KIR (New) tab
  const senariKirNewNav = document.querySelector('[data-section="senarai-kir-new"]');
  if (senariKirNewNav) {
    senariKirNewNav.addEventListener('click', () => {
      setTimeout(async () => {
        // Import and initialize the new SenaraiKIR component
        try {
          const { SenaraiKIR } = await import('./SenaraiKIR.js');
          const senariKIRNew = new SenaraiKIR();
          
          // Make instance globally available
          window.senaraiKIRNew = senariKIRNew;
          
          // Get the content container and load the component
          const contentContainer = document.getElementById('senarai-kir-new-content');
          if (contentContainer) {
            contentContainer.innerHTML = senariKIRNew.createContent();
            // Add another timeout to ensure DOM is ready
            setTimeout(async () => {
              await senariKIRNew.initialize();
            }, 100);
          } else {
            console.error('Content container not found: senarai-kir-new-content');
          }
        } catch (error) {
          console.error('Error loading SenaraiKIR component:', error);
        }
      }, 100);
    });
  }
}

export function setupReportsListeners() {
  const reportsNav = document.querySelector('[data-section="reports"]');
  const ensureInitialized = () => initializeReportsDashboard();
  if (reportsNav) {
    reportsNav.addEventListener('click', () => {
      console.log('Reports section activated');
      ensureInitialized();
    });
  }
  
  const refreshBtn = document.getElementById('reports-refresh-btn');
  if (refreshBtn && refreshBtn.dataset.listenerAttached !== 'true') {
    refreshBtn.dataset.listenerAttached = 'true';
    refreshBtn.addEventListener('click', () => initializeReportsDashboard(true));
  }
  
  const downloadBtn = document.getElementById('reports-download-btn');
  if (downloadBtn && downloadBtn.dataset.listenerAttached !== 'true') {
    downloadBtn.dataset.listenerAttached = 'true';
    downloadBtn.addEventListener('click', downloadSystemReportPDF);
  }
  
  const reportsContent = document.getElementById('reports-content');
  if (reportsContent && reportsContent.classList.contains('active')) {
    ensureInitialized();
  }
}

export function setupSettingsListeners() {
  const settingsNav = document.querySelector('[data-section="settings"]');
  const ensureInitialized = () => {
    setTimeout(() => initializeAdminPasswordForm(), 100);
  };
  if (settingsNav) {
    settingsNav.addEventListener('click', () => {
      console.log('Settings section activated');
      ensureInitialized();
    });
  }
  const settingsContent = document.getElementById('settings-content');
  if (settingsContent && settingsContent.classList.contains('active')) {
    ensureInitialized();
  }
}

function initializeAdminPasswordForm() {
  const form = document.getElementById('adminChangePasswordForm');
  if (!form || form.dataset.listenerAttached === 'true') return;
  form.dataset.listenerAttached = 'true';
  const statusElement = document.getElementById('adminChangePasswordStatus');
  const submitBtn = form.querySelector('button[type=\"submit\"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = form.querySelector('#adminCurrentPassword')?.value.trim();
    const newPassword = form.querySelector('#adminNewPassword')?.value.trim();
    const confirmPassword = form.querySelector('#adminConfirmPassword')?.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormStatusMessage(statusElement, 'Sila isi semua ruangan.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormStatusMessage(statusElement, 'Kata laluan baharu tidak sepadan.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      setFormStatusMessage(statusElement, 'Kata laluan baharu mesti sekurang-kurangnya 6 aksara.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }
      setFormStatusMessage(statusElement, 'Sedang mengemaskini kata laluan...', '');
      await FirebaseAuthService.changePasswordWithCurrentPassword(currentPassword, newPassword);
      setFormStatusMessage(statusElement, 'Kata laluan berjaya dikemas kini.', 'success');
      form.reset();
    } catch (error) {
      setFormStatusMessage(statusElement, error.message || 'Gagal menukar kata laluan.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
      }
    }
  });
}

function setFormStatusMessage(element, message, type = '') {
  if (!element) return;
  element.style.display = message ? 'block' : 'none';
  element.textContent = message || '';
  element.classList.remove('success', 'error');
  if (type) {
    element.classList.add(type);
  }
}

// Initialize KIR management when senarai-kir section is activated
export function setupKIRManagementListeners() {
  const senariKIRNav = document.querySelector('[data-section="senarai-kir"]');
  if (senariKIRNav) {
    senariKIRNav.addEventListener('click', () => {
      setTimeout(() => {
        initializeKIRManagement();
      }, 100);
    });
  }
}

// Initialize Cipta KIR wizard when cipta-kir section is activated
export function setupCiptaKIRListeners() {
  const ciptaKIRNav = document.querySelector('[data-section="cipta-kir"]');
  if (ciptaKIRNav) {
    ciptaKIRNav.addEventListener('click', () => {
      console.log('Cipta KIR nav clicked, waiting for DOM...');
      setTimeout(() => {
        // Clear any existing draft data to start fresh
        localStorage.removeItem('ciptaKIR_draft');
        localStorage.removeItem('wizardKirId');
        
        // Initialize wizard when form elements are ready
        initializeBasicWizard();
      }, 300); // Increased timeout to ensure DOM is ready
    });
  }
}

// Initialize KIR Sync Dashboard when kir-sync section is activated


// Setup event listeners for Program & Kehadiran overview buttons
function setupProgramKehadiranOverviewListeners() {
  const manageBtn = document.getElementById('manage-programs-btn');
  const attendanceBtn = document.getElementById('view-attendance-btn');
  const reportsBtn = document.getElementById('generate-reports-btn');
  
  if (manageBtn) {
    manageBtn.addEventListener('click', () => {
      showProgramSubSection('program-management-content');
    });
  }
  
  if (attendanceBtn) {
    attendanceBtn.addEventListener('click', () => {
      showProgramSubSection('attendance-tracking-content');
    });
  }
  
  if (reportsBtn) {
    reportsBtn.addEventListener('click', () => {
      showProgramSubSection('program-reports-content');
    });
  }
}

// Setup event listeners for Program Management section
async function setupProgramManagementListeners(programService) {
  const createTestProgramBtn = document.getElementById('create-test-program-btn');
  const addProgramBtn = document.getElementById('add-program-btn');
  const backBtn = document.getElementById('program-management-back-btn');
  
  if (createTestProgramBtn) {
    createTestProgramBtn.addEventListener('click', async () => {
      try {
        // Create a test program with unique timestamp to avoid duplicates
        const timestamp = new Date().toISOString();
        const testProgram = {
          nama_program: `Test Program ${timestamp}`,
          deskripsi: 'This is a test program created automatically',
          tarikh_mula: new Date().toISOString().split('T')[0],
          tarikh_tamat: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          kategori: 'Test',
          status: 'Upcoming',
          env: 'production'
        };
        
        await programService.createProgram(testProgram);
        showNotification('Test program created successfully!', 'success');
        // Reload programs table if it exists
        // loadPrograms();
      } catch (error) {
        console.error('Error creating test program:', error);
        showNotification(error.message || 'Failed to create test program', 'error');
      }
    });
  }
  
  if (addProgramBtn) {
    addProgramBtn.addEventListener('click', () => {
      // Show program form modal or navigate to program creation page
      
    });
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showProgramSubSection('program-kehadiran-overview');
    });
  }
}

// Setup Program & Kehadiran navigation listener
export function setupProgramKehadiranListeners() {
  const programNav = document.querySelector('[data-section="program-kehadiran"]');
  if (programNav) {
    programNav.addEventListener('click', () => {
      console.log('Program & Kehadiran nav clicked, loading page...');
      setTimeout(async () => {
        await initializeProgramKehadiran();
      }, 100);
    });
    
    // Also initialize if this section is currently active
    if (document.getElementById('program-kehadiran-content').classList.contains('active')) {
      console.log('Program & Kehadiran section is active on load, initializing...');
      setTimeout(async () => {
        await initializeProgramKehadiran();
      }, 100);
    }
  }
}

// Setup Program & Kehadiran (New) navigation listener
export function setupProgramKehadiranNewListeners() {
  const programNewNav = document.querySelector('[data-section="program-kehadiran-new"]');
  if (programNewNav) {
    programNewNav.addEventListener('click', () => {
      console.log('Program & Kehadiran (New) nav clicked, loading page...');
      setTimeout(async () => {
        await initializeProgramKehadiranNew();
      }, 100);
    });
    
    // Also initialize if this section is currently active
    if (document.getElementById('program-kehadiran-new-content').classList.contains('active')) {
      console.log('Program & Kehadiran (New) section is active on load, initializing...');
      setTimeout(async () => {
        await initializeProgramKehadiranNew();
      }, 100);
    }
  }
}

export function setupProgramKehadiranNewestListeners() {
    const programNewestNav = document.querySelector('[data-section="program-kehadiran-newest"]');

    const loadNewestModule = async () => {
      try {
      const container = document.getElementById('program-kehadiran-newest-content');
      if (!container) {
        console.error('Content container not found: program-kehadiran-newest-content');
        return;
      }

      if (container.dataset.programNewestLoaded === "true" && window.programKehadiranNewest) {
        return;
      }

      const { ProgramKehadiranNewest } = await import('./ProgramKehadiranNewest.js');
      const programNewest = new ProgramKehadiranNewest();
      window.programKehadiranNewest = programNewest;
      container.innerHTML = programNewest.createContent();

      try {
        await programNewest.initialize();
        container.dataset.programNewestLoaded = "true";
      } catch (initError) {
        console.error('Error initializing Program & Kehadiran (Newest):', initError);
      }
    } catch (error) {
      console.error('Error loading ProgramKehadiranNewest module:', error);
    }
  };

  if (programNewestNav) {
    programNewestNav.addEventListener('click', () => {
      console.log('Program & Kehadiran (Newest) nav clicked, loading module...');
      setTimeout(loadNewestModule, 100);
    });
  }

  const initialContainer = document.getElementById('program-kehadiran-newest-content');
  if (initialContainer && initialContainer.classList.contains('active')) {
    console.log('Program & Kehadiran (Newest) section is active on load, initializing...');
    setTimeout(loadNewestModule, 100);
    }
  }

export function setupFinancialTrackingNewestListeners() {
  const newestNav = document.querySelector('[data-section="financial-tracking-newest"]');

  const loadNewestTracking = async ({ forceShow = false } = {}) => {
    try {
      const container = document.getElementById('financial-tracking-newest-content');
      if (!container) {
        console.error('Content container not found: financial-tracking-newest-content');
        return;
      }

      if (container.dataset.financialNewestLoaded === 'true' && window.financialTrackingNewest) {
        if (forceShow) {
          if (typeof window.financialTrackingNewest.showSection === 'function') {
            window.financialTrackingNewest.showSection('overview');
          }
          if (typeof window.financialTrackingNewest.refreshSummary === 'function') {
            window.financialTrackingNewest.refreshSummary();
          }
        }
        return;
      }

      const { FinancialTrackingNewest } = await import('./FinancialTrackingNewest.js');
      const module = new FinancialTrackingNewest();
      window.financialTrackingNewest = module;

      container.innerHTML = module.createContent();
      try {
        await module.initialize();
        container.dataset.financialNewestLoaded = 'true';
        if (typeof module.showSection === 'function') {
          module.showSection('overview');
        }
        if (typeof module.refreshSummary === 'function') {
          module.refreshSummary();
        }
      } catch (initError) {
        console.error('Error initializing Financial Tracking (Newest):', initError);
      }
    } catch (error) {
      console.error('Error loading FinancialTrackingNewest module:', error);
    }
  };

  if (newestNav) {
    newestNav.addEventListener('click', (event) => {
      event.preventDefault();
      setTimeout(() => loadNewestTracking({ forceShow: true }), 100);
    });
  }

  const initialContainer = document.getElementById('financial-tracking-newest-content');
  if (initialContainer && initialContainer.classList.contains('active')) {
    setTimeout(() => loadNewestTracking({ forceShow: true }), 100);
  }
}

// Setup Financial Tracking navigation listener
export function setupFinancialTrackingListeners() {
  const financialNav = document.querySelector('[data-section="financial-tracking"]');
  
  // Handle main financial tracking nav click
  if (financialNav) {
    financialNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Financial Tracking nav clicked');
      
      // Show overview by default when clicking on Financial Tracking
      setTimeout(() => {
        showFinancialSubTab('overview');
      }, 100);
    });
  }
  
  // Setup Money In and Money Out button listeners
  const moneyInBtn = document.getElementById('money-in-btn');
  const moneyOutBtn = document.getElementById('money-out-btn');
  
  if (moneyInBtn) {
    moneyInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Money In button clicked');
      showFinancialSubTab('money-in');
    });
  }
  
  if (moneyOutBtn) {
    moneyOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Money Out button clicked');
      showFinancialSubTab('money-out');
    });
  }
  
  // Setup Back buttons for Money In and Money Out pages
  const moneyInBackBtn = document.getElementById('money-in-back-btn');
  const moneyOutBackBtn = document.getElementById('money-out-back-btn');
  
  if (moneyInBackBtn) {
    moneyInBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Money In Back button clicked');
      showFinancialSubTab('overview');
    });
  }
  
  if (moneyOutBackBtn) {
    moneyOutBackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Money Out Back button clicked');
      showFinancialSubTab('overview');
    });
  }
}

// Show specific financial sub-tab content
function showFinancialSubTab(subTab) {
  console.log(`Showing financial sub-tab: ${subTab}`);
  
  // Hide all sub-content sections
  const subContentSections = document.querySelectorAll('.sub-content-section');
  subContentSections.forEach(section => section.classList.remove('active'));
  
  // Show the selected sub-tab content
  let targetSection;
  switch(subTab) {
    case 'overview':
      targetSection = document.getElementById('financial-overview-content');
      initializeFinancialOverview();
      break;
    case 'money-in':
      targetSection = document.getElementById('financial-money-in-content');
      initializeMoneyIn();
      break;
    case 'money-out':
      targetSection = document.getElementById('financial-money-out-content');
      initializeMoneyOut();
      break;
    default:
      targetSection = document.getElementById('financial-overview-content');
      initializeFinancialOverview();
  }
  
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

// Initialize Financial Overview (main dashboard)
function initializeFinancialOverview() {
  console.log('Initializing Financial Overview...');
  
  // Load financial data and update summary cards
  loadFinancialSummary();
  
  // Setup event listeners for financial reports
  setupFinancialReportListeners();
  
  // Setup chart controls
  setupChartControls();
}

// Initialize Money In sub-tab
function initializeMoneyIn() {
  console.log('Initializing Money In Form...');
  
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('income-date');
  if (dateInput) {
    dateInput.value = today;
  }
  
  // Setup form event listeners
  setupIncomeFormListeners();
}

// Initialize Money Out sub-tab
function initializeMoneyOut() {
  console.log('Initializing Money Out Form...');
  
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('expense-date');
  if (dateInput) {
    dateInput.value = today;
  }
  
  // Setup form event listeners
  setupExpenseFormListeners();
}

async function fetchFinancialTotals() {
  try {
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    
    let totalIncome = 0;
    let totalExpenses = 0;
    
    const incomeQuery = query(
      collection(db, COLLECTIONS.FINANCIAL_INCOME),
      createEnvFilter()
    );
    const incomeSnapshot = await getDocs(incomeQuery);
    totalIncome = incomeSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (parseFloat(data.amount) || 0);
    }, 0);
    
    const expenseQuery = query(
      collection(db, COLLECTIONS.FINANCIAL_EXPENSES),
      createEnvFilter()
    );
    const expenseSnapshot = await getDocs(expenseQuery);
    totalExpenses = expenseSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (parseFloat(data.amount) || 0);
    }, 0);
    
    return {
      totalIncome,
      totalExpenses,
      currentBalance: totalIncome - totalExpenses
    };
  } catch (error) {
    console.error('Error fetching financial totals:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      currentBalance: 0
    };
  }
}

// Load and display financial summary data
async function loadFinancialSummary() {
  try {
    const { totalIncome, currentBalance } = await fetchFinancialTotals();
    
    // Today's transactions section removed as requested
  
  // Update summary cards
  const totalIncomeEl = document.getElementById('total-income');
  const totalExpensesEl = document.getElementById('total-expenses');
  const netBalanceEl = document.getElementById('net-balance');
  const balanceChangeEl = document.getElementById('balance-change');
  
  // Jumlah Terkumpul = total income (all money received)
  if (totalIncomeEl) totalIncomeEl.textContent = `RM ${totalIncome.toLocaleString('en-MY', {minimumFractionDigits: 2})}`;
  
  // Baki Semasa = current balance (income minus expenses)
  if (totalExpensesEl) totalExpensesEl.textContent = `RM ${currentBalance.toLocaleString('en-MY', {minimumFractionDigits: 2})}`;
  
  // Remove Pending Income (not needed anymore)
  if (netBalanceEl) netBalanceEl.style.display = 'none';
  if (document.querySelector('.stat-card:last-child')) {
    document.querySelector('.stat-card:last-child').style.display = 'none';
  }
  
  if (balanceChangeEl) {
    if (currentBalance > 0) {
      balanceChangeEl.textContent = 'Positive balance';
      balanceChangeEl.className = 'stat-change positive';
    } else if (currentBalance < 0) {
      balanceChangeEl.textContent = 'Negative balance';
      balanceChangeEl.className = 'stat-change negative';
    } else {
      balanceChangeEl.textContent = 'Balanced';
      balanceChangeEl.className = 'stat-change neutral';
    }
  }
  
  } catch (error) {
    console.error('Error loading financial summary:', error);
    
    // Fallback to RM0 values on error
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const netBalanceEl = document.getElementById('net-balance');
    const balanceChangeEl = document.getElementById('balance-change');
    
    if (totalIncomeEl) totalIncomeEl.textContent = 'RM 0.00';
    if (totalExpensesEl) totalExpensesEl.textContent = 'RM 0.00';
    
    // Hide the Pending Income card
    if (netBalanceEl) netBalanceEl.style.display = 'none';
    if (document.querySelector('.stat-card:last-child')) {
      document.querySelector('.stat-card:last-child').style.display = 'none';
    }
    
    if (balanceChangeEl) {
      balanceChangeEl.textContent = 'No data available';
      balanceChangeEl.className = 'stat-change neutral';
    }
  }
}

async function loadDashboardStats() {
  if (dashboardStatsLoadingPromise) {
    return dashboardStatsLoadingPromise;
  }
  
  const pendingLoad = (async () => {
    try {
      const { collection, getCountFromServer, getDocs, query } = await import('firebase/firestore');
      const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
      
      const buildQuery = (collectionName, useEnvFilter = true) => {
        const baseRef = collection(db, collectionName);
        return useEnvFilter ? query(baseRef, createEnvFilter()) : baseRef;
      };
      
      const fetchCount = async (collectionName, useEnvFilter = true) => {
        const target = buildQuery(collectionName, useEnvFilter);
        try {
          const snapshot = await getCountFromServer(target);
          return snapshot.data().count || 0;
        } catch (countError) {
          console.warn(`Falling back to document scan for ${collectionName}:`, countError.message);
          const docsSnapshot = await getDocs(target);
          return docsSnapshot.size;
        }
      };
      
      const [
        totalUsers,
        totalKIR,
        totalPKIR,
        totalAIR,
        financialTotals
      ] = await Promise.all([
        fetchCount(COLLECTIONS.USERS, false),
        fetchCount(COLLECTIONS.KIR, true),
        fetchCount(COLLECTIONS.KIR_PASANGAN, true),
        fetchCount(COLLECTIONS.KIR_AIR, true),
        fetchFinancialTotals()
      ]);
      
      const programSnapshot = await getDocs(buildQuery(COLLECTIONS.PROGRAM));
      const totalPrograms = programSnapshot.size;
      const now = new Date();
      const statusCounts = {
        upcoming: 0,
        active: 0,
        completed: 0,
        cancelled: 0
      };
      
      const programDocs = programSnapshot.docs.map(doc => {
        const data = doc.data();
        const startDate = normalizeToDate(data.tarikh_mula || data.startDate);
        const endDate = normalizeToDate(data.tarikh_tamat || data.endDate);
        const statusKey = determineProgramStatus(data, startDate, endDate, now);
        if (statusCounts[statusKey] !== undefined) {
          statusCounts[statusKey]++;
        } else {
          statusCounts.upcoming++;
        }
        return {
          id: doc.id,
          ...data,
          startDate,
          endDate
        };
      });
      
      const upcomingProgram = programDocs
        .filter(program => program.startDate && program.startDate >= now)
        .sort((a, b) => a.startDate - b.startDate)[0];
      
      updateStatValue('dashboard-total-users', formatNumber(totalUsers));
      updateStatValue('dashboard-total-kir', formatNumber(totalKIR));
      updateStatValue('dashboard-total-pkir', formatNumber(totalPKIR));
      updateStatValue('dashboard-total-air', formatNumber(totalAIR));
      updateStatValue('dashboard-total-programs', formatNumber(totalPrograms));
      updateStatValue('dashboard-total-household-records', formatNumber(totalKIR + totalPKIR + totalAIR));
      updateStatValue('dashboard-current-balance', formatCurrency(financialTotals.currentBalance));
      await renderProgramStatusChart(statusCounts);
      
      if (upcomingProgram) {
        const programName = upcomingProgram.nama_program || upcomingProgram.nama || upcomingProgram.name || 'Upcoming Program';
        const programDate = formatProgramDateRange(
          upcomingProgram.startDate,
          upcomingProgram.endDate,
          upcomingProgram.lokasi || upcomingProgram.location
        );
        updateStatValue('dashboard-upcoming-program-name', programName);
        updateStatValue('dashboard-upcoming-program-date', programDate);
      } else {
        updateStatValue('dashboard-upcoming-program-name', 'Tiada Program Dijadualkan');
        updateStatValue('dashboard-upcoming-program-date', 'Semua program yang dijadualkan telah selesai');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      resetDashboardStatsToFallback();
      setChartEmptyState('program-status', false, 'Unable to load program data');
    } finally {
      dashboardStatsLoadingPromise = null;
    }
  })();
  
  dashboardStatsLoadingPromise = pendingLoad;
  return pendingLoad;
}

function updateStatValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString('en-MY') : '-';
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return 'RM 0.00';
  }
  return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeToDate(value) {
  if (!value) return null;
  if (typeof value === 'object' && value !== null) {
    if (typeof value.toDate === 'function') {
      const date = value.toDate();
      return Number.isNaN(date?.getTime()) ? null : date;
    }
    if (typeof value.seconds === 'number') {
      const date = new Date(value.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatProgramDateRange(startDate, endDate, location) {
  if (!startDate) {
    return 'Date not available';
  }
  
  const startText = formatDateForDisplay(startDate);
  const endText = endDate && endDate.toDateString() !== startDate.toDateString()
    ? ` - ${formatDateForDisplay(endDate)}`
    : '';
  const locationText = location ? ` | ${location}` : '';
  return `${startText}${endText}${locationText}`;
}

function formatDateForDisplay(date) {
  return date?.toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) || '';
}

function resetDashboardStatsToFallback() {
  updateStatValue('dashboard-total-users', '-');
  updateStatValue('dashboard-total-kir', '-');
  updateStatValue('dashboard-total-pkir', '-');
  updateStatValue('dashboard-total-air', '-');
  updateStatValue('dashboard-total-programs', '-');
  updateStatValue('dashboard-total-household-records', '-');
  updateStatValue('dashboard-current-balance', 'RM 0.00');
  updateStatValue('dashboard-upcoming-program-name', 'Unable to load data');
  updateStatValue('dashboard-upcoming-program-date', 'Refresh the dashboard to try again');
}

function determineProgramStatus(program, startDate, endDate, now = new Date()) {
  const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
  if (typeof program?.status === 'string') {
    const normalized = program.status.trim().toLowerCase();
    if (validStatuses.includes(normalized)) {
      return normalized;
    }
  }
  
  if (startDate && endDate) {
    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'active';
    if (now > endDate) return 'completed';
  }
  
  if (startDate) {
    return now < startDate ? 'upcoming' : 'active';
  }
  
  return 'upcoming';
}

async function loadChartModule() {
  if (!chartModulePromise) {
    chartModulePromise = import('chart.js/auto');
  }
  return chartModulePromise;
}

async function loadFinancialTrendChart(monthCount = 6) {
  if (financialTrendLoadingPromise) {
    return financialTrendLoadingPromise;
  }
  
  const pendingLoad = (async () => {
    try {
      const { collection, getDocs, query } = await import('firebase/firestore');
      const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
      
      const [incomeSnapshot, expenseSnapshot] = await Promise.all([
        getDocs(query(collection(db, COLLECTIONS.FINANCIAL_INCOME), createEnvFilter())),
        getDocs(query(collection(db, COLLECTIONS.FINANCIAL_EXPENSES), createEnvFilter()))
      ]);
      
      const monthBuckets = createMonthBuckets(monthCount);
      const bucketMap = new Map(monthBuckets.map(bucket => [bucket.key, bucket]));
      
      const accumulateRecords = (snapshot, type) => {
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const amount = parseFloat(data.amount);
          if (!Number.isFinite(amount) || amount === 0) {
            return;
          }
          const entryDate = normalizeToDate(data.date || data.tarikh || data.tarikh_cipta || data.tarikh_transaksi);
          if (!entryDate) return;
          const key = formatMonthKey(entryDate);
          const bucket = bucketMap.get(key);
          if (bucket) {
            bucket[type] += amount;
          }
        });
      };
      
      accumulateRecords(incomeSnapshot, 'income');
      accumulateRecords(expenseSnapshot, 'expenses');
      
      await renderFinancialTrendChart(monthBuckets);
    } catch (error) {
      console.error('Error loading financial trend chart:', error);
      if (financialTrendChartInstance) {
        financialTrendChartInstance.destroy();
        financialTrendChartInstance = null;
      }
      setChartEmptyState('financial-trend', false, 'Unable to load financial data');
    } finally {
      financialTrendLoadingPromise = null;
    }
  })();
  
  financialTrendLoadingPromise = pendingLoad;
  return pendingLoad;
}

async function loadAttendanceLeaderList(limit = 3) {
  if (attendanceLeaderLoadingPromise) {
    return attendanceLeaderLoadingPromise;
  }
  
  const pendingLoad = (async () => {
    try {
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
      const attendanceRecords = await ProgramService.listAllAttendance();
      
      if (!attendanceRecords || attendanceRecords.length === 0) {
        renderAttendanceLeaderList([], []);
        return;
      }
      
      const participantMap = new Map();
      attendanceRecords.forEach(record => {
        const id = record.participantId;
        if (!id) return;
        if (!participantMap.has(id)) {
          participantMap.set(id, {
            id,
            name: record.participantName || 'Unknown',
            type: record.participantType || 'N/A',
            presentCount: 0,
            totalPrograms: 0
          });
        }
        const participant = participantMap.get(id);
        participant.totalPrograms++;
        if (record.present) {
          participant.presentCount++;
        }
      });
      
      const participants = Array.from(participantMap.values()).map(p => ({
        ...p,
        attendancePercentage: p.totalPrograms > 0 ? Math.round((p.presentCount / p.totalPrograms) * 100) : 0
      }));
      
      if (participants.length === 0) {
        setChartEmptyState('attendance-leaders', false, 'No attendance data recorded yet');
        return;
      }
      
      const best = [...participants]
        .sort((a, b) => b.attendancePercentage - a.attendancePercentage)
        .slice(0, limit);
      const worst = [...participants]
        .sort((a, b) => a.attendancePercentage - b.attendancePercentage)
        .slice(0, limit);
      
      renderAttendanceLeaderList(best, worst);
    } catch (error) {
      console.error('Error loading attendance leaders chart:', error);
      renderAttendanceLeaderList([], []);
      const emptyElement = document.getElementById('attendance-leaders-empty');
      if (emptyElement) {
        emptyElement.textContent = 'Unable to load attendance data';
      }
    } finally {
      attendanceLeaderLoadingPromise = null;
    }
  })();
  
  attendanceLeaderLoadingPromise = pendingLoad;
  return pendingLoad;
}

function createMonthBuckets(monthCount) {
  const now = new Date();
  const buckets = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = formatMonthKey(date);
    buckets.push({
      key,
      label: date.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' }),
      income: 0,
      expenses: 0
    });
  }
  return buckets;
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function renderFinancialTrendChart(buckets = []) {
  const canvas = document.getElementById('financial-trend-chart');
  if (!canvas) return;
  
  const hasData = buckets.some(bucket => bucket.income > 0 || bucket.expenses > 0);
  setChartEmptyState('financial-trend', hasData, 'No financial data recorded yet');
  
  if (!hasData) {
    if (financialTrendChartInstance) {
      financialTrendChartInstance.destroy();
      financialTrendChartInstance = null;
    }
    return;
  }
  
  const { Chart } = await loadChartModule();
  const labels = buckets.map(bucket => bucket.label);
  const incomeData = buckets.map(bucket => bucket.income);
  const expenseData = buckets.map(bucket => bucket.expenses);
  
  if (financialTrendChartInstance) {
    financialTrendChartInstance.destroy();
  }
  
  financialTrendChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5'
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#f97316'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: RM ${context.formattedValue}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `RM ${value}`
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

async function renderProgramStatusChart(counts = {}) {
  const canvas = document.getElementById('program-status-chart');
  if (!canvas) return;
  
  const labels = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
  const colors = ['#4f46e5', '#22c55e', '#64748b', '#ef4444'];
  const keys = ['upcoming', 'active', 'completed', 'cancelled'];
  const data = keys.map(key => counts[key] || 0);
  const total = data.reduce((sum, value) => sum + value, 0);
  const hasData = total > 0;
  
  setChartEmptyState('program-status', hasData, 'Tiada Program Dijadualkan');
  
  if (!hasData) {
    if (programStatusChartInstance) {
      programStatusChartInstance.destroy();
      programStatusChartInstance = null;
    }
    return;
  }
  
  const { Chart } = await loadChartModule();
  
  if (programStatusChartInstance) {
    programStatusChartInstance.destroy();
  }
  
  programStatusChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderAttendanceLeaderList(best = [], worst = []) {
  const container = document.getElementById('attendance-leaders-container');
  const bestList = document.getElementById('attendance-best-list');
  const worstList = document.getElementById('attendance-worst-list');
  if (!container || !bestList || !worstList) return;
  
  const hasData = best.length + worst.length > 0;
  setChartEmptyState('attendance-leaders', hasData, 'No attendance data recorded yet');
  container.style.display = hasData ? 'grid' : 'none';
  
  const buildItems = (items, variant) => {
    if (!items.length) {
      return '<li class="leader-item"><div class="leader-info"><span class="leader-name">No data</span><span class="leader-meta">-</span></div><span class="leader-score">-</span></li>';
    }
    return items.map((p, index) => {
      const percentage = `${p.attendancePercentage}%`;
      return `
        <li class="leader-item">
          <div class="leader-info">
            <span class="leader-name">${index + 1}. ${p.name || 'Unknown'}</span>
            <span class="leader-meta">${p.type || 'N/A'} • ${p.presentCount}/${p.totalPrograms} programs</span>
          </div>
          <span class="leader-score ${variant === 'positive' ? 'positive' : 'negative'}">${percentage}</span>
        </li>
      `;
    }).join('');
  };
  
  bestList.innerHTML = buildItems(best, 'positive');
  worstList.innerHTML = buildItems(worst, 'negative');
}

function setChartEmptyState(chartId, hasData, emptyMessage) {
  const emptyElement = document.getElementById(`${chartId}-empty`);
  if (!emptyElement) return;
  if (hasData) {
    emptyElement.style.display = 'none';
  } else {
    emptyElement.style.display = 'flex';
    if (emptyMessage) {
      emptyElement.textContent = emptyMessage;
    }
  }
}

// Setup event listeners for financial report buttons
function setupFinancialReportListeners() {
  const generateIncomeBtn = document.getElementById('generate-income-report');
  const generateExpenseBtn = document.getElementById('generate-expense-report');
  const exportDataBtn = document.getElementById('export-financial-data');
  const showAllTransactionsBtn = document.getElementById('show-all-transactions');
  
  if (generateIncomeBtn) {
    generateIncomeBtn.addEventListener('click', () => {
      alert('Income report generation feature coming soon!');
    });
  }
  
  if (generateExpenseBtn) {
    generateExpenseBtn.addEventListener('click', () => {
      alert('Expense report generation feature coming soon!');
    });
  }
  
  if (showAllTransactionsBtn) {
    showAllTransactionsBtn.addEventListener('click', () => {
      showAllTransactionsModal();
    });
  }
  
  // Setup modal close button
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('all-transactions-modal');
      if (modal) modal.style.display = 'none';
    });
  }
  
  // Setup transaction filters
  const typeFilter = document.getElementById('transaction-type-filter');
  const dateFilter = document.getElementById('transaction-date-filter');
  const resetFiltersBtn = document.getElementById('reset-transaction-filters');
  
  if (typeFilter) {
    typeFilter.addEventListener('change', filterTransactions);
  }
  
  if (dateFilter) {
    dateFilter.addEventListener('change', filterTransactions);
  }
  
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (typeFilter) typeFilter.value = 'all';
      if (dateFilter) dateFilter.value = '';
      filterTransactions();
    });
  }
  
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', () => {
      alert('Financial data export feature coming soon!');
    });
  }
}

// Setup chart controls
function setupChartControls() {
  const trendPeriodSelect = document.getElementById('trend-period');
  
  if (trendPeriodSelect) {
    trendPeriodSelect.addEventListener('change', (e) => {
      console.log('Chart period changed to:', e.target.value);
      // In a real app, this would update the chart data
      alert(`Chart updated for period: ${e.target.value}`);
    });
  }
}

// Show all transactions modal
async function showAllTransactionsModal() {
  const modal = document.getElementById('all-transactions-modal');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  // Load all transactions
  await loadAllTransactions();
}

// Load all transactions from Firestore
async function loadAllTransactions() {
  const transactionsList = document.getElementById('all-transactions-list');
  if (!transactionsList) return;
  
  transactionsList.innerHTML = '<p class="loading-text">Loading transactions...</p>';
  
  try {
    // Import Firebase functions
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    
    // Fetch all income transactions
    const incomeQuery = query(
      collection(db, COLLECTIONS.FINANCIAL_INCOME),
      createEnvFilter()
      // Note: orderBy removed as it's causing issues
    );
    const incomeSnapshot = await getDocs(incomeQuery);
    const incomeTransactions = incomeSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'income',
        amount: parseFloat(data.amount) || 0,
        description: data.description || '',
        category: data.category || '',
        date: data.date ? new Date(data.date) : new Date(),
        formattedDate: data.date ? new Date(data.date).toLocaleDateString('en-MY') : 'Unknown date'
      };
    });
    
    // Fetch all expense transactions
    const expenseQuery = query(
      collection(db, COLLECTIONS.FINANCIAL_EXPENSES),
      createEnvFilter()
      // Note: orderBy removed as it's causing issues
    );
    const expenseSnapshot = await getDocs(expenseQuery);
    const expenseTransactions = expenseSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'expense',
        amount: parseFloat(data.amount) || 0,
        description: data.description || '',
        category: data.category || '',
        date: data.date ? new Date(data.date) : new Date(),
        formattedDate: data.date ? new Date(data.date).toLocaleDateString('en-MY') : 'Unknown date'
      };
    });
    
    // Combine and sort all transactions by date (newest first)
    const allTransactions = [...incomeTransactions, ...expenseTransactions];
    allTransactions.sort((a, b) => b.date - a.date);
    
    // Store transactions in a global variable for filtering
    window.allTransactionsData = allTransactions;
    
    // Display transactions
    displayTransactions(allTransactions);
    
  } catch (error) {
    console.error('Error loading transactions:', error);
    transactionsList.innerHTML = '<p class="error-text">Error loading transactions. Please try again.</p>';
  }
}

// Display transactions in the modal
function displayTransactions(transactions) {
  const transactionsList = document.getElementById('all-transactions-list');
  if (!transactionsList) return;
  
  if (transactions.length === 0) {
    transactionsList.innerHTML = '<p class="empty-text">No transactions found.</p>';
    return;
  }
  
  let html = '';
  
  transactions.forEach(transaction => {
    const amountFormatted = transaction.amount.toLocaleString('en-MY', {minimumFractionDigits: 2});
    const typeClass = transaction.type === 'income' ? 'income-transaction' : 'expense-transaction';
    const typeIcon = transaction.type === 'income' ? '💵' : '💸';
    
    html += `
      <div class="transaction-item ${typeClass}" data-id="${transaction.id}" data-type="${transaction.type}" data-date="${transaction.date.toISOString()}">
        <div class="transaction-icon">${typeIcon}</div>
        <div class="transaction-details">
          <div class="transaction-header">
            <h4>${transaction.description}</h4>
            <span class="transaction-date">${transaction.formattedDate}</span>
          </div>
          <div class="transaction-info">
            <span class="transaction-category">${transaction.category}</span>
            <span class="transaction-amount">RM ${amountFormatted}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  transactionsList.innerHTML = html;
}

// Filter transactions based on selected filters
function filterTransactions() {
  if (!window.allTransactionsData) return;
  
  const typeFilter = document.getElementById('transaction-type-filter');
  const dateFilter = document.getElementById('transaction-date-filter');
  
  const typeValue = typeFilter ? typeFilter.value : 'all';
  const dateValue = dateFilter ? dateFilter.value : '';
  
  let filteredTransactions = [...window.allTransactionsData];
  
  // Filter by type
  if (typeValue !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.type === typeValue);
  }
  
  // Filter by date
  if (dateValue) {
    const filterDate = new Date(dateValue);
    filterDate.setHours(0, 0, 0, 0);
    
    filteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === filterDate.getTime();
    });
  }
  
  // Display filtered transactions
  displayTransactions(filteredTransactions);
}

// Load income data for Money In sub-tab
async function loadIncomeData() {
  console.log('Loading income data...');
  
  try {
    // Import Firebase functions
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    
    let totalIncome = 0;
    
    // Fetch income data from Firebase
    try {
      const incomeQuery = query(
        collection(db, COLLECTIONS.FINANCIAL_INCOME),
        createEnvFilter()
      );
      const incomeSnapshot = await getDocs(incomeQuery);
      totalIncome = incomeSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (parseFloat(data.amount) || 0);
      }, 0);
    } catch (error) {
      console.log('No income data found:', error.message);
    }
    
    const incomeData = {
      totalIncome: totalIncome,
      monthlyIncome: 0,
      incomeGrowth: 0,
      topSources: []
    };
    
    // Update income summary cards
    updateIncomeCards(incomeData);
  } catch (error) {
    console.error('Error loading income data:', error);
    
    // Fallback to RM0 values
    const incomeData = {
      totalIncome: 0,
      monthlyIncome: 0,
      incomeGrowth: 0,
      topSources: []
    };
    updateIncomeCards(incomeData);
  }
}

// Load expense data for Money Out sub-tab
async function loadExpenseData() {
  console.log('Loading expense data...');
  
  try {
    // Import Firebase functions
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    
    let totalExpenses = 0;
    
    // Fetch expense data from Firebase
    try {
      const expenseQuery = query(
        collection(db, COLLECTIONS.FINANCIAL_EXPENSES),
        createEnvFilter()
      );
      const expenseSnapshot = await getDocs(expenseQuery);
      totalExpenses = expenseSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (parseFloat(data.amount) || 0);
      }, 0);
    } catch (error) {
      console.log('No expense data found:', error.message);
    }
    
    const expenseData = {
      totalExpenses: totalExpenses,
      monthlyExpenses: 0,
      expenseGrowth: 0,
      topCategories: []
    };
    
    // Update expense summary cards
    updateExpenseCards(expenseData);
  } catch (error) {
    console.error('Error loading expense data:', error);
    
    // Fallback to RM0 values
    const expenseData = {
      totalExpenses: 0,
      monthlyExpenses: 0,
      expenseGrowth: 0,
      topCategories: []
    };
    updateExpenseCards(expenseData);
  }
}

// Update income summary cards
function updateIncomeCards(data) {
  const totalIncomeEl = document.querySelector('#financial-money-in-content .stat-value');
  if (totalIncomeEl) {
    totalIncomeEl.textContent = `RM ${data.totalIncome.toLocaleString()}`;
  }
}

// Update expense summary cards
function updateExpenseCards(data) {
  const totalExpenseEl = document.querySelector('#financial-money-out-content .stat-value');
  if (totalExpenseEl) {
    totalExpenseEl.textContent = `RM ${data.totalExpenses.toLocaleString()}`;
  }
}

// Setup income-specific event listeners
function setupIncomeFormListeners() {
  console.log('Setting up income form listeners...');
  
  const incomeForm = document.getElementById('income-entry-form');
  const clearFormBtn = document.getElementById('clear-form-btn');
  const submitBtn = document.getElementById('submit-income-btn');
  const messageDiv = document.getElementById('form-message');
  
  // Check if listeners are already attached to prevent duplicates
  if (incomeForm && incomeForm.dataset.listenersAttached === 'true') {
    console.log('Income form listeners already attached, skipping...');
    return;
  }
  
  // Form submission
  if (incomeForm) {
    incomeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleIncomeFormSubmission();
    });
    // Mark listeners as attached
    incomeForm.dataset.listenersAttached = 'true';
  }
  
  // Clear form button
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
      resetIncomeForm();
      showFormMessage('Form cleared successfully.', 'success');
    });
  }
  
  // Real-time validation
  const amountInput = document.getElementById('income-amount');
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (value < 0) {
        e.target.value = 0;
      }
    });
  }
  
  // Auto-format amount on blur
  if (amountInput) {
    amountInput.addEventListener('blur', (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        e.target.value = value.toFixed(2);
      }
    });
  }
}

// Reset income form to default state
function resetIncomeForm() {
  const form = document.getElementById('income-entry-form');
  if (form) {
    form.reset();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('income-date');
    if (dateInput) {
      dateInput.value = today;
    }
    // Clear any validation messages
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
  }
}

// Handle income form submission
async function handleIncomeFormSubmission() {
  const form = document.getElementById('income-entry-form');
  const submitBtn = document.getElementById('submit-income-btn');
  
  try {
    // Disable submit button to prevent double submission
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    }
    
    const formData = new FormData(form);
    
    // Get form values
    const incomeData = {
      date: formData.get('date'),
      source: formData.get('source').trim(),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description')?.trim() || '',
      reference: formData.get('reference')?.trim() || '',
      paymentMethod: formData.get('paymentMethod')
    };
    
    // Validate form data
    if (!validateIncomeData(incomeData)) {
      return;
    }
    
    // Import Firebase functions
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    
    // Prepare document for Firebase
    const docData = addStandardFields({
      ...incomeData,
      type: 'income',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to Firebase
    await addDoc(collection(db, COLLECTIONS.FINANCIAL_INCOME), docData);
    
    console.log('Income entry saved successfully:', incomeData);
    
    // Reset form and show success message
    resetIncomeForm();
    showFormMessage('Income entry saved successfully! ✅', 'success');
    
  } catch (error) {
    console.error('Error saving income entry:', error);
    showFormMessage('Error saving income entry. Please try again. ❌', 'error');
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Save Income Entry';
    }
  }
}

// Show form message
function showFormMessage(message, type) {
  const messageDiv = document.getElementById('form-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

// Validate income form data
function validateIncomeData(data) {
  const errors = [];
  
  // Required field validation
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.source || data.source.length < 2) {
    errors.push('Income source must be at least 2 characters');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }
  
  // Date validation (not in future)
  const selectedDate = new Date(data.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (selectedDate > today) {
    errors.push('Date cannot be in the future');
  }
  
  // Show errors if any
  if (errors.length > 0) {
    showFormMessage(errors.join('. '), 'error');
    return false;
  }
  
  return true;
}

// Setup expense-specific event listeners
function setupExpenseFormListeners() {
  console.log('Setting up expense form listeners...');
  
  const expenseForm = document.getElementById('expense-entry-form');
  const clearFormBtn = document.getElementById('clear-expense-form-btn');
  const submitBtn = document.getElementById('submit-expense-btn');
  const messageDiv = document.getElementById('expense-form-message');
  
  // Check if listeners are already attached to prevent duplicates
  if (expenseForm && expenseForm.dataset.listenersAttached === 'true') {
    console.log('Expense form listeners already attached, skipping...');
    return;
  }
  
  // Form submission
  if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleExpenseFormSubmission();
    });
    // Mark listeners as attached
    expenseForm.dataset.listenersAttached = 'true';
  }
  
  // Clear form button
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', () => {
      resetExpenseForm();
      showExpenseFormMessage('Form cleared successfully.', 'success');
    });
  }
  
  // Real-time validation
  const amountInput = document.getElementById('expense-amount');
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (value < 0) {
        e.target.value = 0;
      }
    });
  }
  
  // Auto-format amount on blur
  if (amountInput) {
    amountInput.addEventListener('blur', (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        e.target.value = value.toFixed(2);
      }
    });
  }
}

// Reset expense form to default state
function resetExpenseForm() {
  const form = document.getElementById('expense-entry-form');
  if (form) {
    form.reset();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = today;
    }
    // Clear any validation messages
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
  }
}

// Handle expense form submission
async function handleExpenseFormSubmission() {
  const form = document.getElementById('expense-entry-form');
  const submitBtn = document.getElementById('submit-expense-btn');
  
  try {
    // Disable submit button to prevent double submission
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    }
    
    const formData = new FormData(form);
    
    // Get form values
    const expenseData = {
      date: formData.get('date'),
      vendor: formData.get('vendor').trim(),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      description: formData.get('description')?.trim() || '',
      reference: formData.get('reference')?.trim() || '',
      paymentMethod: formData.get('paymentMethod')
    };
    
    // Validate form data
    if (!validateExpenseData(expenseData)) {
      return;
    }
    
    // Import Firebase functions
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    
    // Prepare document for Firebase
    const docData = addStandardFields({
      ...expenseData,
      type: 'expense',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save to Firebase
    await addDoc(collection(db, COLLECTIONS.FINANCIAL_EXPENSES), docData);
    
    console.log('Expense entry saved successfully:', expenseData);
    
    // Reset form and show success message
    resetExpenseForm();
    showExpenseFormMessage('Expense entry saved successfully! ✅', 'success');
    
  } catch (error) {
    console.error('Error saving expense entry:', error);
    showExpenseFormMessage('Error saving expense entry. Please try again. ❌', 'error');
  } finally {
    // Re-enable submit button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="btn-icon">💾</span> Save Expense Entry';
    }
  }
}

// Show expense form message
function showExpenseFormMessage(message, type) {
  const messageDiv = document.getElementById('expense-form-message');
  if (messageDiv) {
    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}

// Validate expense form data
function validateExpenseData(data) {
  const errors = [];
  
  // Required field validation
  if (!data.date) {
    errors.push('Date is required');
  }
  
  if (!data.vendor || data.vendor.length < 2) {
    errors.push('Vendor/Payee must be at least 2 characters');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  if (!data.paymentMethod) {
    errors.push('Payment method is required');
  }
  
  // Date validation (not in future)
  const selectedDate = new Date(data.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (selectedDate > today) {
    errors.push('Date cannot be in the future');
  }
  
  // Show errors if any
  if (errors.length > 0) {
    showExpenseFormMessage(errors.join('. '), 'error');
    return false;
  }
  
  return true;
}

// Show field validation error
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (field) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    field.parentNode.appendChild(errorDiv);
  }
}

// Add income entry to table
function addIncomeToTable(incomeData) {
  const tableBody = document.getElementById('income-table-body');
  if (!tableBody) return;
  
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${formatDate(incomeData.date)}</td>
    <td>${incomeData.source}</td>
    <td>${formatCategory(incomeData.category)}</td>
    <td>RM ${incomeData.amount.toFixed(2)}</td>
    <td>${incomeData.description}</td>
    <td>
      <button class="btn-icon edit-btn" onclick="editIncomeEntry('${incomeData.id}')">✏️</button>
      <button class="btn-icon delete-btn" onclick="deleteIncomeEntry('${incomeData.id}')">🗑️</button>
    </td>
  `;
  
  // Add to top of table
  tableBody.insertBefore(row, tableBody.firstChild);
}

// Update income statistics
function updateIncomeStats(incomeData) {
  // Update total income (this would typically come from a database)
  const totalIncomeEl = document.querySelector('#salary-income');
  if (totalIncomeEl && incomeData.category === 'employment') {
    const currentValue = parseFloat(totalIncomeEl.textContent.replace('RM ', '').replace(',', '')) || 0;
    const newValue = currentValue + incomeData.amount;
    totalIncomeEl.textContent = `RM ${newValue.toLocaleString()}`;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-MY');
}

// Format category for display
function formatCategory(category) {
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Show success message
function showSuccessMessage(message) {
  // Create success notification
  const notification = document.createElement('div');
  notification.className = 'success-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #27ae60;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}





// Note: Using existing showProgramSubSection function defined below

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.textContent = message;
  
  // Set background color based on notification type
  let bgColor = '#4CAF50'; // Default success/info color
  if (type === 'error') {
    bgColor = '#f44336'; // Error color
  } else if (type === 'warning') {
    bgColor = '#ff9800'; // Warning color
  } else if (type === 'info') {
    bgColor = '#2196F3'; // Info color
  }
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background-color: ${bgColor};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize the Program & Kehadiran page
export async function initializeProgramKehadiran() {
  console.log('Initializing Program & Kehadiran page...');
  
  const container = document.getElementById('program-kehadiran-content');
  if (!container) {
    console.error('Program & Kehadiran container not found');
    return;
  }
  
  // Make sure the overview section is visible initially
  showProgramSubSection('program-kehadiran-overview');

  try {
    // Import ProgramService for program management
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    const programService = new ProgramService();
    
    // Setup event listeners for Program & Kehadiran overview buttons
    setupProgramKehadiranOverviewListeners();
    
    // Setup event listeners for Program Management section
    setupProgramManagementListeners(programService);
    
    // Import the CSS styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Program & Kehadiran Section Styles */
      .program-kehadiran-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .program-card {
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
      }
      
      .program-header {
        display: flex;
        justify-content: space-between;
      }
      
      .program-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 10px;
      }
      
      .program-icon {
        font-size: 24px;
        color: #4a6cf7;
      }
      
      .program-description {
        color: #64748b;
        margin-bottom: 15px;
        flex-grow: 1;
      }
      
      .program-action {
        margin-top: auto;
      }
      
      /* Sub-section styles */
      .program-subsection {
        display: none;
      }
      
      .program-subsection.active {
        display: block;
      }
      
      /* Action bar styles */
      .program-action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .program-filters {
        display: flex;
        gap: 10px;
      }
      
      /* Table styles */
      .program-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      .program-table th,
      .program-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .program-table th {
        background-color: #f8fafc;
        font-weight: 600;
      }
      
      .program-table tr:hover {
        background-color: #f1f5f9;
      }
      
      /* Status badge styles */
      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .status-badge.upcoming {
        background-color: #e0f2fe;
        color: #0369a1;
      }
      
      .status-badge.active {
        background-color: #dcfce7;
        color: #15803d;
      }
      
      .status-badge.completed {
        background-color: #f1f5f9;
        color: #64748b;
      }
      
      .status-badge.cancelled {
        background-color: #fee2e2;
        color: #b91c1c;
      }
      
      /* Report card styles */
      .report-card {
        background-color: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      
      .report-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
        color: #334155;
      }
      
      .report-stats {
        display: flex;
        gap: 20px;
      }
      
      .stat-card {
        flex: 1;
        background-color: #f8fafc;
        border-radius: 6px;
        padding: 15px;
        text-align: center;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #4a6cf7;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #64748b;
      }
      
      .stat-helper-text {
        font-size: 13px;
        color: #94a3b8;
        margin: 4px 0 0;
      }
      
      .top-participants {
        margin-top: 20px;
      }
      
      .participant-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .participant-name {
        font-weight: 500;
      }
      
      .participant-attendance {
        color: #4a6cf7;
        font-weight: 600;
      }
      
      .program-participation {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 15px;
      }
      
      .program-item {
        background-color: #f8fafc;
        border-radius: 6px;
        padding: 15px;
      }
      
      .program-dates {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 10px;
      }
      
      .program-stats {
        display: flex;
        justify-content: space-between;
      }
    `;
    document.head.appendChild(styleElement);
    
    console.log('Program & Kehadiran page loaded successfully');
    
    // Add event listeners for the main navigation buttons
    const manageBtn = document.getElementById('manage-programs-btn');
    const attendanceBtn = document.getElementById('view-attendance-btn');
    const reportsBtn = document.getElementById('generate-reports-btn');
    
    console.log('Setting up Program & Kehadiran navigation buttons:', { 
      manageBtn: !!manageBtn, 
      attendanceBtn: !!attendanceBtn, 
      reportsBtn: !!reportsBtn 
    });
    
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        console.log('Manage Programs button clicked');
        showProgramSubSection('program-management-content');
        loadPrograms();
      });
    } else {
      console.error('Manage Programs button not found');
    }
    
    if (attendanceBtn) {
      attendanceBtn.addEventListener('click', () => {
        console.log('View Attendance button clicked');
        showProgramSubSection('attendance-tracking-content');
        loadAttendanceData();
      });
    } else {
      console.error('View Attendance button not found');
    }
    
    if (reportsBtn) {
      reportsBtn.addEventListener('click', () => {
        console.log('Generate Reports button clicked');
        showProgramSubSection('program-reports-content');
        loadProgramReports();
      });
    } else {
      console.error('Generate Reports button not found');
    }
    
    // Add event listeners for back buttons
    const programManagementBackBtn = document.getElementById('program-management-back-btn');
    if (programManagementBackBtn) {
      programManagementBackBtn.addEventListener('click', () => {
        console.log('Program Management back button clicked');
        showProgramSubSection('program-kehadiran-overview');
      });
    } else {
      console.error('Program Management back button not found');
    }
    
    const attendanceTrackingBackBtn = document.getElementById('attendance-tracking-back-btn');
    if (attendanceTrackingBackBtn) {
      attendanceTrackingBackBtn.addEventListener('click', () => {
        console.log('Attendance Tracking back button clicked');
        showProgramSubSection('program-kehadiran-overview');
      });
    } else {
      console.error('Attendance Tracking back button not found');
    }
    
    const programReportsBackBtn = document.getElementById('program-reports-back-btn');
    if (programReportsBackBtn) {
      programReportsBackBtn.addEventListener('click', () => {
        console.log('Program Reports back button clicked');
        showProgramSubSection('program-kehadiran-overview');
      });
    } else {
      console.error('Program Reports back button not found');
    }
    
    // Add event listener for adding a new program
    const addProgramBtn = document.getElementById('add-program-btn');
    if (addProgramBtn) {
      addProgramBtn.addEventListener('click', () => {
        console.log('Add Program button clicked');
        openAddProgramModal();
      });
    } else {
      console.error('Add Program button not found');
    }
    
    // Add event listeners for attendance filters
    const applyFiltersBtn = document.getElementById('apply-attendance-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        applyAttendanceFilters();
      });
    }
    
    const resetFiltersBtn = document.getElementById('reset-attendance-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        resetAttendanceFilters();
      });
    }
    
  } catch (error) {
    console.error('Error loading Program & Kehadiran page:', error);
    container.innerHTML = `
      <div class="error-container">
        <h3>Error Loading Program & Kehadiran</h3>
        <p>Unable to load the Program & Kehadiran page. Please try again.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Initialize Program & Kehadiran (New) functionality
export async function initializeProgramKehadiranNew() {
  console.log('Initializing Program & Kehadiran (New) page...');
  
  const container = document.getElementById('program-kehadiran-new-content');
  if (!container) {
    console.error('Program & Kehadiran (New) container not found');
    return;
  }
  
  // Make sure the overview section is visible initially
  showProgramNewSubSection('program-kehadiran-new-overview');

  try {
    // Import ProgramService for enhanced program management
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    const programService = new ProgramService();
    
    // Setup event listeners for Program & Kehadiran (New) overview buttons
    setupProgramKehadiranNewOverviewListeners();
    
    // Setup event listeners for Enhanced Program Management section
    setupProgramManagementNewListeners(programService);
    
    // Import the enhanced CSS styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Enhanced Program & Kehadiran Section Styles */
      .program-kehadiran-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-top: 24px;
      }
      
      .program-card {
        background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        transition: all 0.3s ease;
      }
      
      .program-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }
      
      .program-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      
      .program-title {
        font-size: 20px;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
      
      .program-icon {
        font-size: 28px;
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .program-description {
        color: #64748b;
        margin-bottom: 20px;
        flex-grow: 1;
        line-height: 1.6;
      }
      
      /* Enhanced table styles */
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
      }
      
      .data-table th {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        font-weight: 600;
        color: #374151;
        padding: 16px;
      }
      
      .data-table td {
        padding: 16px;
        border-bottom: 1px solid #f1f5f9;
      }
      
      .data-table tr:hover {
        background-color: #f8fafc;
      }
      
      /* Enhanced action bar */
      .action-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      
      /* Enhanced filters */
      .filters-container {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 24px;
        border: 1px solid #e2e8f0;
      }
      
      .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .filter-group label {
        font-weight: 500;
        color: #374151;
        min-width: 80px;
      }
      
      .form-select, .form-input {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        transition: border-color 0.3s ease;
      }
      
      .form-select:focus, .form-input:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
      }
    `;
    document.head.appendChild(styleElement);
    
    console.log('Program & Kehadiran (New) page loaded successfully');
    
    // Add event listeners for the main navigation buttons
    const manageNewBtn = document.getElementById('manage-programs-new-btn');
    const attendanceNewBtn = document.getElementById('view-attendance-new-btn');
    const reportsNewBtn = document.getElementById('generate-reports-new-btn');
    
    console.log('Setting up Program & Kehadiran (New) navigation buttons:', { 
      manageNewBtn: !!manageNewBtn, 
      attendanceNewBtn: !!attendanceNewBtn, 
      reportsNewBtn: !!reportsNewBtn 
    });
    
    if (manageNewBtn) {
      manageNewBtn.addEventListener('click', () => {
        console.log('Enhanced Manage Programs button clicked');
        showProgramNewSubSection('program-management-new-content');
        loadProgramsNew();
      });
    } else {
      console.error('Enhanced Manage Programs button not found');
    }
    
    if (attendanceNewBtn) {
      attendanceNewBtn.addEventListener('click', () => {
        console.log('Smart Attendance Tracking button clicked');
        showProgramNewSubSection('attendance-tracking-new-content');
        loadAttendanceDataNew();
      });
    } else {
      console.error('Smart Attendance Tracking button not found');
    }
    
    if (reportsNewBtn) {
      reportsNewBtn.addEventListener('click', () => {
        console.log('Advanced Reports button clicked');
        showProgramNewSubSection('program-reports-new-content');
        loadProgramReportsNew();
      });
    } else {
      console.error('Advanced Reports button not found');
    }
    
    // Add event listeners for back buttons
    const programManagementNewBackBtn = document.getElementById('program-management-new-back-btn');
    if (programManagementNewBackBtn) {
      programManagementNewBackBtn.addEventListener('click', () => {
        console.log('Enhanced Program Management back button clicked');
        showProgramNewSubSection('program-kehadiran-new-overview');
      });
    } else {
      console.error('Enhanced Program Management back button not found');
    }
    
    const attendanceTrackingNewBackBtn = document.getElementById('attendance-tracking-new-back-btn');
    if (attendanceTrackingNewBackBtn) {
      attendanceTrackingNewBackBtn.addEventListener('click', () => {
        console.log('Smart Attendance Tracking back button clicked');
        showProgramNewSubSection('program-kehadiran-new-overview');
      });
    } else {
      console.error('Smart Attendance Tracking back button not found');
    }
    
    // Add event listeners for enhanced action buttons
    const addProgramNewBtn = document.getElementById('add-program-new-btn');
    if (addProgramNewBtn) {
      addProgramNewBtn.addEventListener('click', () => {
        console.log('Add New Program (Enhanced) button clicked');
        openAddProgramNewModal();
      });
    }
    
    const importProgramsBtn = document.getElementById('import-programs-btn');
    if (importProgramsBtn) {
      importProgramsBtn.addEventListener('click', () => {
        console.log('Import Programs button clicked');
        openImportProgramsModal();
      });
    }
    
    const exportProgramsBtn = document.getElementById('export-programs-btn');
    if (exportProgramsBtn) {
      exportProgramsBtn.addEventListener('click', () => {
        console.log('Export Programs button clicked');
        exportProgramsData();
      });
    }
    
    // Add event listeners for enhanced attendance filters
    const applyFiltersNewBtn = document.getElementById('apply-filters-new-btn');
    if (applyFiltersNewBtn) {
      applyFiltersNewBtn.addEventListener('click', () => {
        applyAttendanceFiltersNew();
      });
    }
    
    const exportAttendanceNewBtn = document.getElementById('export-attendance-new-btn');
    if (exportAttendanceNewBtn) {
      exportAttendanceNewBtn.addEventListener('click', () => {
        exportAttendanceDataNew();
      });
    }
    
  } catch (error) {
    console.error('Error loading Program & Kehadiran (New) page:', error);
    container.innerHTML = `
      <div class="error-container">
        <h3>Error Loading Program & Kehadiran (New)</h3>
        <p>Unable to load the enhanced Program & Kehadiran page. Please try again.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Function to show the selected sub-section and hide others
function showProgramSubSection(sectionId) {
  console.log(`Showing program sub-section: ${sectionId}`);
  // Hide all sub-sections
  const subSections = document.querySelectorAll('#program-kehadiran-content .sub-content-section');
  subSections.forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the selected sub-section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  } else {
    console.error(`Sub-section with ID ${sectionId} not found`);
  }
}

// Function to format program date for display
function formatProgramDate(timestamp) {
  if (!timestamp) return 'N/A';
  
  let date;
  try {
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // Handle string date format
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      // Handle numeric timestamp (milliseconds)
      date = new Date(timestamp);
    } else {
      console.warn('Unknown timestamp format:', timestamp);
      return 'Invalid Date';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date from timestamp:', timestamp);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, timestamp);
    return 'Error';
  }
}

// Function to create a test program for demonstration
async function createTestProgram() {
  try {
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Create a test program
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // End date is 7 days from now
    
    const testProgram = {
      name: 'Test Program ' + new Date().toISOString().slice(0, 10),
      description: 'This is a test program created for demonstration purposes',
      startDate: startDate,
      endDate: endDate,
      category: 'Test',
      status: 'Upcoming',
      location: 'Test Location'
    };
    
    const result = await ProgramService.createProgram(testProgram);
    console.log('Test program created:', result);
    
    // Reload programs to show the new test program
    await loadPrograms();
    
    return result;
  } catch (error) {
    console.error('Error creating test program:', error);
    alert('Failed to create test program: ' + error.message);
  }
}

// Function to load programs from the database
async function loadPrograms() {
  try {
    const programsTableBody = document.getElementById('programs-table-body');
    if (!programsTableBody) {
      console.error('Programs table body not found');
      return;
    }
    
    programsTableBody.innerHTML = '<tr><td colspan="7" class="loading-text">Loading programs...</td></tr>';
    
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get programs from the database
    const programs = await ProgramService.listProgram();
    console.log('Programs loaded:', programs);
    
    // Debug: Log the raw programs data
    console.log('Raw programs data:', JSON.stringify(programs, null, 2));
    
    if (programs.length === 0) {
      programsTableBody.innerHTML = `
        <tr><td colspan="7" class="empty-text">
          No programs found. 
          <button id="create-test-program" class="btn btn-sm btn-primary">Create Test Program</button>
        </td></tr>
      `;
      
      // Add event listener to create test program button
      document.getElementById('create-test-program').addEventListener('click', createTestProgram);
      return;
    }
    
    // Clear the loading message
    programsTableBody.innerHTML = '';
    
    // Add each program to the table
    programs.forEach(program => {
      const row = document.createElement('tr');
      
      // Format dates - handle both tarikh and tarikh_mula fields
      const startDate = formatProgramDate(program.tarikh_mula);
      const endDate = formatProgramDate(program.tarikh_tamat);
      
      // Determine status based on dates if not explicitly set
      let status = program.status || 'upcoming';
      if (!program.status) {
        const now = new Date();
        const programStartDate = program.tarikh_mula;
        const programEndDate = program.tarikh_tamat;
        
        if (programStartDate && programEndDate) {
          let startDate, endDate;
          
          // Handle different timestamp formats
          if (programStartDate.seconds) {
            startDate = new Date(programStartDate.seconds * 1000);
          } else {
            startDate = new Date(programStartDate);
          }
          
          if (programEndDate.seconds) {
            endDate = new Date(programEndDate.seconds * 1000);
          } else {
            endDate = new Date(programEndDate);
          }
          
          if (now > endDate) {
            status = 'completed';
          } else if (now >= startDate && now <= endDate) {
            status = 'active';
          } else {
            status = 'upcoming';
          }
        }
      }
      
      // Determine status class
      let statusClass = 'status-badge ';
      switch(status) {
        case 'upcoming':
          statusClass += 'upcoming';
          break;
        case 'active':
          statusClass += 'active';
          break;
        case 'completed':
          statusClass += 'completed';
          break;
        case 'cancelled':
          statusClass += 'cancelled';
          break;
        default:
          statusClass += 'upcoming';
      }
      
      // Create the row content - handle both nama and nama_program fields
      const programName = program.nama_program || program.nama || 'Unnamed Program';
      const description = program.penerangan || program.deskripsi || 'No description';
      
      // Create the row content
      row.innerHTML = `
        <td>${programName}</td>
        <td>${description}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${program.kategori || 'N/A'}</td>
        <td><span class="${statusClass}">${status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary edit-program" data-id="${program.id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-program" data-id="${program.id}">Delete</button>
            <button class="btn btn-sm btn-danger attendance-program" data-id="${program.id}">Manage Attendance</button>
          </div>
        </td>
      `;
      
      programsTableBody.appendChild(row);
      
      // Add event listeners for edit and delete buttons
      row.querySelector('.edit-program').addEventListener('click', () => {
        editProgram(program.id);
      });
      
      row.querySelector('.delete-program').addEventListener('click', () => {
        deleteProgram(program.id);
      });
      
      // Add event listener for manage attendance button
      row.querySelector('.attendance-program').addEventListener('click', () => {
        showKIRListModal(program.id, program.name);
      });
    });
    
  } catch (error) {
    console.error('Error loading programs:', error);
    const programsTableBody = document.getElementById('programs-table-body');
    if (programsTableBody) {
      programsTableBody.innerHTML = `<tr><td colspan="7" class="error-text">Error loading programs: ${error.message}</td></tr>`;
    }
  }
}

// This function is implemented below

// This function is implemented below

// Function to show the add program form
function showAddProgramForm() {
  console.log('Opening add program form');
  openAddProgramModal();
}

// Function to open the add program modal
function openAddProgramModal() {
  // Create modal HTML
  const modalHTML = `
    <div id="add-program-modal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Add New Program</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <form id="add-program-form">
            <div class="form-group">
              <label for="program-name">Program Name</label>
              <input type="text" id="program-name" class="form-input" required>
            </div>
            <div class="form-group">
              <label for="program-description">Description</label>
              <textarea id="program-description" class="form-input" rows="3" required></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="program-start-date">Start Date</label>
                <input type="date" id="program-start-date" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="program-end-date">End Date</label>
                <input type="date" id="program-end-date" class="form-input" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="program-category">Category</label>
                <select id="program-category" class="form-select" required>
                  <option value="">Select Category</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Community">Community</option>
                  <option value="Religious">Religious</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="program-status">Status</label>
                <select id="program-status" class="form-select" required>
                  <option value="">Select Status</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-add-program">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Program</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to the DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
  
  // Show the modal
  const modal = document.getElementById('add-program-modal');
  modal.style.display = 'block';
  
  // Add event listener for closing the modal
  document.querySelector('.close-modal').addEventListener('click', () => {
    closeAddProgramModal();
  });
  
  document.getElementById('cancel-add-program').addEventListener('click', () => {
    closeAddProgramModal();
  });
  
  // Add event listener for form submission
  document.getElementById('add-program-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProgram();
  });
}

// Function to close the add program modal
function closeAddProgramModal() {
  const modal = document.getElementById('add-program-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// Function to save a new program
async function saveProgram() {
  try {
    // Get form values
    const name = document.getElementById('program-name').value;
    const description = document.getElementById('program-description').value;
    const startDate = document.getElementById('program-start-date').value;
    const endDate = document.getElementById('program-end-date').value;
    const category = document.getElementById('program-category').value;
    const status = document.getElementById('program-status').value;
    
    // Validate form
    if (!name || !description || !startDate || !endDate || !category || !status) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Create program object
    const program = {
      name,
      description,
      startDate,
      endDate,
      category,
      status,
      location: ''
    };
    
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Save program to the database
    await ProgramService.createProgram(program);
    
    // Close the modal
    closeAddProgramModal();
    
    // Reload programs
    loadPrograms();
  
    
  } catch (error) {
    console.error('Error saving program:', error);
    alert('Failed to save program. Please try again.');
  }
}

// Function to edit a program
async function editProgram(programId) {
  try {
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get program from the database
    const program = await ProgramService.getProgramById(programId);
    
    if (!program) {
      alert('Program not found.');
      return;
    }
    
    // Create modal HTML
    const modalHTML = `
      <div id="edit-program-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Program</h2>
            <span class="close-modal">&times;</span>
          </div>
          <div class="modal-body">
            <form id="edit-program-form">
              <input type="hidden" id="edit-program-id" value="${programId}">
              <div class="form-group">
                <label for="edit-program-name">Program Name</label>
                <input type="text" id="edit-program-name" class="form-input" value="${program.nama_program}" required>
              </div>
              <div class="form-group">
                <label for="edit-program-description">Description</label>
                <textarea id="edit-program-description" class="form-input" rows="3" required>${program.penerangan}</textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-program-start-date">Start Date</label>
                  <input type="date" id="edit-program-start-date" class="form-input" value="${program.tarikh_mula ? program.tarikh_mula.split('T')[0] : ''}" required>
                </div>
                <div class="form-group">
                  <label for="edit-program-end-date">End Date</label>
                  <input type="date" id="edit-program-end-date" class="form-input" value="${program.tarikh_tamat ? program.tarikh_tamat.split('T')[0] : ''}" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="edit-program-category">Category</label>
                  <select id="edit-program-category" class="form-select" required>
                    <option value="Education" ${program.kategori === 'Education' ? 'selected' : ''}>Education</option>
                    <option value="Health" ${program.kategori === 'Health' ? 'selected' : ''}>Health</option>
                    <option value="Community" ${program.kategori === 'Community' ? 'selected' : ''}>Community</option>
                    <option value="Religious" ${program.kategori === 'Religious' ? 'selected' : ''}>Religious</option>
                    <option value="Other" ${program.kategori === 'Other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="edit-program-status">Status</label>
                  <select id="edit-program-status" class="form-select" required>
                    <option value="Upcoming" ${program.status === 'Upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="Active" ${program.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Completed" ${program.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${program.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-outline" id="cancel-edit-program">Cancel</button>
                <button type="submit" class="btn btn-primary">Update Program</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Show the modal
    const modal = document.getElementById('edit-program-modal');
    modal.style.display = 'block';
    
    // Add event listener for closing the modal
    document.querySelector('.close-modal').addEventListener('click', () => {
      closeEditProgramModal();
    });
    
    document.getElementById('cancel-edit-program').addEventListener('click', () => {
      closeEditProgramModal();
    });
    
    // Add event listener for form submission
    document.getElementById('edit-program-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProgram();
    });
    
  } catch (error) {
    console.error('Error editing program:', error);
    alert('Failed to edit program. Please try again.');
  }
}

// Function to close the edit program modal
function closeEditProgramModal() {
  const modal = document.getElementById('edit-program-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.remove();
  }
}

// Function to update a program
async function updateProgram() {
  try {
    // Get form values
    const programId = document.getElementById('edit-program-id').value;
    const name = document.getElementById('edit-program-name').value;
    const description = document.getElementById('edit-program-description').value;
    const startDate = document.getElementById('edit-program-start-date').value;
    const endDate = document.getElementById('edit-program-end-date').value;
    const category = document.getElementById('edit-program-category').value;
    const status = document.getElementById('edit-program-status').value;
    
    // Validate form
    if (!name || !description || !startDate || !endDate || !category || !status) {
      alert('Please fill in all required fields.');
      return;
    }
    
    // Create program object
    const program = {
      id: programId,
      name,
      description,
      startDate,
      endDate,
      category,
      status,
      location: ''
    };
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Update program in the database
    await ProgramService.updateProgram(programId, program);
    
    // Close the modal
    closeEditProgramModal();
    
    // Reload programs
    loadPrograms();
    
    // Show success message
    alert('Program updated successfully!');
    
  } catch (error) {
    console.error('Error updating program:', error);
    alert('Failed to update program. Please try again.');
  }
}

// Function to delete a program
async function deleteProgram(programId) {
  try {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this program?')) {
      return;
    }
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Delete program from the database
    await ProgramService.deleteProgram(programId);
    
    // Reload programs
    loadPrograms();
    
    // Show success message
    alert('Program deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting program:', error);
    alert('Failed to delete program. Please try again.');
  }
}

// Function to load attendance data
async function loadAttendanceData() {
  try {
    const attendanceTableBody = document.getElementById('attendance-table-body');
    attendanceTableBody.innerHTML = '<tr><td colspan="6" class="loading-text">Loading attendance records...</td></tr>';
    
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Load programs for the filter dropdown
    const programs = await ProgramService.listProgram();
    const programFilter = document.getElementById('program-filter');
    
    // Clear existing options except the first one
    while (programFilter.options.length > 1) {
      programFilter.remove(1);
    }
    
    // Add program options to the filter
    programs.forEach(program => {
      const option = document.createElement('option');
      option.value = program.id;
      option.textContent = program.name;
      programFilter.appendChild(option);
    });
    
    // Get attendance records
    const attendanceRecords = await ProgramService.listAllAttendance();
    
    if (attendanceRecords.length === 0) {
      attendanceTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">No attendance records found.</td></tr>';
      return;
    }
    
    // Clear the loading message
    attendanceTableBody.innerHTML = '';
    
    // Add each attendance record to the table
    attendanceRecords.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.participantName}</td>
        <td>${record.participantId}</td>
        <td>${record.participantType}</td>
        <td>
          <input type="checkbox" class="attendance-checkbox" data-id="${record.id}" ${record.present ? 'checked' : ''}>
        </td>
        <td>${record.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-edit-notes" data-id="${record.id}">Edit Notes</button>
        </td>
      `;
      attendanceTableBody.appendChild(row);
      
      // Add event listener for attendance checkbox
      row.querySelector('.attendance-checkbox').addEventListener('change', async (e) => {
        await updateAttendanceStatus(record.id, e.target.checked);
      });
      
      // Add event listener for edit notes button
      row.querySelector('.btn-edit-notes').addEventListener('click', () => {
        editAttendanceNotes(record.id);
      });
    });
    
  } catch (error) {
    console.error('Error loading attendance data:', error);
    const attendanceTableBody = document.getElementById('attendance-table-body');
    attendanceTableBody.innerHTML = '<tr><td colspan="6" class="error-text">Failed to load attendance records. Please try again.</td></tr>';
  }
}

// Function to apply attendance filters
async function applyAttendanceFilters() {
  try {
    const programId = document.getElementById('program-filter').value;
    const date = document.getElementById('attendance-date-filter').value;
    
    const attendanceTableBody = document.getElementById('attendance-table-body');
    attendanceTableBody.innerHTML = '<tr><td colspan="6" class="loading-text">Filtering attendance records...</td></tr>';
    
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Get filtered attendance records
    const attendanceRecords = await ProgramService.listAttendanceByFilters(programId, date);
    
    if (attendanceRecords.length === 0) {
      attendanceTableBody.innerHTML = '<tr><td colspan="6" class="empty-text">No attendance records found for the selected filters.</td></tr>';
      return;
    }
    
    // Clear the loading message
    attendanceTableBody.innerHTML = '';
    
    // Add each attendance record to the table
    attendanceRecords.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.participantName}</td>
        <td>${record.participantId}</td>
        <td>${record.participantType}</td>
        <td>
          <input type="checkbox" class="attendance-checkbox" data-id="${record.id}" ${record.present ? 'checked' : ''}>
        </td>
        <td>${record.notes || '-'}</td>
        <td>
          <button class="btn btn-sm btn-edit-notes" data-id="${record.id}">Edit Notes</button>
        </td>
      `;
      attendanceTableBody.appendChild(row);
      
      // Add event listener for attendance checkbox
      row.querySelector('.attendance-checkbox').addEventListener('change', async (e) => {
        await updateAttendanceStatus(record.id, e.target.checked);
      });
      
      // Add event listener for edit notes button
      row.querySelector('.btn-edit-notes').addEventListener('click', () => {
        editAttendanceNotes(record.id);
      });
    });
    
  } catch (error) {
    console.error('Error applying attendance filters:', error);
    const attendanceTableBody = document.getElementById('attendance-table-body');
    attendanceTableBody.innerHTML = '<tr><td colspan="6" class="error-text">Failed to filter attendance records. Please try again.</td></tr>';
  }
}

// Function to reset attendance filters
function resetAttendanceFilters() {
  document.getElementById('program-filter').value = '';
  document.getElementById('attendance-date-filter').value = '';
  loadAttendanceData();
}

// Function to update attendance status
async function updateAttendanceStatus(attendanceId, present) {
  try {
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Update attendance status in the database
    await ProgramService.updateAttendanceStatus(attendanceId, present);
    
    // Show success message
    console.log('Attendance status updated successfully!');
    
  } catch (error) {
    console.error('Error updating attendance status:', error);
    alert('Failed to update attendance status. Please try again.');
  }
}

// Function to edit attendance notes
async function editAttendanceNotes(attendanceId) {
  try {
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Get attendance record from the database
    const attendanceRecord = await ProgramService.getAttendanceById(attendanceId);
    
    if (!attendanceRecord) {
      alert('Attendance record not found.');
      return;
    }
    
    // Prompt for new notes
    const newNotes = prompt('Enter notes for this attendance record:', attendanceRecord.notes || '');
    
    if (newNotes === null) {
      // User cancelled
      return;
    }
    
    // Update notes in the database
    await ProgramService.updateAttendanceNotes(attendanceId, newNotes);
    
    // Reload attendance data
    loadAttendanceData();
    
    // Show success message
    console.log('Attendance notes updated successfully!');
    
  } catch (error) {
    console.error('Error editing attendance notes:', error);
    alert('Failed to edit attendance notes. Please try again.');
  }
}

// Function to load program reports
async function loadProgramReports() {
  try {
    // Import the ProgramService dynamically
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
    // Using static methods
    
    // Load attendance summary
    const attendanceSummary = await ProgramService.getAttendanceSummary();
    const attendanceSummaryReport = document.getElementById('attendance-summary-report');
    
    if (!attendanceSummary) {
      attendanceSummaryReport.innerHTML = '<p class="empty-text">No attendance data available.</p>';
    } else {
      attendanceSummaryReport.innerHTML = `
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Programs</span>
            <span class="stat-value">${attendanceSummary.totalPrograms}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Participants</span>
            <span class="stat-value">${attendanceSummary.totalParticipants}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Average Attendance</span>
            <span class="stat-value">${attendanceSummary.averageAttendance}%</span>
          </div>
        </div>
      `;
    }
    
    // Load top participants
    const topParticipants = await ProgramService.getTopParticipants(3);
    const topParticipantsReport = document.getElementById('top-participants-report');
    
    if (topParticipants.length === 0) {
      topParticipantsReport.innerHTML = '<p class="empty-text">No participant data available.</p>';
    } else {
      let topParticipantsHTML = '<div class="top-participants">';
      
      topParticipants.forEach((participant, index) => {
        topParticipantsHTML += `
          <div class="participant-item">
            <div class="participant-rank">${index + 1}</div>
            <div class="participant-info">
              <h4>${participant.name}</h4>
              <p>${participant.type} - ${participant.id}</p>
            </div>
            <div class="participant-stats">
              <span class="attendance-count">${participant.attendanceCount} hadir</span>
            </div>
          </div>
        `;
      });
      
      topParticipantsHTML += '</div>';
      topParticipantsReport.innerHTML = topParticipantsHTML;
    }
    
    // Load program participation data
    const programParticipation = await ProgramService.getProgramParticipation();
    const programParticipationReport = document.getElementById('program-participation-report');
    
    if (programParticipation.length === 0) {
      programParticipationReport.innerHTML = '<p class="empty-text">No program participation data available.</p>';
    } else {
      let programParticipationHTML = '<div class="program-participation">';
      
      programParticipation.forEach(program => {
        programParticipationHTML += `
          <div class="program-item">
            <h4>${program.name}</h4>
            <div class="program-dates">${formatProgramDate(program.startDate)} - ${formatProgramDate(program.endDate)}</div>
            <div class="program-stats">
              <div class="stat-item">
                <span class="stat-label">Participants</span>
                <span class="stat-value">${program.participantCount}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      programParticipationHTML += '</div>';
      programParticipationReport.innerHTML = programParticipationHTML;
    }
    
  } catch (error) {
    console.error('Error loading program reports:', error);
    document.getElementById('attendance-summary-report').innerHTML = '<p class="error-text">Failed to load attendance summary. Please try again.</p>';
    document.getElementById('top-participants-report').innerHTML = '<p class="error-text">Failed to load top participants. Please try again.</p>';
    document.getElementById('program-participation-report').innerHTML = '<p class="error-text">Failed to load program participation data. Please try again.</p>';
  }
}

let reportsDashboardLoadingPromise = null;
let reportsAttendanceChartInstance = null;

async function initializeReportsDashboard(forceReload = false) {
  if (reportsDashboardLoadingPromise && !forceReload) {
    return reportsDashboardLoadingPromise;
  }
  
  const dashboard = document.getElementById('reports-dashboard');
  if (!dashboard) return;
  
  setReportsDashboardState('loading');
  
  const pendingLoad = (async () => {
    try {
      const { ProgramService } = await import('../../services/backend/ProgramService.js');
      const [programs, attendanceRecords, financialSummary] = await Promise.all([
        ProgramService.listProgram(),
        ProgramService.listAllAttendance(),
        fetchFinancialSummaryData()
      ]);
      
      renderReportsDashboard({ programs, attendanceRecords, financialSummary });
      setReportsDashboardState('ready');
    } catch (error) {
      console.error('Error loading consolidated reports:', error);
      setReportsDashboardState('error', error.message || 'Unable to load reports');
    } finally {
      reportsDashboardLoadingPromise = null;
    }
  })();
  
  reportsDashboardLoadingPromise = pendingLoad;
  return pendingLoad;
}

function setReportsDashboardState(state, message = '') {
  const loadingEl = document.getElementById('reports-loading');
  const errorEl = document.getElementById('reports-error');
  const dashboardEl = document.getElementById('reports-dashboard');
  
  if (!loadingEl || !errorEl || !dashboardEl) return;
  
  if (state === 'loading') {
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    dashboardEl.style.display = 'none';
  } else if (state === 'ready') {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'none';
    dashboardEl.style.display = 'flex';
    dashboardEl.style.flexDirection = 'column';
  } else if (state === 'error') {
    loadingEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.textContent = `Unable to load report: ${message}`;
    dashboardEl.style.display = 'none';
  }
}

async function fetchFinancialSummaryData() {
  try {
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    
    const [
      grantsSnapshot,
      transactionsSnapshot,
      legacyIncomeSnapshot,
      legacyExpenseSnapshot
    ] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.FINANCIAL_GRANTS), createEnvFilter())),
      getDocs(query(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS), createEnvFilter())),
      getDocs(query(collection(db, COLLECTIONS.FINANCIAL_INCOME), createEnvFilter())),
      getDocs(query(collection(db, COLLECTIONS.FINANCIAL_EXPENSES), createEnvFilter()))
    ]);
    
    const parseGrantTransaction = doc => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      if (!Number.isFinite(amount)) return null;
      const type = data.type === 'deduction' ? 'expense' : 'income';
      const dateValue = data.createdAt || data.date || data.updatedAt || new Date();
      const date = normalizeToDate(dateValue) || new Date();
      const grantNames = Array.isArray(data.grantImpacts)
        ? data.grantImpacts
            .map(impact => impact.grantName || impact.grantId)
            .filter(Boolean)
            .join(', ')
        : '';
      return {
        id: doc.id,
        type,
        title: data.description || (type === 'expense' ? 'Tolakan Dana' : 'Dana Masuk'),
        category: grantNames || type,
        amount,
        date
      };
    };
    
    const parseLegacyTransaction = (doc, type) => {
      const data = doc.data();
      const rawAmount = parseFloat(data.amount ?? data.jumlah ?? data.value ?? 0);
      if (!Number.isFinite(rawAmount)) return null;
      const dateValue = data.date || data.tarikh || data.tarikh_cipta || data.tarikh_transaksi;
      const date = normalizeToDate(dateValue) || new Date();
      return {
        id: doc.id,
        type,
        title: data.title || data.nama || data.description || data.keterangan || type.toUpperCase(),
        category: data.category || data.kategori || type,
        amount: rawAmount,
        date
      };
    };
    
    const grantTransactions = transactionsSnapshot.docs
      .map(parseGrantTransaction)
      .filter(Boolean);
    const hasGrantData = grantsSnapshot.docs.length > 0 || grantTransactions.length > 0;
    
    if (hasGrantData) {
      const grantTotals = grantsSnapshot.docs.reduce(
        (totals, doc) => {
          const data = doc.data();
          const totalAmount = Number(data.totalAmount) || 0;
          const availableAmount = Number(
            data.availableAmount !== undefined ? data.availableAmount : totalAmount
          );
          return {
            totalIncome: totals.totalIncome + totalAmount,
            available: totals.available + Math.max(availableAmount, 0)
          };
        },
        { totalIncome: 0, available: 0 }
      );
      
      const totalIncome = grantTotals.totalIncome;
      const totalExpenses = Math.max(totalIncome - grantTotals.available, 0);
      const netBalance = grantTotals.available;
      const recentTransactions = grantTransactions
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);
      
      return {
        totalIncome,
        totalExpenses,
        netBalance,
        recentTransactions
      };
    }
    
    const legacyIncomeTransactions = legacyIncomeSnapshot.docs
      .map(doc => parseLegacyTransaction(doc, 'income'))
      .filter(Boolean);
    const legacyExpenseTransactions = legacyExpenseSnapshot.docs
      .map(doc => parseLegacyTransaction(doc, 'expense'))
      .filter(Boolean);
    
    const totalIncome = legacyIncomeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpenses = legacyExpenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const recentTransactions = [...legacyIncomeTransactions, ...legacyExpenseTransactions]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
    
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      recentTransactions
    };
  } catch (error) {
    console.error('Error loading financial summary data:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      recentTransactions: []
    };
  }
}

function renderReportsDashboard({ programs = [], attendanceRecords = [], financialSummary = {} }) {
  const totalPrograms = programs.length;
  const now = new Date();
  const activePrograms = programs.filter(program => {
    const start = normalizeToDate(program.tarikh_mula || program.startDate);
    const end = normalizeToDate(program.tarikh_tamat || program.endDate);
    const status = determineProgramStatus(program, start, end, now);
    return status === 'active';
  }).length;
  const upcomingPrograms = programs.filter(program => {
    const start = normalizeToDate(program.tarikh_mula || program.startDate);
    const end = normalizeToDate(program.tarikh_tamat || program.endDate);
    const status = determineProgramStatus(program, start, end, now);
    return status === 'upcoming';
  }).length;
  
  const presentCount = attendanceRecords.filter(record => record.present).length;
  const attendanceRate = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;
  
  const uniqueParticipants = new Set();
  attendanceRecords.forEach(record => {
    const id = record.participant_id || record.participantId || record.no_kp_display || record.id;
    if (id) uniqueParticipants.add(id);
  });
  
  updateElementText('report-total-programs', formatNumber(totalPrograms));
  updateElementText('report-program-meta', `${activePrograms} active • ${upcomingPrograms} upcoming`);
  updateElementText('report-attendance-rate', `${attendanceRate}%`);
  updateElementText('report-attendance-meta', `${formatNumber(attendanceRecords.length)} attendance records`);
  updateElementText('report-total-participants', formatNumber(uniqueParticipants.size));
  updateElementText('report-net-balance', formatCurrency(financialSummary.netBalance ?? 0));
  updateElementText('report-financial-meta', `${formatCurrency(financialSummary.totalIncome ?? 0)} income • ${formatCurrency(financialSummary.totalExpenses ?? 0)} expenses`);
  updateElementText('report-income-total', formatCurrency(financialSummary.totalIncome ?? 0));
  updateElementText('report-expense-total', formatCurrency(financialSummary.totalExpenses ?? 0));
  updateElementText('report-surplus-value', formatCurrency((financialSummary.netBalance ?? 0)));
  const surplusHelper = document.getElementById('report-surplus-helper');
  if (surplusHelper) {
    surplusHelper.textContent = financialSummary.netBalance >= 0 ? 'Healthy surplus' : 'Deficit detected';
  }
  
  const programMetrics = buildProgramMetrics(programs, attendanceRecords);
  updateElementText('report-program-summary', `${programMetrics.length} programs tracked`);
  renderReportsProgramTable(programMetrics);
  renderReportsTopParticipants(attendanceRecords);
  renderReportsFinancialSection(financialSummary);
  renderReportsAttendanceChart(attendanceRecords);
}

function updateElementText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function buildProgramMetrics(programs = [], attendanceRecords = []) {
  const attendanceMap = new Map();
  
  attendanceRecords.forEach(record => {
    const programId = record.programId || record.program_id;
    if (!programId) return;
    if (!attendanceMap.has(programId)) {
      attendanceMap.set(programId, { total: 0, present: 0 });
    }
    const info = attendanceMap.get(programId);
    info.total += 1;
    if (record.present) {
      info.present += 1;
    }
  });
  
  return programs.map(program => {
    const attendanceInfo = attendanceMap.get(program.id) || { total: 0, present: 0 };
    const startDate = normalizeToDate(program.tarikh_mula || program.startDate);
    const endDate = normalizeToDate(program.tarikh_tamat || program.endDate);
    const status = determineProgramStatus(program, startDate, endDate);
    const attendanceRate = attendanceInfo.total > 0
      ? Math.round((attendanceInfo.present / attendanceInfo.total) * 100)
      : 0;
    
    return {
      id: program.id,
      name: program.nama_program || program.nama || 'Unnamed Program',
      status,
      participants: attendanceInfo.total,
      present: attendanceInfo.present,
      attendanceRate,
      duration: calculateProgramDuration(program)
    };
  });
}

function renderReportsProgramTable(programMetrics = []) {
  const tableBody = document.getElementById('report-program-table-body');
  if (!tableBody) return;
  
  if (!programMetrics.length) {
    tableBody.innerHTML = '<tr><td colspan="5" class="report-empty">No program data available</td></tr>';
    return;
  }
  
  const sorted = [...programMetrics].sort((a, b) => b.attendanceRate - a.attendanceRate || b.participants - a.participants).slice(0, 8);
  tableBody.innerHTML = sorted.map(metric => `
    <tr>
      <td><strong>${metric.name}</strong></td>
      <td><span class="status-badge ${metric.status}">${metric.status?.toUpperCase() || 'N/A'}</span></td>
      <td>${formatNumber(metric.participants)}</td>
      <td>${metric.attendanceRate}% (${formatNumber(metric.present)} hadir)</td>
      <td>${metric.duration}</td>
    </tr>
  `).join('');
}

function renderReportsTopParticipants(attendanceRecords = []) {
  const container = document.getElementById('report-top-participants');
  if (!container) return;
  
  if (!attendanceRecords.length) {
    container.innerHTML = '<div class="report-empty">No attendance data recorded yet</div>';
    return;
  }
  
  const participantMap = new Map();
  attendanceRecords.forEach(record => {
    const id = record.participant_id || record.participantId || record.no_kp_display || record.id;
    if (!id) return;
    if (!participantMap.has(id)) {
      participantMap.set(id, {
        id,
        name: record.participant_name || record.participantName || 'Unknown',
        type: record.participant_type || record.participantType || 'Participant',
        total: 0,
        present: 0
      });
    }
    const info = participantMap.get(id);
    info.total += 1;
    if (record.present) {
      info.present += 1;
    }
  });
  
  const topParticipants = Array.from(participantMap.values())
    .map(p => ({ ...p, attendanceRate: p.total ? Math.round((p.present / p.total) * 100) : 0 }))
    .sort((a, b) => b.present - a.present || b.attendanceRate - a.attendanceRate)
    .slice(0, 5);
  
  if (!topParticipants.length) {
    container.innerHTML = '<div class="report-empty">No participants to display</div>';
    return;
  }
  
  container.innerHTML = topParticipants.map((participant, index) => `
    <div class="report-list-item">
      <div>
        <strong>${index + 1}. ${participant.name}</strong>
        <span>${participant.type}</span>
      </div>
      <div>${participant.present} hadir</div>
    </div>
  `).join('');
}

function renderReportsFinancialSection(summary = {}) {
  const list = document.getElementById('report-financial-list');
  if (!list) return;
  
  const transactions = summary.recentTransactions || [];
  if (!transactions.length) {
    list.innerHTML = '<div class="report-empty">No financial transactions recorded</div>';
    return;
  }
  
  list.innerHTML = transactions.map(tx => `
    <div class="report-list-item">
      <div>
        <strong>${tx.title || tx.category || tx.type}</strong>
        <span>${tx.date ? new Date(tx.date).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
      </div>
      <div style="color: ${tx.type === 'income' ? '#10b981' : '#ef4444'};">
        ${tx.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(tx.amount))}
      </div>
    </div>
  `).join('');
}

async function renderReportsAttendanceChart(attendanceRecords = []) {
  const canvas = document.getElementById('report-attendance-chart');
  if (!canvas) return;
  
  const buckets = buildAttendanceBuckets(attendanceRecords, 6);
  const labels = buckets.map(bucket => bucket.label);
  const presentData = buckets.map(bucket => bucket.present);
  const totalData = buckets.map(bucket => bucket.total);
  
  const hasData = totalData.some(value => value > 0);
  const wrapper = canvas.parentElement;
  if (!hasData) {
    if (reportsAttendanceChartInstance) {
      reportsAttendanceChartInstance.destroy();
      reportsAttendanceChartInstance = null;
    }
    canvas.style.display = 'none';
    let emptyState = wrapper.querySelector('.report-empty');
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'report-empty';
      wrapper.appendChild(emptyState);
    }
    emptyState.textContent = 'No attendance activity for the selected period';
    emptyState.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  const existingEmpty = wrapper.querySelector('.report-empty');
  if (existingEmpty) {
    existingEmpty.style.display = 'none';
  }
  
  const { Chart } = await loadChartModule();
  if (reportsAttendanceChartInstance) {
    reportsAttendanceChartInstance.destroy();
  }
  
  reportsAttendanceChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          tension: 0.35,
          fill: true
        },
        {
          label: 'Total Records',
          data: totalData,
          borderColor: '#94a3b8',
          backgroundColor: 'rgba(148, 163, 184, 0.15)',
          tension: 0.35,
          fill: false,
          borderDash: [6, 6]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function buildAttendanceBuckets(records = [], months = 6) {
  const buckets = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: formatMonthKey(date),
      label: date.toLocaleDateString('en-MY', { month: 'short', year: '2-digit' }),
      total: 0,
      present: 0
    });
  }
  
  const bucketMap = new Map(buckets.map(bucket => [bucket.key, bucket]));
  
  records.forEach(record => {
    const dateValue = record.timestamp?.seconds
      ? new Date(record.timestamp.seconds * 1000)
      : record.timestamp
        ? new Date(record.timestamp)
        : record.date
          ? new Date(record.date)
          : null;
    const attendanceDate = normalizeToDate(dateValue);
    if (!attendanceDate) return;
    const key = formatMonthKey(attendanceDate);
    const bucket = bucketMap.get(key);
    if (bucket) {
      bucket.total += 1;
      if (record.present) bucket.present += 1;
    }
  });
  
  return buckets;
}

function downloadSystemReportPDF() {
  window.print();
}

// Helper function to format date for program section is already defined above



// Removed redundant initializeCiptaKIRWizard function - using initializeBasicWizard directly

// Enhanced 8-step wizard functionality
function initializeBasicWizard() {
  // Initialize 8-step wizard functionality
  
  // Check if wizard form exists
  const wizardForm = document.getElementById('ciptaKIRForm');
  if (!wizardForm) {
    console.error('Cipta KIR form not found!');
    return;
  }
  // Wizard form found, proceed with initialization
  
  let currentStep = 1;
  const totalSteps = 8;
  let kirId = null;
  let autosaveTimeout = null;
  let formData = {};
  
  // Step configuration
  const stepConfig = {
    1: { slug: 'maklumat-asas', label: 'Maklumat Asas', required: ['nama_penuh', 'no_kp', 'tarikh_lahir', 'telefon_utama', 'alamat'] },
    2: { slug: 'maklumat-keluarga', label: 'Maklumat Keluarga', required: ['status_perkahwinan'] },
    3: { slug: 'kafa', label: 'Pendidikan Agama (KAFA)', required: [] },
    4: { slug: 'pendidikan', label: 'Pendidikan', required: [] },
    5: { slug: 'pekerjaan', label: 'Maklumat Pekerjaan', required: ['status_pekerjaan'] },
    6: { slug: 'kesihatan', label: 'Maklumat Kesihatan', required: [] },
    7: { slug: 'ekonomi', label: 'Ekonomi', required: [] },
    8: { slug: 'semak', label: 'Semakan & Pengesahan', required: ['confirm_accuracy'] }
  };
  
  // Get wizard elements
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const submitBtn = document.getElementById('submitBtn');
  const saveBtn = document.getElementById('saveAsDraftBtn');
  const form = document.getElementById('ciptaKIRForm');
  
  // Initialize URL routing
  function initializeRouting() {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    
    if (stepParam) {
      const stepNumber = Object.keys(stepConfig).find(key => stepConfig[key].slug === stepParam);
      if (stepNumber) {
        currentStep = parseInt(stepNumber);
      }
    }
    
    // Load from localStorage if available (only if not cleared by navigation)
    const savedData = localStorage.getItem('ciptaKIR_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        kirId = parsed.kirId;
        currentStep = parsed.step || currentStep;
        formData = parsed.data || {};
        // Only populate if there's actual data
        if (Object.keys(formData).length > 0) {
          populateForm(formData);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    } else {
      // No saved data, ensure we start from step 1
      currentStep = 1;
      kirId = null;
      formData = {};
    }
  }
  
  // Update URL and localStorage
  function updatePersistence() {
    const stepSlug = stepConfig[currentStep].slug;
    const url = new URL(window.location);
    url.searchParams.set('step', stepSlug);
    window.history.replaceState({}, '', url);
    
    // Save to localStorage
    const saveData = {
      kirId,
      step: currentStep,
      data: collectFormData()
    };
    localStorage.setItem('ciptaKIR_draft', JSON.stringify(saveData));
  }
  
  // Collect form data
  function collectFormData() {
    const data = {};
    
    // Collect data manually to avoid file input issues
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      // Skip file inputs as they cannot be serialized
      if (input.type === 'file') return;
      
      const name = input.name;
      if (!name) return;
      
      let value;
      if (input.type === 'checkbox') {
        value = input.checked;
      } else {
        value = input.value;
      }
      
      if (name.includes('[')) {
        // Handle array fields
        const match = name.match(/(\w+)\[(\d+)\]\[(\w+)\]/);
        if (match) {
          const [, arrayName, index, fieldName] = match;
          if (!data[arrayName]) data[arrayName] = [];
          if (!data[arrayName][index]) data[arrayName][index] = {};
          data[arrayName][index][fieldName] = value;
        }
      } else {
        data[name] = value;
      }
    });
    
    // Map KAFA fields to expected database field names
    const kafaFieldMapping = {
      'sumber_pengetahuan': 'kafa_sumber',
      'tahap_iman': 'kafa_iman',
      'tahap_islam': 'kafa_islam',
      'tahap_fatihah': 'kafa_fatihah',
      'tahap_taharah_wuduk_solat': 'kafa_solat',
      'tahap_puasa_fidyah_zakat': 'kafa_puasa',
      'kafa_skor': 'kafa_skor'
    };
    
    // Apply KAFA field mapping
    Object.keys(kafaFieldMapping).forEach(formField => {
      if (data[formField] !== undefined) {
        data[kafaFieldMapping[formField]] = data[formField];
        // Keep original field for form compatibility
        // delete data[formField]; // Don't delete to maintain form functionality
      }
    });
    
    return data;
  }
  
  // Populate form with data
  function populateForm(data) {
    if (!data || Object.keys(data).length === 0) return;
    
    Object.keys(data).forEach(key => {
      // Skip empty values to avoid clearing existing form data
      if (data[key] === '' || data[key] === null || data[key] === undefined) return;
      
      if (Array.isArray(data[key])) {
        // Handle array data
        data[key].forEach((item, index) => {
          Object.keys(item).forEach(field => {
            if (item[field] !== '' && item[field] !== null && item[field] !== undefined) {
              const input = document.querySelector(`[name="${key}[${index}][${field}]"]`);
              if (input) input.value = item[field];
            }
          });
        });
      } else {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) {
          // Skip file inputs as they cannot be programmatically set
          if (input.type === 'file') {
            return;
          }
          if (input.type === 'checkbox') {
            input.checked = data[key] === 'on' || data[key] === true;
          } else {
            input.value = data[key];
          }
        }
      }
    });
    
    // Trigger marital status field visibility after data population
    const statusPerkahwinanField = document.getElementById('status_perkahwinan');
    if (statusPerkahwinanField && statusPerkahwinanField.value) {
      statusPerkahwinanField.dispatchEvent(new Event('change'));
    }
  }
  
  // Age calculation
  const tarikhLahir = document.getElementById('tarikh_lahir');
  const umur = document.getElementById('umur');
  if (tarikhLahir && umur) {
    tarikhLahir.addEventListener('change', function() {
      const birthDate = new Date(this.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      umur.value = age >= 0 ? age : '';
      triggerAutosave();
    });
  }
  
  // KAFA scoring calculation
  function updateKAFAScore() {
    const tahapIman = document.getElementById('tahap_iman')?.value;
    const tahapIslam = document.getElementById('tahap_islam')?.value;
    const tahapFatihah = document.getElementById('tahap_fatihah')?.value;
    const tahapTaharah = document.getElementById('tahap_taharah_wuduk_solat')?.value;
    const tahapPuasa = document.getElementById('tahap_puasa_fidyah_zakat')?.value;
    const skorField = document.getElementById('kafa_skor');
    
    if (skorField) {
      const scores = [
        parseInt(tahapIman) || 0,
        parseInt(tahapIslam) || 0,
        parseInt(tahapFatihah) || 0,
        parseInt(tahapTaharah) || 0,
        parseInt(tahapPuasa) || 0
      ];
      
      const validScores = scores.filter(score => score > 0);
      if (validScores.length > 0) {
        const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
        skorField.value = Math.round(average * 100) / 100; // Round to 2 decimal places
      } else {
        skorField.value = '';
      }
      triggerAutosave();
    }
  }
  
  // Employment status handler
  const statusPekerjaan = document.getElementById('status_pekerjaan');
  if (statusPekerjaan) {
    statusPekerjaan.addEventListener('change', function() {
      const employmentFields = ['jenis_pekerjaan_group', 'nama_majikan_group', 'gaji_bulanan_group', 'alamat_kerja_group'];
      const isWorking = this.value === 'Bekerja';
      
      employmentFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          field.classList.toggle('employment-hidden', !isWorking);
        }
      });
      
      triggerAutosave();
    });
  }
  
  // Economic calculations
  function updateEconomicTotals() {
    // Calculate total income
    let totalIncome = 0;
    document.querySelectorAll('[name*="pendapatan_tetap"][name*="[jumlah]"], [name*="pendapatan_tidak_tetap"][name*="[jumlah]"]').forEach(input => {
      totalIncome += parseFloat(input.value) || 0;
    });
    const incomeDisplay = document.getElementById('jumlah-pendapatan');
    if (incomeDisplay) incomeDisplay.textContent = totalIncome.toFixed(2);
    
    // Calculate total expenses
    let totalExpenses = 0;
    document.querySelectorAll('[name*="perbelanjaan"][name*="[jumlah]"]').forEach(input => {
      totalExpenses += parseFloat(input.value) || 0;
    });
    const expenseDisplay = document.getElementById('jumlah-perbelanjaan');
    if (expenseDisplay) expenseDisplay.textContent = totalExpenses.toFixed(2);
    
    // Calculate monthly assistance
    let monthlyAssistance = 0;
    document.querySelectorAll('.bantuan-bulanan-item').forEach(item => {
      const kadar = parseFloat(item.querySelector('[name*="[kadar]"]')?.value) || 0;
      const kekerapan = item.querySelector('[name*="[kekerapan]"]')?.value;
      
      const factors = {
        'Bulanan': 1,
        'Mingguan': 4.33,
        'Harian': 30,
        'Suku-Tahunan': 1/3,
        'Tahunan': 1/12,
        'Sekali': 0
      };
      
      monthlyAssistance += kadar * (factors[kekerapan] || 0);
    });
    const assistanceDisplay = document.getElementById('anggaran-bulanan');
    if (assistanceDisplay) assistanceDisplay.textContent = monthlyAssistance.toFixed(2);
  }
  
  // Dynamic field addition handlers
  function initializeDynamicFields() {
    const addButtons = {
      'add-penyakit-kronik': 'penyakit-kronik-container',
      'add-ubat-tetap': 'ubat-tetap-container',
      'add-rawatan': 'rawatan-container',
      'add-pembedahan': 'pembedahan-container',
      'add-pendapatan-tetap': 'pendapatan-tetap-container',
      'add-pendapatan-tidak-tetap': 'pendapatan-tidak-tetap-container',
      'add-perbelanjaan': 'perbelanjaan-container',
      'add-bantuan-bulanan': 'bantuan-bulanan-container'
    };
    
    Object.keys(addButtons).forEach(buttonId => {
      const button = document.getElementById(buttonId);
      const container = document.getElementById(addButtons[buttonId]);
      
      if (button && container) {
        button.addEventListener('click', function() {
          const items = container.querySelectorAll('.form-grid');
          const newIndex = items.length;
          const template = items[0].cloneNode(true);
          
          // Update field names and clear values
          template.querySelectorAll('input, select').forEach(input => {
            const name = input.getAttribute('name');
            if (name) {
              input.setAttribute('name', name.replace(/\[\d+\]/, `[${newIndex}]`));
              input.value = '';
            }
          });
          
          container.appendChild(template);
          triggerAutosave();
        });
      }
    });
    
    // Marital status handler
    const statusPerkahwinan = document.getElementById('status_perkahwinan');
    if (statusPerkahwinan) {
      statusPerkahwinan.addEventListener('change', function() {
        const value = this.value;
        const tarikhNikahGroup = document.getElementById('tarikh_nikah_group');
        const tarikhCeraiGroup = document.getElementById('tarikh_cerai_group');
        const spouseInfo = document.getElementById('spouse-info');
        
        // Hide all conditional fields first
        if (tarikhNikahGroup) tarikhNikahGroup.style.display = 'none';
        if (tarikhCeraiGroup) tarikhCeraiGroup.style.display = 'none';
        if (spouseInfo) spouseInfo.style.display = 'none';
        
        // Show relevant fields based on status
        // For "Bujang" (single), no additional fields are shown
        if (value === 'Berkahwin') {
          if (tarikhNikahGroup) tarikhNikahGroup.style.display = 'block';
          if (spouseInfo) spouseInfo.style.display = 'block';
        } else if (value === 'Bercerai' || value === 'Duda' || value === 'Janda') {
          if (tarikhNikahGroup) tarikhNikahGroup.style.display = 'block';
          if (tarikhCeraiGroup) tarikhCeraiGroup.style.display = 'block';
          if (spouseInfo) spouseInfo.style.display = 'block';
        }
        // Note: For "Bujang" or empty value, all fields remain hidden
        
        triggerAutosave();
      });
    }
  }
  
  // Autosave functionality
  function triggerAutosave() {
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    
    autosaveTimeout = setTimeout(async () => {
      if (kirId) {
        try {
          const data = collectFormData();
          const { KIRService } = await import('../../services/backend/KIRService.js');
          await KIRService.updateKIR(kirId, data);
          console.log('Autosaved successfully');
        } catch (error) {
          console.error('Autosave failed:', error);
        }
      }
    }, 2000);
  }
  
  // S1 Requirement: ensureKirId() - create-once logic for AdminDashboard
  async function ensureKIRExists() {
    console.log('ensureKIRExists() called', { kirId });
    
    // If kirId already exists, use it
    if (kirId) {
      console.log('Using existing kirId:', kirId);
      return kirId;
    }
    
    // Check localStorage for persisted kirId
    const savedKirId = localStorage.getItem('wizardKirId');
    if (savedKirId) {
      kirId = savedKirId;
      console.log('Using kirId from localStorage:', kirId);
      return kirId;
    }
    
    const data = collectFormData();
    
    // Check if no_kp is available for index lookup
    if (!data.no_kp) {
      throw new Error('No. KP diperlukan untuk mencipta KIR');
    }
    
    const { normalizeNoKP } = await import('../../services/database/collections.js');
    const normalizedNoKP = normalizeNoKP(data.no_kp);
    if (!normalizedNoKP) {
      throw new Error('No. KP tidak sah');
    }
    
    try {
      const { KIRService } = await import('../../services/backend/KIRService.js');
      
      // Check /index_nokp/{normalized_no_kp} for existing KIR
      const existingIndex = await KIRService.getNoKPIndex(normalizedNoKP);
      if (existingIndex && existingIndex.kir_id) {
        kirId = existingIndex.kir_id;
        
        // Persist to localStorage
        localStorage.setItem('wizardKirId', kirId);
        updatePersistence();
        
        console.log('Found existing KIR via index_nokp:', kirId);
        return kirId;
      }
      
      // No existing KIR found - create new one
      const requiredFields = stepConfig[1].required;
      const hasRequiredData = requiredFields.every(field => data[field]);
      
      if (!hasRequiredData) {
        throw new Error('Maklumat asas diperlukan untuk mencipta KIR');
      }
      
      data.status_rekod = 'Draf';
      const result = await KIRService.createKIR(data);
      kirId = result.id;
      
      // Persist to localStorage immediately
      localStorage.setItem('wizardKirId', kirId);
      updatePersistence();
      
      console.log('Created new KIR:', kirId);
      return kirId;
      
    } catch (error) {
      console.error('Error in ensureKIRExists:', error);
      if (error.message.includes('duplicate') || error.message.includes('No. KP')) {
        throw error;
      } else {
        throw new Error('Ralat mencipta KIR: ' + error.message);
      }
    }
  }
  
  // Update UI based on current step
  function updateUI() {
    // Update wizard sections - only hide non-current steps to avoid flash
    const sections = document.querySelectorAll('.wizard-step');
    sections.forEach((section, index) => {
      const stepNumber = parseInt(section.getAttribute('data-step'));
      if (stepNumber === currentStep) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
    
    // Update progress indicators
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
      step.classList.remove('active', 'completed');
      if (index + 1 < currentStep) {
        step.classList.add('completed');
      } else if (index + 1 === currentStep) {
        step.classList.add('active');
      }
    });
    
    // Update button visibility - get current button references
    const currentPrevBtn = document.getElementById('prevBtn');
    const currentNextBtn = document.getElementById('nextBtn');
    const currentSubmitBtn = document.getElementById('submitBtn');
    
    if (currentPrevBtn) currentPrevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
    if (currentNextBtn) currentNextBtn.style.display = currentStep < totalSteps ? 'inline-block' : 'none';
    if (currentSubmitBtn) currentSubmitBtn.style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    
    // Update completion percentage for final step
    if (currentStep === 8) {
      updateCompletionStatus();
      updateReviewContent();
    }
    
    updatePersistence();
    // UI updated for current step
  }
  
  // Validate current step
  function validateStep() {
    const currentSection = document.querySelector(`[data-step="${currentStep}"]`);
    if (!currentSection) return true;
    
    const requiredFields = stepConfig[currentStep].required;
    let isValid = true;
    let errors = [];
    
    requiredFields.forEach(fieldName => {
      const field = currentSection.querySelector(`[name="${fieldName}"]`);
      if (field) {
        if (field.type === 'checkbox') {
          if (!field.checked) {
            field.style.outline = '2px solid #dc3545';
            errors.push(`${field.closest('.form-group')?.querySelector('label')?.textContent || fieldName} diperlukan`);
            isValid = false;
          } else {
            field.style.outline = 'none';
          }
        } else if (!field.value.trim()) {
          field.style.borderColor = '#dc3545';
          errors.push(`${field.closest('.form-group')?.querySelector('label')?.textContent || fieldName} diperlukan`);
          isValid = false;
        } else {
          field.style.borderColor = '#e9ecef';
        }
      }
    });
    
    // Additional validations
    if (currentStep === 2) {
      const statusPerkahwinan = document.getElementById('status_perkahwinan')?.value;
      const tarikhNikah = document.getElementById('tarikh_nikah')?.value;
      const tarikhCerai = document.getElementById('tarikh_cerai')?.value;
      
      if (statusPerkahwinan === 'Berkahwin' && !tarikhNikah) {
        errors.push('Tarikh nikah diperlukan untuk status berkahwin');
        isValid = false;
      }
      
      if (['Bercerai', 'Janda', 'Duda'].includes(statusPerkahwinan)) {
        if (!tarikhCerai) {
          errors.push('Tarikh cerai diperlukan');
          isValid = false;
        } else if (tarikhNikah && new Date(tarikhCerai) < new Date(tarikhNikah)) {
          errors.push('Tarikh cerai mesti selepas tarikh nikah');
          isValid = false;
        }
      }
    }
    
    if (!isValid) {
      showError(errors.join('\n'));
    }
    
    return isValid;
  }
  
  // Update completion status
  function updateCompletionStatus() {
    const data = collectFormData();
    let completedItems = 0;
    let totalItems = 0;
    
    // Check Maklumat Asas (weight: 4)
    const basicFields = ['nama_penuh', 'no_kp', 'telefon_utama', 'alamat'];
    basicFields.forEach(field => {
      totalItems++;
      if (data[field]) completedItems++;
    });
    
    // Check KAFA (weight: 2)
    if (data.kafa_iman && data.kafa_islam) completedItems++;
    totalItems++;
    
    // Check Pekerjaan (weight: 1)
    if (data.status_pekerjaan) completedItems++;
    totalItems++;
    
    // Check Ekonomi (weight: 1)
    if (data.jumlah_pendapatan > 0 || (data.pendapatan_tetap && data.pendapatan_tetap.length > 0)) completedItems++;
    totalItems++;
    
    const percentage = Math.round((completedItems / totalItems) * 100);
    
    const percentageEl = document.getElementById('completion-percentage');
    const progressFill = document.getElementById('progress-fill');
    
    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
  }
  
  // Update review content
  function updateReviewContent() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const data = collectFormData();
    let html = '';
    
    Object.keys(stepConfig).forEach(stepNum => {
      if (stepNum == 8) return; // Skip review step itself
      
      const config = stepConfig[stepNum];
      html += `<div class="review-section"><h6>${config.label}</h6>`;
      
      // Add relevant fields for each step
      if (stepNum == 1) {
        html += `<p><strong>Nama:</strong> ${data.nama_penuh || '-'}</p>`;
        html += `<p><strong>No. KP:</strong> ${data.no_kp || '-'}</p>`;
        html += `<p><strong>Telefon:</strong> ${data.telefon_utama || '-'}</p>`;
      } else if (stepNum == 2) {
        html += `<p><strong>Status Perkahwinan:</strong> ${data.status_perkahwinan || '-'}</p>`;
      } else if (stepNum == 5) {
        html += `<p><strong>Status Pekerjaan:</strong> ${data.status_pekerjaan || '-'}</p>`;
        if (data.gaji_bulanan) html += `<p><strong>Gaji:</strong> RM ${data.gaji_bulanan}</p>`;
      }
      
      html += '</div>';
    });
    
    reviewContent.innerHTML = html;
  }
  
  // Show error message
  function showError(message) {
    alert(message); // Could be enhanced with a better UI
  }
  
  // Event listeners
  if (form) {
    form.addEventListener('input', triggerAutosave);
    form.addEventListener('change', triggerAutosave);
  }
  
  // KAFA score calculation listeners
  ['tahap_iman', 'tahap_islam', 'tahap_fatihah', 'tahap_taharah_wuduk_solat', 'tahap_puasa_fidyah_zakat'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.addEventListener('change', updateKAFAScore);
  });
  
  // Economic calculation listeners
  document.addEventListener('input', function(e) {
    if (e.target.name && (e.target.name.includes('pendapatan') || e.target.name.includes('perbelanjaan') || e.target.name.includes('bantuan'))) {
      updateEconomicTotals();
    }
  });
  
  // Next button handler
  if (nextBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    newNextBtn.addEventListener('click', async function() {
      // Navigate to next step
      if (validateStep()) {
        await ensureKIRExists();
        if (currentStep < totalSteps) {
          currentStep++;
          updateUI();
        }
      }
    });
  }
  
  // Previous button handler
  if (prevBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    
    newPrevBtn.addEventListener('click', function() {
      // Navigate to previous step
      if (currentStep > 1) {
        currentStep--;
        updateUI();
      }
    });
  }
  
  // Save draft handler
  if (saveBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    newSaveBtn.addEventListener('click', async function() {
      // Save current form data as draft
      
      try {
        const data = collectFormData();
        
        // S1 Requirement: All saves call ensureKIRExists() first
        await ensureKIRExists();
        
        // Then updateKIR (never call create twice)
        const { KIRService } = await import('../../services/backend/KIRService.js');
        await KIRService.updateKIR(kirId, {
          ...data,
          status_rekod: 'Draf'
        });
        
        // Log to console each write: {op, kirId, from, time}
        console.log({
          op: 'updateKIR',
          kirId: kirId,
          from: 'saveAsDraft-AdminDashboard',
          time: new Date().toISOString()
        });
        
        alert('Draf telah disimpan!');
      } catch (error) {
        console.error('Error saving draft:', error);
        if (error.message.includes('duplicate') || error.message.includes('No. KP')) {
          alert(error.message);
        } else {
          alert('Ralat menyimpan draf: ' + error.message);
        }
      }
    });
  }
  
  // Submit handler
  if (submitBtn) {
    // Remove any existing event listeners to prevent duplicates
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    let isSubmitting = false; // Prevent multiple submissions
    
    newSubmitBtn.addEventListener('click', async function() {
      // Prevent multiple submissions
      if (isSubmitting) {
        console.log('Submission already in progress, ignoring click');
        return;
      }
      
      // Submit final form data
      if (validateStep()) {
        isSubmitting = true;
        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = 'Menghantar...';
        
        try {
          // S1 Requirement: All saves call ensureKIRExists() first
          await ensureKIRExists();
          
          const { KIRService } = await import('../../services/backend/KIRService.js');
          
          // Update with final submission status
          const data = collectFormData();
          await KIRService.updateKIR(kirId, {
            ...data,
            status_rekod: 'Dihantar',
            tarikh_hantar: new Date().toISOString()
          });
          
          console.log('KIR updated successfully, now creating related documents...');
          
          // Create related documents (KAFA, Pendidikan, etc.) after successful submission
          await KIRService.createRelatedDocuments(kirId, data);
          
          console.log('Related documents created successfully');
          
          // Clear localStorage
          localStorage.removeItem('ciptaKIR_draft');
          localStorage.removeItem('wizardKirId');
          localStorage.removeItem('wizardIsCreated');
          
          alert('KIR telah dihantar berjaya!');
          
          // Trigger KIR list refresh before redirect
          if (typeof window.loadKIRData === 'function') {
            window.loadKIRData();
          }
          
          // Also dispatch refresh event
          window.dispatchEvent(new CustomEvent('kirListNeedsRefresh', {
            detail: { kirId: kirId, action: 'submitted' }
          }));
          
          // Redirect to KIR details
          window.location.href = `/admin/kir/${kirId}`;
        } catch (error) {
          console.error('Error submitting form:', error);
          isSubmitting = false;
          newSubmitBtn.disabled = false;
          newSubmitBtn.textContent = 'Hantar';
          
          if (error.message.includes('PERMISSION_DENIED')) {
            alert('Akses ditolak: sila semak peraturan Firestore/peranan.');
          } else {
            alert('Ralat menghantar borang: ' + error.message);
          }
        }
      }
    });
  }
  
  // Initialize everything
  initializeRouting();
  initializeDynamicFields();
  initializeAIRFunctionality();
  initializeSpouseConditionalLogic();
  
  // Delay UI update to ensure DOM is ready
  requestAnimationFrame(() => {
    updateUI();
    updateEconomicTotals();
  });
  
  // 8-step wizard initialization complete
}

// AIR (Ahli Isi Rumah) Dynamic Functionality
function initializeAIRFunctionality() {
  const airContainer = document.getElementById('air-rows');
  const addAIRBtn = document.getElementById('add-air-row');
  const toggleAIRBtn = document.getElementById('toggle-air-section');
  const airMainContainer = document.getElementById('air-container');
  
  console.log('Initializing AIR functionality...');
  console.log('AIR elements found:', {
    airContainer: !!airContainer,
    addAIRBtn: !!addAIRBtn,
    toggleAIRBtn: !!toggleAIRBtn,
    airMainContainer: !!airMainContainer
  });
  
  if (!airContainer || !addAIRBtn) {
    console.log('AIR elements not found, skipping AIR initialization');
    return;
  }
  
  let airCounter = 0;
  
  // Add new AIR row
  function addAIRRow() {
    airCounter++;
    const airRow = document.createElement('div');
    airRow.className = 'air-grid air-row';
    airRow.dataset.airIndex = airCounter;
    
    airRow.innerHTML = `
      <div class="air-grid-row">
        <div class="air-cell">
          <input type="text" id="air_nama_${airCounter}" name="air[${airCounter}][nama]" placeholder="Nama" required>
        </div>
        
        <div class="air-cell">
          <input type="text" id="air_no_kp_${airCounter}" name="air[${airCounter}][no_kp]" pattern="[0-9]{12}" maxlength="12" placeholder="No. KP">
          <input type="date" id="air_tarikh_lahir_${airCounter}" name="air[${airCounter}][tarikh_lahir]" placeholder="Tarikh Lahir" style="margin-top: 5px;">
          <small style="font-size: 0.75rem; color: #666;">No. KP atau Tarikh Lahir</small>
        </div>
        
        <div class="air-cell">
          <select id="air_jantina_${airCounter}" name="air[${airCounter}][jantina]" required>
            <option value="">Pilih</option>
            <option value="Lelaki">Lelaki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        
        <div class="air-cell">
          <select id="air_hubungan_${airCounter}" name="air[${airCounter}][hubungan]" required>
            <option value="">Pilih</option>
            <option value="Anak">Anak</option>
            <option value="Menantu">Menantu</option>
            <option value="Cucu">Cucu</option>
            <option value="Adik">Adik</option>
            <option value="Lain-lain">Lain-lain</option>
          </select>
        </div>
        
        <div class="air-cell">
          <select id="air_status_${airCounter}" name="air[${airCounter}][status]" required onchange="toggleAIRConditionalFields(${airCounter})">
            <option value="">Pilih</option>
            <option value="Pelajar">Pelajar</option>
            <option value="Bekerja">Bekerja</option>
            <option value="Tidak Bekerja">Tidak Bekerja</option>
          </select>
        </div>
        
        <div class="air-cell">
          <select id="air_oku_${airCounter}" name="air[${airCounter}][oku]">
            <option value="Tidak">Tidak</option>
            <option value="Ya">Ya</option>
          </select>
        </div>
        
        <div class="air-cell">
          <input type="number" id="air_pendapatan_${airCounter}" name="air[${airCounter}][pendapatan]" min="0" step="0.01" placeholder="Pendapatan (RM)" class="conditional-field" style="display: none;">
          <input type="text" id="air_sekolah_${airCounter}" name="air[${airCounter}][sekolah]" placeholder="Sekolah/IPT" class="conditional-field" style="display: none;">
        </div>
        
        <div class="air-cell">
          <button type="button" class="air-remove-btn" onclick="removeAIRRow(${airCounter})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
    
    airContainer.appendChild(airRow);
    updateAIREmptyState();
  }
  
  // Remove AIR row
  window.removeAIRRow = function(index) {
    const airRow = document.querySelector(`[data-air-index="${index}"]`);
    if (airRow) {
      airRow.remove();
      updateAIREmptyState();
    }
  };
  
  // Toggle conditional fields based on status
  window.toggleAIRConditionalFields = function(index) {
    const statusSelect = document.getElementById(`air_status_${index}`);
    const pendapatanInput = document.getElementById(`air_pendapatan_${index}`);
    const sekolahInput = document.getElementById(`air_sekolah_${index}`);
    
    if (statusSelect && pendapatanInput && sekolahInput) {
      const status = statusSelect.value;
      
      // Reset visibility
      pendapatanInput.style.display = 'none';
      sekolahInput.style.display = 'none';
      
      // Show relevant fields
      if (status === 'Bekerja') {
        pendapatanInput.style.display = 'block';
      } else if (status === 'Pelajar') {
        sekolahInput.style.display = 'block';
      }
    }
  };
  
  // Update empty state
  function updateAIREmptyState() {
    const airRows = airContainer.querySelectorAll('.air-row');
    const emptyState = airContainer.querySelector('.air-empty-state');
    
    if (airRows.length === 0) {
      if (!emptyState) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'air-empty-state';
        emptyDiv.innerHTML = 'Tiada ahli isi rumah ditambah. Klik "Tambah Ahli Isi Rumah" untuk menambah.';
        airContainer.appendChild(emptyDiv);
      }
    } else {
      if (emptyState) {
        emptyState.remove();
      }
    }
  }
  
  // Add event listener to add button
  addAIRBtn.addEventListener('click', addAIRRow);
  
  // Add event listener to toggle button
  if (toggleAIRBtn && airMainContainer) {
    toggleAIRBtn.addEventListener('click', () => {
      if (airMainContainer.style.display === 'none') {
        airMainContainer.style.display = 'block';
        toggleAIRBtn.innerHTML = '<i class="fas fa-minus"></i> Sembunyikan AIR';
      } else {
        airMainContainer.style.display = 'none';
        toggleAIRBtn.innerHTML = '<i class="fas fa-plus"></i> Tambah AIR (Ringkas)';
      }
    });
  }
  
  // Initialize empty state
   updateAIREmptyState();
}

// Spouse Conditional Logic
function initializeSpouseConditionalLogic() {
  const statusPerkahwinanSelect = document.getElementById('status_perkahwinan');
  const spouseSection = document.getElementById('ringkasan-pasangan-section');
  const airSection = document.getElementById('ahli-isi-rumah-section');
  const addAIRManualBtn = document.getElementById('toggle-air-section');
  
  console.log('Initializing spouse conditional logic...');
  console.log('Elements found:', {
    statusPerkahwinanSelect: !!statusPerkahwinanSelect,
    spouseSection: !!spouseSection,
    airSection: !!airSection,
    addAIRManualBtn: !!addAIRManualBtn
  });
  
  if (!statusPerkahwinanSelect) {
    console.log('Status perkahwinan select not found, skipping spouse logic initialization');
    return;
  }
  
  function toggleSpouseAndAIRSections() {
    const status = statusPerkahwinanSelect.value;
    console.log('Toggling spouse and AIR sections for status:', status);
    
    // Show/hide spouse section - show for married, divorced, or widowed
    if (spouseSection) {
      if (status === 'Berkahwin' || status === 'Bercerai' || status === 'Balu/Duda') {
        spouseSection.style.display = 'block';
        // Make spouse fields required only if currently married
        const spouseRequiredFields = spouseSection.querySelectorAll('input[data-required-if-married]');
        spouseRequiredFields.forEach(field => {
          field.required = (status === 'Berkahwin');
        });
      } else {
        spouseSection.style.display = 'none';
        // Remove required from spouse fields
        const spouseFields = spouseSection.querySelectorAll('input');
        spouseFields.forEach(field => {
          field.required = false;
          field.value = ''; // Clear values
        });
      }
    }
    
    // Show/hide AIR section based on marriage status
    if (airSection) {
      if (status === 'Berkahwin' || status === 'Bercerai' || status === 'Balu/Duda') {
        console.log('Showing AIR section for married/divorced/widowed status');
        airSection.style.display = 'block';
      } else {
        // Keep AIR section hidden by default for single, but allow manual show
        console.log('Hiding AIR section for single status');
        airSection.style.display = 'none';
      }
    } else {
      console.log('AIR section element not found!');
    }
    
    // Show/hide manual AIR button
    if (addAIRManualBtn) {
      if (status === 'Bujang' || status === '') {
        addAIRManualBtn.style.display = 'inline-block';
      } else {
        addAIRManualBtn.style.display = 'none';
      }
    }
  }
  
  // Manual AIR section toggle
  if (addAIRManualBtn) {
    addAIRManualBtn.addEventListener('click', () => {
      if (airSection) {
        airSection.style.display = 'block';
        addAIRManualBtn.style.display = 'none';
      }
    });
  }
  
  // Add event listener
  statusPerkahwinanSelect.addEventListener('change', toggleSpouseAndAIRSections);
  
  // Initialize on page load
  toggleSpouseAndAIRSections();
}

// Helper functions for Program & Kehadiran (New) functionality
function showProgramNewSubSection(sectionId) {
  console.log('Showing Program New sub-section:', sectionId);
  
  // Hide all sub-sections
  const subSections = [
    'program-kehadiran-new-overview',
    'program-management-new-content',
    'attendance-tracking-new-content',
    'program-reports-new-content'
  ];
  
  subSections.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.display = 'none';
    }
  });
  
  // Show the selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
  } else {
    console.error(`Section ${sectionId} not found`);
  }
}

function setupProgramKehadiranNewOverviewListeners() {
  console.log('Setting up Program & Kehadiran (New) overview listeners');
  // This function will be called when the overview section is initialized
}

function setupProgramManagementNewListeners(programService) {
  console.log('Setting up Enhanced Program Management listeners');
  // This function will handle enhanced program management functionality
}

async function loadProgramsNew() {
  console.log('Loading enhanced programs data...');
  
  try {
    const programsTableBody = document.getElementById('programs-new-table-body');
    if (!programsTableBody) {
      console.error('Enhanced programs table body not found');
      return;
    }
    
    programsTableBody.innerHTML = '<tr><td colspan="8" class="loading-text">Loading enhanced programs...</td></tr>';
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get programs from the database
    const programs = await ProgramService.listProgram();
    console.log('Enhanced programs loaded:', programs);
    
    if (programs.length === 0) {
      programsTableBody.innerHTML = `
        <tr><td colspan="8" class="empty-text">
          No programs found. 
          <button id="create-test-program-new" class="btn btn-sm btn-primary">Create Test Program</button>
        </td></tr>
      `;
      
      // Add event listener to create test program button
      const createTestBtn = document.getElementById('create-test-program-new');
      if (createTestBtn) {
        createTestBtn.addEventListener('click', createTestProgram);
      }
      return;
    }
    
    // Clear the loading message
    programsTableBody.innerHTML = '';
    
    // Add each program to the table
    programs.forEach(program => {
      const row = document.createElement('tr');
      
      // Format dates - handle both tarikh and tarikh_mula fields
      const startDate = formatProgramDate(program.tarikh_mula);
      const endDate = formatProgramDate(program.tarikh_tamat);
      
      // Determine status based on dates if not explicitly set
      let status = program.status || 'upcoming';
      if (!program.status) {
        const now = new Date();
        const programStartDate = program.tarikh_mula;
        const programEndDate = program.tarikh_tamat;
        
        if (programStartDate && programEndDate) {
          let startDate, endDate;
          
          // Handle different timestamp formats
          if (programStartDate.seconds) {
            startDate = new Date(programStartDate.seconds * 1000);
          } else {
            startDate = new Date(programStartDate);
          }
          
          if (programEndDate.seconds) {
            endDate = new Date(programEndDate.seconds * 1000);
          } else {
            endDate = new Date(programEndDate);
          }
          
          if (now > endDate) {
            status = 'completed';
          } else if (now >= startDate && now <= endDate) {
            status = 'active';
          } else {
            status = 'upcoming';
          }
        }
      }
      
      // Determine status class
      let statusClass = 'status-badge ';
      switch(status) {
        case 'upcoming':
          statusClass += 'upcoming';
          break;
        case 'active':
          statusClass += 'active';
          break;
        case 'completed':
          statusClass += 'completed';
          break;
        case 'cancelled':
          statusClass += 'cancelled';
          break;
        default:
          statusClass += 'upcoming';
      }
      
      // Create the row content - handle both nama and nama_program fields
      const programName = program.nama_program || program.nama || 'Unnamed Program';
      const description = program.penerangan || program.deskripsi || 'No description';
      
      // Create the row content with enhanced styling
      row.innerHTML = `
        <td><strong>${programName}</strong></td>
        <td>${description}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td><span class="category-badge">${program.kategori || 'N/A'}</span></td>
        <td><span class="${statusClass}">${status.toUpperCase()}</span></td>
        <td>${program.participants || 0}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary edit-program-new" data-id="${program.id}" title="Edit Program">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-info view-program-new" data-id="${program.id}" title="View Details">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-danger delete-program-new" data-id="${program.id}" title="Delete Program">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </td>
      `;
      
      programsTableBody.appendChild(row);
      
      // Add event listeners for enhanced action buttons
      row.querySelector('.edit-program-new').addEventListener('click', () => {
        editProgram(program.id);
      });
      
      row.querySelector('.view-program-new').addEventListener('click', () => {
        viewProgramDetails(program.id);
      });
      
      row.querySelector('.delete-program-new').addEventListener('click', () => {
        deleteProgram(program.id);
      });
    });
    
  } catch (error) {
    console.error('Error loading enhanced programs:', error);
    const programsTableBody = document.getElementById('programs-new-table-body');
    if (programsTableBody) {
      programsTableBody.innerHTML = `<tr><td colspan="8" class="error-text">Error loading enhanced programs: ${error.message}</td></tr>`;
    }
  }
}

async function loadAttendanceDataNew() {
  console.log('Loading smart attendance tracking data...');
  
  try {
    const attendanceTableBody = document.getElementById('attendance-new-table-body');
    if (!attendanceTableBody) {
      console.error('Enhanced attendance table body not found');
      return;
    }
    
    attendanceTableBody.innerHTML = '<tr><td colspan="7" class="loading-text">Loading smart attendance records...</td></tr>';
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Load programs for the filter dropdown
    const programs = await ProgramService.listProgram();
    const programFilterNew = document.getElementById('program-filter-new');
    
    if (programFilterNew) {
      // Clear existing options except the first one
      while (programFilterNew.options.length > 1) {
        programFilterNew.remove(1);
      }
      
      // Add program options to the filter
      programs.forEach(program => {
        const option = document.createElement('option');
        option.value = program.id;
        option.textContent = program.nama_program || program.nama || 'Unnamed Program';
        programFilterNew.appendChild(option);
      });
    }
    
    // Get attendance records
    const attendanceRecords = await ProgramService.listAllAttendance();
    console.log('Enhanced attendance records loaded:', attendanceRecords);
    
    if (attendanceRecords.length === 0) {
      attendanceTableBody.innerHTML = '<tr><td colspan="7" class="empty-text">No attendance records found. Start tracking attendance for your programs!</td></tr>';
      return;
    }
    
    // Clear the loading message
    attendanceTableBody.innerHTML = '';
    
    // Add each attendance record to the table with enhanced features
    attendanceRecords.forEach(record => {
      const row = document.createElement('tr');
      
      // Enhanced attendance status with visual indicators
      const attendanceStatus = record.present ? 
        '<span class="attendance-status present"><i class="fas fa-check-circle"></i> Present</span>' : 
        '<span class="attendance-status absent"><i class="fas fa-times-circle"></i> Absent</span>';
      
      // Format timestamp if available
      const timestamp = record.timestamp ? 
        new Date(record.timestamp.seconds * 1000).toLocaleString() : 
        'N/A';
      
      row.innerHTML = `
        <td><strong>${record.participantName || 'Unknown'}</strong></td>
        <td><span class="participant-id">${record.participantId || 'N/A'}</span></td>
        <td><span class="participant-type-badge ${record.participantType?.toLowerCase() || 'default'}">${record.participantType || 'Participant'}</span></td>
        <td>${attendanceStatus}</td>
        <td><span class="timestamp">${timestamp}</span></td>
        <td>
          <div class="notes-container">
            <span class="notes-text">${record.notes || 'No notes'}</span>
          </div>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary edit-attendance-new" data-id="${record.id}" title="Edit Attendance">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-info view-details-new" data-id="${record.id}" title="View Details">
              <i class="fas fa-eye"></i> Details
            </button>
            <button class="btn btn-sm btn-warning toggle-status-new" data-id="${record.id}" title="Toggle Status">
              <i class="fas fa-sync"></i> Toggle
            </button>
          </div>
        </td>
      `;
      
      attendanceTableBody.appendChild(row);
      
      // Add event listeners for enhanced action buttons
      row.querySelector('.edit-attendance-new').addEventListener('click', () => {
        editAttendanceRecordNew(record.id);
      });
      
      row.querySelector('.view-details-new').addEventListener('click', () => {
        viewAttendanceDetailsNew(record.id);
      });
      
      row.querySelector('.toggle-status-new').addEventListener('click', async () => {
        await toggleAttendanceStatusNew(record.id, !record.present);
      });
    });
    
  } catch (error) {
    console.error('Error loading enhanced attendance data:', error);
    const attendanceTableBody = document.getElementById('attendance-new-table-body');
    if (attendanceTableBody) {
      attendanceTableBody.innerHTML = `<tr><td colspan="7" class="error-text">Error loading smart attendance records: ${error.message}</td></tr>`;
    }
  }
}

async function loadProgramReportsNew() {
  console.log('Loading advanced program reports...');
  
  try {
    const reportsContainer = document.getElementById('reports-new-container');
    if (!reportsContainer) {
      console.error('Enhanced reports container not found');
      return;
    }
    
    reportsContainer.innerHTML = '<div class="loading-text">Loading advanced program reports...</div>';
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get programs and attendance data for reports
    const programs = await ProgramService.listProgram();
    const attendanceRecords = await ProgramService.listAllAttendance();
    
    // Generate enhanced reports
    const reportsHTML = generateEnhancedReports(programs, attendanceRecords);
    reportsContainer.innerHTML = reportsHTML;
    
  } catch (error) {
    console.error('Error loading advanced program reports:', error);
    const reportsContainer = document.getElementById('reports-new-container');
    if (reportsContainer) {
      reportsContainer.innerHTML = `<div class="error-text">Error loading advanced reports: ${error.message}</div>`;
    }
  }
}

function generateEnhancedReports(programs, attendanceRecords) {
  // Calculate statistics
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'active').length;
  const completedPrograms = programs.filter(p => p.status === 'completed').length;
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.present).length;
  const attendanceRate = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0;
  
  return `
    <div class="reports-dashboard">
      <div class="reports-header">
        <h3>Advanced Program Reports</h3>
        <div class="report-actions">
          <button class="btn btn-primary" onclick="exportReportsNew()">
            <i class="fas fa-download"></i> Export Reports
          </button>
          <button class="btn btn-secondary" onclick="refreshReportsNew()">
            <i class="fas fa-sync"></i> Refresh
          </button>
        </div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-calendar-alt"></i>
          </div>
          <div class="stat-content">
            <h4>${totalPrograms}</h4>
            <p>Total Programs</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-play-circle"></i>
          </div>
          <div class="stat-content">
            <h4>${activePrograms}</h4>
            <p>Active Programs</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-content">
            <h4>${completedPrograms}</h4>
            <p>Completed Programs</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h4>${attendanceRate}%</h4>
            <p>Attendance Rate</p>
          </div>
        </div>
      </div>
      
      <div class="reports-content">
        <div class="report-section">
          <h4>Program Performance Overview</h4>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Status</th>
                  <th>Participants</th>
                  <th>Attendance Rate</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${programs.map(program => {
                  const programAttendance = attendanceRecords.filter(r => r.programId === program.id);
                  const programRate = programAttendance.length > 0 ? 
                    ((programAttendance.filter(r => r.present).length / programAttendance.length) * 100).toFixed(1) : 0;
                  
                  return `
                    <tr>
                      <td><strong>${program.nama_program || program.nama || 'Unnamed Program'}</strong></td>
                      <td><span class="status-badge ${program.status || 'upcoming'}">${(program.status || 'upcoming').toUpperCase()}</span></td>
                      <td>${program.participants || programAttendance.length || 0}</td>
                      <td>${programRate}%</td>
                      <td>${calculateProgramDuration(program)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function calculateProgramDuration(program) {
  if (!program.tarikh_mula || !program.tarikh_tamat) return 'N/A';
  
  let startDate, endDate;
  
  if (program.tarikh_mula.seconds) {
    startDate = new Date(program.tarikh_mula.seconds * 1000);
  } else {
    startDate = new Date(program.tarikh_mula);
  }
  
  if (program.tarikh_tamat.seconds) {
    endDate = new Date(program.tarikh_tamat.seconds * 1000);
  } else {
    endDate = new Date(program.tarikh_tamat);
  }
  
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
}

function openAddProgramNewModal() {
  console.log('Opening enhanced Add Program modal...');
  
  // Create enhanced modal HTML with improved styling
  const modalHTML = `
    <div id="add-program-new-modal" class="modal">
      <div class="modal-content enhanced-modal">
        <div class="modal-header">
          <h2><i class="fas fa-plus-circle"></i> Add New Program</h2>
          <span class="close-modal" id="close-program-new-modal">&times;</span>
        </div>
        <div class="modal-body">
          <form id="add-program-new-form">
            <div class="form-group">
              <label for="program-name-new"><i class="fas fa-tag"></i> Program Name</label>
              <input type="text" id="program-name-new" class="form-input" placeholder="Enter program name" required>
            </div>
            
            <div class="form-group">
              <label for="program-description-new"><i class="fas fa-align-left"></i> Description</label>
              <textarea id="program-description-new" class="form-input" rows="4" placeholder="Enter program description" required></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="program-start-date-new"><i class="fas fa-calendar-alt"></i> Start Date</label>
                <input type="date" id="program-start-date-new" class="form-input" required>
              </div>
              <div class="form-group">
                <label for="program-end-date-new"><i class="fas fa-calendar-check"></i> End Date</label>
                <input type="date" id="program-end-date-new" class="form-input" required>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="program-category-new"><i class="fas fa-folder"></i> Category</label>
                <select id="program-category-new" class="form-select" required>
                  <option value="">Select Category</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Community">Community</option>
                  <option value="Religious">Religious</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Environment">Environment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label for="program-location-new"><i class="fas fa-map-marker-alt"></i> Location</label>
                <input type="text" id="program-location-new" class="form-input" placeholder="Enter location">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="program-participants-new"><i class="fas fa-users"></i> Expected Participants</label>
                <input type="number" id="program-participants-new" class="form-input" min="1" placeholder="Number of participants">
              </div>
              <div class="form-group">
                <label for="program-budget-new"><i class="fas fa-dollar-sign"></i> Budget (RM)</label>
                <input type="number" id="program-budget-new" class="form-input" min="0" step="0.01" placeholder="0.00">
              </div>
            </div>
            
            <div class="form-group">
              <label for="program-objectives-new"><i class="fas fa-bullseye"></i> Objectives</label>
              <textarea id="program-objectives-new" class="form-input" rows="3" placeholder="Enter program objectives"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-outline" onclick="closeAddProgramNewModal()">
                <i class="fas fa-times"></i> Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Save Program
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to the DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
  
  // Show the modal
  const modal = document.getElementById('add-program-new-modal');
  modal.style.display = 'block';
  
  // Add event listener for form submission
  document.getElementById('add-program-new-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProgramNew();
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddProgramNewModal();
    }
  });
}

function openImportProgramsModal() {
  console.log('Opening Import Programs modal...');
  // Import programs functionality
}

async function exportProgramsData() {
  console.log('Exporting programs data...');
  
  try {
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get all programs
    const programs = await ProgramService.listProgram();
    
    if (programs.length === 0) {
      alert('No program data available to export');
      return;
    }
    
    // Prepare CSV data
    const csvHeaders = ['Program Name', 'Description', 'Start Date', 'End Date', 'Category', 'Status', 'Participants'];
    const csvRows = programs.map(program => {
      const startDate = program.tarikh_mula?.seconds ? 
        new Date(program.tarikh_mula.seconds * 1000).toLocaleDateString() : 
        (program.tarikh_mula ? new Date(program.tarikh_mula).toLocaleDateString() : 'N/A');
      
      const endDate = program.tarikh_tamat?.seconds ? 
        new Date(program.tarikh_tamat.seconds * 1000).toLocaleDateString() : 
        (program.tarikh_tamat ? new Date(program.tarikh_tamat).toLocaleDateString() : 'N/A');
      
      // Determine status
      let status = 'upcoming';
      const now = new Date();
      const start = program.tarikh_mula?.seconds ? new Date(program.tarikh_mula.seconds * 1000) : new Date(program.tarikh_mula);
      const end = program.tarikh_tamat?.seconds ? new Date(program.tarikh_tamat.seconds * 1000) : new Date(program.tarikh_tamat);
      
      if (start && end) {
        if (now < start) {
          status = 'upcoming';
        } else if (now >= start && now <= end) {
          status = 'active';
        } else if (now > end) {
          status = 'completed';
        }
      }
      
      return [
        program.nama_program || program.nama || 'Unnamed Program',
        program.deskripsi || program.description || '',
        startDate,
        endDate,
        program.kategori || program.category || 'General',
        status.toUpperCase(),
        program.participants || '0'
      ];
    });
    
    // Create CSV content
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `programs_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Programs data exported successfully');
    
  } catch (error) {
    console.error('Error exporting programs data:', error);
    alert('Error exporting programs data: ' + error.message);
  }
}

async function applyAttendanceFiltersNew() {
  console.log('Applying enhanced attendance filters...');
  
  try {
    const programFilter = document.getElementById('program-filter-new')?.value || '';
    const statusFilter = document.getElementById('status-filter-new')?.value || '';
    const dateFilter = document.getElementById('date-filter-new')?.value || '';
    
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get all attendance records
    let attendanceRecords = await ProgramService.listAllAttendance();
    
    // Apply filters
    if (programFilter) {
      attendanceRecords = attendanceRecords.filter(record => 
        record.programId === programFilter || record.program_name?.includes(programFilter)
      );
    }
    
    if (statusFilter) {
      const isPresent = statusFilter === 'present';
      attendanceRecords = attendanceRecords.filter(record => record.present === isPresent);
    }
    
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      attendanceRecords = attendanceRecords.filter(record => {
        let recordDate;
        if (record.timestamp?.seconds) {
          recordDate = new Date(record.timestamp.seconds * 1000);
        } else if (record.timestamp) {
          recordDate = new Date(record.timestamp);
        } else if (record.date) {
          recordDate = new Date(record.date);
        }
        
        if (recordDate) {
          return recordDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }
    
    // Update the attendance table with filtered results
    updateAttendanceTableNew(attendanceRecords);
    
  } catch (error) {
    console.error('Error applying attendance filters:', error);
  }
}

function updateAttendanceTableNew(attendanceRecords) {
  const tableBody = document.querySelector('#attendance-table-new tbody');
  if (!tableBody) {
    console.error('Attendance table body not found');
    return;
  }
  
  if (attendanceRecords.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">No attendance records found matching the filters</td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = attendanceRecords.map(record => {
    const timestamp = record.timestamp?.seconds ? 
      new Date(record.timestamp.seconds * 1000).toLocaleString() : 
      (record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A');
    
    const statusClass = record.present ? 'status-present' : 'status-absent';
    const statusIcon = record.present ? 'fa-check-circle' : 'fa-times-circle';
    const statusText = record.present ? 'Present' : 'Absent';
    
    return `
      <tr>
        <td><strong>${record.participant_name || record.name || 'Unknown'}</strong></td>
        <td>${record.program_name || record.programName || 'N/A'}</td>
        <td>${timestamp}</td>
        <td>
          <span class="status-indicator ${statusClass}">
            <i class="fas ${statusIcon}"></i>
            ${statusText}
          </span>
        </td>
        <td>${record.notes || '-'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editAttendanceRecordNew('${record.id}')" title="Edit Record">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-info" onclick="viewAttendanceDetailsNew('${record.id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm ${record.present ? 'btn-warning' : 'btn-success'}" 
                    onclick="toggleAttendanceStatusNew('${record.id}', ${!record.present})" 
                    title="${record.present ? 'Mark Absent' : 'Mark Present'}">
              <i class="fas ${record.present ? 'fa-times' : 'fa-check'}"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function exportAttendanceDataNew() {
  console.log('Exporting enhanced attendance data...');
  
  try {
    // Import the ProgramService dynamically
    const { ProgramService } = await import('../../services/backend/ProgramService.js');
    
    // Get all attendance records
    const attendanceRecords = await ProgramService.listAllAttendance();
    
    if (attendanceRecords.length === 0) {
      alert('No attendance data available to export');
      return;
    }
    
    // Prepare CSV data
    const csvHeaders = ['Participant Name', 'Program Name', 'Date/Time', 'Status', 'Notes'];
    const csvRows = attendanceRecords.map(record => {
      const timestamp = record.timestamp?.seconds ? 
        new Date(record.timestamp.seconds * 1000).toLocaleString() : 
        (record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A');
      
      const status = record.present ? 'Present' : 'Absent';
      
      return [
        record.participant_name || record.name || 'Unknown',
        record.program_name || record.programName || 'N/A',
        timestamp,
        status,
        record.notes || ''
      ];
    });
    
    // Create CSV content
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Attendance data exported successfully');
    
  } catch (error) {
    console.error('Error exporting attendance data:', error);
    alert('Error exporting attendance data: ' + error.message);
  }
}

// Function to show KIR list modal
async function showKIRListModal(programId, programName) {
  try {
    // Create modal HTML
    const modalHTML = `
      <div id="kir-list-modal" class="modal">
        <div class="modal-content enhanced-modal">
          <div class="modal-header">
            <h2><i class="fas fa-users"></i> KIR List for Program: ${programName}</h2>
            <span class="close-modal" onclick="closeKIRListModal()">&times;</span>
          </div>
          <div class="modal-body">
            <div class="search-container">
              <input type="text" id="kir-search" class="form-input" placeholder="Search KIR by name or ID...">
            </div>
            <div id="kir-list-loading" class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i> Loading KIR data...
            </div>
            <div id="kir-list-container" style="display: none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>KIR ID</th>
                    <th>Name</th>
                    <th>IC Number</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="kir-list-tbody">
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeKIRListModal()">
              <i class="fas fa-times"></i> Close
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Show the modal
    const modal = document.getElementById('kir-list-modal');
    modal.style.display = 'block';
    
    // Load KIR data
    await loadKIRListData();
    
    // Add search functionality
    const searchInput = document.getElementById('kir-search');
    searchInput.addEventListener('input', filterKIRList);
    
  } catch (error) {
    console.error('Error showing KIR list modal:', error);
    alert('Error loading KIR list: ' + error.message);
  }
}

// Function to close KIR list modal
function closeKIRListModal() {
  const modal = document.getElementById('kir-list-modal');
  if (modal) {
    modal.remove();
  }
}

// Function to load KIR data
async function loadKIRListData() {
  try {
    const loadingDiv = document.getElementById('kir-list-loading');
    const containerDiv = document.getElementById('kir-list-container');
    const tbody = document.getElementById('kir-list-tbody');
    
    // Show loading
    loadingDiv.style.display = 'block';
    containerDiv.style.display = 'none';
    
    // Import KIRService
    const { KIRService } = await import('../../services/backend/KIRService.js');
    
    // Get KIR list
    const kirResult = await KIRService.getKIRList();
    const kirList = kirResult.items || [];
    
    // Clear existing data
    tbody.innerHTML = '';
    
    // Populate table
    kirList.forEach(kir => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${kir.id}</td>
        <td>${kir.nama_penuh || kir.nama || 'N/A'}</td>
        <td>${kir.no_kp || 'N/A'}</td>
        <td>${kir.telefon || 'N/A'}</td>
        <td>${kir.alamat || 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary view-kir-btn" data-kir-id="${kir.id}">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-kir-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const kirId = e.target.closest('.view-kir-btn').dataset.kirId;
        viewKIRDetails(kirId);
      });
    });
    
    // Hide loading and show container
    loadingDiv.style.display = 'none';
    containerDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading KIR data:', error);
    const loadingDiv = document.getElementById('kir-list-loading');
    loadingDiv.innerHTML = `<div class="error-text">Error loading KIR data: ${error.message}</div>`;
  }
}

// Function to filter KIR list
function filterKIRList() {
  const searchTerm = document.getElementById('kir-search').value.toLowerCase();
  const rows = document.querySelectorAll('#kir-list-tbody tr');
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// Function to view KIR details
function viewKIRDetails(kirId) {
  // Close current modal
  closeKIRListModal();
  
  // Navigate to KIR profile page
  window.location.href = `../admin/KIRProfile.html?id=${kirId}`;
}
