const NEWEST_PREFIX = 'ftn-newest';
const DRAWER_VIEWS = ['grant-form', 'funds', 'deduction'];

export class FinancialTrackingNewest {
  constructor() {
    this.root = null;
    this.sections = {};
    this.forms = {};
    this.summaryEls = {};
    this.tables = {};
    this.messages = {};
    this.buttons = {};
    this.containers = {};
    this.labels = {};
    this.state = {
      grants: [],
      transactions: [],
      totals: { received: 0, deducted: 0, available: 0, grantCount: 0 }
    };
    this.deductionRowIndex = 0;
  }

  createContent() {
    return `
      <div class="financial-newest">
        <header class="financial-hero">
          <div class="hero-text">
            <p class="hero-subtitle">Laporan Kewangan</p>
            <h3 class="section-title">Penjejakan Geran &amp; Tolakan</h3>
            <p class="section-description">
              Jejak semua dana geran, tambah dana baharu, dan rekodkan tolakan merentas geran dengan mudah.
            </p>
          </div>
          <div class="hero-actions">
            <button class="btn btn-ghost" data-action="refresh-summary">
              <span>&#8635;</span> Refresh Data
            </button>
            <button class="btn btn-ghost" data-action="export-excel">
              <span>&#128190;</span> Export Excel
            </button>
            <button class="btn btn-primary" data-view-target="transactions">
              <span>&#128179;</span> Lihat Transaksi
            </button>
          </div>
        </header>

        <div class="financial-quick-actions">
          <button class="btn btn-primary" data-view-target="grant-form">
            <span>&#43;</span> Geran Baharu
          </button>
          <button class="btn btn-success" data-view-target="funds">
            <span>&#43;</span> Tambah Dana
          </button>
          <button class="btn btn-danger" data-view-target="deduction">
            <span>&#8722;</span> Rekod Tolakan
          </button>
        </div>

        <section class="financial-dashboard active" data-view="overview">
          <div class="financial-metrics-grid">
            <article class="metric-card income">
              <div class="metric-card-top">
                <div>
                  <p class="metric-label">Jumlah Dana Diterima</p>
                  <p class="metric-value" id="${NEWEST_PREFIX}-total-received">RM 0.00</p>
                </div>
                <span class="metric-icon">&#128176;</span>
              </div>
              <p class="metric-subtext">Jumlah keseluruhan semua geran</p>
            </article>
            <article class="metric-card expense">
              <div class="metric-card-top">
                <div>
                  <p class="metric-label">Jumlah Tolakan</p>
                  <p class="metric-value" id="${NEWEST_PREFIX}-total-deductions">RM 0.00</p>
                </div>
                <span class="metric-icon">&#128184;</span>
              </div>
              <p class="metric-subtext">Jumlah penggunaan dana</p>
            </article>
            <article class="metric-card balance">
              <div class="metric-card-top">
                <div>
                  <p class="metric-label">Baki Dana Semasa</p>
                  <p class="metric-value" id="${NEWEST_PREFIX}-total-available">RM 0.00</p>
                </div>
                <span class="metric-icon">&#128200;</span>
              </div>
              <p class="metric-subtext" id="${NEWEST_PREFIX}-balance-info">Tiada data geran.</p>
            </article>
            <article class="metric-card activity">
              <div class="metric-card-top">
                <div>
                  <p class="metric-label">Geran Aktif</p>
                  <p class="metric-value" id="${NEWEST_PREFIX}-total-grants">0</p>
                </div>
                <span class="metric-icon">&#128221;</span>
              </div>
              <p class="metric-subtext" id="${NEWEST_PREFIX}-transaction-label">Tiada geran direkodkan.</p>
            </article>
          </div>

          <div class="financial-panels-grid">
            <article class="financial-panel grants-panel">
              <div class="panel-header">
                <div>
                  <p class="panel-eyebrow">Grants</p>
                  <h4>Senarai Geran</h4>
                </div>
                <button class="btn btn-outline" data-view-target="grant-form">Tambah Geran</button>
              </div>
              <div class="table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nama Geran</th>
                      <th>Jumlah Diterima</th>
                      <th>Jumlah Ditolak</th>
                      <th>Baki</th>
                      <th>Kemaskini Terakhir</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody data-role="grant-list">
                    <tr>
                      <td colspan="5" class="loading-text">Loading grants...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article class="financial-panel recent-activity-panel">
              <div class="panel-header">
                <div>
                  <p class="panel-eyebrow">Transaksi Terkini</p>
                  <h4>Aliran Dana</h4>
                </div>
                <button class="btn btn-outline" data-view-target="transactions">Lihat Semua</button>
              </div>
              <div class="recent-activity-list" data-role="recent-transactions">
                <p class="empty-text">Tiada transaksi direkodkan.</p>
              </div>
            </article>
          </div>
        </section>
        <section class="financial-layer" data-view="transactions">
          <div class="layer-panel">
            <div class="drawer-header">
              <div>
                <p class="panel-eyebrow">Transactions</p>
                <h3>Rekod Transaksi</h3>
                <p>Senarai lengkap penambahan dana dan tolakan.</p>
              </div>
              <button class="btn btn-secondary" data-view-target="overview">
                <span>&larr;</span> Tutup
              </button>
            </div>

            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tarikh</th>
                    <th>Jenis</th>
                    <th>Jumlah (RM)</th>
                    <th>Butiran</th>
                    <th>Impak Geran</th>
                  </tr>
                </thead>
                <tbody id="${NEWEST_PREFIX}-transaction-body">
                  <tr>
                    <td colspan="5" class="loading-text">Loading transactions...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="financial-drawer" data-view="grant-form">
          <div class="drawer-panel">
            <div class="drawer-header">
              <div>
                <p class="panel-eyebrow" data-role="grant-form-eyebrow">Geran Baharu</p>
                <h3 data-role="grant-form-title">Daftar Geran</h3>
                <p data-role="grant-form-desc">Masukkan butiran geran dan jumlah dana awal jika ada.</p>
              </div>
              <button class="btn btn-secondary" data-view-target="overview">
                <span>&larr;</span> Kembali
              </button>
            </div>
            <form id="${NEWEST_PREFIX}-grant-form" class="grant-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-grant-name">Nama Geran</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-grant-name" type="text" required placeholder="Contoh: Geran Operasi" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-grant-amount">Jumlah Dana Awal (RM)</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-grant-amount" type="number" min="0" step="0.01" placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-grant-date">Tarikh Terimaan</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-grant-date" type="date" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="${NEWEST_PREFIX}-grant-description">Catatan / Penerangan</label>
                <textarea class="form-textarea" id="${NEWEST_PREFIX}-grant-description" rows="3"></textarea>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-view-target="overview">Batal</button>
                <button type="submit" class="btn btn-primary" id="${NEWEST_PREFIX}-grant-submit">Simpan Geran</button>
              </div>
              <div class="form-message" id="${NEWEST_PREFIX}-grant-message" style="display:none;"></div>
            </form>
          </div>
        </section>

        <section class="financial-drawer" data-view="funds">
          <div class="drawer-panel">
            <div class="drawer-header">
              <div>
                <p class="panel-eyebrow">Dana Geran</p>
                <h3>Tambah Dana ke Geran</h3>
                <p>Pilih geran dan catat penambahan dana.</p>
              </div>
              <button class="btn btn-secondary" data-view-target="overview">
                <span>&larr;</span> Kembali
              </button>
            </div>
            <form id="${NEWEST_PREFIX}-fund-form" class="fund-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-fund-grant">Pilih Geran</label>
                  <select class="form-select" id="${NEWEST_PREFIX}-fund-grant" data-role="grant-options" required></select>
                  <div class="form-helper" data-role="fund-balance">Baki semasa: -</div>
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-fund-amount">Jumlah Dana (RM)</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-fund-amount" type="number" min="0" step="0.01" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-fund-date">Tarikh Dana</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-fund-date" type="date" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-fund-reference">Rujukan</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-fund-reference" type="text" placeholder="No. invoice / memo" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="${NEWEST_PREFIX}-fund-notes">Catatan</label>
                <textarea class="form-textarea" id="${NEWEST_PREFIX}-fund-notes" rows="3"></textarea>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-view-target="overview">Batal</button>
                <button type="submit" class="btn btn-primary" id="${NEWEST_PREFIX}-fund-submit">Rekod Dana</button>
              </div>
              <div class="form-message" id="${NEWEST_PREFIX}-fund-message" style="display:none;"></div>
            </form>
          </div>
        </section>

        <section class="financial-drawer" data-view="deduction">
          <div class="drawer-panel">
            <div class="drawer-header">
              <div>
                <p class="panel-eyebrow">Tolakan Dana</p>
                <h3>Rekod Penggunaan Dana</h3>
                <p>Pilih satu atau lebih geran untuk ditolak bagi transaksi ini.</p>
              </div>
              <button class="btn btn-secondary" data-view-target="overview">
                <span>&larr;</span> Kembali
              </button>
            </div>
            <form id="${NEWEST_PREFIX}-deduction-form" class="deduction-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-deduction-date">Tarikh Tolakan</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-deduction-date" type="date" required />
                </div>
                <div class="form-group">
                  <label class="form-label" for="${NEWEST_PREFIX}-deduction-reference">Rujukan</label>
                  <input class="form-input" id="${NEWEST_PREFIX}-deduction-reference" type="text" placeholder="No. invoice / memo" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Butiran Geran &amp; Jumlah Tolakan</label>
                <div data-role="deduction-rows" class="deduction-rows"></div>
                <button type="button" class="btn btn-outline" data-action="add-deduction-row">
                  + Tambah Geran
                </button>
              </div>

              <div class="form-group">
                <label class="form-label" for="${NEWEST_PREFIX}-deduction-notes">Catatan</label>
                <textarea class="form-textarea" id="${NEWEST_PREFIX}-deduction-notes" rows="3"></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" data-view-target="overview">Batal</button>
                <button type="submit" class="btn btn-primary" id="${NEWEST_PREFIX}-deduction-submit">Rekod Tolakan</button>
              </div>
              <div class="form-message" id="${NEWEST_PREFIX}-deduction-message" style="display:none;"></div>
            </form>
          </div>
        </section>
      </div>
    `;
  }
  async initialize() {
    this.root = document.getElementById('financial-tracking-newest-content');
    if (!this.root) {
      console.error('FinancialTrackingNewest: container not found');
      return;
    }
    this.cacheDom();
    this.setupNavigation();
    this.setupActions();
    this.setupForms();
    this.setGrantFormMode('create');
    this.setupDeductionControls();
    await this.refreshAllData();
  }

