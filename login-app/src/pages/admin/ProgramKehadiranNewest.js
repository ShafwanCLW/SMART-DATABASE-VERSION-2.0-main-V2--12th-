// Standalone Program & Kehadiran (Modul Terkini) module
// This module mirrors the original Program & Kehadiran tab but is self-contained.
import { ProgramService } from '../../services/backend/ProgramService.js';

const STYLE_ID = 'program-kehadiran-newest-styles';

export class ProgramKehadiranNewest {
  constructor() {
    this.root = null;
    this.sections = {};
    this.elements = {};
    this.state = {
      programs: [],
      attendance: [],
      filters: {
        programId: '',
        search: '',
        attendanceDate: this.getToday()
      },
      reportSelection: null,
      programStatusFilter: 'active',
      financialGrants: [],
      financialGrantsLoaded: false,
      financialGrantsLoading: false,
      participantIndexCount: null,
      participantIndexCountLoading: false
    };
  }

  handleSectionLoad(sectionKey) {
    if (sectionKey === 'management') {
      this.loadPrograms();
      return;
    }
    if (sectionKey === 'attendance') {
      if (!this.state.programs || this.state.programs.length === 0) {
        this.loadPrograms().then(() => {
          this.renderAttendanceProgramList();
          this.loadAttendanceData();
        });
      } else {
        this.renderAttendanceProgramList();
        this.loadAttendanceData();
      }
      return;
    }
    if (sectionKey === 'reports') {
      this.loadReports();
    }
  }

  getToday() {
    return new Date().toISOString().split('T')[0];
  }

