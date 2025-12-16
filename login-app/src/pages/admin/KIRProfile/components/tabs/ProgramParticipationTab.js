import { BaseTab } from '../shared/BaseTab.js';
import { ProgramService } from '../../../../../services/backend/ProgramService.js';
import { listAttendanceByProgram } from '../../../../../services/backend/AttendanceService.js';

export class ProgramParticipationTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'kehadiran-program';
    this.state = {
      loading: false,
      error: null,
      programs: [],
      participants: [],
      matrix: [],
      summary: null
    };
    this.hasLoaded = false;
    this.addStyles();
  }

  render() {
    return `
      <div class="participation-tab" data-participation-tab>
        <div class="participation-header">
          <div>
            <h3>Kehadiran Program Isi Rumah</h3>
            <p>Ringkasan penyertaan KIR, PKIR dan semua AIR terhadap program komuniti</p>
          </div>
          <div class="participation-meta">
            <span>ID KIR: ${this.kirProfile.kirId || '-'}</span>
            <span>Jumlah Isi Rumah: ${(this.buildParticipantList()?.length) || 0}</span>
          </div>
        </div>

        <div id="participation-summary">
          ${this.renderSummary()}
        </div>

        <div id="participation-participants">
          ${this.renderParticipants()}
        </div>

        <div id="participation-programs">
          ${this.renderProgramMatrix()}
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.hasLoaded) {
      this.loadParticipationData();
    }
  }

  async loadParticipationData() {
    if (this.state.loading) return;
    this.state.loading = true;
    this.state.error = null;
    this.updateDOM();

    try {
      const programs = await ProgramService.listProgram();
      const participants = this.buildParticipantList();
      const attendanceMap = new Map();

      for (const program of programs) {
        try {
          const records = await listAttendanceByProgram(program.id, null);
          attendanceMap.set(program.id, records || []);
        } catch (error) {
          console.warn('ProgramParticipationTab: gagal memuat rekod kehadiran untuk program', program.id, error);
          attendanceMap.set(program.id, []);
        }
      }

      const participantStats = await Promise.all(
        participants.map(participant =>
          this.buildParticipantStats(participant, programs, attendanceMap)
        )
      );

      const matrix = this.buildProgramMatrix(programs, participantStats, attendanceMap);
      const summary = this.buildSummary(programs, participantStats);

      this.state = {
        loading: false,
        error: null,
        programs,
        participants: participantStats,
        matrix,
        summary
      };
      this.hasLoaded = true;
      this.updateDOM();
    } catch (error) {
      console.error('ProgramParticipationTab: gagal memuat data kehadiran', error);
      this.state.loading = false;
      this.state.error = error?.message || 'Gagal memuat data kehadiran program.';
      this.updateDOM();
    }
  }

  buildParticipantList() {
    const list = [];
    const normalizeNoKP = value => (value || '').toString().replace(/\D/g, '');

    const kirName = this.kirData?.nama_penuh || this.kirData?.nama || 'Ketua Isi Rumah';
    if (this.kirProfile.kirId) {
      list.push({
        id: this.kirProfile.kirId,
        name: kirName,
        role: 'Ketua Isi Rumah',
        type: 'KIR',
        normalizedNoKP: normalizeNoKP(this.kirData?.no_kp || this.kirData?.nokp || '')
      });
    }

    if (this.kirProfile.pkirData?.id) {
      const pkir = this.kirProfile.pkirData;
      const pkirName = pkir?.nama ||
        pkir?.nama_penuh ||
        pkir?.asas?.nama ||
        pkir?.asas?.nama_penuh ||
        'PKIR';
      list.push({
        id: pkir.id,
        name: pkirName,
        role: 'PKIR',
        type: 'PKIR',
        normalizedNoKP: normalizeNoKP(pkir?.no_kp || pkir?.nokp || pkir?.asas?.no_kp || '')
      });
    }

    const airList = Array.isArray(this.kirProfile.airData) ? this.kirProfile.airData : [];
    airList.forEach((air, index) => {
      if (!air?.id) return;
      const airName = air?.nama ||
        air?.nama_penuh ||
        air?.asas?.nama ||
        air?.asas?.nama_penuh ||
        `AIR ${index + 1}`;
      list.push({
        id: air.id,
        name: airName,
        role: 'Ahli Isi Rumah',
        type: 'AIR',
        normalizedNoKP: normalizeNoKP(air?.no_kp || air?.nokp || air?.asas?.no_kp || '')
      });
    });

    return list;
  }

  async buildParticipantStats(participant, programs, attendanceMap) {
    const joinedIds = new Set();

    programs.forEach(program => {
      const records = attendanceMap.get(program.id) || [];
      const match = records.some(record => this.doesRecordBelongToParticipant(record, participant));
      if (match) {
        joinedIds.add(program.id);
      }
    });

    const joinedPrograms = programs.filter(program => joinedIds.has(program.id));
    const totalPrograms = programs.length;
    const joinedCount = joinedPrograms.length;
    const notJoinedCount = Math.max(totalPrograms - joinedCount, 0);
    const attendanceRate = totalPrograms > 0 ? Math.round((joinedCount / totalPrograms) * 100) : 0;

    return {
      ...participant,
      totalPrograms,
      joinedCount,
      notJoinedCount,
      attendanceRate,
      joinedProgramIds: joinedIds,
      joinedPrograms
    };
  }

  buildProgramMatrix(programs, participantStats, attendanceMap) {
    return programs.map(program => {
      const records = attendanceMap.get(program.id) || [];
      const attendees = participantStats.filter(participant =>
        records.some(record => this.doesRecordBelongToParticipant(record, participant))
      );
      const absentees = participantStats.filter(participant =>
        !records.some(record => this.doesRecordBelongToParticipant(record, participant))
      );
      return {
        id: program.id,
        name: program.nama_program || program.nama || 'Program',
        startDate: program.tarikh_mula || program.startDate,
        endDate: program.tarikh_tamat || program.endDate,
        attendees,
        absentees
      };
    });
  }

  buildSummary(programs, participantStats) {
    const totalPrograms = programs.length;
    const totalParticipants = participantStats.length;
    const totalJoined = participantStats.reduce((sum, participant) => sum + participant.joinedCount, 0);
    const coverageRate =
      totalParticipants && totalPrograms
        ? Math.round((totalJoined / (totalParticipants * totalPrograms)) * 100)
        : 0;

    return {
      totalPrograms,
      totalParticipants,
      totalJoined,
      coverageRate
    };
  }

  renderSummary() {
    if (this.state.loading) {
      return `
        <div class="participation-card loading">
          <div class="loading-bar"></div>
          <div class="loading-bar short"></div>
        </div>
      `;
    }

    if (this.state.error) {
      return `
        <div class="participation-card error">
          <p>${this.state.error}</p>
        </div>
      `;
    }

    if (!this.state.summary) {
      return `
        <div class="participation-card empty">
          <p>Tiada data program ditemui.</p>
        </div>
      `;
    }

    const summary = this.state.summary;
    const cards = [
      {
        label: 'Jumlah Program',
        value: summary.totalPrograms,
        helper: 'Program dianjurkan'
      },
      {
        label: 'Isi Rumah Dipantau',
        value: summary.totalParticipants,
        helper: 'Ahli dipadankan'
      },
      {
        label: 'Program Dihadiri',
        value: summary.totalJoined,
        helper: 'Jumlah kehadiran'
      },
      {
        label: 'Liputan Program',
        value: `${summary.coverageRate}%`,
        helper: 'Purata kehadiran'
      }
    ];

    return `
      <div class="stats-grid">
        ${cards
          .map(
            card => `
              <div class="stat-card">
                <p class="stat-label">${card.label}</p>
                <h4>${card.value}</h4>
                <span class="stat-helper">${card.helper}</span>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  renderParticipants() {
    if (this.state.loading) {
      return `
        <div class="participation-card">
          <p>Memuatkan kehadiran peserta...</p>
        </div>
      `;
    }

    if (this.state.error) {
      return '';
    }

    if (!this.state.participants.length) {
      return `
        <div class="participation-card empty">
          <p>Tiada ahli isi rumah berdaftar untuk dinilai.</p>
        </div>
      `;
    }

    return `
      <div class="participant-grid">
        ${this.state.participants.map(participant => this.renderParticipantCard(participant)).join('')}
      </div>
    `;
  }

  renderParticipantCard(participant) {
    const topPrograms = participant.joinedPrograms.slice(0, 3);
    const hasPrograms = participant.totalPrograms > 0;
    return `
      <div class="participant-card">
        <div class="participant-top">
          <div>
            <span class="role-chip">${participant.role}</span>
            <h4>${this.escapeHtml(participant.name || '-')}</h4>
          </div>
          <div class="rate-pill">
            <span>${participant.attendanceRate}%</span>
            <small>Kehadiran</small>
          </div>
        </div>
        <div class="participant-progress">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${Math.min(participant.attendanceRate, 100)}%;"></div>
          </div>
          <div class="progress-breakdown">
            <span>${participant.joinedCount} hadir</span>
            <span>${participant.notJoinedCount} belum hadir</span>
            <span>${participant.totalPrograms} program</span>
          </div>
        </div>
        <div class="participant-programs">
          <p>Program Dihadiri</p>
          ${!hasPrograms ? '<small>Tiada program tersedia.</small>' : ''}
          ${
            topPrograms.length
              ? `<div class="program-pill-group">
                  ${topPrograms
                    .map(
                      program => `
                        <span class="program-pill">
                          ${this.escapeHtml(program.nama_program || program.nama || 'Program')}
                          <small>${this.formatDate(program.tarikh_mula || program.startDate)}</small>
                        </span>
                      `
                    )
                    .join('')}
                </div>`
              : '<small>Belum ada kehadiran direkodkan.</small>'
          }
        </div>
      </div>
    `;
  }

  renderProgramMatrix() {
    if (this.state.loading) {
      return `
        <div class="participation-card">
          <p>Memuatkan senarai program...</p>
        </div>
      `;
    }

    if (this.state.error || !this.state.matrix.length) {
      return `
        <div class="participation-card empty">
          <p>Tiada program untuk dipaparkan.</p>
        </div>
      `;
    }

    const participants = this.state.participants;

    return `
      <div class="program-board">
        <div class="program-board-header">
          <div>
            <h4>Penyertaan Mengikut Program</h4>
            <p>Senarai status kehadiran bagi setiap program</p>
          </div>
        </div>
        <div class="program-list">
          ${this.state.matrix
            .map(program => {
              const attendeeNames = program.attendees.map(p => this.escapeHtml(p.name || p.role));
              const absenteeNames =
                program.absentees.length === participants.length
                  ? ['Belum ada kehadiran']
                  : program.absentees.map(p => this.escapeHtml(p.name || p.role));

              return `
                <div class="program-item">
                  <div class="program-info">
                    <h5>${this.escapeHtml(program.name || 'Program')}</h5>
                    <span>${this.formatProgramDateRange(program)}</span>
                  </div>
                  <div class="program-attendance">
                    <div>
                      <p>Hadir</p>
                      ${
                        attendeeNames.length
                          ? `<div class="chip-group success">
                              ${attendeeNames.map(name => `<span class="chip">${name}</span>`).join('')}
                            </div>`
                          : '<span class="chip muted">Belum ada kehadiran</span>'
                      }
                    </div>
                    <div>
                      <p>Tidak Hadir</p>
                      ${
                        absenteeNames.length
                          ? `<div class="chip-group muted">
                              ${absenteeNames.map(name => `<span class="chip">${name}</span>`).join('')}
                            </div>`
                          : '<span class="chip muted">-</span>'
                      }
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  formatProgramDateRange(program) {
    const start = program.startDate || program.tarikh_mula;
    const end = program.endDate || program.tarikh_tamat;
    if (!start && !end) {
      return '-';
    }
    if (start && end && start !== end) {
      return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    }
    return this.formatDate(start || end);
  }

  normalizeNoKP(value) {
    return (value || '').toString().replace(/\D/g, '');
  }

  doesRecordBelongToParticipant(record, participant) {
    if (!record || !participant) {
      return false;
    }

    const normalizedParticipantNo = participant.normalizedNoKP;
    const recordNoKP = this.normalizeNoKP(record.no_kp || record.no_kp_display || record.no_kp_original);
    if (normalizedParticipantNo && recordNoKP && normalizedParticipantNo === recordNoKP) {
      return true;
    }

    const recordIds = [
      record.kir_id,
      record.pkir_id,
      record.air_id,
      record.participant_id,
      record.participantId
    ].filter(Boolean);

    if (recordIds.includes(participant.id)) {
      return true;
    }

    return false;
  }

  updateDOM() {
    const summaryContainer = document.getElementById('participation-summary');
    if (summaryContainer) {
      summaryContainer.innerHTML = this.renderSummary();
    }

    const participantContainer = document.getElementById('participation-participants');
    if (participantContainer) {
      participantContainer.innerHTML = this.renderParticipants();
    }

    const programContainer = document.getElementById('participation-programs');
    if (programContainer) {
      programContainer.innerHTML = this.renderProgramMatrix();
    }
  }

  escapeHtml(text) {
    if (!text || typeof text !== 'string') return text || '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  addStyles() {
    if (document.getElementById('participation-tab-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'participation-tab-styles';
    style.textContent = `
      .participation-tab {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .participation-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: #fff;
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
      }

      .participation-header h3 {
        margin: 0;
        font-size: 22px;
      }

      .participation-header p {
        margin: 6px 0 0;
        color: #64748b;
      }

      .participation-meta {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: #475569;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background: #fff;
        border-radius: 16px;
        padding: 18px 20px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.65);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .stat-label {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 12px;
        color: #94a3b8;
      }

      .stat-card h4 {
        margin: 0;
        font-size: 30px;
        color: #0f172a;
      }

      .stat-helper {
        font-size: 13px;
        color: #64748b;
      }

      .participant-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 18px;
      }

      .participant-card {
        background: #fff;
        border-radius: 18px;
        padding: 20px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 18px 30px rgba(15,23,42,0.06);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .participant-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
      }

      .role-chip {
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(79, 70, 229, 0.12);
        color: #4f46e5;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .rate-pill {
        background: #eef2ff;
        border-radius: 14px;
        padding: 10px 14px;
        text-align: right;
        min-width: 100px;
      }

      .rate-pill span {
        font-size: 24px;
        font-weight: 700;
        color: #312e81;
      }

      .rate-pill small {
        display: block;
        color: #6366f1;
      }

      .participant-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-track {
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: #e2e8f0;
        position: relative;
        overflow: hidden;
      }

      .progress-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        border-radius: inherit;
        background: linear-gradient(90deg, #4f46e5, #a855f7);
      }

      .progress-breakdown {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #475569;
        flex-wrap: wrap;
        gap: 4px 12px;
      }

      .participant-programs {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .program-pill-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .program-pill {
        display: inline-flex;
        flex-direction: column;
        background: #f8fafc;
        border-radius: 12px;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        font-size: 13px;
        color: #0f172a;
        min-width: 120px;
      }

      .program-pill small {
        color: #94a3b8;
        font-size: 11px;
      }

      .program-board {
        background: #fff;
        border-radius: 18px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        box-shadow: 0 18px 30px rgba(15,23,42,0.06);
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .program-board-header h4 {
        margin: 0;
        font-size: 20px;
      }

      .program-board-header p {
        margin: 4px 0 0;
        color: #94a3b8;
      }

      .program-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .program-item {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .program-info h5 {
        margin: 0;
        font-size: 16px;
      }

      .program-info span {
        color: #94a3b8;
        font-size: 13px;
      }

      .program-attendance {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px 16px;
      }

      .program-attendance p {
        margin: 0 0 6px;
        font-size: 12px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #94a3b8;
      }

      .chip-group {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        border: 1px solid transparent;
        background: #f8fafc;
        color: #0f172a;
      }

      .chip-group.success .chip {
        background: rgba(34, 197, 94, 0.15);
        color: #166534;
        border-color: rgba(34, 197, 94, 0.3);
      }

      .chip-group.muted .chip,
      .chip.muted {
        background: rgba(148, 163, 184, 0.15);
        color: #475569;
        border-color: rgba(148, 163, 184, 0.3);
      }

      .participation-card {
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      .participation-card.loading .loading-bar {
        height: 14px;
        background: #e2e8f0;
        border-radius: 8px;
        margin-bottom: 8px;
        animation: pulse 1.5s infinite;
      }

      .participation-card.loading .loading-bar.short {
        width: 60%;
      }

      .participation-card.empty {
        text-align: center;
        color: #94a3b8;
      }

      .participation-card.error {
        background: #fef2f2;
        border-color: #fecaca;
        color: #b91c1c;
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }

      @media (max-width: 768px) {
        .participation-meta {
          flex-direction: column;
          gap: 6px;
        }

        .participant-grid {
          grid-template-columns: 1fr;
        }

        .progress-breakdown {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `;

    document.head.appendChild(style);
  }
}