  cacheDom() {
    this.root.querySelectorAll('[data-view]').forEach(section => {
      this.sections[section.dataset.view] = section;
    });

    this.forms.grant = this.root.querySelector(`#${NEWEST_PREFIX}-grant-form`);
    this.forms.fund = this.root.querySelector(`#${NEWEST_PREFIX}-fund-form`);
    this.forms.deduction = this.root.querySelector(`#${NEWEST_PREFIX}-deduction-form`);

    this.summaryEls.received = this.root.querySelector(`#${NEWEST_PREFIX}-total-received`);
    this.summaryEls.deductions = this.root.querySelector(`#${NEWEST_PREFIX}-total-deductions`);
    this.summaryEls.available = this.root.querySelector(`#${NEWEST_PREFIX}-total-available`);
    this.summaryEls.grants = this.root.querySelector(`#${NEWEST_PREFIX}-total-grants`);
    this.summaryEls.info = this.root.querySelector(`#${NEWEST_PREFIX}-balance-info`);
    this.summaryEls.transactionLabel = this.root.querySelector(`#${NEWEST_PREFIX}-transaction-label`);

    this.containers.grantList = this.root.querySelector('[data-role="grant-list"]');
    this.containers.recentTransactions = this.root.querySelector('[data-role="recent-transactions"]');
    this.containers.deductionRows = this.root.querySelector('[data-role="deduction-rows"]');

    this.tables.transactionBody = this.root.querySelector(`#${NEWEST_PREFIX}-transaction-body`);

    this.messages.grant = this.root.querySelector(`#${NEWEST_PREFIX}-grant-message`);
    this.messages.fund = this.root.querySelector(`#${NEWEST_PREFIX}-fund-message`);
    this.messages.deduction = this.root.querySelector(`#${NEWEST_PREFIX}-deduction-message`);

    this.buttons.grantSubmit = this.root.querySelector(`#${NEWEST_PREFIX}-grant-submit`);
    this.buttons.fundSubmit = this.root.querySelector(`#${NEWEST_PREFIX}-fund-submit`);
    this.buttons.deductionSubmit = this.root.querySelector(`#${NEWEST_PREFIX}-deduction-submit`);

    this.labels.grantEyebrow = this.root.querySelector('[data-role="grant-form-eyebrow"]');
    this.labels.grantTitle = this.root.querySelector('[data-role="grant-form-title"]');
    this.labels.grantDescription = this.root.querySelector('[data-role="grant-form-desc"]');
    this.labels.fundBalance = this.root.querySelector('[data-role="fund-balance"]');
  }