  createContent() {
    return `
      <div class="program-newest-wrapper">
        <div class="section-header">
          <h3 class="section-title">Program & Kehadiran (Modul Terkini)</h3>
          <p class="section-description">
            Pengurusan program dan kehadiran generasi terkini dengan antaramuka seragam.
          </p>
        </div>

        <div class="program-tab-shell">
          <div class="program-tab-header">
            <button class="program-tab active" data-tab-target="management">
              <span class="tab-icon">&#9881;</span>
              <div class="tab-details">
                <span class="tab-title">Pengurusan Program</span>
                
              </div>
            </button>
            <button class="program-tab" data-tab-target="attendance">
              <span class="tab-icon">&#9200;</span>
              <div class="tab-details">
                <span class="tab-title">Jejak Kehadiran</span>
                
              </div>
            </button>
            <button class="program-tab" data-tab-target="reports">
              <span class="tab-icon">&#128202;</span>
              <div class="tab-details">
                <span class="tab-title">Laporan Program</span>
                
              </div>
            </button>
          </div>
        </div>

        <div class="program-newest-section active" data-section="management">
          

          <div class="program-action-bar">
            <div class="program-action-buttons">
              
              <button class="btn btn-primary" data-action="add-program">
                <span>&#9998;</span> Tambah Program
              </button>
            </div>
            <div class="program-refresh">
              <button class="btn btn-outline" data-action="refresh-programs">
                Refresh
              </button>
            </div>
          </div>

          <div class="program-status-tabs" data-role="program-status-tabs">
            <button class="status-tab active" data-status="active">
              Aktif <span class="count" data-status-count="active">0</span>
            </button>
            <button class="status-tab" data-status="upcoming">
              Akan Datang <span class="count" data-status-count="upcoming">0</span>
            </button>
            <button class="status-tab" data-status="completed">
              Selesai <span class="count" data-status-count="completed">0</span>
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nama Program</th>
                  <th>Kod Program</th>
                  <th>Penerangan</th>
                  <th>Tarikh Mula</th>
                  <th>Tarikh Tamat</th>
                  <th>Kategori</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody data-role="program-table-body">
                <tr>
                  <td colspan="7" class="placeholder-text">
                    Klik "Masuk Modul" untuk memuatkan senarai program.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="program-newest-section" data-section="attendance">
        <div class="section-card">
          <div class="section-header">
            
          </div>

          <div class="attendance-program-list" data-role="attendance-program-list"></div>

          <div class="search-bar">
            <input type="text" class="form-input" placeholder="Cari nama atau NO KP..." data-role="attendance-search" />
          </div>

          <div class="attendance-date-filter">
            <div class="filter-label">Tarikh Kehadiran</div>
            <div class="date-control-group">
              <button class="btn btn-outline" data-action="attendance-prev-date">&#8592;</button>
              <input type="date" class="form-input" data-role="attendance-date">
              <button class="btn btn-outline" data-action="attendance-next-date">&#8594;</button>
            </div>
            <p class="date-helper" data-role="attendance-date-helper">-</p>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>No KP</th>
                  <th>Sumber</th>
                  <th>Hadir</th>
                  <th>Catatan</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody data-role="attendance-table-body">
                <tr>
                  <td colspan="6" class="placeholder-text">
                    Pilih "Jejak Kehadiran" untuk memuatkan rekod.
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="table-footer" data-role="attendance-footer"></div>
          </div>
        </div>
        </div>

        <div class="program-newest-section" data-section="reports">
          <div class="reports-layered-shell">
            <div class="reports-layered-backdrop"></div>
            <div class="reports-layered-panel">
              <div class="report-hero">
                <div class="report-hero-text">
                  
                </div>
                <div class="report-hero-actions">
                  
                </div>
              </div>

              <div class="reports-grid">
                <section class="report-card span-2">
                  <header class="report-header">
                    <div>
                      <p class="report-eyebrow">Ringkasan</p>
                      <h4>Ringkasan Kehadiran</h4>
                    </div>
                    <span class="report-icon">&#128202;</span>
                  </header>
                  <div class="report-content" data-role="attendance-summary">
                    <p class="placeholder-text">Tekan "Lihat Laporan" untuk memuatkan data.</p>
                  </div>
                </section>
                <section class="report-card">
                  <header class="report-header">
                    <div>
                      <p class="report-eyebrow">Peserta</p>
                      <h4>Peserta Terbaik</h4>
                    </div>
                    <span class="report-icon">&#11088;</span>
                  </header>
                  <div class="report-content" data-role="top-participants">
                    <p class="placeholder-text">Tekan "Lihat Laporan" untuk memuatkan data.</p>
                  </div>
                </section>
                <section class="report-card span-full">
                  <header class="report-header">
                    <div>
                      <p class="report-eyebrow">Program</p>
                      <h4>Penyertaan Program</h4>
                    </div>
                    <span class="report-icon">&#128200;</span>
                  </header>
                  <div class="report-content" data-role="program-participation">
                    <p class="placeholder-text">Tekan "Lihat Laporan" untuk memuatkan data.</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async initialize() {
    this.root = document.getElementById('program-kehadiran-newest-content');
    if (!this.root) {
      console.error('ProgramKehadiranNewest: container not found');
      return;
    }

    this.injectStyles();
    this.cacheDom();
    this.bindOverviewNavigation();
    this.bindManagementActions();
    this.setupProgramStatusTabs();
    this.bindAttendanceActions();
    this.bindReportActions();
    this.handleSectionLoad('management');
  }

  cacheDom() {
    this.sections = {
      management: this.root.querySelector('[data-section="management"]'),
      attendance: this.root.querySelector('[data-section="attendance"]'),
      reports: this.root.querySelector('[data-section="reports"]')
    };

    this.elements = {
      programsTableBody: this.root.querySelector('[data-role="program-table-body"]'),
      programStatusTabs: this.root.querySelector('[data-role="program-status-tabs"]'),
      attendanceTableBody: this.root.querySelector('[data-role="attendance-table-body"]'),
      attendanceSummary: this.root.querySelector('[data-role="attendance-summary"]'),
      topParticipants: this.root.querySelector('[data-role="top-participants"]'),
      programParticipation: this.root.querySelector('[data-role="program-participation"]'),
      attendanceProgramList: this.root.querySelector('[data-role="attendance-program-list"]'),
      attendanceSearch: this.root.querySelector('[data-role="attendance-search"]'),
      attendanceFooter: this.root.querySelector('[data-role="attendance-footer"]'),
      attendanceDateInput: this.root.querySelector('[data-role="attendance-date"]'),
      attendanceDateHelper: this.root.querySelector('[data-role="attendance-date-helper"]'),
      attendancePrevBtn: this.root.querySelector('[data-action="attendance-prev-date"]'),
      attendanceNextBtn: this.root.querySelector('[data-action="attendance-next-date"]')
    };
  }

  bindOverviewNavigation() {
    const tabs = this.root.querySelectorAll('[data-tab-target]');
    if (tabs.length) {
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab-target');
          if (target) {
            this.showSection(target);
          }
        });
      });
    }
  }

  bindManagementActions() {
    const createTestBtn = this.root.querySelector('[data-action="create-test-program"]');
    const addProgramBtn = this.root.querySelector('[data-action="add-program"]');
    const refreshBtn = this.root.querySelector('[data-action="refresh-programs"]');

    if (createTestBtn) {
      createTestBtn.addEventListener('click', () => this.createTestProgram());
    }
    if (addProgramBtn) {
      addProgramBtn.addEventListener('click', () => this.handleAddProgram());
    }
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadPrograms());
    }
  }

  setupProgramStatusTabs() {
    const tabs = this.elements.programStatusTabs;
    if (!tabs) return;
    tabs.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const status = btn.getAttribute('data-status');
        if (!status || status === this.state.programStatusFilter) {
          return;
        }
        this.state.programStatusFilter = status;
        this.updateProgramStatusTabs();
        this.renderProgramTable();
      });
    });
    this.updateProgramStatusTabs();
  }

  bindAttendanceActions() {
    if (this.elements.attendanceSearch) {
      this.elements.attendanceSearch.addEventListener('input', () => {
        this.state.filters.search = this.elements.attendanceSearch.value || '';
        this.renderAttendanceTable();
      });
    }

    if (this.elements.attendanceDateInput) {
      this.elements.attendanceDateInput.value = this.state.filters.attendanceDate;
      this.elements.attendanceDateInput.addEventListener('change', () => {
        const dateValue = this.elements.attendanceDateInput.value;
        if (dateValue) {
          this.setAttendanceDate(dateValue, true);
        }
      });
    }

    if (this.elements.attendancePrevBtn) {
      this.elements.attendancePrevBtn.addEventListener('click', () => this.shiftAttendanceDate(-1));
    }

    if (this.elements.attendanceNextBtn) {
      this.elements.attendanceNextBtn.addEventListener('click', () => this.shiftAttendanceDate(1));
    }

  }

  bindReportActions() {
    // Reports load automatically when the section opens, so no extra listeners are required here.
  }

  getSelectedProgram() {
    const programId = this.state.filters.programId;
    if (!programId) return null;
    return (this.state.programs || []).find(program => program.id === programId) || null;
  }

  isRecurringScale(scaleValue) {
    const normalized = (scaleValue || '').toString().trim().toLowerCase();
    return normalized === 'daily' || normalized === 'weekly';
  }

  getProgramTimeScale(program) {
    const scale = (program?.time_scale || program?.timeScale || '').toLowerCase();
    const allowed = ['one off', 'one-off', 'daily', 'weekly', 'monthly', 'berkala'];
    if (allowed.includes(scale)) {
      return scale.replace('one-off', 'one off');
    }
    return 'one off';
  }

  generateProgramCode(name = '') {
    const slug = (name || 'Program')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toUpperCase()
      .slice(0, 4)
      .padEnd(3, 'X');
    const unique = Date.now().toString(36).slice(-4).toUpperCase();
    return `${slug}-${unique}`;
  }

  normalizeDateValue(value) {
    if (!value) return '';
    let date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      if (typeof value === 'string' && value.includes('/')) {
        const parts = value.split(/[\\/]/).map(part => part.trim());
        if (parts.length === 3) {
          let [day, month, year] = parts;
          if (year.length === 2) {
            year = `20${year}`;
          }
          if (day.length === 4 && year.length === 2) {
            [year, day] = [day, year];
          }
          const isDayFirst = Number(day) > 12;
          const iso = isDayFirst ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
          date = new Date(iso);
        }
      }
    }
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  setAttendanceDate(dateValue, reload = false) {
    const normalized = this.normalizeDateValue(dateValue) || this.getToday();
    const program = this.getSelectedProgram();
    const clamped = this.clampAttendanceDate(normalized, program);
    this.state.filters.attendanceDate = clamped;
    this.updateAttendanceDateUI();
    if (reload) {
      this.loadAttendanceData(true);
    }
  }

  clampAttendanceDate(dateValue, program) {
    if (!program) {
      return dateValue;
    }
    const start = this.normalizeDateValue(program.tarikh_mula || program.startDate);
    const end = this.normalizeDateValue(program.tarikh_tamat || program.endDate);
    if (start && dateValue < start) {
      return start;
    }
    if (end && dateValue > end) {
      return end;
    }
    return dateValue;
  }

  shiftAttendanceDate(direction = 1) {
    const program = this.getSelectedProgram();
    const current = this.state.filters.attendanceDate || this.getToday();
    const scale = this.getProgramTimeScale(program);
    let nextDate = current;
    if (scale === 'daily') {
      nextDate = this.shiftDateByDays(current, direction);
    } else if (scale === 'weekly') {
      nextDate = this.shiftDateByDays(current, 7 * direction);
    } else if (scale === 'monthly') {
      nextDate = this.shiftDateByMonths(current, direction);
    } else {
      nextDate = this.shiftDateByDays(current, direction);
    }
    this.setAttendanceDate(nextDate, true);
  }

  shiftDateByDays(dateValue, days) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return this.getToday();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  shiftDateByMonths(dateValue, months) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return this.getToday();
    const targetDay = date.getDate();
    date.setMonth(date.getMonth() + months);
    if (date.getDate() !== targetDay) {
      date.setDate(0); // fallback to last day of previous month
    }
    return date.toISOString().split('T')[0];
  }

  startOfWeek(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return this.getToday();
    const diff = (date.getDay() + 6) % 7; // Monday as start of week
    date.setDate(date.getDate() - diff);
    return date.toISOString().split('T')[0];
  }

  getAttendanceDateRange() {
    const baseDate = this.state.filters.attendanceDate || this.getToday();
    const program = this.getSelectedProgram();
    const scale = this.getProgramTimeScale(program);
    if (scale === 'weekly') {
      const start = this.startOfWeek(baseDate);
      const end = this.shiftDateByDays(start, 6);
      return { start, end, scale };
    }
    return { start: baseDate, end: baseDate, scale };
  }

  formatAttendanceRangeLabel(range) {
    if (!range) {
      return this.formatDateForDisplay(this.state.filters.attendanceDate || this.getToday());
    }
    const { start, end } = range;
    if (start === end) {
      return this.formatDateForDisplay(start);
    }
    return `${this.formatDateForDisplay(start)} - ${this.formatDateForDisplay(end)}`;
  }

  updateAttendanceDateUI() {
    if (this.elements.attendanceDateInput) {
      this.elements.attendanceDateInput.value = this.state.filters.attendanceDate || this.getToday();
    }
    if (this.elements.attendanceDateHelper) {
      const range = this.getAttendanceDateRange();
      const labelMap = {
        'one off': 'One Off',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        berkala: 'Berkala'
      };
      const dateText = this.formatAttendanceRangeLabel(range);
      this.elements.attendanceDateHelper.textContent = `${labelMap[range.scale] || 'One Off'} • ${dateText}`;
    }
  }

  formatDateForDisplay(dateValue) {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue || '-';
    return date.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  setDefaultAttendanceDateForProgram(program) {
    if (!program) {
      this.state.filters.attendanceDate = this.getToday();
      this.updateAttendanceDateUI();
      return;
    }
    const today = this.getToday();
    this.state.filters.attendanceDate = this.clampAttendanceDate(today, program);
    this.updateAttendanceDateUI();
  }

  updateProgramStatusTabs() {
    const tabs = this.elements.programStatusTabs;
    if (!tabs) return;
    const programs = this.state.programs || [];
    const statusCounts = programs.reduce(
      (counts, program) => {
        const status = this.resolveStatus(program).className;
        if (status) {
          counts[status] = (counts[status] || 0) + 1;
        }
        return counts;
      },
      { active: 0, upcoming: 0, completed: 0 }
    );

    tabs.querySelectorAll('[data-status]').forEach(btn => {
      const status = btn.getAttribute('data-status');
      btn.classList.toggle('active', status === this.state.programStatusFilter);
      const countEl = btn.querySelector('[data-status-count]');
      if (countEl && status) {
        countEl.textContent = statusCounts[status] ?? 0;
      }
    });
  }

  showSection(sectionKey) {
    Object.entries(this.sections).forEach(([key, section]) => {
      if (!section) {
        return;
      }
      if (key === sectionKey) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
    const tabs = this.root.querySelectorAll('.program-tab');
    tabs.forEach(tab => {
      const target = tab.getAttribute('data-tab-target');
      tab.classList.toggle('active', target === sectionKey);
    });
    this.handleSectionLoad(sectionKey);
  }

  async loadPrograms() {
    const target = this.elements.programsTableBody;
    if (!target) return;

    target.innerHTML = `
      <tr>
        <td colspan="7" class="loading-text">Memuatkan senarai program...</td>
      </tr>
    `;

    try {
      const programs = await ProgramService.listProgram();
      this.state.programs = programs;

      if (!programs || programs.length === 0) {
        target.innerHTML = `
          <tr>
            <td colspan="7" class="placeholder-text">Tiada program direkodkan.</td>
          </tr>
        `;
        this.populateProgramFilter([]);
        this.updateProgramStatusTabs();
        return;
      }

      this.populateProgramFilter(programs);
      this.renderProgramTable();
      this.renderAttendanceProgramList();
      this.setDefaultAttendanceDateForProgram(this.getSelectedProgram());
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal memuat program', error);
      target.innerHTML = `
        <tr>
          <td colspan="7" class="error-text">
            ${error.message || 'Gagal memuat program.'}
          </td>
        </tr>
      `;
      this.updateProgramStatusTabs();
    }
  }

  renderProgramTable() {
    const target = this.elements.programsTableBody;
    if (!target) return;

    const programs = this.state.programs || [];
    if (!programs.length) {
      target.innerHTML = `
        <tr>
          <td colspan="7" class="placeholder-text">Tiada program direkodkan.</td>
        </tr>
      `;
      return;
    }

    const filtered = programs.filter(program => {
      const status = this.resolveStatus(program).className;
      return status === this.state.programStatusFilter;
    });

    if (!filtered.length) {
      const statusLabel =
        this.state.programStatusFilter === 'active'
          ? 'aktif'
          : this.state.programStatusFilter === 'upcoming'
            ? 'akan datang'
            : 'selesai';
      target.innerHTML = `
        <tr>
          <td colspan="7" class="placeholder-text">Tiada program ${statusLabel} ditemui.</td>
        </tr>
      `;
      this.updateProgramStatusTabs();
      return;
    }

    target.innerHTML = filtered.map(program => this.buildProgramRow(program)).join('');
    this.updateProgramStatusTabs();
    this.bindProgramActions();
  }

  renderAttendanceProgramList() {
    const container = this.elements.attendanceProgramList;
    if (!container) return;

    if (!this.state.programs || this.state.programs.length === 0) {
      container.innerHTML = `<div class="empty-text">Tiada program ditemui.</div>`;
      return;
    }

    const selectedProgram = this.state.programs.find(p => p.id === this.state.filters.programId);
    const startLabel = selectedProgram ? this.formatDate(selectedProgram.tarikh_mula || selectedProgram.startDate) : '';
    const endLabel = selectedProgram ? this.formatDate(selectedProgram.tarikh_tamat || selectedProgram.endDate) : '';

    container.innerHTML = `
      <div class="program-selection-card">
        <div class="selection-details">
          <div class="selection-label">${selectedProgram ? 'Program dipilih' : 'Tiada program dipilih'}</div>
          <div class="selection-value">
            ${selectedProgram ? this.escapeHtml(selectedProgram.nama_program || selectedProgram.nama || 'Program') : 'Sila pilih program untuk mula menapis kehadiran.'}
          </div>
          ${selectedProgram ? `<div class="selection-meta">${startLabel}${endLabel ? ' - ' + endLabel : ''}</div>` : ''}
          ${selectedProgram ? `<div class="selection-meta">Skala: ${this.getProgramTimeScale(selectedProgram).replace('one off', 'One Off')}</div>` : ''}
        </div>
        <button class="btn btn-secondary" data-action="open-program-selector">
          ${selectedProgram ? 'Tukar Program' : 'Pilih Program'}
        </button>
      </div>
    `;

    const selectorBtn = container.querySelector('[data-action="open-program-selector"]');
    if (selectorBtn) {
      selectorBtn.addEventListener('click', () => this.openProgramSelectionModal());
    }
  }

  openProgramSelectionModal() {
    if (!this.state.programs || this.state.programs.length === 0) {
      return;
    }

    this.closeProgramSelectionModal();

    const selectedId = this.state.filters.programId;
    const items = this.state.programs.map(program => {
      const programId = program.id;
      const isActive = selectedId === programId ? 'active' : '';
      const start = this.formatDate(program.tarikh_mula || program.startDate);
      const end = this.formatDate(program.tarikh_tamat || program.endDate);
      const label = program.nama_program || program.nama || 'Program';
      const searchText = `${label} ${start} ${end}`.toLowerCase();
      return `
        <button class="program-selection-item ${isActive}" data-program-option="${programId}" data-program-search="${this.escapeHtml(searchText)}">
          <div class="item-title">${this.escapeHtml(label)}</div>
          <div class="item-dates">${start}${end ? ' - ' + end : ''}</div>
        </button>
      `;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'program-selection-modal';
    modal.className = 'program-selection-modal';
    modal.innerHTML = `
      <div class="program-selection-dialog">
        <div class="program-selection-header">
          <div>
            <h3>Pilih Program</h3>
            <p>Senarai penuh program dengan tarikh bermula dan tamat.</p>
          </div>
          <button type="button" class="close-modal-btn" data-action="close-program-selector">&times;</button>
        </div>
        <div class="program-selection-body">
          <input type="text" class="program-selection-search" placeholder="Cari nama program..." data-role="program-selection-search" />
          <div class="program-selection-list" data-role="program-selection-list">${items}</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeProgramSelectionModal();
      }
    });

    modal.querySelectorAll('[data-action="close-program-selector"]').forEach(btn => {
      btn.addEventListener('click', () => this.closeProgramSelectionModal());
    });

    modal.querySelectorAll('[data-program-option]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const programId = btn.getAttribute('data-program-option');
        this.state.filters.programId = programId;
        this.renderAttendanceProgramList();
        const program = this.state.programs.find(p => p.id === programId);
        this.setDefaultAttendanceDateForProgram(program);
        this.closeProgramSelectionModal();
        await this.loadAttendanceData(true);
      });
    });

    const searchInput = modal.querySelector('[data-role="program-selection-search"]');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        modal.querySelectorAll('[data-program-search]').forEach(item => {
          const text = item.getAttribute('data-program-search') || '';
          item.style.display = !term || text.includes(term) ? '' : 'none';
        });
      });
    }
  }

  closeProgramSelectionModal() {
    const modal = document.getElementById('program-selection-modal');
    if (modal) {
      modal.remove();
    }
  }

  openReportProgramSelectionModal(programs = []) {
    if (!programs || programs.length === 0) {
      return;
    }

    this.closeReportProgramSelectionModal();

    const resolveProgramId = (program) => program?.id || program?.programId || program?.name || program?.nama_program || program?.nama || '';
    const selectedId = this.state.reportSelection;

    const options = programs.map(program => {
      const programId = resolveProgramId(program);
      const active = programId === selectedId ? 'active' : '';
      const name = program.name || program.nama_program || program.nama || 'Program';
      const dates = `${this.formatDate(program.startDate)} - ${this.formatDate(program.endDate)}`;
      const searchText = `${name} ${dates}`.toLowerCase();
      return `
        <button class="program-selection-item ${active}" data-report-program-option="${programId}" data-report-program-search="${this.escapeHtml(searchText)}">
          <div class="item-title">${this.escapeHtml(name)}</div>
          <div class="item-dates">${this.escapeHtml(dates)}</div>
        </button>
      `;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'report-program-selection-modal';
    modal.className = 'program-selection-modal';
    modal.innerHTML = `
      <div class="program-selection-dialog">
        <div class="program-selection-header">
          <div>
            <h3>Pilih Program Laporan</h3>
            <p>Pilih program untuk lihat statistik kehadiran terperinci.</p>
          </div>
          <button type="button" class="close-modal-btn" data-action="close-report-program-selector">&times;</button>
        </div>
        <div class="program-selection-body">
          <input type="text" class="program-selection-search" placeholder="Cari program..." data-role="report-program-search" />
          <div class="program-selection-list" data-role="report-program-list">${options}</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => this.closeReportProgramSelectionModal();

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        close();
      }
    });

    modal.querySelectorAll('[data-action="close-report-program-selector"]').forEach(btn => {
      btn.addEventListener('click', close);
    });

    modal.querySelectorAll('[data-report-program-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        const programId = btn.getAttribute('data-report-program-option');
        this.state.reportSelection = programId;
        close();
        this.renderProgramParticipation(programs);
      });
    });

    const searchInput = modal.querySelector('[data-role="report-program-search"]');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        modal.querySelectorAll('[data-report-program-search]').forEach(item => {
          const text = item.getAttribute('data-report-program-search') || '';
          item.style.display = !term || text.includes(term) ? '' : 'none';
        });
      });
    }
  }

  closeReportProgramSelectionModal() {
    const modal = document.getElementById('report-program-selection-modal');
    if (modal) {
      modal.remove();
    }
  }

  buildProgramRow(program) {
    const startDate = this.formatDate(program.tarikh_mula || program.startDate);
    const endDate = this.formatDate(program.tarikh_tamat || program.endDate);
    const status = this.resolveStatus(program);

    return `
      <tr data-program-id="${program.id}">
        <td>${program.nama_program || program.nama || 'Tidak dinyatakan'}</td>
        <td>${program.program_code || program.programCode || '-'}</td>
        <td>${program.penerangan || program.deskripsi || '-'}</td>
        <td>${startDate}</td>
        <td>${endDate}</td>
        <td>${program.kategori || '-'}</td>
        <td>
            <span class="status-badge ${status.className}">${status.label}</span>
        </td>
        <td>
          <div class="program-row-actions">
            <button class="btn btn-sm btn-outline" data-action="view-program" data-program-id="${program.id}">
              Butiran
            </button>
            <button class="btn btn-sm btn-primary" data-action="edit-program" data-program-id="${program.id}">
              Sunting
            </button>
            <button class="btn btn-sm btn-danger" data-action="delete-program" data-program-id="${program.id}">
              Padam
            </button>
            <button class="btn btn-sm btn-secondary" data-action="qr-program" data-program-id="${program.id}">
              Kod QR
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  bindProgramActions() {
    this.root.querySelectorAll('[data-action="view-program"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const programId = btn.getAttribute('data-program-id');
        const program = this.state.programs.find(item => item.id === programId);
        if (!program) {
          this.showToast('Program tidak ditemui', 'error');
          return;
        }

        this.openProgramDetailsModal(program);
      });
    });

    this.root.querySelectorAll('[data-action="edit-program"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const programId = btn.getAttribute('data-program-id');
        await this.openSuntingProgramModal(programId);
      });
    });

    this.root.querySelectorAll('[data-action="qr-program"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const programId = btn.getAttribute('data-program-id');
        const program = this.state.programs.find(item => item.id === programId);
        if (!program) {
          this.showToast('Program tidak ditemui', 'error');
          return;
        }
        this.openQRModal(program);
      });
    });

    this.root.querySelectorAll('[data-action="delete-program"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const programId = btn.getAttribute('data-program-id');
        await this.deleteProgram(programId);
      });
    });
  }

  openProgramDetailsModal(program) {
    const existing = document.getElementById('program-newest-details-modal');
    if (existing) existing.remove();

    const start = this.formatDate(program.tarikh_mula || program.startDate);
    const end = this.formatDate(program.tarikh_tamat || program.endDate);
    const status = this.resolveStatus(program);
    const expenseDisplay = this.formatExpenseDisplay(program.expenses ?? program.perbelanjaan);
    const hasExpenseGrant = this.programHasExpenseGrant(program);
    const expenseGrantName = program.expense_grant_name || program.expenseGrantName || '';
    const expenseDeductedAmount = program.expense_deducted_amount ?? program.expenseDeductedAmount ?? 0;
    const expenseGrantNotes = program.expense_grant_notes || program.expenseGrantNotes || '';

    const modal = document.createElement('div');
    modal.id = 'program-newest-details-modal';
    modal.className = 'program-newest-modal visible';
    modal.innerHTML = `
      <div class="modal-panel program-details-panel">
        <div class="modal-header">
          <h3>Butiran Program</h3>
          <button type="button" class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <div class="program-details-grid">
          <div class="detail-item">
            <span class="detail-label">Nama Program</span>
            <span class="detail-value">${program.nama_program || program.nama || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Kategori</span>
            <span class="detail-value">${program.kategori || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="status-badge ${status.className}">${status.label}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Lokasi</span>
            <span class="detail-value">${program.lokasi || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Skala Masa</span>
            <span class="detail-value">${program.time_scale || program.timeScale || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Tempoh</span>
            <span class="detail-value">${start} - ${end}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Co-organizer</span>
            <span class="detail-value">${program.co_organizer || program.coOrganizer || '-'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Perbelanjaan</span>
            <span class="detail-value">${expenseDisplay}</span>
            ${hasExpenseGrant ? `<span class="detail-hint">Ditolak daripada ${this.escapeHtml(expenseGrantName || '-')} (${this.formatCurrency(expenseDeductedAmount)})</span>` : ''}
            ${expenseGrantNotes ? `<span class="detail-hint">Catatan: ${this.escapeHtml(expenseGrantNotes)}</span>` : ''}
          </div>
          <div class="detail-item detail-span">
            <span class="detail-label">Penerangan</span>
            <p class="detail-value description">${program.penerangan || program.deskripsi || '-'}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-action="close-modal">Tutup</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.dataset.action === 'close-modal') {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  openQRModal(program) {
    const existing = document.getElementById('program-newest-qr-modal');
    if (existing) existing.remove();

    const checkinLink = `${window.location.origin}/#/checkin?programId=${program.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(checkinLink)}`;

    const modal = document.createElement('div');
    modal.id = 'program-newest-qr-modal';
    modal.className = 'program-newest-modal visible';
    modal.innerHTML = `
      <div class="modal-panel program-details-panel">
        <div class="modal-header">
          <h3>Kod QR</h3>
          <button type="button" class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <p><strong>${program.nama_program || program.nama || 'Program'}</strong></p>
        <div class="qr-container">
          <img src="${qrUrl}" alt="QR code for check-in" />
        </div>
        <div class="qr-link">${checkinLink}</div>
        <div class="modal-actions">
          <button class="btn btn-primary" data-action="close-modal">Tutup</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.dataset.action === 'close-modal') {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
  }

  async createTestProgram() {
    try {
      const timestamp = new Date().toISOString();
      const status = this.getStatusLabelFromDates(timestamp, timestamp);
      await ProgramService.createProgram({
        name: `Demo Program ${timestamp.slice(0, 10)}`,
        description: 'Program contoh yang dijana secara automatik.',
        startDate: timestamp,
        endDate: timestamp,
        category: 'Demo',
        status,
        location: 'Ibu Pejabat'
      });
      this.showToast('Program contoh berjaya dicipta.', 'success');
      await this.loadPrograms();
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal cipta program contoh', error);
      this.showToast(error.message || 'Gagal mencipta program contoh.', 'error');
    }
  }

  handleAddProgram() {
    this.openCreateProgramModal();
  }

  async openCreateProgramModal() {
    if (document.getElementById("program-newest-create-modal")) {
      return;
    }

    await this.ensureFinancialGrants().catch(() => {});

    const modal = document.createElement("div");
    modal.id = "program-newest-create-modal";
    modal.className = "program-newest-modal";
    modal.innerHTML = `
      <div class="modal-panel">
        <div class="modal-header">
          <h3>Cipta Program Baharu</h3>
          <button type="button" class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form id="program-newest-create-form">
          <div class="form-group">
            <label for="program-newest-name">Nama Program</label>
            <input id="program-newest-name" name="name" type="text" class="form-input" placeholder="Contoh: Program Komuniti" required>
          </div>
          <div class="form-group">
            <label for="program-newest-description">Penerangan</label>
            <textarea id="program-newest-description" name="description" class="form-input" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="program-newest-time-scale">Skala Masa</label>
              <select id="program-newest-time-scale" name="time_scale" class="form-input">
                <option value="">Pilih skala masa</option>
                <option value="One Off">One Off (bukan berulang)</option>
                <option value="Daily">Daily (berulang automatik)</option>
                <option value="Weekly">Weekly (berulang automatik)</option>
                <option value="Monthly">Monthly (cipta baharu setiap kali)</option>
                <option value="Berkala">Berkala (cipta baharu setiap kali)</option>
              </select>
              <small class="form-helper">Daily & Weekly akan berjalan berulang secara automatik. Pilihan lain memerlukan penciptaan program baharu setiap kali.</small>
            </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-start">Tarikh Mula</label>
              <input id="program-newest-start" name="startDate" type="date" class="form-input" required>
            </div>
            <div class="form-group" data-role="end-date-group">
              <label for="program-newest-end">Tarikh Tamat</label>
              <input id="program-newest-end" name="endDate" type="date" class="form-input" required>
            </div>
          </div>
          <div class="form-group recurrence-control" data-role="recurrence-group" hidden>
            <label>Tempoh Berulang</label>
            <div class="recurrence-options">
              <label class="recurrence-option">
                <input type="radio" name="recurrence_mode" value="forever" checked>
                Berterusan
              </label>
              <label class="recurrence-option">
                <input type="radio" name="recurrence_mode" value="until">
                Ada tarikh tamat
              </label>
            </div>
            <small class="form-helper">Pilih "Ada tarikh tamat" jika pengulangan perlu dihentikan pada tarikh tertentu.</small>
          </div>
          <div class="form-group">
            <label for="program-newest-category">Kategori</label>
            <input id="program-newest-category" name="category" type="text" class="form-input" placeholder="Contoh: Pendidikan" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-location">Lokasi (Pilihan)</label>
              <input id="program-newest-location" name="location" type="text" class="form-input" placeholder="Contoh: Dewan Komuniti">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-co-organizer">Co-organizer (Pilihan)</label>
              <input id="program-newest-co-organizer" name="co_organizer" type="text" class="form-input" placeholder="Contoh: NGO Tempatan">
            </div>
            <div class="form-group">
              <label for="program-newest-expenses">Perbelanjaan (RM)</label>
              <input id="program-newest-expenses" name="expenses" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" data-role="expense-input" data-expense-scope="create">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-expense-grant">Tolak Dari Geran (Pilihan)</label>
              <select id="program-newest-expense-grant" name="expense_grant_id" class="form-input" data-role="expense-grant-select" data-expense-scope="create"></select>
              <small class="form-helper" data-role="expense-grant-balance" data-expense-scope="create">Baki semasa: -</small>
            </div>
            <div class="form-group">
              <label for="program-newest-expense-notes">Catatan Tolakan (Pilihan)</label>
              <input id="program-newest-expense-notes" name="expense_grant_notes" type="text" class="form-input" placeholder="Contoh: Logistik program">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" data-action="close-modal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Program</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("visible"));

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        this.closeCreateProgramModal();
      }
    });

    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener("click", () => this.closeCreateProgramModal());
    });

    const form = modal.querySelector("#program-newest-create-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.submitCreateProgram(form);
    });

    this.initializeExpenseGrantControls({
      scope: 'create',
      modal
    });
    this.initializeRecurrenceControls({ modal });
  }

  closeCreateProgramModal() {
    const modal = document.getElementById("program-newest-create-modal");
    if (modal) {
      modal.classList.remove("visible");
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 200);
    }
  }

  async submitCreateProgram(form) {
    if (!form) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : "";

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Menyimpan...";
      }

      const formData = new FormData(form);
      const name = (formData.get("name") || "").toString().trim();
      const description = (formData.get("description") || "").toString().trim();
      const startDate = formData.get("startDate");
      const endDate = formData.get("endDate");
      const category = (formData.get("category") || "").toString();
      const location = (formData.get("location") || "").toString().trim();
      const timeScale = (formData.get("time_scale") || "").toString();
      const coOrganizer = (formData.get("co_organizer") || "").toString().trim();
      const expenseGrantId = (formData.get("expense_grant_id") || "").toString().trim();
      const expenseGrantNotes = (formData.get("expense_grant_notes") || "").toString().trim();
      const expensesRaw = formData.get("expenses");
      const expenseAmount = this.parseAmountInput(expensesRaw);
      const shouldDeduct = expenseGrantId && expenseAmount > 0;

      if (!name || !description || !startDate || !category) {
        this.showToast("Sila lengkapkan semua maklumat wajib.", "error");
        return;
      }

      if (expenseGrantId && expenseAmount <= 0) {
        this.showToast("Masukkan jumlah perbelanjaan sebelum memilih geran.", "error");
        return;
      }

      if (shouldDeduct) {
        await this.ensureFinancialGrants().catch(() => {});
        const grant = this.getFinancialGrantById(expenseGrantId);
        if (!grant) {
          this.showToast("Geran tidak ditemui.", "error");
          return;
        }
        if (grant.availableAmount < expenseAmount) {
          this.showToast("Baki geran tidak mencukupi untuk perbelanjaan ini.", "error");
          return;
        }
      }

      const usesRecurringFlow = this.isRecurringScale(timeScale);
      const recurrenceMode = (formData.get("recurrence_mode") || "forever").toString();

      if (!usesRecurringFlow && !endDate) {
        this.showToast("Tarikh tamat diperlukan untuk pilihan ini.", "error");
        return;
      }
      if (usesRecurringFlow && recurrenceMode === "until" && !endDate) {
        this.showToast("Sila pilih tarikh tamat untuk pengulangan.", "error");
        return;
      }

      const startIso = new Date(startDate).toISOString();
      let endIso = "";
      if (usesRecurringFlow) {
        if (recurrenceMode === "until") {
          endIso = new Date(endDate).toISOString();
        }
      } else {
        endIso = new Date(endDate).toISOString();
      }
      const status = this.getStatusLabelFromDates(startIso, endIso, timeScale);
      const normalizedExpenses = expenseAmount > 0 ? expenseAmount : '';

      const payload = {
        name,
        description,
        startDate: startIso,
        endDate: endIso,
        category,
        status,
        location,
        time_scale: timeScale,
        co_organizer: coOrganizer,
        expenses: normalizedExpenses,
        expense_grant_notes: expenseGrantNotes,
        expense_grant_id: shouldDeduct ? expenseGrantId : '',
        program_code: this.generateProgramCode(name),
        recurrence_mode: usesRecurringFlow ? recurrenceMode : '',
        recurrence_end_date: usesRecurringFlow && recurrenceMode === "until" ? endIso : ''
      };

      let createdProgram = null;
      try {
        createdProgram = await ProgramService.createProgram(payload);
        if (shouldDeduct && createdProgram?.id) {
          await this.reconcileProgramExpenseGrant({
            programId: createdProgram.id,
            programName: name,
            newGrantId: expenseGrantId,
            newAmount: expenseAmount,
            notes: expenseGrantNotes,
            previousMetadata: {}
          });
        }
        this.showToast("Program baharu berjaya dicipta.", "success");
        this.closeCreateProgramModal();
        await this.loadPrograms();
      } catch (deductionError) {
        if (createdProgram?.id && shouldDeduct) {
          try {
            await ProgramService.deleteProgram(createdProgram.id);
          } catch (cleanupError) {
            console.warn("ProgramKehadiranNewest: gagal memadam program selepas ralat tolakan", cleanupError);
          }
        }
        throw deductionError;
      }
    } catch (error) {
      console.error("ProgramKehadiranNewest: gagal mencipta program baharu", error);
      this.showToast(error.message || "Gagal mencipta program baharu.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  }

  formatDateForInput(value) {
    if (!value) {
      return "";
    }

    try {
      if (typeof value === "string") {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
          return "";
        }
        return date.toISOString().slice(0, 10);
      }

      if (value.seconds) {
        const date = new Date(value.seconds * 1000);
        return date.toISOString().slice(0, 10);
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    } catch (error) {
      console.warn("ProgramKehadiranNewest: tidak dapat memformat tarikh input", value, error);
      return "";
    }
  }

  async openSuntingProgramModal(programId) {
    if (!programId) {
      return;
    }

    if (document.getElementById("program-newest-edit-modal")) {
      this.closeSuntingProgramModal();
    }

    let program = this.state.programs.find(item => item.id === programId);

    if (!program) {
      try {
        program = await ProgramService.getProgramById(programId);
      } catch (error) {
        console.error("ProgramKehadiranNewest: gagal mendapatkan program", error);
      }
    }

    if (!program) {
      this.showToast("Program tidak ditemui.", "error");
      return;
    }

    const startValue = this.formatDateForInput(program.tarikh_mula || program.startDate);
    const endValue = this.formatDateForInput(program.tarikh_tamat || program.endDate);
    const currentKategori = program.kategori || program.category || "Education";
    const currentTimeScale = (program.time_scale || program.timeScale || "").toLowerCase();
    const currentLocation = program.lokasi || program.location || "";
    const currentCoOrganizer = program.co_organizer || program.coOrganizer || "";
    const currentExpenses = program.expenses ?? program.perbelanjaan ?? "";
    const parsedExpenseValue = this.parseAmountInput(currentExpenses);
    const expenseInputValue = parsedExpenseValue > 0 ? parsedExpenseValue : (currentExpenses || "");
    const currentExpenseGrantId = program.expense_grant_id || program.expenseGrantId || "";
    const currentExpenseGrantNotes = program.expense_grant_notes || program.expenseGrantNotes || "";

    await this.ensureFinancialGrants().catch(() => {});

    const usesRecurringScale = currentTimeScale === "daily" || currentTimeScale === "weekly";
    let recurrenceModePreset = (program.recurrence_mode || program.recurrenceMode || "").toLowerCase();
    const recurrenceEndRaw = program.recurrence_end_date || program.recurrenceEndDate || program.tarikh_tamat || program.endDate;
    const recurrenceEndValue = this.formatDateForInput(recurrenceEndRaw);
    if (!recurrenceModePreset && usesRecurringScale && recurrenceEndValue) {
      recurrenceModePreset = "until";
    }
    if (!recurrenceModePreset) {
      recurrenceModePreset = "forever";
    }

    const modal = document.createElement("div");
    modal.id = "program-newest-edit-modal";
    modal.className = "program-newest-modal";
    modal.innerHTML = `
      <div class="modal-panel">
        <div class="modal-header">
          <h3>Kemas Kini Program</h3>
          <button type="button" class="modal-close" data-action="close-modal">&times;</button>
        </div>
        <form id="program-newest-edit-form">
          <div class="form-group">
            <label for="program-newest-edit-name">Nama Program</label>
            <input id="program-newest-edit-name" name="name" type="text" class="form-input" value="${program.nama_program || program.nama || ""}" required>
          </div>
          <div class="form-group">
            <label for="program-newest-edit-description">Penerangan</label>
            <textarea id="program-newest-edit-description" name="description" class="form-input" rows="3" required>${program.penerangan || program.deskripsi || ""}</textarea>
          </div>
          <div class="form-group">
            <label for="program-newest-edit-time-scale">Skala Masa</label>
              <select id="program-newest-edit-time-scale" name="time_scale" class="form-input">
                <option value="" ${currentTimeScale === "" ? "selected" : ""}>Pilih skala masa</option>
                <option value="One Off" ${currentTimeScale === "one off" ? "selected" : ""}>One Off (bukan berulang)</option>
                <option value="Daily" ${currentTimeScale === "daily" ? "selected" : ""}>Daily (berulang automatik)</option>
                <option value="Weekly" ${currentTimeScale === "weekly" ? "selected" : ""}>Weekly (berulang automatik)</option>
                <option value="Monthly" ${currentTimeScale === "monthly" ? "selected" : ""}>Monthly (cipta baharu setiap kali)</option>
                <option value="Berkala" ${currentTimeScale === "berkala" ? "selected" : ""}>Berkala (cipta baharu setiap kali)</option>
              </select>
              <small class="form-helper">Daily & Weekly akan kekal berulang secara automatik. Pilihan lain perlu dicipta semula apabila mahu dijalankan.</small>
            </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-edit-start">Tarikh Mula</label>
              <input id="program-newest-edit-start" name="startDate" type="date" class="form-input" value="${startValue}" required>
            </div>
            <div class="form-group" data-role="end-date-group">
              <label for="program-newest-edit-end">Tarikh Tamat</label>
              <input id="program-newest-edit-end" name="endDate" type="date" class="form-input" value="${endValue}" required>
            </div>
          </div>
          <div class="form-group recurrence-control" data-role="recurrence-group" ${usesRecurringScale ? '' : 'hidden'}>
            <label>Tempoh Berulang</label>
            <div class="recurrence-options">
              <label class="recurrence-option">
                <input type="radio" name="recurrence_mode" value="forever" ${recurrenceModePreset === 'until' ? '' : 'checked'}>
                Berterusan
              </label>
              <label class="recurrence-option">
                <input type="radio" name="recurrence_mode" value="until" ${recurrenceModePreset === 'until' ? 'checked' : ''}>
                Ada tarikh tamat
              </label>
            </div>
            <small class="form-helper">Pilih "Ada tarikh tamat" jika pengulangan perlu dihentikan pada tarikh tertentu.</small>
          </div>
          <div class="form-group">
            <label for="program-newest-edit-category">Kategori</label>
            <input id="program-newest-edit-category" name="category" type="text" class="form-input" value="${currentKategori}" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-edit-location">Lokasi (Pilihan)</label>
              <input id="program-newest-edit-location" name="location" type="text" class="form-input" value="${currentLocation}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-edit-co-organizer">Co-organizer (Pilihan)</label>
              <input id="program-newest-edit-co-organizer" name="co_organizer" type="text" class="form-input" value="${currentCoOrganizer}">
            </div>
            <div class="form-group">
              <label for="program-newest-edit-expenses">Perbelanjaan (RM)</label>
              <input id="program-newest-edit-expenses" name="expenses" type="number" min="0" step="0.01" class="form-input" value="${expenseInputValue}" data-role="expense-input" data-expense-scope="edit">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="program-newest-edit-expense-grant">Tolak Dari Geran (Pilihan)</label>
              <select id="program-newest-edit-expense-grant" name="expense_grant_id" class="form-input" data-role="expense-grant-select" data-expense-scope="edit" data-selected-grant="${currentExpenseGrantId}"></select>
              <small class="form-helper" data-role="expense-grant-balance" data-expense-scope="edit">Baki semasa: -</small>
            </div>
            <div class="form-group">
              <label for="program-newest-edit-expense-notes">Catatan Tolakan (Pilihan)</label>
              <input id="program-newest-edit-expense-notes" name="expense_grant_notes" type="text" class="form-input" value="${currentExpenseGrantNotes}">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" data-action="close-modal">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("visible"));

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        this.closeSuntingProgramModal();
      }
    });

    modal.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
      btn.addEventListener("click", () => this.closeSuntingProgramModal());
    });

    const form = modal.querySelector("#program-newest-edit-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.submitSuntingProgram(form, programId);
    });

    this.initializeExpenseGrantControls({
      scope: 'edit',
      modal,
      selectedGrantId: currentExpenseGrantId
    });
    this.initializeRecurrenceControls({ modal });
  }

  closeSuntingProgramModal() {
    const modal = document.getElementById("program-newest-edit-modal");
    if (modal) {
      modal.classList.remove("visible");
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 200);
    }
  }

  async submitSuntingProgram(form, programId) {
    if (!form || !programId) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : "";

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Menyimpan...";
      }

      const formData = new FormData(form);
      const name = (formData.get("name") || "").toString().trim();
      const description = (formData.get("description") || "").toString().trim();
      const startDate = formData.get("startDate");
      const endDate = formData.get("endDate");
      const category = (formData.get("category") || "").toString();
      const location = (formData.get("location") || "").toString().trim();
      const timeScale = (formData.get("time_scale") || "").toString();
      const coOrganizer = (formData.get("co_organizer") || "").toString().trim();
      const expenseGrantId = (formData.get("expense_grant_id") || "").toString().trim();
      const expenseGrantNotes = (formData.get("expense_grant_notes") || "").toString().trim();
      const expensesRaw = formData.get("expenses");
      const expenseAmount = this.parseAmountInput(expensesRaw);
      const normalizedExpenses = expenseAmount > 0 ? expenseAmount : '';
      const shouldDeduct = expenseGrantId && expenseAmount > 0;

      let previousProgramMeta = this.state.programs.find(item => item.id === programId);
      if (!previousProgramMeta) {
        try {
          previousProgramMeta = await ProgramService.getProgramById(programId);
        } catch (loadError) {
          console.warn("ProgramKehadiranNewest: gagal mendapatkan metadata program untuk pelarasan geran", loadError);
        }
      }
      const hasExistingGrantLink = this.programHasExpenseGrant(previousProgramMeta);
      const requiresGrantSync = shouldDeduct || hasExistingGrantLink;

      const usesRecurringFlow = this.isRecurringScale(timeScale);
      const recurrenceMode = (formData.get("recurrence_mode") || "forever").toString();

      if (!name || !description || !startDate || !category) {
        this.showToast("Sila lengkapkan semua maklumat wajib.", "error");
        return;
      }
      if (!usesRecurringFlow && !endDate) {
        this.showToast("Tarikh tamat diperlukan untuk pilihan ini.", "error");
        return;
      }
      if (usesRecurringFlow && recurrenceMode === "until" && !endDate) {
        this.showToast("Sila pilih tarikh tamat untuk pengulangan.", "error");
        return;
      }

      if (expenseGrantId && expenseAmount <= 0) {
        this.showToast("Masukkan jumlah perbelanjaan sebelum memilih geran.", "error");
        return;
      }

      if (requiresGrantSync) {
        await this.ensureFinancialGrants().catch(() => {});
      }

      if (shouldDeduct) {
        const grant = this.getFinancialGrantById(expenseGrantId);
        if (!grant) {
          this.showToast("Geran tidak ditemui.", "error");
          return;
        }
        if (grant.availableAmount < expenseAmount && (!hasExistingGrantLink || grant.id !== (previousProgramMeta?.expense_grant_id || previousProgramMeta?.expenseGrantId))) {
          this.showToast("Baki geran tidak mencukupi untuk jumlah baharu.", "error");
          return;
        }
      }

      const startIso = new Date(startDate).toISOString();
      let endIso = "";
      if (usesRecurringFlow) {
        if (recurrenceMode === "until") {
          endIso = new Date(endDate).toISOString();
        }
      } else {
        endIso = new Date(endDate).toISOString();
      }
      const status = this.getStatusLabelFromDates(startIso, endIso, timeScale);

      const payload = {
        name,
        description,
        startDate: startIso,
        endDate: endIso,
        category,
        status,
        location,
        time_scale: timeScale,
        co_organizer: coOrganizer,
        expenses: normalizedExpenses,
        expense_grant_notes: expenseGrantNotes,
        expense_grant_id: shouldDeduct ? expenseGrantId : '',
        recurrence_mode: usesRecurringFlow ? recurrenceMode : '',
        recurrence_end_date: usesRecurringFlow && recurrenceMode === "until" ? endIso : ''
      };

      if (requiresGrantSync) {
        await this.reconcileProgramExpenseGrant({
          programId,
          programName: name,
          newGrantId: shouldDeduct ? expenseGrantId : '',
          newAmount: expenseAmount,
          notes: expenseGrantNotes,
          previousMetadata: previousProgramMeta || {}
        });
      }

      await ProgramService.updateProgram(programId, payload);
      this.showToast("Program dikemas kini.", "success");
      this.closeSuntingProgramModal();
      await this.loadPrograms();
    } catch (error) {
      console.error("ProgramKehadiranNewest: gagal mengemas kini program", error);
      this.showToast(error.message || "Gagal mengemas kini program.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  }

  async deleteProgram(programId) {
    if (!programId) {
      return;
    }

    const confirmPadam = window.confirm("Padam program ini? Tindakan ini tidak boleh diundur.");
    if (!confirmPadam) {
      return;
    }

    try {
      await ProgramService.deleteProgram(programId);
      this.showToast("Program berjaya dipadam.", "success");
      await this.loadPrograms();
    } catch (error) {
      console.error("ProgramKehadiranNewest: gagal memadam program", error);
      this.showToast(error.message || "Gagal memadam program.", "error");
    }
  }

  populateProgramFilter(programs) {
    const select = this.elements.programFilter;
    if (!select) return;

    const current = select.value;
    select.innerHTML = '<option value="">All Programs</option>';

    programs.forEach(program => {
      const option = document.createElement('option');
      option.value = program.id;
      option.textContent = program.nama_program || program.nama || 'Tanpa Nama';
      select.appendChild(option);
    });

    if (current && Array.from(select.options).some(opt => opt.value === current)) {
      select.value = current;
    }
  }

  async loadAttendanceData(userTriggered = false) {
    const target = this.elements.attendanceTableBody;
    if (!target) return;

    const { programId } = this.state.filters;
    this.updateAttendanceDateUI();
    if (!programId) {
      target.innerHTML = `
        <tr>
          <td colspan="6" class="empty-text">Sila pilih program untuk melihat kehadiran.</td>
        </tr>
      `;
      return;
    }

    target.innerHTML = `
      <tr>
        <td colspan="6" class="loading-text">Memuatkan rekod kehadiran...</td>
      </tr>
    `;

    try {
      const { start: attendanceDate, end: attendanceEnd } = this.getAttendanceDateRange();
      const { listAttendanceByProgram } = await import('../../services/backend/AttendanceService.js');
      const records = await listAttendanceByProgram(programId, attendanceDate, { endDate: attendanceEnd });
      this.state.attendance = records || [];
      this.renderAttendanceTable();

    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal memuat kehadiran', error);
      target.innerHTML = `
        <tr>
          <td colspan="6" class="error-text">
            ${error.message || 'Gagal memuat rekod kehadiran.'}
          </td>
        </tr>
      `;
    }
  }

  renderAttendanceTable() {
    const target = this.elements.attendanceTableBody;
    if (!target) return;

    const search = (this.state.filters.search || '').toLowerCase();
    const records = (this.state.attendance || []).filter(rec => {
      if (!search) return true;
      const name = (rec.participant_name || '').toLowerCase();
      const kp = (rec.no_kp_display || rec.participant_id || '').toLowerCase();
      return name.includes(search) || kp.includes(search);
    });

    if (!records || records.length === 0) {
      const dateText = this.formatAttendanceRangeLabel(this.getAttendanceDateRange());
      target.innerHTML = `
        <tr>
          <td colspan="6" class="empty-text">Tiada rekod kehadiran pada ${dateText}.</td>
        </tr>
      `;
      if (this.elements.attendanceFooter) {
        this.elements.attendanceFooter.textContent = '';
      }
      return;
    }

    const rows = records.map(record => this.buildAttendanceRow(record)).join('');
    target.innerHTML = rows;
    this.bindAttendanceRowEvents();

    if (this.elements.attendanceFooter) {
      const presentCount = records.filter(r => r.hadir).length;
      this.elements.attendanceFooter.innerHTML = `
        <div class="footer-meta">
          <span>Showing ${records.length} attendees</span>
          <span>Total Hadir: ${presentCount} &nbsp; Attendance Rate: ${records.length ? Math.round((presentCount / records.length) * 100) : 0}%</span>
        </div>
      `;
    }
  }

  buildAttendanceRow(record) {
    const checked = record.hadir ? 'checked' : '';
    const notes = record.catatan || '-';
    return `
      <tr data-attendance-id="${record.id}">
        <td>${record.participant_name || '-'}</td>
        <td>${record.no_kp_display || record.participant_id || '-'}</td>
        <td>${record.source || '-'}</td>
        <td>
          <input type="checkbox" data-role="attendance-checkbox" data-id="${record.id}" ${checked}>
        </td>
        <td>${notes}</td>
        <td>
          <button class="btn btn-sm btn-outline" data-role="edit-attendance-note" data-id="${record.id}">
            Sunting Catatan
          </button>
        </td>
      </tr>
    `;
  }

  bindAttendanceRowEvents() {
    this.root.querySelectorAll('[data-role="attendance-checkbox"]').forEach(input => {
      input.addEventListener('change', (event) => {
        const attendanceId = event.target.getAttribute('data-id');
        const present = event.target.checked;
        this.updateAttendanceStatus(attendanceId, present);
      });
    });

    this.root.querySelectorAll('[data-role="edit-attendance-note"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const attendanceId = btn.getAttribute('data-id');
        const current = this.state.attendance.find(item => item.id === attendanceId);
        const existingCatatan = current?.catatan || '';
        const newCatatan = prompt('Kemas kini catatan kehadiran:', existingCatatan);
        if (newCatatan !== null) {
          this.updateAttendanceCatatan(attendanceId, newCatatan);
        }
      });
    });
  }

  async updateAttendanceStatus(attendanceId, present) {
    try {
      const { updateAttendanceStatus } = await import('../../services/backend/AttendanceService.js');
      await updateAttendanceStatus(attendanceId, present);
      this.showToast('Status kehadiran dikemas kini.', 'success');
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal kemas kini kehadiran', error);
      this.showToast(error.message || 'Gagal mengemas kini status kehadiran.', 'error');
      await this.loadAttendanceData(Boolean(this.state.filters.programId));
    }
  }

  async updateAttendanceCatatan(attendanceId, notes) {
    try {
      const { updateAttendanceCatatan } = await import('../../services/backend/AttendanceService.js');
      await updateAttendanceCatatan(attendanceId, notes);
      this.showToast('Catatan kehadiran dikemas kini.', 'success');
      await this.loadAttendanceData(Boolean(this.state.filters.programId));
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal kemas kini catatan', error);
      this.showToast(error.message || 'Gagal mengemas kini catatan.', 'error');
    }
  }

  async loadReports() {
    if (!this.elements.attendanceSummary || !this.elements.topParticipants || !this.elements.programParticipation) {
      return;
    }

    this.elements.attendanceSummary.innerHTML = '<p class="loading-text">Memuatkan ringkasan...</p>';
    this.elements.topParticipants.innerHTML = '<p class="loading-text">Memuatkan peserta terbaik...</p>';
    this.elements.programParticipation.innerHTML = '<p class="loading-text">Memuatkan statistik program...</p>';

    try {
      const { listAttendanceByProgram } = await import('../../services/backend/AttendanceService.js');
      const programs = await ProgramService.listProgram();
      const totalIndexedParticipants = await this.getIndexedParticipantCount().catch(() => null);

      const programResults = await Promise.all(
        programs.map(async (program) => {
          const records = await listAttendanceByProgram(program.id, null);
          const participantCount = records.length;
          const presentCount = records.filter(r => r.hadir).length;
          return { program, records, participantCount, presentCount };
        })
      );

      const allRecords = programResults.flatMap(r => r.records);
      const totalPrograms = programs.length;
      const participantIdSet = new Set();
      allRecords.forEach(r => participantIdSet.add(r.participant_id || r.no_kp_display || r.id));
      const fallbackParticipants = participantIdSet.size;
      const totalParticipants = typeof totalIndexedParticipants === 'number' && totalIndexedParticipants > 0
        ? totalIndexedParticipants
        : fallbackParticipants;
      const capacityDenominator = totalParticipants > 0 ? totalParticipants : null;
      const averageAttendance = programResults.length
        ? Math.round(
          (programResults.reduce((sum, item) => {
            const programDenom = capacityDenominator ?? item.participantCount;
            if (!programDenom) return sum;
            const ratio = capacityDenominator
              ? item.participantCount / capacityDenominator
              : item.presentCount / programDenom;
            return sum + ratio;
          }, 0) / programResults.length) * 100
        )
        : 0;

      const participantMap = new Map();
      allRecords.forEach(r => {
        const id = r.participant_id || r.no_kp_display || r.id;
        if (!participantMap.has(id)) {
          participantMap.set(id, {
            id,
            name: r.participant_name || 'Unknown',
            type: r.participant_type || '-',
            present: 0,
            total: 0
          });
        }
        const p = participantMap.get(id);
        p.total += 1;
        if (r.hadir) p.present += 1;
      });

      const topParticipants = Array.from(participantMap.values())
        .map(p => ({
          ...p,
          attendanceCount: p.present,
          attendancePercentage: p.total ? Math.round((p.present / p.total) * 100) : 0
        }))
        .sort((a, b) => b.attendanceCount - a.attendanceCount || b.attendancePercentage - a.attendancePercentage)
        .slice(0, 5);

      const totalAvailableForPercentage =
        typeof totalParticipants === 'number' && totalParticipants > 0 ? totalParticipants : null;
      const participation = programResults.map(({ program, participantCount }) => {
        const denominator = totalAvailableForPercentage ?? participantCount ?? 0;
        const capacityPercentage =
          denominator > 0 ? Math.round((participantCount / denominator) * 100) : 0;
        return {
          id: program.id || program.programId || program.nama_program || program.nama || 'program',
          name: program.nama_program || program.nama || 'Unknown',
          startDate: program.tarikh_mula || program.startDate,
          endDate: program.tarikh_tamat || program.endDate,
          participantCount,
          attendancePercentage: capacityPercentage
        };
      });

      this.renderAttendanceSummary({ totalPrograms, totalParticipants, averageAttendance });
      this.renderTopParticipants(topParticipants);
      this.renderProgramParticipation(participation);
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal memuat laporan', error);
      const message = `<p class="error-text">${error.message || 'Gagal memuat laporan.'}</p>`;
      this.elements.attendanceSummary.innerHTML = message;
      this.elements.topParticipants.innerHTML = message;
      this.elements.programParticipation.innerHTML = message;
    }
  }

  renderAttendanceSummary(summary) {
    if (!summary) {
      this.elements.attendanceSummary.innerHTML = '<p class="empty-text">Tiada data ringkasan.</p>';
      return;
    }

    this.elements.attendanceSummary.innerHTML = `
      <div class="stat-grid summary-layout">
        <div class="summary-card accent">
          <div class="summary-label">Jumlah Program</div>
          <div class="summary-value">${summary.totalPrograms ?? 0}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Jumlah Peserta</div>
          <div class="summary-value">${summary.totalParticipants ?? 0}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Purata Kehadiran</div>
          <div class="summary-value">${summary.averageAttendance ?? 0}%</div>
        </div>
      </div>
    `;
  }

  renderTopParticipants(participants) {
    if (!participants || participants.length === 0) {
      this.elements.topParticipants.innerHTML = '<p class="empty-text">Tiada peserta direkodkan.</p>';
      return;
    }

    const items = participants.map(participant => `
      <div class="participant-item">
        <div>
          <div class="participant-name">${participant.name || '-'}</div>
          <div class="participant-type">${participant.type || '-'}</div>
        </div>
        <div class="participant-score">
          ${participant.attendanceCount ?? 0} hadir
        </div>
      </div>
    `).join('');

    this.elements.topParticipants.innerHTML = items;
  }

  renderProgramParticipation(programs) {
    if (!programs || programs.length === 0) {
      this.elements.programParticipation.innerHTML = '<p class="empty-text">Tiada statistik program.</p>';
      return;
    }

    const resolveProgramId = (program) => program?.id || program?.programId || program?.name || program?.nama_program || program?.nama || '';

    const hasValidSelection = this.state.reportSelection && programs.some(p => resolveProgramId(p) === this.state.reportSelection);
    if (!hasValidSelection) {
      this.state.reportSelection = resolveProgramId(programs[0]);
    }

    const selectedProgram = programs.find(p => resolveProgramId(p) === this.state.reportSelection) || programs[0];
    const selectedStats = `
      <div class="program-item">
        <div class="program-name">${selectedProgram.name || '-'}</div>
        <div class="program-dates">${this.formatDate(selectedProgram.startDate)} - ${this.formatDate(selectedProgram.endDate)}</div>
        <div class="program-stats">
          <div>
            <span class="stat-label">Peserta</span>
            <span class="stat-value">${selectedProgram.participantCount ?? 0}</span>
          </div>
          <div>
            <span class="stat-label">Kehadiran</span>
            <span class="stat-value">${selectedProgram.attendancePercentage ?? 0}%</span>
          </div>
        </div>
      </div>
    `;

    this.elements.programParticipation.innerHTML = `
      <div class="program-selection-card report-selection">
        <div class="selection-details">
          <div class="selection-label">Program dipilih</div>
          <div class="selection-value">${selectedProgram.name || '-'}</div>
          <div class="selection-meta">${this.formatDate(selectedProgram.startDate)} - ${this.formatDate(selectedProgram.endDate)}</div>
        </div>
        <button class="btn btn-secondary" data-action="open-report-program-selector">
          Tukar Program
        </button>
      </div>
      <div class="program-participation-grid">${selectedStats}</div>
    `;

    const selectBtn = this.elements.programParticipation.querySelector('[data-action="open-report-program-selector"]');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => this.openReportProgramSelectionModal(programs));
    }
  }

  parseAmountInput(rawValue) {
    if (rawValue === null || rawValue === undefined) {
      return 0;
    }
    if (typeof rawValue === 'number') {
      return Number.isFinite(rawValue) ? rawValue : 0;
    }
    const cleaned = rawValue.toString().replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatCurrency(value) {
    const amount = this.parseAmountInput(value);
    return `RM ${amount.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  formatExpenseDisplay(value) {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const parsed = this.parseAmountInput(value);
    if (parsed > 0) {
      return this.formatCurrency(parsed);
    }
    return typeof value === 'string' ? value : '-';
  }

  programHasExpenseGrant(program) {
    if (!program) return false;
    const grantId = program.expense_grant_id || program.expenseGrantId || '';
    const amount = this.parseAmountInput(
      program.expense_deducted_amount ?? program.expenseDeductedAmount ?? 0
    );
    return Boolean(grantId && amount > 0);
  }

  getFinancialGrantById(grantId) {
    if (!grantId) return null;
    return (this.state.financialGrants || []).find(grant => grant.id === grantId) || null;
  }

  async ensureFinancialGrants(force = false) {
    if (this.state.financialGrantsLoading) {
      return this.state.financialGrants;
    }
    if (!force && this.state.financialGrantsLoaded && this.state.financialGrants.length) {
      return this.state.financialGrants;
    }
    this.state.financialGrantsLoading = true;
    try {
      const { collection, getDocs, query } = await import('firebase/firestore');
      const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.FINANCIAL_GRANTS), createEnvFilter()));
      this.state.financialGrants = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Geran',
            availableAmount: Number(data.availableAmount ?? data.totalAmount ?? 0)
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      this.state.financialGrantsLoaded = true;
      return this.state.financialGrants;
    } catch (error) {
      console.error('ProgramKehadiranNewest: gagal memuat senarai geran kewangan', error);
      this.state.financialGrants = [];
      throw error;
    } finally {
      this.state.financialGrantsLoading = false;
    }
  }

  initializeRecurrenceControls({ modal }) {
    if (!modal) return;
    const timeScaleSelect = modal.querySelector('select[name="time_scale"]');
    if (!timeScaleSelect) return;
    const endDateGroup = modal.querySelector('[data-role="end-date-group"]');
    const endDateInput = endDateGroup?.querySelector('input[name="endDate"]');
    const recurrenceGroup = modal.querySelector('[data-role="recurrence-group"]');
    const recurrenceRadios = modal.querySelectorAll('input[name="recurrence_mode"]');

    const resetRecurrenceRadios = () => {
      const defaultRadio = modal.querySelector('input[name="recurrence_mode"][value="forever"]');
      if (defaultRadio) {
        defaultRadio.checked = true;
      }
    };

    const isRecurringScale = () => {
      const scale = (timeScaleSelect.value || '').toLowerCase();
      return scale === 'daily' || scale === 'weekly';
    };

    const setRecurrenceVisibility = (visible) => {
      if (!recurrenceGroup) return;
      recurrenceGroup.hidden = !visible;
      recurrenceGroup.style.display = visible ? '' : 'none';
    };

    const applyEndDateState = () => {
      const isRecurring = isRecurringScale();
      if (!endDateInput) return;
      if (!isRecurring) {
        endDateInput.disabled = false;
        endDateInput.required = true;
        endDateGroup?.classList.remove('disabled');
        return;
      }
      const mode = modal.querySelector('input[name="recurrence_mode"]:checked')?.value || 'forever';
      const requireEnd = mode === 'until';
      endDateInput.disabled = !requireEnd;
      endDateInput.required = requireEnd;
      endDateGroup?.classList.toggle('disabled', !requireEnd);
      if (!requireEnd) {
        endDateInput.value = '';
      }
    };

    const handleTimeScaleChange = () => {
      const isRecurring = isRecurringScale();
      setRecurrenceVisibility(isRecurring);
      if (!isRecurring) {
        resetRecurrenceRadios();
      }
      applyEndDateState();
    };

    recurrenceRadios.forEach(radio => {
      radio.addEventListener('change', () => applyEndDateState());
    });
    timeScaleSelect.addEventListener('change', handleTimeScaleChange);
    handleTimeScaleChange();
  }

  async getIndexedParticipantCount(force = false) {
    if (!force && this.state.participantIndexCount !== null) {
      return this.state.participantIndexCount;
    }
    if (this.state.participantIndexCountLoading) {
      return this.state.participantIndexCount ?? 0;
    }
    this.state.participantIndexCountLoading = true;
    try {
      const { collection, getDocs, query } = await import('firebase/firestore');
      const { db } = await import('../../services/database/firebase.js');
      const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
      const snapshot = await getDocs(query(collection(db, COLLECTIONS.INDEX_NOKP), createEnvFilter()));
      this.state.participantIndexCount = snapshot.size;
      return snapshot.size;
    } catch (error) {
      console.warn('ProgramKehadiranNewest: gagal memuat bilangan index_nokp', error);
      return this.state.participantIndexCount ?? 0;
    } finally {
      this.state.participantIndexCountLoading = false;
    }
  }

  populateGrantSelectElement(select, selectedId = '') {
    if (!select) {
      return;
    }
    const grants = this.state.financialGrants || [];
    if (!grants.length) {
      select.innerHTML = '<option value="">Tiada geran tersedia</option>';
      select.value = '';
      select.disabled = true;
      return;
    }
    select.disabled = false;
    const options = ['<option value="">Pilih Geran</option>', ...grants.map(
      grant => `<option value="${grant.id}">${this.escapeHtml(grant.name)}</option>`
    )];
    select.innerHTML = options.join('');
    if (selectedId && grants.some(grant => grant.id === selectedId)) {
      select.value = selectedId;
    } else {
      select.value = '';
    }
  }

  initializeExpenseGrantControls({ scope, modal, selectedGrantId = '' }) {
    if (!modal) return;
    const select = modal.querySelector(
      `[data-role="expense-grant-select"][data-expense-scope="${scope}"]`
    );
    if (select) {
      this.populateGrantSelectElement(select, selectedGrantId);
      select.addEventListener('change', () => this.updateExpenseGrantHelper(scope, modal));
    }
    this.updateExpenseGrantHelper(scope, modal);
  }

  updateExpenseGrantHelper(scope, container = document) {
    if (!container) return;
    const select = container.querySelector(
      `[data-role="expense-grant-select"][data-expense-scope="${scope}"]`
    );
    const helper = container.querySelector(
      `[data-role="expense-grant-balance"][data-expense-scope="${scope}"]`
    );
    if (!helper) {
      return;
    }
    if (!select) {
      helper.textContent = 'Baki semasa: -';
      return;
    }
    if (select.disabled) {
      helper.textContent = 'Tiada geran tersedia.';
      return;
    }
    if (!select.value) {
      helper.textContent = 'Baki semasa: -';
      return;
    }
    const grant = this.getFinancialGrantById(select.value);
    helper.textContent = grant ? `Baki semasa: ${this.formatCurrency(grant.availableAmount)}` : 'Baki semasa: -';
  }

  async reconcileProgramExpenseGrant({ programId, programName, newGrantId, newAmount, notes, previousMetadata = {} }) {
    const prevGrantId = previousMetadata?.expense_grant_id || previousMetadata?.expenseGrantId || '';
    const prevAmount = this.parseAmountInput(
      previousMetadata?.expense_deducted_amount ?? previousMetadata?.expenseDeductedAmount ?? 0
    );
    const sameGrant = prevGrantId && newGrantId && prevGrantId === newGrantId;
    const amountsEqual = sameGrant && Math.abs(prevAmount - newAmount) < 0.01;
    if (amountsEqual) {
      return;
    }
    const requiresRefund = Boolean(prevGrantId && prevAmount > 0);
    const requiresNewDeduction = Boolean(newGrantId && newAmount > 0);
    if (!requiresRefund && !requiresNewDeduction) {
      return;
    }

    const { doc, collection, runTransaction } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');

    await runTransaction(db, async transaction => {
      const now = new Date();
      const programRef = doc(db, COLLECTIONS.PROGRAM, programId);
      const updates = {};

      if (requiresRefund) {
        const refundGrantRef = doc(db, COLLECTIONS.FINANCIAL_GRANTS, prevGrantId);
        const prevSnap = await transaction.get(refundGrantRef);
        if (prevSnap.exists()) {
          const prevData = prevSnap.data();
          const prevAvailable = Number(prevData.availableAmount ?? prevData.totalAmount ?? 0) + prevAmount;
          transaction.update(refundGrantRef, {
            availableAmount: prevAvailable,
            updatedAt: now
          });

          const refundTxnRef = doc(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS));
          transaction.set(
            refundTxnRef,
            addStandardFields({
              type: 'adjustment',
              amount: prevAmount,
              date: now,
              description: `Pelarasan perbelanjaan untuk ${programName}`,
              reference: `PROGRAM-${programId}`,
              grantImpacts: [{
                grantId: prevGrantId,
                grantName: previousMetadata?.expense_grant_name || previousMetadata?.expenseGrantName || prevData.name || 'Geran',
                amount: prevAmount
              }],
              metadata: { programId, action: 'program-expense-refund' },
              createdAt: now,
              updatedAt: now
            })
          );
        }
        if (!requiresNewDeduction) {
          updates.expense_grant_id = '';
          updates.expense_grant_name = '';
          updates.expense_deducted_amount = 0;
          updates.expense_deducted_at = null;
          updates.expense_deduction_transaction_id = '';
        }
      }

      if (requiresNewDeduction) {
        const grantRef = doc(db, COLLECTIONS.FINANCIAL_GRANTS, newGrantId);
        const grantSnap = await transaction.get(grantRef);
        if (!grantSnap.exists()) {
          throw new Error('Geran tidak ditemui.');
        }
        const grantData = grantSnap.data();
        const baseAvailable = Number(grantData.availableAmount ?? grantData.totalAmount ?? 0);
        const effectiveAvailable = sameGrant ? baseAvailable + prevAmount : baseAvailable;
        if (effectiveAvailable < newAmount) {
          throw new Error(`Baki ${grantData.name || 'geran'} tidak mencukupi.`);
        }
        transaction.update(grantRef, {
          availableAmount: effectiveAvailable - newAmount,
          updatedAt: now
        });

        const deductionTxnRef = doc(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS));
        transaction.set(
          deductionTxnRef,
          addStandardFields({
            type: 'deduction',
            amount: newAmount,
            date: now,
            description: notes || `Perbelanjaan program ${programName}`,
            reference: `PROGRAM-${programId}`,
            grantImpacts: [{
              grantId: newGrantId,
              grantName: grantData.name || 'Geran',
              amount: newAmount
            }],
            metadata: { programId, action: 'program-expense' },
            createdAt: now,
            updatedAt: now
          })
        );

        updates.expense_grant_id = newGrantId;
        updates.expense_grant_name = grantData.name || '';
        updates.expense_deducted_amount = newAmount;
        updates.expense_deducted_at = now;
        updates.expense_deduction_transaction_id = deductionTxnRef.id;
      }

      if (Object.keys(updates).length) {
        transaction.update(programRef, updates);
      }
    });

    this.state.financialGrantsLoaded = false;
  }

  formatDate(value) {
    if (!value) return 'N/A';

    try {
      if (typeof value === 'string') {
        return new Date(value).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      if (value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' });
      }

      return new Date(value).toLocaleDateString('ms-MY', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      console.warn('ProgramKehadiranNewest: tidak dapat memformat tarikh', value, error);
      return 'N/A';
    }
  }

  resolveStatus(program) {
    const now = new Date();
    const start = program.tarikh_mula || program.startDate;
    const end = program.tarikh_tamat || program.endDate;
    const status = (program.status || '').toLowerCase();
    if (this.isRecurringScale(program.time_scale || program.timeScale)) {
      return { label: 'Active', className: 'active' };
    }

    const normalizeDate = (input) => {
      if (!input) return null;
      if (typeof input === 'string') return new Date(input);
      if (input.seconds) return new Date(input.seconds * 1000);
      return new Date(input);
    };

    const startDate = normalizeDate(start);
    const endDate = normalizeDate(end);

    let label = 'Upcoming';
    let className = 'upcoming';

    if (status === 'active' || status === 'ongoing') {
      label = 'Active';
      className = 'active';
    } else if (status === 'completed') {
      label = 'Completed';
      className = 'completed';
    } else if (status === 'cancelled') {
      label = 'Cancelled';
      className = 'cancelled';
    } else if (startDate && endDate) {
      if (now > endDate) {
        label = 'Completed';
        className = 'completed';
      } else if (now >= startDate && now <= endDate) {
        label = 'Active';
        className = 'active';
      }
    }

    return { label, className };
  }

  getStatusLabelFromDates(startDateIso, endDateIso, timeScale) {
    if (this.isRecurringScale(timeScale)) {
      return 'Active';
    }
    const statusMeta = this.resolveStatus({
      startDate: startDateIso ? new Date(startDateIso) : null,
      endDate: endDateIso ? new Date(endDateIso) : null,
      time_scale: timeScale
    });
    return statusMeta.label || 'Upcoming';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `program-newest-toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2600);
  }

  escapeHtml(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  injectStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    
style.textContent = `
  #program-kehadiran-newest-content.content-section {
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: clamp(8px, 1vw, 16px);
    padding-right: clamp(10px, 1.8vw, 24px);
  }

  #program-kehadiran-newest-content .program-newest-wrapper {
    padding-left: 0;
    padding-right: 0;
  }

  .program-newest-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0px;
    padding: 0px 0 0;
  }

  .program-newest-wrapper .program-newest-section {
    display: none;
  }

  .program-newest-wrapper .program-newest-section.active {
    display: block;
  }

  .program-tab-shell {
    margin-bottom: 0px;
  }

  .program-tab-header {
    display: flex;
    flex-wrap: wrap;
    gap: 0px;
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--warna-sempadan);
    padding: 8px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
  }

  .program-tab {
    flex: 1 1 200px;
    border: 1px solid transparent;
    border-radius: 14px;
    padding: 10px 12px;
    background: #f9f9ff;
    display: flex;
    gap: 10px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 64px;
  }

  .program-tab .tab-icon {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    background: linear-gradient(135deg, #a855f7, #7c3aed);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    box-shadow: 0 8px 16px rgba(124, 58, 237, 0.25);
  }

  .program-tab .tab-title {
    display: block;
    font-weight: 700;
    color: var(--warna-teks-utama);
    font-size: 0.95rem;
  }

  .program-tab .tab-desc {
    display: block;
    color: var(--warna-teks-sekunder);
    font-size: 0.78rem;
    margin-top: 2px;
    line-height: 1.2;
  }

  .program-tab.active {
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.07), rgba(96, 165, 250, 0.05));
    border-color: rgba(124, 58, 237, 0.3);
    box-shadow: 0 12px 22px rgba(124, 58, 237, 0.15);
  }

  .program-tab.active .tab-icon {
    background: linear-gradient(135deg, #7c3aed, #6366f1);
  }

  .program-newest-wrapper .program-newest-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .program-newest-wrapper .program-newest-card {
    border-radius: 18px;
    border: 1px solid var(--warna-sempadan);
    background: #fff;
    padding: 20px;
    box-shadow: 0 20px 35px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .program-newest-wrapper .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .program-newest-wrapper .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--warna-utama), #8b5cf6);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 24px rgba(109, 40, 217, 0.3);
  }

  .program-newest-wrapper .card-description {
    margin: 0;
    color: var(--warna-teks-sekunder);
    line-height: 1.5;
  }

  .program-newest-wrapper .program-newest-card .btn {
    align-self: flex-start;
  }

  .program-newest-wrapper .section-card {
    background: #fff;
    border-radius: 20px;
    border: 1px solid var(--warna-sempadan);
    padding: clamp(18px, 2vw, 26px);
    box-shadow: 0 24px 45px rgba(15, 23, 42, 0.08);
    position: relative;
    overflow: visible;
  }

  .program-newest-wrapper .section-header {
    margin-bottom: 0px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .program-newest-wrapper .section-header-start,
  .program-newest-wrapper .section-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .program-newest-wrapper .header-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--warna-utama), #a855f7);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .program-newest-wrapper .section-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .program-newest-wrapper .section-description {
    margin: 0;
    max-width: min(620px, 100%);
    color: var(--warna-teks-sekunder);
  }

  .program-newest-wrapper .btn-ghost {
    background: #f6f0ff;
    color: var(--warna-utama);
    border: 1px solid var(--warna-sempadan);
    box-shadow: none;
  }

  .program-newest-wrapper .btn-ghost:hover {
    background: var(--warna-utama-muda);
  }

  .program-newest-wrapper .filter-group {
    flex: 1 1 200px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .program-newest-wrapper .attendance-program-list {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    margin-bottom: 12px;
  }

  .program-newest-wrapper .program-selection-card.report-selection {
    margin-bottom: 16px;
  }

  .program-newest-wrapper .program-selection-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--warna-sempadan);
    border-radius: 16px;
    background: #fff;
    padding: 16px 20px;
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08);
  }

  .program-newest-wrapper .selection-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .program-newest-wrapper .selection-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--warna-teks-sekunder);
  }

  .program-newest-wrapper .selection-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--warna-teks-utama);
  }

  .program-newest-wrapper .selection-meta {
    font-size: 13px;
    color: var(--warna-teks-sekunder);
  }

  .program-selection-modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    z-index: 2000;
  }

  .program-selection-dialog {
    background: #fff;
    border-radius: 20px;
    width: min(640px, 100%);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 60px rgba(15, 23, 42, 0.3);
    border: 1px solid var(--warna-sempadan);
  }

  .program-selection-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--warna-sempadan);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .program-selection-header h3 {
    margin: 0;
    font-size: 20px;
  }

  .program-selection-header p {
    margin: 6px 0 0;
    color: var(--warna-teks-sekunder);
    font-size: 14px;
  }

  .program-selection-body {
    padding: 20px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .program-selection-search {
    border: 1px solid var(--warna-sempadan);
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 15px;
  }

  .program-selection-list {
    max-height: 55vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .program-selection-item {
    width: 100%;
    text-align: left;
    border: 1px solid var(--warna-sempadan);
    border-radius: 14px;
    padding: 12px 14px;
    background: #f9fafc;
    transition: all 0.2s ease;
  }

  .program-selection-item .item-title {
    font-weight: 600;
    color: var(--warna-teks-utama);
  }

  .program-selection-item .item-dates {
    font-size: 13px;
    color: var(--warna-teks-sekunder);
  }

  .program-selection-item:hover {
    border-color: var(--warna-utama);
    background: #fff;
  }

  .program-selection-item.active {
    background: var(--warna-utama-muda);
    border-color: var(--warna-utama);
  }

  .close-modal-btn {
    border: none;
    background: #f1f5f9;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    color: var(--warna-teks-utama);
  }

  .close-modal-btn:hover {
    background: #e2e8f0;
  }

  .program-newest-wrapper .attendance-program-card {
    border-radius: 14px;
    border: 1px solid var(--warna-sempadan);
    background: #fff;
    padding: 12px 14px;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.07);
    transition: all 0.2s ease;
    text-align: left;
  }

  .program-newest-wrapper .attendance-program-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px rgba(109, 40, 217, 0.16);
  }

  .program-newest-wrapper .attendance-program-card.active {
    border-color: var(--warna-utama);
    background: linear-gradient(135deg, rgba(109, 40, 217, 0.08), rgba(99, 102, 241, 0.08));
  }

  .program-newest-wrapper .attendance-program-card .card-title {
    font-weight: 700;
    color: var(--warna-teks-utama);
    margin-bottom: 6px;
  }

  .program-newest-wrapper .attendance-program-card .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--warna-utama-muda);
    color: var(--warna-utama);
    font-size: 11px;
    font-weight: 700;
  }

  .program-newest-wrapper .search-bar input {
    border: 1px solid var(--warna-sempadan);
    border-radius: 12px;
    padding: 12px;
    background: #fff;
  }

  .attendance-date-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 12px 0;
  }

  .attendance-date-filter .filter-label {
    font-weight: 600;
    color: var(--warna-teks-utama);
  }

  .attendance-date-filter .date-control-group {
    display: flex;
    gap: 8px;
    align-items: center;
    max-width: 360px;
  }

  .attendance-date-filter .date-control-group .btn {
    padding: 8px 12px;
  }

  .attendance-date-filter .date-helper {
    margin: 0;
    font-size: 13px;
    color: var(--warna-teks-sekunder);
  }

  .program-newest-wrapper .program-action-bar {
    background: #f8f7ff;
    border: 1px solid var(--warna-sempadan);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
  }

  .program-status-tabs {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .program-status-tabs .status-tab {
    border: 1px solid var(--warna-sempadan);
    border-radius: 999px;
    padding: 6px 14px;
    background: #fff;
    color: var(--warna-teks-utama);
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .program-status-tabs .status-tab .count {
    background: #f1f5f9;
    border-radius: 999px;
    padding: 2px 8px;
    font-size: 12px;
    color: var(--warna-teks-sekunder);
  }

  .program-status-tabs .status-tab.active {
    background: linear-gradient(135deg, var(--warna-utama), #8b5cf6);
    color: #fff;
    border-color: transparent;
  }

  .program-status-tabs .status-tab.active .count {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .program-newest-wrapper .program-row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .program-newest-wrapper .program-row-actions .btn {
    flex: 1 1 120px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--warna-sempadan);
    color: var(--warna-teks-utama);
    box-shadow: none;
  }

  .program-newest-wrapper .program-row-actions .btn.btn-primary {
    background: linear-gradient(135deg, var(--warna-utama), #8b5cf6);
    color: #fff;
    border: none;
  }

  .program-newest-wrapper .program-row-actions .btn.btn-danger {
    border-color: #fecdd3;
    color: #b91c1c;
  }

  .program-newest-wrapper .program-row-actions .btn.btn-secondary {
    background: #fff;
    border: 1px solid var(--warna-sempadan);
  }

  .program-newest-wrapper .program-newest-section .table-container {
    background: #fff;
    border-radius: 18px;
    border: 1px solid var(--warna-sempadan);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    margin-top: 12px;
  }

  .program-newest-wrapper .program-newest-section .data-table {
    width: 100%;
    border-collapse: collapse;
  }

  .program-newest-wrapper .program-newest-section .data-table th {
    background: #f5f3ff;
    color: var(--warna-teks-utama);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .program-newest-wrapper .program-newest-section .data-table th,
  .program-newest-wrapper .program-newest-section .data-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #edf2f7;
  }

  .program-newest-wrapper .program-newest-section .data-table tbody tr:hover {
    background: #f8f7ff;
  }

  .program-newest-wrapper .table-footer {
    font-size: 12px;
    color: var(--warna-teks-sekunder);
    padding: 10px 14px;
  }

  .program-newest-wrapper .reports-layered-shell {
    position: relative;
    padding: clamp(12px, 2vw, 24px);
  }

  .program-newest-wrapper .reports-layered-backdrop {
    position: absolute;
    inset: clamp(12px, 2vw, 24px);
    border-radius: 32px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(236, 72, 153, 0.08));
    transform: translate(16px, 18px);
    z-index: 0;
    filter: blur(2px);
  }

  .program-newest-wrapper .reports-layered-panel {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 32px;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 40px 65px rgba(15, 23, 42, 0.15);
    padding: clamp(20px, 2.8vw, 32px);
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .program-newest-wrapper .report-hero {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .program-newest-wrapper .report-eyebrow {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #94a3b8;
    margin: 0 0 6px;
    font-weight: 700;
  }

  .program-newest-wrapper .report-hero h3 {
    margin: 0;
    font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  }

  .program-newest-wrapper .report-description {
    max-width: 520px;
    margin-top: 6px;
    color: var(--warna-teks-sekunder);
  }

  .program-newest-wrapper .report-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .program-newest-wrapper .reports-grid {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
    gap: clamp(16px, 2vw, 24px);
    align-items: stretch;
  }

  .program-newest-wrapper .report-card {
    position: relative;
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 24px;
    background: linear-gradient(135deg, #ffffff, #f7f5ff);
    box-shadow: 0 25px 45px rgba(15, 23, 42, 0.15);
    padding: clamp(16px, 2vw, 22px);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .program-newest-wrapper .report-card::before {
    content: '';
    position: absolute;
    inset: 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.35);
    opacity: 0.6;
    pointer-events: none;
  }

  .program-newest-wrapper .report-card > * {
    position: relative;
  }

  .program-newest-wrapper .report-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 12px;
  }

  .program-newest-wrapper .report-header h4 {
    margin: 0;
  }

  .program-newest-wrapper .report-icon {
    width: 44px;
    height: 44px;
    border-radius: 16px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #a855f7, #6366f1);
    color: #fff;
    font-size: 1.1rem;
    box-shadow: 0 12px 25px rgba(99, 102, 241, 0.35);
  }

  .program-newest-wrapper .report-card.span-2 {
    grid-column: 1 / 2;
  }

  .program-newest-wrapper .report-card.span-full {
    grid-column: 1 / 3;
  }

  @media (max-width: 1024px) {
    .program-newest-wrapper .reports-grid {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }
    .program-newest-wrapper .report-card.span-2,
    .program-newest-wrapper .report-card.span-full {
      grid-column: span 1;
    }
  }

  .program-newest-wrapper .stat-grid {
    display: grid;
    gap: 14px;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .program-newest-wrapper .stat-grid.summary-layout {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .program-newest-wrapper .summary-card {
    background: #f9f7ff;
    border-radius: 16px;
    padding: 18px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(99, 102, 241, 0.15);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .program-newest-wrapper .summary-card.accent {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.1));
    border-color: transparent;
  }

  .program-newest-wrapper .summary-label {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--warna-teks-sekunder);
  }

  .program-newest-wrapper .summary-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--warna-teks-utama);
  }

  .program-newest-wrapper .participant-item {
    border-bottom: 1px solid var(--warna-sempadan);
    padding: 10px 0;
  }

  .program-newest-wrapper .participant-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .program-newest-wrapper .report-content {
    margin-top: 10px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .program-newest-wrapper .program-participation-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .program-newest-wrapper .program-item {
    background: #f9fafc;
    border-radius: 12px;
    padding: 14px;
  }

  .program-newest-modal {
    position: fixed;
    inset: 0;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.5);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 3000;
  }

  .program-newest-modal.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .program-newest-modal .modal-panel {
    width: min(720px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 20px;
    border: 1px solid var(--warna-sempadan);
    box-shadow: 0 35px 60px rgba(15, 23, 42, 0.25);
    padding: clamp(18px, 2vw, 26px);
  }

  .program-newest-modal .program-details-panel {
    width: min(540px, 100%);
  }

  .program-newest-modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .program-newest-modal .modal-header h3 {
    margin: 0;
    font-size: clamp(18px, 2vw, 22px);
  }

  .program-newest-modal .modal-close {
    width: 38px;
    height: 38px;
    border-radius: 999px;
    border: none;
    background: #f3f4ff;
    color: var(--warna-teks-utama);
    font-size: 22px;
    cursor: pointer;
  }

  .program-newest-modal .modal-close:hover {
    background: #e4e6fb;
  }

  .program-newest-modal .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;
  }

  .program-newest-modal .form-helper {
    font-size: 12px;
    color: var(--warna-teks-sekunder);
  }

  .program-newest-modal .form-group label {
    font-weight: 600;
    color: var(--warna-teks-utama);
  }

  .program-newest-modal .form-group.disabled .form-input {
    background: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .program-newest-modal .recurrence-options {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 6px;
  }

  .program-newest-modal .recurrence-option {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--warna-teks-utama);
  }

  .program-newest-modal .form-input {
    border: 1px solid var(--warna-sempadan);
    border-radius: 12px;
    padding: 10px 12px;
    background: #fff;
    font-size: 15px;
  }

  .program-newest-modal textarea.form-input {
    min-height: 110px;
    resize: vertical;
  }

  .program-newest-modal .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .program-newest-modal .form-row .form-group {
    flex: 1 1 220px;
  }

  .program-newest-modal .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 4px;
  }

  .program-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-bottom: 12px;
  }

  .program-details-grid .detail-item {
    background: #f9f7ff;
    border-radius: 12px;
    padding: 12px 14px;
  }

  .program-details-grid .detail-label {
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--warna-teks-sekunder);
  }

  .program-details-grid .detail-value {
    font-size: 16px;
    font-weight: 600;
    color: var(--warna-teks-utama);
  }

  .program-details-grid .detail-hint {
    display: block;
    font-size: 12px;
    color: var(--warna-teks-sekunder);
  }

  .program-details-grid .detail-span {
    grid-column: span 2;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-badge.active {
    background: rgba(34, 197, 94, 0.15);
    color: #15803d;
  }

  .status-badge.completed {
    background: rgba(59, 130, 246, 0.15);
    color: #1d4ed8;
  }

  .status-badge.upcoming {
    background: rgba(249, 115, 22, 0.15);
    color: #c2410c;
  }

  .status-badge.cancelled {
    background: rgba(248, 113, 113, 0.15);
    color: #b91c1c;
  }

  .qr-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  .qr-container img {
    width: 260px;
    height: 260px;
    object-fit: contain;
  }

  .qr-link {
    word-break: break-all;
    font-size: 13px;
    color: var(--warna-teks-sekunder);
    text-align: center;
    margin-bottom: 12px;
  }

  .program-newest-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 18px;
    border-radius: 999px;
    background: #1e293b;
    color: #fff;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s ease;
    z-index: 3200;
  }

  .program-newest-toast.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .program-newest-toast.success {
    background: #16a34a;
  }

  .program-newest-toast.error {
    background: #dc2626;
  }

  .program-newest-toast.info {
    background: #2563eb;
  }
`;


    document.head.appendChild(style);
  }
}