  setupNavigation() {
    const triggers = this.root.querySelectorAll('[data-view-target]');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', event => {
        event.preventDefault();
        this.showSection(trigger.getAttribute('data-view-target'));
      });
    });
  }

  showSection(view) {
    if (!this.sections[view]) {
      return;
    }

    const isDrawerView = DRAWER_VIEWS.includes(view);

    if (isDrawerView) {
      Object.entries(this.sections).forEach(([key, section]) => {
        if (DRAWER_VIEWS.includes(key)) {
          section.classList.toggle('active', key === view);
        } else {
          section.classList.toggle('active', key === 'overview');
        }
      });
    } else {
      DRAWER_VIEWS.forEach(key => {
        if (this.sections[key]) {
          this.sections[key].classList.remove('active');
        }
      });
      Object.entries(this.sections).forEach(([key, section]) => {
        section.classList.toggle('active', key === view);
      });
    }

    if (view === 'grant-form') {
      if (this.forms.grant && this.forms.grant.dataset.mode !== 'edit') {
        this.setGrantFormMode('create');
      }
    } else if (this.forms.grant && this.forms.grant.dataset.mode === 'edit') {
      this.setGrantFormMode('create');
    }
    if (view === 'transactions') {
      this.renderTransactionsTable(this.state.transactions);
    }
  }

  setupActions() {
    this.root.addEventListener('click', event => {
      const target = event.target.closest('[data-action]');
      if (!target || !this.root.contains(target)) {
        return;
      }
      const action = target.getAttribute('data-action');
      if (!action) {
        return;
      }
      event.preventDefault();
      this.handleAction(action, target);
    });
  }

  handleAction(action, target) {
    if (action === 'refresh-summary') {
      this.refreshAllData();
      return;
    }
    if (action === 'export-excel') {
      this.exportToExcel();
      return;
    }
    if (action === 'add-deduction-row') {
      this.addDeductionRow();
      return;
    }
    if (action === 'edit-grant') {
      this.startGrantEdit(target?.getAttribute('data-grant-id'));
      return;
    }
    if (action === 'delete-grant') {
      this.handleGrantDelete(target?.getAttribute('data-grant-id'));
      return;
    }
  }

  setupForms() {
    if (this.forms.grant && !this.forms.grant.dataset.listenersAttached) {
      this.forms.grant.addEventListener('submit', event => {
        event.preventDefault();
        this.handleGrantSubmit();
      });
      this.forms.grant.dataset.listenersAttached = 'true';
    }

    if (this.forms.fund && !this.forms.fund.dataset.listenersAttached) {
      this.forms.fund.addEventListener('submit', event => {
        event.preventDefault();
        this.handleFundSubmit();
      });
      const fundGrantSelect = this.root.querySelector(`#${NEWEST_PREFIX}-fund-grant`);
      if (fundGrantSelect) {
        fundGrantSelect.addEventListener('change', () => this.updateFundBalanceDisplay());
      }
      this.forms.fund.dataset.listenersAttached = 'true';
    }

    if (this.forms.deduction && !this.forms.deduction.dataset.listenersAttached) {
      this.forms.deduction.addEventListener('submit', event => {
        event.preventDefault();
        this.handleDeductionSubmit();
      });
      this.forms.deduction.dataset.listenersAttached = 'true';
    }
  }

  setupDeductionControls() {
    if (!this.containers.deductionRows) {
      return;
    }
    this.containers.deductionRows.innerHTML = '';
    this.deductionRowIndex = 0;
    this.addDeductionRow();
  }

  updateFundBalanceDisplay() {
    const balanceLabel = this.labels.fundBalance;
    if (!balanceLabel) return;
    const select = this.root.querySelector(`#${NEWEST_PREFIX}-fund-grant`);
    const grant = this.state.grants.find(item => item.id === select?.value);
    if (!grant) {
      balanceLabel.textContent = 'Baki semasa: -';
      return;
    }
    const available = Number(grant.availableAmount) || 0;
    balanceLabel.textContent = `Baki semasa: ${this.formatCurrency(available)}`;
  }

  setGrantFormMode(mode, grant = null) {
    const form = this.forms.grant;
    if (!form) return;
    form.dataset.mode = mode;
    form.dataset.grantId = grant?.id || '';

    const nameInput = document.getElementById(`${NEWEST_PREFIX}-grant-name`);
    const amountInput = document.getElementById(`${NEWEST_PREFIX}-grant-amount`);
    const dateInput = document.getElementById(`${NEWEST_PREFIX}-grant-date`);
    const descInput = document.getElementById(`${NEWEST_PREFIX}-grant-description`);

    if (mode === 'edit' && grant) {
      if (this.labels.grantEyebrow) {
        this.labels.grantEyebrow.textContent = 'Edit Geran';
      }
      if (this.labels.grantTitle) {
        this.labels.grantTitle.textContent = 'Kemas Kini Geran';
      }
      if (this.labels.grantDescription) {
        this.labels.grantDescription.textContent = 'Tukar maklumat geran. Untuk tambah dana guna borang Tambah Dana.';
      }
      if (this.buttons.grantSubmit) {
        this.buttons.grantSubmit.textContent = 'Simpan Perubahan';
      }
      if (nameInput) {
        nameInput.value = grant.name || '';
      }
      if (descInput) {
        descInput.value = grant.description || '';
      }
      if (amountInput) {
        amountInput.value = '';
        amountInput.disabled = true;
        amountInput.placeholder = 'Guna Tambah Dana untuk dana baharu';
      }
      if (dateInput) {
        dateInput.value = '';
      }
    } else {
      if (this.labels.grantEyebrow) {
        this.labels.grantEyebrow.textContent = 'Geran Baharu';
      }
      if (this.labels.grantTitle) {
        this.labels.grantTitle.textContent = 'Daftar Geran';
      }
      if (this.labels.grantDescription) {
        this.labels.grantDescription.textContent = 'Masukkan butiran geran dan jumlah dana awal jika ada.';
      }
      if (this.buttons.grantSubmit) {
        this.buttons.grantSubmit.textContent = 'Simpan Geran';
      }
      if (nameInput) {
        nameInput.value = '';
      }
      if (descInput) {
        descInput.value = '';
      }
      if (amountInput) {
        amountInput.value = '';
        amountInput.disabled = false;
        amountInput.placeholder = '0.00';
      }
      if (dateInput) {
        dateInput.value = '';
      }
      form.dataset.mode = 'create';
      form.dataset.grantId = '';
    }
  }

  addDeductionRow(defaults = {}) {
    if (!this.containers.deductionRows) {
      return;
    }
    this.deductionRowIndex += 1;
    const row = document.createElement('div');
    row.className = 'deduction-row';
    row.dataset.rowId = `${NEWEST_PREFIX}-deduction-row-${this.deductionRowIndex}`;
    row.innerHTML = `
      <div class="deduction-row-main">
        <select class="form-select" data-field="grant" data-role="grant-options" required></select>
        <input class="form-input" data-field="amount" type="number" min="0" step="0.01" placeholder="Jumlah" required />
        <button type="button" class="btn btn-danger" data-action="remove-deduction-row">&#10005;</button>
      </div>
      <div class="deduction-row-meta">
        <span data-field="balance-info">Baki semasa: -</span>
      </div>
    `;
    this.containers.deductionRows.appendChild(row);
    const select = row.querySelector('[data-role="grant-options"]');
    const amountInput = row.querySelector('[data-field="amount"]');
    this.populateGrantSelect(select);
    if (defaults.grantId) {
      select.value = defaults.grantId;
    }
    if (defaults.amount) {
      amountInput.value = defaults.amount;
    }
    this.updateDeductionRowInfo(row);
    select.addEventListener('change', () => this.updateDeductionRowInfo(row));
    amountInput.addEventListener('input', () => {
      this.ensureNonNegative(amountInput);
      this.updateDeductionRowInfo(row);
    });
    row.querySelector('[data-action="remove-deduction-row"]').addEventListener('click', () => {
      if (this.containers.deductionRows.children.length > 1) {
        row.remove();
      }
    });
  }

  updateAllDeductionRowInfo() {
    if (!this.containers.deductionRows) return;
    Array.from(this.containers.deductionRows.querySelectorAll('.deduction-row')).forEach(row =>
      this.updateDeductionRowInfo(row)
    );
  }

  updateDeductionRowInfo(row) {
    if (!row) return;
    const select = row.querySelector('[data-field="grant"]');
    const amountInput = row.querySelector('[data-field="amount"]');
    const balanceEl = row.querySelector('[data-field="balance-info"]');
    const grant = this.state.grants.find(item => item.id === select?.value);
    let amount = 0;
    if (amountInput) {
      if (Number.isFinite(amountInput.valueAsNumber)) {
        amount = amountInput.valueAsNumber;
      } else {
        const sanitized = (amountInput.value || '').replace(/,/g, '');
        amount = parseFloat(sanitized);
        if (!Number.isFinite(amount)) {
          amount = 0;
        }
      }
    }

    if (!grant) {
      if (balanceEl) balanceEl.textContent = 'Baki semasa: -';
      return;
    }

    const available = Number(grant.availableAmount) || 0;

    if (balanceEl) {
      balanceEl.textContent = `Baki semasa: ${this.formatCurrency(available)}`;
    }
  }
  async refreshAllData() {
    const [grantsResult, transactionsResult] = await Promise.allSettled([
      this.fetchGrants(),
      this.fetchTransactions()
    ]);

    if (grantsResult.status === 'fulfilled') {
      this.state.grants = grantsResult.value;
    } else {
      console.error('FinancialTrackingNewest: grants load failed', grantsResult.reason);
      this.state.grants = [];
    }

    if (transactionsResult.status === 'fulfilled') {
      this.state.transactions = transactionsResult.value;
    } else {
      console.error('FinancialTrackingNewest: transactions load failed', transactionsResult.reason);
      this.state.transactions = [];
    }

    this.updateMetrics();
    this.renderGrantTable();
    this.renderTransactionsPreview();
    this.renderTransactionsTable(this.state.transactions);
    this.populateGrantSelects(true);
  }

  async fetchGrants() {
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.FINANCIAL_GRANTS), createEnvFilter()));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const totalAmount = Number(data.totalAmount) || 0;
      const availableAmount = Number(data.availableAmount ?? totalAmount);
      return {
        id: doc.id,
        name: data.name || 'Tanpa Nama',
        description: data.description || '',
        totalAmount,
        availableAmount,
        deducted: Math.max(totalAmount - availableAmount, 0),
        updatedAt: data.updatedAt ? this.normalizeDate(data.updatedAt) : null
      };
    });
  }

  startGrantEdit(grantId) {
    if (!grantId) return;
    const grant = this.state.grants.find(item => item.id === grantId);
    if (!grant) {
      alert('Geran tidak ditemui.');
      return;
    }
    this.setGrantFormMode('edit', grant);
    this.showSection('grant-form');
  }

  async handleGrantDelete(grantId) {
    if (!grantId) return;
    const grant = this.state.grants.find(item => item.id === grantId);
    if (!grant) {
      alert('Geran tidak ditemui.');
      return;
    }
    const inUse = this.state.transactions.some(txn =>
      (txn.grantImpacts || []).some(impact => impact.grantId === grantId)
    );
    if (inUse) {
      alert('Geran ini mempunyai transaksi. Padam tidak dibenarkan.');
      return;
    }
    const confirmed = window.confirm(`Padam geran "${grant.name}"? Tindakan ini tidak boleh diundurkan.`);
    if (!confirmed) return;
    try {
      await this.deleteGrant(grantId);
      alert('Geran dipadam.');
      if (this.forms.grant?.dataset.grantId === grantId) {
        this.setGrantFormMode('create');
      }
      await this.refreshAllData();
    } catch (error) {
      console.error('FinancialTrackingNewest: delete grant failed', error);
      alert(error.message || 'Gagal memadam geran.');
    }
  }

  async deleteGrant(grantId) {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS } = await import('../../services/database/collections.js');
    await deleteDoc(doc(db, COLLECTIONS.FINANCIAL_GRANTS, grantId));
  }

  async fetchTransactions() {
    const { collection, getDocs, query } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, createEnvFilter } = await import('../../services/database/collections.js');
    const snapshot = await getDocs(query(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS), createEnvFilter()));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const date = this.normalizeDate(data.date || data.createdAt);
      return {
        id: doc.id,
        type: data.type || 'grant-addition',
        amount: Number(data.amount) || 0,
        description: data.description || '',
        reference: data.reference || '',
        grantImpacts: Array.isArray(data.grantImpacts) ? data.grantImpacts : [],
        date,
        isoDate: this.formatDate(date, 'iso'),
        displayDate: this.formatDate(date, 'display')
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  updateMetrics() {
    const totals = { received: 0, deducted: 0, available: 0, grantCount: this.state.grants.length };
    totals.received = this.state.grants.reduce((sum, grant) => sum + (grant.totalAmount || 0), 0);
    totals.available = this.state.grants.reduce((sum, grant) => sum + (grant.availableAmount || 0), 0);
    totals.deducted = Math.max(totals.received - totals.available, 0);
    this.state.totals = totals;
    if (this.summaryEls.received) {
      this.summaryEls.received.textContent = this.formatCurrency(totals.received);
    }
    if (this.summaryEls.deductions) {
      this.summaryEls.deductions.textContent = this.formatCurrency(totals.deducted);
    }
    if (this.summaryEls.available) {
      this.summaryEls.available.textContent = this.formatCurrency(totals.available);
    }
    if (this.summaryEls.grants) {
      this.summaryEls.grants.textContent = `${totals.grantCount}`;
    }
    if (this.summaryEls.info) {
      this.summaryEls.info.textContent = totals.grantCount
        ? `Baki sebanyak ${this.formatCurrency(totals.available)}`
        : 'Tiada data geran.';
    }
    if (this.summaryEls.transactionLabel) {
      this.summaryEls.transactionLabel.textContent = this.state.transactions.length
        ? `${this.state.transactions.length} transaksi direkodkan`
        : 'Tiada transaksi direkodkan.';
    }
  }

  renderGrantTable() {
    const container = this.containers.grantList;
    if (!container) {
      return;
    }
    if (!this.state.grants.length) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="empty-text">Tiada geran direkodkan.</td>
        </tr>
      `;
      return;
    }
    container.innerHTML = this.state.grants
      .map(grant => `
        <tr>
          <td>
            <div class="grant-name">${this.escapeHtml(grant.name)}</div>
            <small>${this.escapeHtml(grant.description)}</small>
          </td>
          <td>${this.formatCurrency(grant.totalAmount)}</td>
          <td>${this.formatCurrency(grant.deducted)}</td>
          <td>${this.formatCurrency(grant.availableAmount)}</td>
          <td>${grant.updatedAt ? this.formatDate(grant.updatedAt, 'display') : '-'}</td>
          <td class="grant-actions">
            <button class="btn btn-secondary btn-sm" data-action="edit-grant" data-grant-id="${grant.id}">Edit</button>
            <button class="btn btn-danger btn-sm" data-action="delete-grant" data-grant-id="${grant.id}">Padam</button>
          </td>
        </tr>
      `)
      .join('');
  }

  renderTransactionsPreview() {
    const container = this.containers.recentTransactions;
    if (!container) {
      return;
    }
    const subset = [...this.state.transactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
    if (!subset.length) {
      container.innerHTML = '<p class="empty-text">Tiada transaksi direkodkan.</p>';
      return;
    }
    container.innerHTML = subset
      .map(item => {
        const typeLabel = item.type === 'deduction' ? 'Tolakan' : 'Penambahan';
        const badgeClass = item.type === 'deduction' ? 'negative' : 'positive';
        const grantSummary = item.grantImpacts
          .map(impact => `${this.escapeHtml(impact.grantName || 'Geran')}: ${this.formatCurrency(impact.amount)}`)
          .join('<br>');
        return `
          <div class="recent-transaction-item">
            <div>
              <p class="recent-title">${this.escapeHtml(item.description || typeLabel)}</p>
              <p class="recent-meta">${item.displayDate}${item.reference ? ' · ' + this.escapeHtml(item.reference) : ''}</p>
              <p class="recent-meta">${grantSummary}</p>
            </div>
            <div class="recent-amount ${item.type}">
              <span class="status-badge ${badgeClass}">${typeLabel}</span>
              <span class="amount-text">${this.formatCurrency(item.amount)}</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  renderTransactionsTable(transactions) {
    const body = this.tables.transactionBody;
    if (!body) {
      return;
    }
    if (!transactions.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5" class="empty-text">Tiada transaksi direkodkan.</td>
        </tr>
      `;
      return;
    }
    body.innerHTML = transactions
      .map(item => {
        const typeLabel = item.type === 'deduction' ? 'Tolakan' : 'Penambahan';
        const badgeClass = item.type === 'deduction' ? 'negative' : 'positive';
        const grantDetails = item.grantImpacts
          .map(impact => `${this.escapeHtml(impact.grantName || 'Geran')} (${this.formatCurrency(impact.amount)})`)
          .join('<br>');
        return `
          <tr>
            <td>${item.displayDate}</td>
            <td><span class="status-badge ${badgeClass}">${typeLabel}</span></td>
            <td>${this.formatCurrency(item.amount)}</td>
            <td>
              <div>${this.escapeHtml(item.description || '-')}</div>
              <small>${this.escapeHtml(item.reference || '')}</small>
            </td>
            <td>${grantDetails || '-'}</td>
          </tr>
        `;
      })
      .join('');
  }
  populateGrantSelects(updateInfo = false) {
    const selects = this.root.querySelectorAll('[data-role="grant-options"]');
    selects.forEach(select => this.populateGrantSelect(select));
    this.updateFundBalanceDisplay();
    if (updateInfo) {
      this.updateAllDeductionRowInfo();
    }
  }

  populateGrantSelect(select) {
    if (!select) return;
    const currentValue = select.value;
    if (!this.state.grants.length) {
      select.innerHTML = '<option value="">Tiada geran tersedia</option>';
      select.value = '';
      return;
    }
    const options = ['<option value="">Pilih Geran</option>',
      ...this.state.grants.map(grant => `<option value="${grant.id}">${this.escapeHtml(grant.name)}</option>`)
    ];
    select.innerHTML = options.join('');
    if (this.state.grants.some(grant => grant.id === currentValue)) {
      select.value = currentValue;
    }
  }

  async handleGrantSubmit() {
    const name = this.getFieldValue(`${NEWEST_PREFIX}-grant-name`);
    const description = this.getFieldValue(`${NEWEST_PREFIX}-grant-description`);
    const amount = Number(this.getFieldValue(`${NEWEST_PREFIX}-grant-amount`)) || 0;
    const date = this.getFieldValue(`${NEWEST_PREFIX}-grant-date`);
    const isEdit = this.forms.grant?.dataset.mode === 'edit';
    const grantId = this.forms.grant?.dataset.grantId;
    if (!name) {
      this.setFormMessage('grant', 'Nama geran diperlukan.', 'error');
      return;
    }
    if (isEdit && !grantId) {
      this.setFormMessage('grant', 'Geran tidak ditemui untuk dikemas kini.', 'error');
      return;
    }
    this.setSubmitState('grant', true);
    try {
      if (isEdit) {
        await this.updateGrant(grantId, { name, description });
        this.setFormMessage('grant', 'Geran berjaya dikemas kini.', 'success');
      } else {
        await this.createGrant({ name, description, amount, date });
        this.setFormMessage('grant', 'Geran berjaya direkodkan.', 'success');
      }
      this.resetForm('grant');
      await this.refreshAllData();
      this.showSection('overview');
    } catch (error) {
      console.error(
        `FinancialTrackingNewest: ${isEdit ? 'update grant' : 'create grant'} failed`,
        error
      );
      this.setFormMessage('grant', error.message || 'Gagal merekod geran', 'error');
    } finally {
      this.setSubmitState('grant', false);
    }
  }

  async createGrant({ name, description, amount, date }) {
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    const now = new Date();
    const grantDoc = await addDoc(
      collection(db, COLLECTIONS.FINANCIAL_GRANTS),
      addStandardFields({
        name,
        description,
        totalAmount: amount,
        availableAmount: amount,
        createdAt: now,
        updatedAt: now
      })
    );
    if (amount > 0) {
      await this.logTransactionRecord('grant-addition', amount, {
        description: description || `Dana awal untuk ${name}`,
        reference: 'Initial Grant Allocation',
        date,
        impacts: [{ grantId: grantDoc.id, grantName: name, amount }]
      });
    }
  }

  async updateGrant(grantId, { name, description }) {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS } = await import('../../services/database/collections.js');
    await updateDoc(doc(db, COLLECTIONS.FINANCIAL_GRANTS, grantId), {
      name,
      description,
      updatedAt: new Date()
    });
  }

  async handleFundSubmit() {
    const grantId = this.getFieldValue(`${NEWEST_PREFIX}-fund-grant`);
    const amount = Number(this.getFieldValue(`${NEWEST_PREFIX}-fund-amount`));
    const date = this.getFieldValue(`${NEWEST_PREFIX}-fund-date`);
    const reference = this.getFieldValue(`${NEWEST_PREFIX}-fund-reference`);
    const notes = this.getFieldValue(`${NEWEST_PREFIX}-fund-notes`);
    if (!grantId) {
      this.setFormMessage('fund', 'Sila pilih geran.', 'error');
      return;
    }
    if (!amount || amount <= 0) {
      this.setFormMessage('fund', 'Jumlah dana mesti melebihi 0.', 'error');
      return;
    }
    if (!date) {
      this.setFormMessage('fund', 'Tarikh dana diperlukan.', 'error');
      return;
    }
    this.setSubmitState('fund', true);
    try {
      await this.addGrantFunds({ grantId, amount, date, reference, notes });
      this.setFormMessage('fund', 'Dana berjaya ditambah.', 'success');
      this.resetForm('fund');
      await this.refreshAllData();
      this.showSection('overview');
    } catch (error) {
      console.error('FinancialTrackingNewest: add funds failed', error);
      this.setFormMessage('fund', error.message || 'Gagal menambah dana.', 'error');
    } finally {
      this.setSubmitState('fund', false);
    }
  }

  async addGrantFunds({ grantId, amount, date, reference, notes }) {
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    const { doc, collection, runTransaction } = await import('firebase/firestore');
    await runTransaction(db, async transaction => {
      const grantRef = doc(db, COLLECTIONS.FINANCIAL_GRANTS, grantId);
      const grantSnap = await transaction.get(grantRef);
      if (!grantSnap.exists()) {
        throw new Error('Geran tidak ditemui.');
      }
      const data = grantSnap.data();
      const totalAmount = Number(data.totalAmount) + amount;
      const availableAmount = Number(data.availableAmount ?? data.totalAmount) + amount;
      transaction.update(grantRef, {
        totalAmount,
        availableAmount,
        updatedAt: new Date()
      });
      const txnRef = doc(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS));
      transaction.set(
        txnRef,
        addStandardFields({
          type: 'grant-addition',
          amount,
        date: new Date(),
          description: notes || `Dana baharu untuk ${data.name}`,
          reference,
          grantImpacts: [{ grantId, grantName: data.name || 'Geran', amount }],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });
  }

  async handleDeductionSubmit() {
    const date = this.getFieldValue(`${NEWEST_PREFIX}-deduction-date`);
    const reference = this.getFieldValue(`${NEWEST_PREFIX}-deduction-reference`);
    const notes = this.getFieldValue(`${NEWEST_PREFIX}-deduction-notes`);
    const rows = this.collectDeductionRows();
    if (!date) {
      this.setFormMessage('deduction', 'Tarikh tolakan diperlukan.', 'error');
      return;
    }
    if (!rows.length) {
      this.setFormMessage('deduction', 'Sila tambah sekurang-kurangnya satu geran.', 'error');
      return;
    }
    const invalid = rows.some(row => !row.grantId || row.amount <= 0);
    if (invalid) {
      this.setFormMessage('deduction', 'Setiap geran mesti mempunyai jumlah sah.', 'error');
      return;
    }
    this.setSubmitState('deduction', true);
    try {
      await this.recordDeduction({ date, reference, notes, rows });
      this.setFormMessage('deduction', 'Tolakan direkodkan.', 'success');
      this.resetForm('deduction');
      this.setupDeductionControls();
      await this.refreshAllData();
      this.showSection('overview');
    } catch (error) {
      console.error('FinancialTrackingNewest: deduction failed', error);
      this.setFormMessage('deduction', error.message || 'Gagal merekod tolakan.', 'error');
    } finally {
      this.setSubmitState('deduction', false);
    }
  }

  collectDeductionRows() {
    if (!this.containers.deductionRows) {
      return [];
    }
    return Array.from(this.containers.deductionRows.querySelectorAll('.deduction-row')).map(row => {
      const grantId = row.querySelector('[data-field="grant"]').value;
      const amount = Number(row.querySelector('[data-field="amount"]').value);
      return { grantId, amount };
    }).filter(row => row.grantId && row.amount > 0);
  }

  async recordDeduction({ date, reference, notes, rows }) {
    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
    if (totalAmount <= 0) {
      throw new Error('Jumlah tolakan mesti melebihi 0.');
    }
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    const { doc, collection, runTransaction } = await import('firebase/firestore');
    await runTransaction(db, async transaction => {
      const impacts = [];
      for (const row of rows) {
        const grantRef = doc(db, COLLECTIONS.FINANCIAL_GRANTS, row.grantId);
        const grantSnap = await transaction.get(grantRef);
        if (!grantSnap.exists()) {
          throw new Error('Geran tidak ditemui.');
        }
        const grantData = grantSnap.data();
        const available = Number(grantData.availableAmount ?? grantData.totalAmount) - row.amount;
        if (available < 0) {
          throw new Error(`Baki ${grantData.name} tidak mencukupi.`);
        }
        transaction.update(grantRef, {
          availableAmount: available,
          updatedAt: new Date()
        });
        impacts.push({ grantId: row.grantId, grantName: grantData.name || 'Geran', amount: row.amount });
      }
      const txnRef = doc(collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS));
      transaction.set(
        txnRef,
        addStandardFields({
          type: 'deduction',
          amount: totalAmount,
          date: date ? new Date(date) : new Date(),
          description: notes || 'Tolakan dana',
          reference,
          grantImpacts: impacts,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });
  }

  async logTransactionRecord(type, amount, { description, reference, date, impacts }) {
    const { collection, addDoc } = await import('firebase/firestore');
    const { db } = await import('../../services/database/firebase.js');
    const { COLLECTIONS, addStandardFields } = await import('../../services/database/collections.js');
    await addDoc(
      collection(db, COLLECTIONS.FINANCIAL_TRANSACTIONS),
      addStandardFields({
        type,
        amount,
        description,
        reference,
        date: new Date(),
        grantImpacts: impacts,
        createdAt: date ? new Date(date) : new Date(),
        updatedAt: new Date()
      })
    );
  }
  setFormMessage(key, message, type) {
    const element = this.messages[key];
    if (!element) return;
    element.className = `form-message ${type}`;
    element.textContent = message;
    element.style.display = 'block';
    window.setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  resetForm(key) {
    const form = this.forms[key];
    if (form) {
      form.reset();
      if (key === 'grant') {
        this.setGrantFormMode('create');
      } else if (key === 'fund') {
        this.updateFundBalanceDisplay();
      }
    }
  }

  setSubmitState(key, saving) {
    const button = this.buttons[`${key}Submit`];
    if (!button) return;
    if (saving) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Menyimpan...';
    } else {
      button.disabled = false;
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  getFieldValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  escapeHtml(text = '') {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatCurrency(value) {
    const amount = Number.isFinite(value) ? value : 0;
    return `RM ${amount.toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  formatDate(date, mode) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return mode === 'iso' ? '' : '-';
    }
    if (mode === 'iso') {
      return date.toISOString().split('T')[0];
    }
    return date.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  normalizeDate(value) {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }
    if (value.seconds) {
      return new Date(value.seconds * 1000);
    }
    return new Date();
  }

  async exportToExcel() {
    if (!this.state.grants.length && !this.state.transactions.length) {
      alert('Tiada data untuk dieksport.');
      return;
    }
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const grantsSheetData = [
        ['Nama Geran', 'Penerangan', 'Jumlah Diterima', 'Jumlah Ditolak', 'Baki', 'Kemaskini Terakhir']
      ];
      this.state.grants.forEach(grant => {
        grantsSheetData.push([
          grant.name,
          grant.description || '-',
          grant.totalAmount,
          grant.deducted,
          grant.availableAmount,
          grant.updatedAt ? this.formatDate(grant.updatedAt, 'iso') : ''
        ]);
      });
      const grantsSheet = XLSX.utils.aoa_to_sheet(grantsSheetData);
      XLSX.utils.book_append_sheet(workbook, grantsSheet, 'Grants');

      const transactionsSheetData = [
        ['Tarikh', 'Jenis', 'Jumlah', 'Butiran', 'Rujukan', 'Impak Geran']
      ];
      this.state.transactions.forEach(item => {
        const impactText = item.grantImpacts
          .map(impact => `${impact.grantName}: ${impact.amount}`)
          .join('; ');
        transactionsSheetData.push([
          item.isoDate,
          item.type,
          item.amount,
          item.description,
          item.reference,
          impactText
        ]);
      });
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsSheetData);
      XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

      const filename = `emas-financial-tracker-${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('FinancialTrackingNewest: export failed', error);
      alert('Gagal mengeksport fail.');
    }
  }
}

window.financialTrackingNewest = null;
