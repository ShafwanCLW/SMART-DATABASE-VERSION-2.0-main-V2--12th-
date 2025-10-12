// KIR Profile component for viewing and editing individual KIR records
import { KIRService } from '../../services/backend/KIRService.js';
import { AIRService } from '../../services/backend/AIRService.js';
import { PasanganService } from '../../services/backend/PasanganService.js';
import { ProgramService } from '../../services/backend/ProgramService.js';

export class KIRProfile {
  constructor() {
    this.kirId = null;
    this.kirData = null;
    this.relatedData = null;
    this.currentTab = 'maklumat-asas';
    this.dirtyTabs = new Set();
    this.isLoading = false;
    this.validTabs = ['maklumat-asas', 'kafa', 'pendidikan', 'pekerjaan', 'kekeluargaan', 'kesihatan', 'pendapatan', 'perbelanjaan', 'bantuan-bulanan', 'air', 'pkir', 'program'];
    
    // Initialize services
    this.kirService = KIRService;
    this.airService = AIRService;
    this.pasanganService = PasanganService;
    this.programService = ProgramService;
    
    // Initialize financial data arrays
    this.pendapatanData = [];
    this.perbelanjaanData = [];
    this.bantuanBulananData = [];
    
    // AIR-related properties
    this.airData = [];
    this.isDrawerOpen = false;
    this.currentAIR = null;
    this.currentDrawerTab = 'maklumat-asas';
    this.drawerDirtyTabs = new Set();
    this.validDrawerTabs = ['maklumat-asas', 'pendidikan', 'pekerjaan', 'kesihatan'];
    
    // PKIR-related properties
    this.pkirData = null;
    this.currentPKIRSection = 'maklumat-asas';
    this.pkirDirtyTabs = new Set();
    this.validPKIRSections = ['maklumat-asas', 'kafa', 'pendidikan', 'pekerjaan', 'kesihatan'];
    this.isPKIRModalOpen = false;
    this.duplicateKIRWarning = null;
    
    // Kesihatan KIR-related properties
    this.currentKesihatanSection = 'ringkasan';
    this.kesihatanDirtyTabs = new Set();
    this.validKesihatanSections = ['ringkasan', 'ubat-tetap', 'rawatan', 'pembedahan'];
  }

  // Initialize KIR Profile with kirId and optional tab
  async init(kirId, tab = 'maklumat-asas') {
    // Validate kirId
    if (!kirId || kirId === 'null' || kirId === 'undefined' || kirId.trim() === '') {
      console.error('Invalid KIR ID provided:', kirId);
      this.showToast('KIR ID tidak sah. Mengalihkan ke dashboard admin.', 'error');
      setTimeout(() => {
        window.location.hash = '#/admin';
      }, 2000);
      return;
    }
    
    this.kirId = kirId;
    this.currentTab = this.validTabs.includes(tab) ? tab : 'maklumat-asas';
    
    // Update URL without reload
    this.updateURL();
    
    // Load KIR data
    await this.loadKIRData();
    
    // Render the component
    this.render();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  // Update URL with current tab
  updateURL() {
    // Ensure kirId is preserved and valid
    if (!this.kirId || this.kirId === 'null' || this.kirId === 'undefined') {
      console.error('Cannot update URL: Invalid KIR ID', this.kirId);
      return;
    }
    
    const url = `/admin/kir/${this.kirId}?tab=${this.currentTab}`;
    window.history.replaceState(null, '', `#${url}`);
  }

  // Load KIR data from service
  async loadKIRData() {
    try {
      this.isLoading = true;
      this.showLoadingState();
      
      // Load main KIR data (which already includes related documents)
      const kirDataWithRelated = await KIRService.getKIRById(this.kirId);
      
      if (!kirDataWithRelated) {
        this.showNotFoundState();
        return;
      }
      
      // Extract related data from the combined response (handle undefined/null values)
      const relatedData = {
        kafa: kirDataWithRelated.kafa || {},
        pendidikan: kirDataWithRelated.pendidikan || {},
        pekerjaan: kirDataWithRelated.pekerjaan || {},
        kesihatan: kirDataWithRelated.kesihatan || {}
      };
      
      // Extract main KIR data (remove related data properties)
      const kirData = { ...kirDataWithRelated };
      delete kirData.kafa;
      delete kirData.pendidikan;
      delete kirData.pekerjaan;
      delete kirData.kesihatan;
      
      // Load AIR data and PKIR data
      const [airData, pkirData] = await Promise.all([
        this.loadAIRData(),
        this.loadPKIRData()
      ]);
      
      this.kirData = kirData;
      this.relatedData = relatedData;
      this.airData = airData || [];
      this.pkirData = pkirData;
      
      // Render the UI with loaded data
      this.render();
      
    } catch (error) {
      console.error('Error loading KIR data:', error);
      this.showErrorState(error);
    } finally {
      this.isLoading = false;
    }
  }

  // Load AIR data for this KIR
  async loadAIRData() {
    try {
      if (!this.kirId) {
        console.warn('Cannot load AIR data: KIR ID is not available');
        return [];
      }
      return await AIRService.listAIR(this.kirId);
    } catch (error) {
      console.error('Error loading AIR data:', error);
      return [];
    }
  }

  // Load PKIR data for this KIR
  async loadPKIRData() {
    try {
      if (!this.kirId) {
        console.warn('Cannot load PKIR data: KIR ID is not available');
        return null;
      }
      return await PasanganService.getPKIRByKirId(this.kirId);
    } catch (error) {
      console.error('Error loading PKIR data:', error);
      return null;
    }
  }

  // Show loading skeleton
  showLoadingState() {
    const container = document.getElementById('kir-profile-container');
    if (container) {
      container.innerHTML = this.createLoadingSkeleton();
    }
  }

  // Show not found state
  showNotFoundState() {
    const container = document.getElementById('kir-profile-container');
    if (container) {
      container.innerHTML = this.createNotFoundState();
    }
  }

  // Show error state
  showErrorState(error) {
    const container = document.getElementById('kir-profile-container');
    if (container) {
      const message = error.code === 'permission-denied' || error.message?.includes('permission-denied')
        ? 'Akses ditolak: sila semak peranan dan peraturan pangkalan data.'
        : 'Ralat memuatkan data KIR. Sila cuba lagi.';
      container.innerHTML = this.createErrorState(message);
    }
  }

  // Main render method
  render() {
    if (!this.kirData) return;
    
    const container = document.getElementById('kir-profile-container');
    if (container) {
      container.innerHTML = this.createKIRProfileHTML();
    }
  }

  // Create main KIR Profile HTML
  createKIRProfileHTML() {
    return `
      <div class="kir-profile">
        ${this.createHeader()}
        <div class="profile-layout">
          ${this.createSidebarNavigation()}
          <div class="content-area">
            ${this.createTabContent()}
          </div>
        </div>
      </div>
    `;
  }

  // Create header with KIR info and actions
  createHeader() {
    const completeness = this.calculateCompleteness();
    const statusChip = this.getStatusChip(this.kirData?.status_rekod);
    
    return `
      <div class="kir-profile-header">
        <div class="header-top">
          <button class="btn btn-outline" onclick="kirProfile.goBack()">
            <i class="fas fa-arrow-left"></i> Kembali ke Senarai KIR
          </button>
        </div>
        
        <div class="header-main">
          <div class="kir-info">
            <div class="profile-avatar">
              <div class="avatar-circle">
                <i class="fas fa-user"></i>
              </div>
            </div>
            <div class="profile-details">
              <h1 class="kir-name">${this.kirData?.nama_penuh || 'Tiada Nama'}</h1>
              <div class="kir-details">
                <div class="detail-item">
                  <i class="fas fa-id-card"></i>
                  <span>No. KP: ${this.kirData?.no_kp || 'Tiada'}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-clock"></i>
                  <span>Dikemas kini: ${this.formatDate(this.kirData?.tarikh_kemas_kini)}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-chart-pie"></i>
                  <span>Kelengkapan: ${completeness}%</span>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${completeness}%"></div>
                  </div>
                </div>
              </div>
              ${statusChip}
            </div>
          </div>
          
          <div class="header-actions">
            ${this.createStatusActions()}
          </div>
        </div>
      </div>
    `;
  }

  // Create status action buttons
  createStatusActions() {
    const currentStatus = this.kirData?.status_rekod;
    let actions = [];
    
    if (currentStatus === 'Draf' || currentStatus === 'Dihantar') {
      actions.push(`<button class="btn btn-primary" onclick="kirProfile.updateStatus('Dihantar')">Hantar</button>`);
    }
    
    if (currentStatus === 'Dihantar') {
      actions.push(`<button class="btn btn-success" onclick="kirProfile.updateStatus('Disahkan')">Sahkan</button>`);
    }
    
    if (currentStatus !== 'Tidak Aktif') {
      actions.push(`<button class="btn btn-danger" onclick="kirProfile.updateStatus('Tidak Aktif')">Tidak Aktif</button>`);
    }
    
    return actions.join('');
  }

  // Create sidebar navigation
  createSidebarNavigation() {
    const tabs = [
      { id: 'maklumat-asas', label: 'Maklumat Asas', icon: 'fas fa-user' },
      { id: 'kafa', label: 'Pendidikan Agama (KAFA)', icon: 'fas fa-mosque' },
      { id: 'pendidikan', label: 'Pendidikan', icon: 'fas fa-graduation-cap' },
      { id: 'pekerjaan', label: 'Pekerjaan', icon: 'fas fa-briefcase' },
      { id: 'kekeluargaan', label: 'Kekeluargaan', icon: 'fas fa-users' },
      { id: 'kesihatan', label: 'Kesihatan KIR', icon: 'fas fa-heartbeat' },
      { id: 'pendapatan', label: 'Pendapatan', icon: 'fas fa-coins' },
      { id: 'perbelanjaan', label: 'Perbelanjaan', icon: 'fas fa-shopping-cart' },
      { id: 'bantuan-bulanan', label: 'Bantuan Bulanan', icon: 'fas fa-hand-holding-usd' },
      { id: 'air', label: 'Ahli Isi Rumah (AIR)', icon: 'fas fa-home' },
      { id: 'pkir', label: 'PKIR (Pasangan Ketua Isi Rumah)', icon: 'fas fa-heart' },
      { id: 'program', label: 'Program & Kehadiran', icon: 'fas fa-calendar-check' }
    ];
    
    const tabsHTML = tabs.map(tab => {
      // Handle regular tabs
      const isActive = tab.id === this.currentTab;
      const isDirty = this.dirtyTabs.has(tab.id);
      
      return `
        <button class="tab-btn ${isActive ? 'active' : ''}" 
                data-tab="${tab.id}" 
                onclick="kirProfile.switchTab('${tab.id}')">
          <div class="tab-icon">
            <i class="${tab.icon}"></i>
          </div>
          <span>${tab.label}</span>
          ${isDirty ? '<span class="dirty-indicator">•</span>' : ''}
        </button>
      `;
    }).join('');
    
    return `
      <div class="sidebar-navigation">
        <div class="nav-title">
          <i class="fas fa-list"></i> Navigasi Profil
        </div>
        ${tabsHTML}
      </div>
    `;
  }

  // Create tab content
  createTabContent() {
    return `
      <div class="tab-content">
        <div id="tab-${this.currentTab}" class="tab-pane active">
          ${this.createTabHTML(this.currentTab)}
        </div>
      </div>
    `;
  }

  // Create specific tab HTML based on tab type
  createTabHTML(tabId) {
    switch (tabId) {
      case 'maklumat-asas':
        return this.createMaklumatAsasTab();
      case 'kafa':
        return this.createKAFATab();
      case 'pendidikan':
        return this.createPendidikanTab();
      case 'pekerjaan':
        return this.createPekerjaanTab();
      case 'kekeluargaan':
        return this.createKekeluargaanTab();
      case 'kesihatan':
        return this.createKesihatanTab();
      case 'pendapatan':
        return this.createPendapatanTab();
      case 'perbelanjaan':
        return this.createPerbelanjaanTab();
      case 'bantuan-bulanan':
        return this.createBantuanBulananTab();
      case 'air':
        return this.createAIRTab();
      case 'pkir':
        return this.createPKIRTab();
      case 'program':
        return this.createProgramTab();
      default:
        return '<p>Tab tidak dijumpai</p>';
    }
  }

  // Create Maklumat Asas tab
  createMaklumatAsasTab() {
    const data = this.kirData || {};
    
    console.log('=== Maklumat Asas Tab Render Debug ===');
    console.log('kirData for Maklumat Asas:', this.kirData);
    console.log('data object:', data);
    console.log('nama_penuh value:', data.nama_penuh);
    console.log('=== End Maklumat Asas Debug ===');
    
    return `
      <div class="info-card">
        <form class="kir-form" data-tab="maklumat-asas">
          <div class="form-group">
            <label for="gambar_profil">Gambar Profil (Opsional)</label>
            <input type="file" id="gambar_profil" name="gambar_profil" accept="image/*">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="nama_penuh">Nama Penuh *</label>
              <input type="text" id="nama_penuh" name="nama_penuh" value="${data.nama_penuh || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="no_kp">No. KP *</label>
              <input type="text" id="no_kp" name="no_kp" value="${data.no_kp || ''}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="tarikh_lahir">Tarikh Lahir *</label>
              <input type="date" id="tarikh_lahir" name="tarikh_lahir" value="${data.tarikh_lahir || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="umur">Umur</label>
              <input type="number" id="umur" name="umur" value="${data.umur || ''}" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="jantina">Jantina *</label>
              <select id="jantina" name="jantina" required>
                <option value="">Pilih Jantina</option>
                <option value="Lelaki" ${data.jantina === 'Lelaki' ? 'selected' : ''}>Lelaki</option>
                <option value="Perempuan" ${data.jantina === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="bangsa">Bangsa *</label>
              <select id="bangsa" name="bangsa" required>
                <option value="">Pilih Bangsa</option>
                <option value="Melayu" ${data.bangsa === 'Melayu' ? 'selected' : ''}>Melayu</option>
                <option value="Cina" ${data.bangsa === 'Cina' ? 'selected' : ''}>Cina</option>
                <option value="India" ${data.bangsa === 'India' ? 'selected' : ''}>India</option>
                <option value="Lain-lain" ${data.bangsa === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="agama">Agama *</label>
              <select id="agama" name="agama" required>
                <option value="">Pilih Agama</option>
                <option value="Islam" ${data.agama === 'Islam' ? 'selected' : ''}>Islam</option>
                <option value="Kristian" ${data.agama === 'Kristian' ? 'selected' : ''}>Kristian</option>
                <option value="Buddha" ${data.agama === 'Buddha' ? 'selected' : ''}>Buddha</option>
                <option value="Hindu" ${data.agama === 'Hindu' ? 'selected' : ''}>Hindu</option>
                <option value="Lain-lain" ${data.agama === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="status_perkahwinan">Status Perkahwinan *</label>
              <select id="status_perkahwinan" name="status_perkahwinan" required>
                <option value="">Pilih Status</option>
                <option value="Bujang" ${data.status_perkahwinan === 'Bujang' ? 'selected' : ''}>Bujang</option>
                <option value="Berkahwin" ${data.status_perkahwinan === 'Berkahwin' ? 'selected' : ''}>Berkahwin</option>
                <option value="Bercerai" ${data.status_perkahwinan === 'Bercerai' ? 'selected' : ''}>Bercerai</option>
                <option value="Janda/Duda" ${data.status_perkahwinan === 'Janda/Duda' ? 'selected' : ''}>Janda/Duda</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="telefon_utama">Telefon Utama *</label>
              <input type="tel" id="telefon_utama" name="telefon_utama" value="${data.telefon_utama || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="telefon_kecemasan">Telefon Kecemasan</label>
              <input type="tel" id="telefon_kecemasan" name="telefon_kecemasan" value="${data.telefon_kecemasan || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="alamat">Alamat *</label>
            <textarea id="alamat" name="alamat" rows="3" required>${data.alamat || ''}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="poskod">Poskod *</label>
              <input type="text" id="poskod" name="poskod" value="${data.poskod || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="bandar">Bandar *</label>
              <input type="text" id="bandar" name="bandar" value="${data.bandar || ''}" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="negeri">Negeri *</label>
              <select id="negeri" name="negeri" required>
                <option value="">Pilih Negeri</option>
                <option value="Johor" ${data.negeri === 'Johor' ? 'selected' : ''}>Johor</option>
                <option value="Kedah" ${data.negeri === 'Kedah' ? 'selected' : ''}>Kedah</option>
                <option value="Kelantan" ${data.negeri === 'Kelantan' ? 'selected' : ''}>Kelantan</option>
                <option value="Melaka" ${data.negeri === 'Melaka' ? 'selected' : ''}>Melaka</option>
                <option value="Negeri Sembilan" ${data.negeri === 'Negeri Sembilan' ? 'selected' : ''}>Negeri Sembilan</option>
                <option value="Pahang" ${data.negeri === 'Pahang' ? 'selected' : ''}>Pahang</option>
                <option value="Perak" ${data.negeri === 'Perak' ? 'selected' : ''}>Perak</option>
                <option value="Perlis" ${data.negeri === 'Perlis' ? 'selected' : ''}>Perlis</option>
                <option value="Pulau Pinang" ${data.negeri === 'Pulau Pinang' ? 'selected' : ''}>Pulau Pinang</option>
                <option value="Sabah" ${data.negeri === 'Sabah' ? 'selected' : ''}>Sabah</option>
                <option value="Sarawak" ${data.negeri === 'Sarawak' ? 'selected' : ''}>Sarawak</option>
                <option value="Selangor" ${data.negeri === 'Selangor' ? 'selected' : ''}>Selangor</option>
                <option value="Terengganu" ${data.negeri === 'Terengganu' ? 'selected' : ''}>Terengganu</option>
                <option value="Wilayah Persekutuan Kuala Lumpur" ${data.negeri === 'Wilayah Persekutuan Kuala Lumpur' ? 'selected' : ''}>Wilayah Persekutuan Kuala Lumpur</option>
                <option value="Wilayah Persekutuan Labuan" ${data.negeri === 'Wilayah Persekutuan Labuan' ? 'selected' : ''}>Wilayah Persekutuan Labuan</option>
                <option value="Wilayah Persekutuan Putrajaya" ${data.negeri === 'Wilayah Persekutuan Putrajaya' ? 'selected' : ''}>Wilayah Persekutuan Putrajaya</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="tempat_lahir">Tempat Lahir</label>
              <input type="text" id="tempat_lahir" name="tempat_lahir" value="${data.tempat_lahir || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <div class="form-row">
            <div class="form-group">
              <label for="no_kwsp">No. KWSP</label>
              <input type="text" id="no_kwsp" name="no_kwsp" value="${data.no_kwsp || ''}">
            </div>
            
            <div class="form-group">
              <label for="no_perkeso">No. PERKESO</label>
              <input type="text" id="no_perkeso" name="no_perkeso" value="${data.no_perkeso || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('maklumat-asas')">Simpan</button>
        </div>
      </form>
    `;
  }

  // Create KAFA tab
  createKAFATab() {
    const data = this.relatedData?.kafa || {};
    
    console.log('=== KAFA Tab Render Debug ===');
    console.log('relatedData:', this.relatedData);
    console.log('KAFA data object:', data);
    console.log('KAFA data keys:', Object.keys(data));
    console.log('kafa_sumber value:', data.kafa_sumber);
    console.log('kafa_iman value:', data.kafa_iman);
    console.log('kafa_islam value:', data.kafa_islam);
    console.log('=== End KAFA Debug ===');
    
    // Use correct field names with fallbacks
    const sumberPengetahuan = data.kafa_sumber || data.sumber_pengetahuan || '';
    const tahapIman = data.kafa_iman || data.tahap_iman || '';
    const tahapIslam = data.kafa_islam || data.tahap_islam || '';
    const tahapFatihah = data.kafa_fatihah || data.tahap_fatihah || '';
    const tahapSolat = data.kafa_solat || data.tahap_taharah_wuduk_solat || '';
    const tahapPuasa = data.kafa_puasa || data.tahap_puasa_fidyah_zakat || '';
    
    return `
      <form class="kir-form" data-tab="kafa">
        <div class="form-section">
          <h3>Pendidikan Agama (KAFA)</h3>
          
          <div class="form-group">
            <label for="kafa_sumber">Sumber Pengetahuan Agama</label>
            <textarea id="kafa_sumber" name="kafa_sumber" rows="3">${sumberPengetahuan}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="kafa_iman">Tahap Iman *</label>
              <select id="kafa_iman" name="kafa_iman" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${tahapIman == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${tahapIman == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${tahapIman == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${tahapIman == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${tahapIman == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="kafa_islam">Tahap Islam *</label>
              <select id="kafa_islam" name="kafa_islam" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${tahapIslam == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${tahapIslam == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${tahapIslam == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${tahapIslam == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${tahapIslam == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="kafa_fatihah">Tahap Al-Fatihah</label>
              <select id="kafa_fatihah" name="kafa_fatihah">
                <option value="">Pilih Tahap</option>
                <option value="1" ${tahapFatihah == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${tahapFatihah == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${tahapFatihah == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${tahapFatihah == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${tahapFatihah == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="kafa_solat">Tahap Taharah, Wuduk & Solat</label>
              <select id="kafa_solat" name="kafa_solat">
                <option value="">Pilih Tahap</option>
                <option value="1" ${tahapSolat == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${tahapSolat == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${tahapSolat == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${tahapSolat == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${tahapSolat == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="kafa_puasa">Tahap Puasa, Fidyah & Zakat</label>
            <select id="kafa_puasa" name="kafa_puasa">
              <option value="">Pilih Tahap</option>
              <option value="1" ${tahapPuasa == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
              <option value="2" ${tahapPuasa == 2 ? 'selected' : ''}>2 - Lemah</option>
              <option value="3" ${tahapPuasa == 3 ? 'selected' : ''}>3 - Sederhana</option>
              <option value="4" ${tahapPuasa == 4 ? 'selected' : ''}>4 - Baik</option>
              <option value="5" ${tahapPuasa == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
            </select>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('kafa')">Simpan</button>
        </div>
      </form>
    `;
  }

  // Create Pendidikan tab
  createPendidikanTab() {
    const data = this.relatedData?.pendidikan || {};
    
    console.log('=== Pendidikan Tab Render Debug ===');
    console.log('Pendidikan data object:', data);
    console.log('Pendidikan data keys:', Object.keys(data));
    console.log('=== End Pendidikan Debug ===');
    
    // Use correct field names with fallbacks
    const tahapPendidikan = data.tahap_pendidikan || '';
    const namaSekolah = data.nama_sekolah || '';
    const bidangPengajian = data.bidang_pengajian || '';
    const tahunTamat = data.tahun_tamat || '';
    
    return `
      <form class="kir-form" data-tab="pendidikan">
        <div class="form-section">
          <h3>Pendidikan</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="tahap_pendidikan">Tahap Pendidikan</label>
        <select id="tahap_pendidikan" name="tahap_pendidikan">
                <option value="">Pilih Tahap</option>
                <option value="Tidak Bersekolah" ${tahapPendidikan === 'Tidak Bersekolah' ? 'selected' : ''}>Tidak Bersekolah</option>
                <option value="Sekolah Rendah" ${tahapPendidikan === 'Sekolah Rendah' ? 'selected' : ''}>Sekolah Rendah</option>
                <option value="Sekolah Menengah" ${tahapPendidikan === 'Sekolah Menengah' ? 'selected' : ''}>Sekolah Menengah</option>
                <option value="SPM/SPMV" ${tahapPendidikan === 'SPM/SPMV' ? 'selected' : ''}>SPM/SPMV</option>
                <option value="STPM/Diploma" ${tahapPendidikan === 'STPM/Diploma' ? 'selected' : ''}>STPM/Diploma</option>
                <option value="Ijazah Sarjana Muda" ${tahapPendidikan === 'Ijazah Sarjana Muda' ? 'selected' : ''}>Ijazah Sarjana Muda</option>
                <option value="Ijazah Sarjana" ${tahapPendidikan === 'Ijazah Sarjana' ? 'selected' : ''}>Ijazah Sarjana</option>
                <option value="PhD" ${tahapPendidikan === 'PhD' ? 'selected' : ''}>PhD</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="nama_sekolah">Nama Sekolah/Institusi</label>
        <input type="text" id="nama_sekolah" name="nama_sekolah" value="${namaSekolah}">
            </div>
            
            <div class="form-group">
              <label for="tahun_tamat">Tahun Tamat</label>
              <input type="number" id="tahun_tamat" name="tahun_tamat" value="${tahunTamat}" min="1950" max="2030" placeholder="YYYY">
            </div>
            
            <div class="form-group">
              <label for="bidang_pengajian">Bidang Pengajian</label>
        <input type="text" id="bidang_pengajian" name="bidang_pengajian" value="${bidangPengajian}">
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('pendidikan')">Simpan</button>
        </div>
      </form>
    `;
  }

  // Create Pekerjaan tab
  createPekerjaanTab() {
    const data = this.relatedData?.pekerjaan || {};
    
    console.log('=== Pekerjaan Tab Render Debug ===');
    console.log('Pekerjaan data object:', data);
    console.log('Pekerjaan data keys:', Object.keys(data));
    console.log('=== End Pekerjaan Debug ===');
    
    // Use correct field names with fallbacks
    const statusPekerjaan = data.status_pekerjaan || '';
    const jenisPekerjaan = data.jenis_pekerjaan || '';
    const namaMajikan = data.nama_majikan || '';
    const gajiBulanan = data.gaji_bulanan || '';
    const alamatKerja = data.alamat_kerja || '';
    const pengalamanKerja = data.pengalaman_kerja || '';
    const kemahiran = data.kemahiran || '';
    
    return `
      <form class="kir-form" data-tab="pekerjaan">
        <div class="form-section">
          <h3>Maklumat Pekerjaan</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label for="status_pekerjaan">Status Pekerjaan</label>
        <select id="status_pekerjaan" name="status_pekerjaan">
                <option value="">Pilih Status</option>
                <option value="Bekerja" ${statusPekerjaan === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                <option value="Tidak Bekerja" ${statusPekerjaan === 'Tidak Bekerja' ? 'selected' : ''}>Tidak Bekerja</option>
                <option value="Bersara" ${statusPekerjaan === 'Bersara' ? 'selected' : ''}>Bersara</option>
                <option value="OKU" ${statusPekerjaan === 'OKU' ? 'selected' : ''}>OKU</option>
              </select>
            </div>
            
            <div class="form-group" id="jenis_pekerjaan_group">
              <label for="jenis_pekerjaan">Jenis Pekerjaan</label>
        <input type="text" id="jenis_pekerjaan" name="jenis_pekerjaan" value="${jenisPekerjaan}">
            </div>
            
            <div class="form-group" id="nama_majikan_group">
              <label for="nama_majikan">Nama Majikan</label>
              <input type="text" id="nama_majikan" name="nama_majikan" value="${namaMajikan}">
            </div>
            
            <div class="form-group" id="gaji_bulanan_group">
              <label for="gaji_bulanan">Gaji Bulanan (RM)</label>
        <input type="number" id="gaji_bulanan" name="gaji_bulanan" value="${gajiBulanan}" step="0.01" min="0">
            </div>
            
            <div class="form-group" id="alamat_kerja_group">
              <label for="alamat_kerja">Alamat Kerja</label>
        <textarea id="alamat_kerja" name="alamat_kerja" rows="3">${alamatKerja}</textarea>
            </div>
            
            <div class="form-group">
              <label for="pengalaman_kerja">Pengalaman Kerja (Tahun)</label>
              <input type="number" id="pengalaman_kerja" name="pengalaman_kerja" value="${pengalamanKerja}" min="0">
            </div>
            
            <div class="form-group full-width">
              <label for="kemahiran">Kemahiran</label>
              <textarea id="kemahiran" name="kemahiran" rows="3" placeholder="Senaraikan kemahiran yang dimiliki">${kemahiran}</textarea>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('pekerjaan')">Simpan</button>
        </div>
      </form>
    `;
  }

  // Create Kekeluargaan tab
  createKekeluargaanTab() {
    const data = this.kirData || {};
    
    console.log('=== Kekeluargaan Tab Render Debug ===');
    console.log('KIR data object:', data);
    console.log('Available fields:', Object.keys(data));
    console.log('=== End Kekeluargaan Debug ===');
    
    return `
      <form class="kir-form" data-tab="kekeluargaan">
        <div class="form-section">
          <h3>Kekeluargaan</h3>
          
          <div class="form-group">
            <label for="status_perkahwinan">Status Perkahwinan *</label>
            <select id="status_perkahwinan" name="status_perkahwinan" required>
              <option value="">Pilih Status</option>
              <option value="Bujang" ${data.status_perkahwinan === 'Bujang' ? 'selected' : ''}>Bujang</option>
              <option value="Berkahwin" ${data.status_perkahwinan === 'Berkahwin' ? 'selected' : ''}>Berkahwin</option>
              <option value="Bercerai" ${data.status_perkahwinan === 'Bercerai' ? 'selected' : ''}>Bercerai</option>
              <option value="Balu/Duda" ${data.status_perkahwinan === 'Balu/Duda' ? 'selected' : ''}>Balu/Duda</option>
            </select>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="tarikh_nikah">Tarikh Nikah</label>
              <input type="date" id="tarikh_nikah" name="tarikh_nikah" value="${data.tarikh_nikah || ''}">
            </div>
            
            <div class="form-group">
              <label for="tarikh_cerai">Tarikh Cerai</label>
              <input type="date" id="tarikh_cerai" name="tarikh_cerai" value="${data.tarikh_cerai || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="nama_pasangan">Nama Pasangan</label>
              <input type="text" id="nama_pasangan" name="nama_pasangan" value="${data.nama_pasangan || ''}">
            </div>
            
            <div class="form-group">
              <label for="pasangan_no_kp">No. KP Pasangan</label>
              <input type="text" id="pasangan_no_kp" name="pasangan_no_kp" value="${data.pasangan_no_kp || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="pasangan_alamat">Alamat Pasangan</label>
            <textarea id="pasangan_alamat" name="pasangan_alamat" rows="3">${data.pasangan_alamat || ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="pasangan_status">Status Pasangan</label>
            <input type="text" id="pasangan_status" name="pasangan_status" value="${data.pasangan_status || ''}">
          </div>
          
          <div class="form-group">
            <label for="senarai_adik_beradik">Senarai Adik Beradik</label>
            <div id="siblings-container">
              ${this.createSiblingsHTML(data.senarai_adik_beradik || [])}
            </div>
            <button type="button" class="btn btn-secondary" onclick="kirProfile.addSibling()">Tambah Adik Beradik</button>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="ibu_nama">Nama Ibu</label>
              <input type="text" id="ibu_nama" name="ibu_nama" value="${data.ibu_nama || ''}">
            </div>
            
            <div class="form-group">
              <label for="ibu_negeri">Negeri Ibu</label>
              <input type="text" id="ibu_negeri" name="ibu_negeri" value="${data.ibu_negeri || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="ayah_nama">Nama Ayah</label>
              <input type="text" id="ayah_nama" name="ayah_nama" value="${data.ayah_nama || ''}">
            </div>
            
            <div class="form-group">
              <label for="ayah_negeri">Negeri Ayah</label>
              <input type="text" id="ayah_negeri" name="ayah_negeri" value="${data.ayah_negeri || ''}">
            </div>
          </div>
        </div>
        
        <!-- PKIR Integration Panel -->
        <div class="pkir-integration-panel">
          <div class="integration-card">
            <div class="integration-header">
              <h4><i class="fas fa-users"></i> PKIR (Pasangan Ketua Isi Rumah)</h4>
            </div>
            <div class="integration-content">
              ${this.pkirData ? 
                `<p>Rekod PKIR telah wujud untuk pasangan ini.</p>
                 <button type="button" class="btn btn-secondary" onclick="window.location.hash = '#/admin/kir/${this.kirId}?tab=pkir'">
                   <i class="fas fa-eye"></i> Lihat/Urus PKIR
                 </button>` :
                `<p>Cipta rekod PKIR lengkap untuk pasangan berdasarkan maklumat di atas.</p>
                 <button type="button" class="btn btn-outline-primary" onclick="kirProfile.openPKIRModal()">
                   <i class="fas fa-arrow-up"></i> Promosi ke PKIR
                 </button>`
              }
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('kekeluargaan')">Simpan</button>
        </div>
      </form>
    `;
  }

  // Create Kesihatan KIR tab
  createKesihatanTab() {
    const data = this.relatedData?.kesihatan || {};
    
    // Initialize current section if not set
    if (!this.currentKesihatanSection) {
      this.currentKesihatanSection = 'ringkasan';
    }
    
    return `
      <div class="kesihatan-tab-content">
        <div class="kesihatan-header">
          <h3>Kesihatan KIR</h3>
          <div class="kesihatan-last-updated">
            ${data.updated_at ? `Kemaskini terakhir: ${new Date(data.updated_at).toLocaleString('ms-MY')}` : ''}
          </div>
        </div>
        
        <div class="kesihatan-sections">
          ${this.createKesihatanSectionNavigation()}
          <div class="kesihatan-section-content">
            ${this.createKesihatanSectionContent()}
          </div>
        </div>
      </div>
    `;
  }

  // Create Kesihatan section navigation
  createKesihatanSectionNavigation() {
    const sections = [
      { id: 'ringkasan', label: 'Ringkasan Kesihatan', icon: 'heart' },
      { id: 'ubat-tetap', label: 'Ubat-ubatan Tetap', icon: 'pills' },
      { id: 'rawatan', label: 'Rawatan / Follow-up Berkala', icon: 'calendar-check' },
      { id: 'pembedahan', label: 'Sejarah Pembedahan', icon: 'cut' }
    ];

    const sectionsHTML = sections.map(section => {
      const isActive = section.id === this.currentKesihatanSection;
      const isDirty = this.kesihatanDirtyTabs?.has(section.id) || false;
      
      return `
        <button class="kesihatan-section-btn ${isActive ? 'active' : ''}" 
                data-section="${section.id}" 
                onclick="kirProfile.switchKesihatanSection('${section.id}')">
          <i class="fas fa-${section.icon}"></i>
          ${section.label}
          ${isDirty ? '<span class="dirty-indicator">•</span>' : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="kesihatan-section-navigation">
        ${sectionsHTML}
      </div>
    `;
  }

  // Create Kesihatan section content
  createKesihatanSectionContent() {
    switch (this.currentKesihatanSection) {
      case 'ringkasan':
        return this.createRingkasanKesihatanSection();
      case 'ubat-tetap':
        return this.createUbatTetapSection();
      case 'rawatan':
        return this.createRawatanSection();
      case 'pembedahan':
        return this.createPembedahanSection();
      default:
        return this.createRingkasanKesihatanSection();
    }
  }

  // Create Ringkasan Kesihatan section
  createRingkasanKesihatanSection() {
    const data = this.relatedData?.kesihatan || {};
    
    // Use fallback logic for field names
    const kumpulanDarah = data.kumpulan_darah || data.blood_type || '';
    const penyakitKronik = data.penyakit_kronik || data.chronic_diseases || [];
    const ringkasanKesihatan = data.ringkasan_kesihatan || data.health_summary || '';
    const catatanKesihatan = data.catatan_kesihatan || '';
    
    console.log('Kesihatan data:', data);
    console.log('Processed values:', { kumpulanDarah, penyakitKronik, ringkasanKesihatan, catatanKesihatan });
    
    return `
      <form class="kesihatan-form" data-section="ringkasan">
        <div class="form-section">
          <h4>Ringkasan Kesihatan</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="kumpulan_darah">Kumpulan Darah</label>
              <select id="kumpulan_darah" name="kumpulan_darah">
                <option value="">Pilih Kumpulan Darah</option>
                <option value="A+" ${kumpulanDarah === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${kumpulanDarah === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${kumpulanDarah === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${kumpulanDarah === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${kumpulanDarah === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${kumpulanDarah === 'AB-' ? 'selected' : ''}>AB-</option>
                <option value="O+" ${kumpulanDarah === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${kumpulanDarah === 'O-' ? 'selected' : ''}>O-</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Penyakit Kronik</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Diabetes" ${penyakitKronik.includes('Diabetes') ? 'checked' : ''}>
                <span>Diabetes</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Hipertensi" ${penyakitKronik.includes('Hipertensi') ? 'checked' : ''}>
                <span>Hipertensi</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Jantung" ${penyakitKronik.includes('Jantung') ? 'checked' : ''}>
                <span>Penyakit Jantung</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Asma" ${penyakitKronik.includes('Asma') ? 'checked' : ''}>
                <span>Asma</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Buah Pinggang" ${penyakitKronik.includes('Buah Pinggang') ? 'checked' : ''}>
                <span>Penyakit Buah Pinggang</span>
              </label>
              <label class="checkbox-item">
                <input type="checkbox" name="penyakit_kronik" value="Lain-lain" ${penyakitKronik.includes('Lain-lain') ? 'checked' : ''}>
                <span>Lain-lain</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label for="ringkasan_kesihatan">Ringkasan Kesihatan</label>
            <textarea id="ringkasan_kesihatan" name="ringkasan_kesihatan" rows="3" placeholder="Ringkasan keseluruhan kesihatan...">${ringkasanKesihatan}</textarea>
          </div>
          
          <div class="form-group">
            <label for="catatan_kesihatan">Catatan Kesihatan</label>
            <textarea id="catatan_kesihatan" name="catatan_kesihatan" rows="4" placeholder="Catatan tambahan mengenai kesihatan...">${catatanKesihatan}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> Simpan Ringkasan Kesihatan
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create Ubat Tetap section
  createUbatTetapSection() {
    const data = this.relatedData?.kesihatan?.ubat_tetap || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-pills"></i>
          </div>
          <h4>Tiada Ubat-ubatan Tetap</h4>
          <p>Belum ada maklumat ubat-ubatan tetap yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.addUbatTetapKIR()">
            <i class="fas fa-plus"></i> Tambah Ubat Pertama
          </button>
        </div>
      `;
    }
    
    const tableRows = data.map((ubat, index) => `
      <tr>
        <td>${ubat.nama_ubat || ''}</td>
        <td>${ubat.dos || ''}</td>
        <td>${ubat.kekerapan || ''}</td>
        <td>${ubat.catatan || ''}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kirProfile.editUbatTetapKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kirProfile.deleteUbatTetapKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Ubat-ubatan Tetap</h4>
        <button class="btn btn-primary" onclick="kirProfile.addUbatTetapKIR()">
          <i class="fas fa-plus"></i> Tambah Ubat
        </button>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Ubat</th>
              <th>Dos</th>
              <th>Kekerapan</th>
              <th>Catatan</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Create Rawatan section
  createRawatanSection() {
    const data = this.relatedData?.kesihatan?.rawatan || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-calendar-check"></i>
          </div>
          <h4>Tiada Rawatan / Follow-up</h4>
          <p>Belum ada maklumat rawatan atau follow-up berkala yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.addRawatanKIR()">
            <i class="fas fa-plus"></i> Tambah Rawatan Pertama
          </button>
        </div>
      `;
    }
    
    const tableRows = data.map((rawatan, index) => `
      <tr>
        <td>${rawatan.fasiliti || ''}</td>
        <td>${rawatan.tarikh ? new Date(rawatan.tarikh).toLocaleDateString('ms-MY') : ''}</td>
        <td>${rawatan.catatan || ''}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kirProfile.editRawatanKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kirProfile.deleteRawatanKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Rawatan / Follow-up Berkala</h4>
        <button class="btn btn-primary" onclick="kirProfile.addRawatanKIR()">
          <i class="fas fa-plus"></i> Tambah Rawatan
        </button>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fasiliti</th>
              <th>Tarikh</th>
              <th>Catatan</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  // Create Pembedahan section
  createPembedahanSection() {
    const data = this.relatedData?.kesihatan?.pembedahan || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-cut"></i>
          </div>
          <h4>Tiada Sejarah Pembedahan</h4>
          <p>Belum ada maklumat sejarah pembedahan yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.addPembedahanKIR()">
            <i class="fas fa-plus"></i> Tambah Pembedahan Pertama
          </button>
        </div>
      `;
    }
    
    // Create timeline view
    const timelineItems = data
      .sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh))
      .map(pembedahan => `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h5>${pembedahan.jenis_pembedahan || 'Pembedahan'}</h5>
              <span class="timeline-date">${pembedahan.tarikh ? new Date(pembedahan.tarikh).toLocaleDateString('ms-MY') : ''}</span>
            </div>
            <div class="timeline-body">
              <p><strong>Hospital:</strong> ${pembedahan.hospital || 'Tidak dinyatakan'}</p>
              <span class="status-badge ${pembedahan.status === 'Selesai' ? 'status-success' : 'status-warning'}">
                ${pembedahan.status || 'Perlu Follow-up'}
              </span>
            </div>
          </div>
        </div>
      `).join('');
    
    const tableRows = data.map((pembedahan, index) => `
      <tr>
        <td>${pembedahan.tarikh ? new Date(pembedahan.tarikh).toLocaleDateString('ms-MY') : ''}</td>
        <td>${pembedahan.jenis_pembedahan || ''}</td>
        <td>${pembedahan.hospital || ''}</td>
        <td>
          <span class="status-badge ${pembedahan.status === 'Selesai' ? 'status-success' : 'status-warning'}">
            ${pembedahan.status || 'Perlu Follow-up'}
          </span>
        </td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kirProfile.editPembedahanKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kirProfile.deletePembedahanKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Sejarah Pembedahan</h4>
        <button class="btn btn-primary" onclick="kirProfile.addPembedahanKIR()">
          <i class="fas fa-plus"></i> Tambah Pembedahan
        </button>
      </div>
      
      <div class="pembedahan-content">
        <div class="timeline-container">
          <h5>Timeline Pembedahan</h5>
          <div class="timeline">
            ${timelineItems}
          </div>
        </div>
        
        <div class="table-container">
          <h5>Senarai Pembedahan</h5>
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarikh</th>
                <th>Jenis Pembedahan</th>
                <th>Hospital</th>
                <th>Status</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Get file icon based on file extension
  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return 'file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'file-image';
      default: return 'file';
    }
  }

  // Create AIR tab
  createAIRTab() {
    return `
      <form class="kir-form" data-tab="air">
        <div class="form-section">
          <div class="section-header">
            <h3>Ahli Isi Rumah (AIR)</h3>
            <button type="button" class="btn btn-primary" onclick="kirProfile.openAIRDrawer()">
              <i class="fas fa-plus"></i> Tambah AIR
            </button>
          </div>
          
          ${this.createAIRFormContent()}
        </div>
      </form>
      
      ${this.createAIRDrawer()}
    `;
  }

  // Create AIR form content
  createAIRFormContent() {
    if (!this.airData || this.airData.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-users"></i>
          </div>
          <h4>Tiada Ahli Isi Rumah</h4>
          <p>Klik butang "Tambah AIR" untuk menambah ahli isi rumah.</p>
        </div>
      `;
    }

    return `
      <div class="air-list">
        ${this.airData.map(air => `
          <div class="air-card">
            <div class="air-header">
              <div class="air-info">
                <h4>${air.nama || 'Tiada Nama'}</h4>
                <span class="air-relation">${air.hubungan || 'Tiada Hubungan'}</span>
              </div>
              <div class="air-actions">
                <button class="btn btn-sm btn-outline" onclick="kirProfile.editAIR('${air.id}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="kirProfile.deleteAIR('${air.id}')">
                  <i class="fas fa-trash"></i> Hapus
                </button>
              </div>
            </div>
            <div class="air-details">
              <div class="detail-row">
                <div class="detail-item">
                  <label>No. KP/Passport:</label>
                  <span>${air.no_kp || 'Tiada Data'}</span>
                </div>
                <div class="detail-item">
                  <label>Tarikh Lahir:</label>
                  <span>${air.tarikh_lahir ? new Date(air.tarikh_lahir).toLocaleDateString('ms-MY') : 'Tiada Data'}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <label>Jantina:</label>
                  <span>${air.jantina || 'Tiada Data'}</span>
                </div>
                <div class="detail-item">
                  <label>Bangsa:</label>
                  <span>${air.bangsa || 'Tiada Data'}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <label>Agama:</label>
                  <span>${air.agama || 'Tiada Data'}</span>
                </div>
                <div class="detail-item">
                  <label>Status Perkahwinan:</label>
                  <span>${air.status_perkahwinan || 'Tiada Data'}</span>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-item">
                  <label>Tahap Pendidikan:</label>
                  <span>${air.tahap_pendidikan || 'Tiada Data'}</span>
                </div>
                <div class="detail-item">
                  <label>Pekerjaan:</label>
                  <span>${air.pekerjaan || 'Tiada Data'}</span>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Create AIR table
  createAIRTable() {
    const tableHeader = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Hubungan</th>
              <th>Jantina</th>
              <th>Tarikh Lahir</th>
              <th>No. KP/Sijil Lahir</th>
              <th>Bangsa</th>
              <th>Agama</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (!this.airData || this.airData.length === 0) {
      return `
        ${tableHeader}
            <tr>
              <td colspan="9" class="text-center py-4">
                <div class="empty-state-inline">
                  <i class="fas fa-users text-muted mb-2" style="font-size: 2rem;"></i>
                  <p class="text-muted mb-3">Tiada ahli isi rumah didaftarkan.</p>
                  <button class="btn btn-primary" onclick="kirProfile.openAIRDrawer()">
                    <i class="fas fa-plus"></i> Tambah AIR Pertama
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      `;
    }

    const tableRows = this.airData.map(air => `
      <tr>
        <td>
          <div class="air-info">
            <div class="air-avatar">${(air.nama || 'N').charAt(0).toUpperCase()}</div>
            <div class="air-details">
              <span class="air-name">${air.nama || 'Tiada Nama'}</span>
              <span class="air-age">${AIRService.calculateAge(air.tarikh_lahir)} tahun</span>
            </div>
          </div>
        </td>
        <td>${air.hubungan || 'Tiada Maklumat'}</td>
        <td>${air.jantina || 'Tiada Maklumat'}</td>
        <td>${AIRService.formatDate(air.tarikh_lahir)}</td>
        <td>${air.no_kp || air.sijil_lahir || 'Tiada Maklumat'}</td>
        <td>${air.bangsa || 'Tiada Maklumat'}</td>
        <td>${air.agama || 'Tiada Maklumat'}</td>
        <td>
          <span class="status-badge ${air.status === 'Aktif' ? 'status-active' : 'status-inactive'}">
            ${air.status || 'Aktif'}
          </span>
        </td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit AIR" onclick="kirProfile.editAIR('${air.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam AIR" onclick="kirProfile.deleteAIR('${air.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    return `
      ${tableHeader}
        ${tableRows}
      </tbody>
    </table>
  </div>
    `;
  }

  // Create PKIR tab
  createPKIRTab() {
    if (!this.pkirData) {
      // Empty state - show form structure
      return `
        <form class="kir-form" data-tab="pkir">
          <div class="form-section">
            <div class="section-header">
              <h3>PKIR (Pasangan Ketua Isi Rumah)</h3>
              <button type="button" class="btn btn-primary" onclick="kirProfile.openPKIRModal()">
                <i class="fas fa-plus"></i> Cipta Rekod PKIR
              </button>
            </div>
            
            <div class="empty-state-form">
              <div class="text-center py-5">
                <i class="fas fa-users text-muted mb-3" style="font-size: 3rem;"></i>
                <h5 class="text-muted mb-2">Tiada rekod PKIR untuk KIR ini</h5>
                <p class="text-muted mb-4">Belum ada maklumat pasangan yang didaftarkan untuk KIR ini.</p>
                <button type="button" class="btn btn-primary" onclick="kirProfile.openPKIRModal()">
                  <i class="fas fa-plus"></i> Cipta Rekod PKIR
                </button>
              </div>
            </div>
          </div>
          
          ${this.createPKIRModal()}
        </form>
      `;
    }

    // PKIR record exists - show form structure
    return `
      <form class="kir-form" data-tab="pkir">
        <div class="form-section">
          <div class="section-header">
            <h3>PKIR (Pasangan Ketua Isi Rumah)</h3>
            <button type="button" class="btn btn-secondary" onclick="kirProfile.deletePKIR()">
              <i class="fas fa-trash"></i> Padam PKIR
            </button>
          </div>
          
          ${this.createPKIRFormContent()}
        </div>
      </form>
      
      ${this.createPKIRModal()}
    `;
  }

  // Create PKIR section navigation
  createPKIRSectionNavigation() {
    const sections = [
      { id: 'maklumat-asas', label: 'Maklumat Asas', icon: 'user' },
      { id: 'kafa', label: 'Pendidikan Agama (KAFA)', icon: 'mosque' },
      { id: 'pendidikan', label: 'Pendidikan', icon: 'graduation-cap' },
      { id: 'pekerjaan', label: 'Pekerjaan', icon: 'briefcase' },
      { id: 'kesihatan', label: 'Kesihatan', icon: 'heartbeat' }
    ];

    const sectionsHTML = sections.map(section => {
      const isActive = section.id === this.currentPKIRSection;
      const isDirty = this.pkirDirtyTabs.has(section.id);
      
      return `
        <button class="pkir-section-btn ${isActive ? 'active' : ''}" 
                data-section="${section.id}" 
                onclick="kirProfile.switchPKIRSection('${section.id}')">
          <i class="fas fa-${section.icon}"></i>
          ${section.label}
          ${isDirty ? '<span class="dirty-indicator">•</span>' : ''}
        </button>
      `;
    }).join('');

    return `
      <div class="pkir-section-navigation">
        ${sectionsHTML}
      </div>
    `;
  }

  // Create PKIR form content (combined sections)
  createPKIRFormContent() {
    const asasData = this.pkirData?.asas || {};
    const kafaData = this.pkirData?.kafa || {};
    const pendidikanData = this.pkirData?.pendidikan || {};
    const pekerjaanData = this.pkirData?.pekerjaan || {};
    const kesihatanData = this.pkirData?.kesihatan || {};
    
    return `
      <!-- Maklumat Asas -->
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_nama">Nama Pasangan *</label>
          <input type="text" id="pkir_nama" name="nama_pasangan" value="${asasData.nama || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="pkir_no_kp">No. KP Pasangan *</label>
          <input type="text" id="pkir_no_kp" name="no_kp_pasangan" value="${asasData.no_kp || ''}" required>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_tarikh_lahir">Tarikh Lahir *</label>
          <input type="date" id="pkir_tarikh_lahir" name="tarikh_lahir_pasangan" value="${asasData.tarikh_lahir || ''}" required>
        </div>
        
        <div class="form-group">
          <label for="pkir_jantina">Jantina *</label>
          <select id="pkir_jantina" name="jantina_pasangan" required>
            <option value="">Pilih Jantina</option>
            <option value="Lelaki" ${asasData.jantina === 'Lelaki' ? 'selected' : ''}>Lelaki</option>
            <option value="Perempuan" ${asasData.jantina === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_bangsa">Bangsa</label>
          <input type="text" id="pkir_bangsa" name="bangsa_pasangan" value="${asasData.bangsa || ''}">
        </div>
        
        <div class="form-group">
          <label for="pkir_agama">Agama</label>
          <input type="text" id="pkir_agama" name="agama_pasangan" value="${asasData.agama || ''}">
        </div>
      </div>
      
      <!-- Pendidikan -->
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_tahap_pendidikan">Tahap Pendidikan</label>
          <select id="pkir_tahap_pendidikan" name="tahap_pendidikan">
            <option value="">Pilih Tahap</option>
            <option value="Tiada Pendidikan Formal" ${pendidikanData.tahap === 'Tiada Pendidikan Formal' ? 'selected' : ''}>Tiada Pendidikan Formal</option>
            <option value="Sekolah Rendah" ${pendidikanData.tahap === 'Sekolah Rendah' ? 'selected' : ''}>Sekolah Rendah</option>
            <option value="Sekolah Menengah" ${pendidikanData.tahap === 'Sekolah Menengah' ? 'selected' : ''}>Sekolah Menengah</option>
            <option value="SPM/SPMV" ${pendidikanData.tahap === 'SPM/SPMV' ? 'selected' : ''}>SPM/SPMV</option>
            <option value="STPM/Diploma" ${pendidikanData.tahap === 'STPM/Diploma' ? 'selected' : ''}>STPM/Diploma</option>
            <option value="Ijazah Sarjana Muda" ${pendidikanData.tahap === 'Ijazah Sarjana Muda' ? 'selected' : ''}>Ijazah Sarjana Muda</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="pkir_institusi">Institusi Pendidikan</label>
          <input type="text" id="pkir_institusi" name="institusi_pendidikan" value="${pendidikanData.institusi || ''}">
        </div>
      </div>
      
      <!-- Pekerjaan -->
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_status_pekerjaan">Status Pekerjaan</label>
          <select id="pkir_status_pekerjaan" name="status_pekerjaan">
            <option value="">Pilih Status</option>
            <option value="Bekerja" ${pekerjaanData.status === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
            <option value="Menganggur" ${pekerjaanData.status === 'Menganggur' ? 'selected' : ''}>Menganggur</option>
            <option value="Pelajar" ${pekerjaanData.status === 'Pelajar' ? 'selected' : ''}>Pelajar</option>
            <option value="Pesara" ${pekerjaanData.status === 'Pesara' ? 'selected' : ''}>Pesara</option>
            <option value="Suri Rumah" ${pekerjaanData.status === 'Suri Rumah' ? 'selected' : ''}>Suri Rumah</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="pkir_jenis_pekerjaan">Jenis Pekerjaan</label>
          <input type="text" id="pkir_jenis_pekerjaan" name="jenis_pekerjaan" value="${pekerjaanData.jenis || ''}">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="pkir_pendapatan">Pendapatan Bulanan (RM)</label>
          <input type="number" id="pkir_pendapatan" name="pendapatan_bulanan" value="${pekerjaanData.pendapatan || ''}" min="0" step="0.01">
        </div>
        
        <div class="form-group">
          <label for="pkir_kumpulan_darah">Kumpulan Darah</label>
          <select id="pkir_kumpulan_darah" name="kumpulan_darah">
            <option value="">Pilih Kumpulan Darah</option>
            <option value="A+" ${kesihatanData.kumpulan_darah === 'A+' ? 'selected' : ''}>A+</option>
            <option value="A-" ${kesihatanData.kumpulan_darah === 'A-' ? 'selected' : ''}>A-</option>
            <option value="B+" ${kesihatanData.kumpulan_darah === 'B+' ? 'selected' : ''}>B+</option>
            <option value="B-" ${kesihatanData.kumpulan_darah === 'B-' ? 'selected' : ''}>B-</option>
            <option value="AB+" ${kesihatanData.kumpulan_darah === 'AB+' ? 'selected' : ''}>AB+</option>
            <option value="AB-" ${kesihatanData.kumpulan_darah === 'AB-' ? 'selected' : ''}>AB-</option>
            <option value="O+" ${kesihatanData.kumpulan_darah === 'O+' ? 'selected' : ''}>O+</option>
            <option value="O-" ${kesihatanData.kumpulan_darah === 'O-' ? 'selected' : ''}>O-</option>
          </select>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRForm()">
          <i class="fas fa-save"></i> Simpan Maklumat
        </button>
      </div>
    `;
  }
  
  // Create PKIR section content (keep for backward compatibility)
  createPKIRSectionContent() {
    switch (this.currentPKIRSection) {
      case 'maklumat-asas':
        return this.createPKIRMaklumatAsasSection();
      case 'kafa':
        return this.createPKIRKAFASection();
      case 'pendidikan':
        return this.createPKIRPendidikanSection();
      case 'pekerjaan':
        return this.createPKIRPekerjaanSection();
      case 'kesihatan':
        return this.createPKIRKesihatanSection();
      default:
        return this.createPKIRMaklumatAsasSection();
    }
  }

  // Create PKIR Maklumat Asas section
  createPKIRMaklumatAsasSection() {
    const data = this.pkirData?.asas || {};
    
    return `
      <form class="pkir-form" data-section="maklumat-asas">
        <div class="form-section">
          <h4>Maklumat Asas Pasangan</h4>
          
          <div class="form-group">
            <label for="pkir_gambar_profil">Gambar Profil Pasangan</label>
            <input type="file" id="pkir_gambar_profil" name="gambar_profil_pasangan" accept="image/*">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_nama">Nama Pasangan *</label>
              <input type="text" id="pkir_nama" name="nama_pasangan" value="${data.nama || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="pkir_no_kp">No. KP Pasangan *</label>
              <input type="text" id="pkir_no_kp" name="no_kp_pasangan" value="${data.no_kp || ''}" 
                     onblur="kirProfile.checkDuplicateKIR(this.value)" required>
              <div id="duplicate-kir-warning" class="warning-banner" style="display: none;"></div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_tarikh_lahir">Tarikh Lahir *</label>
              <input type="date" id="pkir_tarikh_lahir" name="tarikh_lahir_pasangan" value="${data.tarikh_lahir || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="pkir_telefon">Telefon Pasangan</label>
              <input type="tel" id="pkir_telefon" name="telefon_pasangan" value="${data.telefon || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_jantina">Jantina *</label>
              <select id="pkir_jantina" name="jantina_pasangan" required>
                <option value="">Pilih Jantina</option>
                <option value="Lelaki" ${data.jantina === 'Lelaki' ? 'selected' : ''}>Lelaki</option>
                <option value="Perempuan" ${data.jantina === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_bangsa">Bangsa *</label>
              <select id="pkir_bangsa" name="bangsa_pasangan" required>
                <option value="">Pilih Bangsa</option>
                <option value="Melayu" ${data.bangsa === 'Melayu' ? 'selected' : ''}>Melayu</option>
                <option value="Cina" ${data.bangsa === 'Cina' ? 'selected' : ''}>Cina</option>
                <option value="India" ${data.bangsa === 'India' ? 'selected' : ''}>India</option>
                <option value="Lain-lain" ${data.bangsa === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_agama">Agama *</label>
              <select id="pkir_agama" name="agama_pasangan" required>
                <option value="">Pilih Agama</option>
                <option value="Islam" ${data.agama === 'Islam' ? 'selected' : ''}>Islam</option>
                <option value="Kristian" ${data.agama === 'Kristian' ? 'selected' : ''}>Kristian</option>
                <option value="Buddha" ${data.agama === 'Buddha' ? 'selected' : ''}>Buddha</option>
                <option value="Hindu" ${data.agama === 'Hindu' ? 'selected' : ''}>Hindu</option>
                <option value="Lain-lain" ${data.agama === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_tempat_lahir">Tempat Lahir</label>
              <input type="text" id="pkir_tempat_lahir" name="tempat_lahir_pasangan" value="${data.tempat_lahir || ''}">
            </div>
          </div>
          
          <div class="form-section">
            <h4>Maklumat Perkahwinan</h4>
            
            <div class="form-row">
              <div class="form-group">
                <label for="pkir_tarikh_nikah">Tarikh Nikah</label>
                <input type="date" id="pkir_tarikh_nikah" name="tarikh_nikah" value="${data.tarikh_nikah || ''}">
              </div>
              
              <div class="form-group">
                <label for="pkir_tarikh_cerai">Tarikh Cerai (jika berkenaan)</label>
                <input type="date" id="pkir_tarikh_cerai" name="tarikh_cerai" value="${data.tarikh_cerai || ''}">
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="pkir_alamat">Alamat Pasangan</label>
            <textarea id="pkir_alamat" name="alamat_pasangan" rows="3">${data.alamat || ''}</textarea>
            <small class="form-help">Boleh berbeza dari alamat KIR utama</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_status">Status Pasangan *</label>
              <select id="pkir_status" name="status_pasangan" required>
                <option value="">Pilih Status</option>
                <option value="Hidup" ${data.status_pasangan === 'Hidup' ? 'selected' : ''}>Hidup</option>
                <option value="Meninggal" ${data.status_pasangan === 'Meninggal' ? 'selected' : ''}>Meninggal</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_oku">OKU Pasangan</label>
              <select id="pkir_oku" name="oku_pasangan">
                <option value="">Pilih Status</option>
                <option value="Ya" ${data.oku === 'Ya' ? 'selected' : ''}>Ya</option>
                <option value="Tidak" ${data.oku === 'Tidak' ? 'selected' : ''}>Tidak</option>
              </select>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRSection('maklumat-asas')">
              <i class="fas fa-save"></i> Simpan Maklumat Asas
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create PKIR modal
  createPKIRModal() {
    if (!this.isPKIRModalOpen) return '';
    
    const kekeluargaanData = this.relatedData?.keluarga || {};
    
    return `
      <div class="modal-overlay" onclick="kirProfile.closePKIRModal()">
        <div class="modal pkir-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Cipta Rekod PKIR</h3>
            <button class="modal-close" onclick="kirProfile.closePKIRModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <p>Maklumat berikut akan dipra-isi dari tab Kekeluargaan. Anda boleh mengedit sebelum menyimpan.</p>
            
            <form id="pkir-creation-form">
              <div class="form-group">
                <label for="modal_nama_pasangan">Nama Pasangan *</label>
                <input type="text" id="modal_nama_pasangan" name="nama_pasangan" 
                       value="${kekeluargaanData.nama_pasangan || ''}" required>
              </div>
              
              <div class="form-group">
                <label for="modal_no_kp_pasangan">No. KP Pasangan *</label>
                <input type="text" id="modal_no_kp_pasangan" name="no_kp_pasangan" 
                       value="${kekeluargaanData.no_kp_pasangan || ''}" required>
              </div>
              
              <div class="form-group">
                <label for="modal_tarikh_lahir_pasangan">Tarikh Lahir *</label>
                <input type="date" id="modal_tarikh_lahir_pasangan" name="tarikh_lahir_pasangan" 
                       value="${kekeluargaanData.tarikh_lahir_pasangan || ''}" required>
              </div>
              
              <div class="form-group">
                <label for="modal_telefon_pasangan">Telefon Pasangan</label>
                <input type="tel" id="modal_telefon_pasangan" name="telefon_pasangan" 
                       value="${kekeluargaanData.telefon_pasangan || ''}">
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="kirProfile.closePKIRModal()">Batal</button>
            <button class="btn btn-primary" onclick="kirProfile.createPKIRRecord()">
              <i class="fas fa-save"></i> Cipta PKIR
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Create PKIR KAFA section
  createPKIRKAFASection() {
    const data = this.pkirData?.kafa || {};
    
    return `
      <form class="pkir-form" data-section="kafa">
        <div class="form-section">
          <h4>Pendidikan Agama (KAFA) Pasangan</h4>
          
          <div class="form-group">
            <label for="pkir_sumber_pengetahuan">Sumber Pengetahuan Agama</label>
            <textarea id="pkir_sumber_pengetahuan" name="sumber_pengetahuan" rows="3">${data.sumber_pengetahuan || ''}</textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_tahap_iman">Tahap Iman *</label>
              <select id="pkir_tahap_iman" name="tahap_iman" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${data.tahap_iman == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${data.tahap_iman == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${data.tahap_iman == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${data.tahap_iman == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${data.tahap_iman == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_tahap_islam">Tahap Islam *</label>
              <select id="pkir_tahap_islam" name="tahap_islam" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${data.tahap_islam == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${data.tahap_islam == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${data.tahap_islam == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${data.tahap_islam == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${data.tahap_islam == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_tahap_fatihah">Tahap Al-Fatihah *</label>
              <select id="pkir_tahap_fatihah" name="tahap_fatihah" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${data.tahap_fatihah == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${data.tahap_fatihah == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${data.tahap_fatihah == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${data.tahap_fatihah == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${data.tahap_fatihah == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_tahap_taharah">Tahap Taharah, Wuduk & Solat *</label>
              <select id="pkir_tahap_taharah" name="tahap_taharah_wuduk_solat" required>
                <option value="">Pilih Tahap</option>
                <option value="1" ${data.tahap_taharah_wuduk_solat == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${data.tahap_taharah_wuduk_solat == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${data.tahap_taharah_wuduk_solat == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${data.tahap_taharah_wuduk_solat == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${data.tahap_taharah_wuduk_solat == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="pkir_tahap_puasa">Tahap Puasa, Fidyah & Zakat *</label>
            <select id="pkir_tahap_puasa" name="tahap_puasa_fidyah_zakat" required>
              <option value="">Pilih Tahap</option>
              <option value="1" ${data.tahap_puasa_fidyah_zakat == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
              <option value="2" ${data.tahap_puasa_fidyah_zakat == 2 ? 'selected' : ''}>2 - Lemah</option>
              <option value="3" ${data.tahap_puasa_fidyah_zakat == 3 ? 'selected' : ''}>3 - Sederhana</option>
              <option value="4" ${data.tahap_puasa_fidyah_zakat == 4 ? 'selected' : ''}>4 - Baik</option>
              <option value="5" ${data.tahap_puasa_fidyah_zakat == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="pkir_skor_kafa">Skor KAFA Pasangan</label>
            <input type="number" id="pkir_skor_kafa" name="skor_kafa" value="${data.skor_kafa || ''}" readonly>
            <small class="form-help">Skor akan dikira secara automatik semasa menyimpan</small>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRSection('kafa')">
              <i class="fas fa-save"></i> Simpan KAFA
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create PKIR Pendidikan section
  createPKIRPendidikanSection() {
    const data = this.pkirData?.pendidikan || {};
    
    return `
      <form class="pkir-form" data-section="pendidikan">
        <div class="form-section">
          <h4>Pendidikan Pasangan</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_tahap_pendidikan">Tahap Pendidikan</label>
              <select id="pkir_tahap_pendidikan" name="tahap">
                <option value="">Pilih Tahap</option>
                <option value="Tiada Pendidikan Formal" ${data.tahap === 'Tiada Pendidikan Formal' ? 'selected' : ''}>Tiada Pendidikan Formal</option>
                <option value="Sekolah Rendah" ${data.tahap === 'Sekolah Rendah' ? 'selected' : ''}>Sekolah Rendah</option>
                <option value="Sekolah Menengah" ${data.tahap === 'Sekolah Menengah' ? 'selected' : ''}>Sekolah Menengah</option>
                <option value="SPM/SPMV" ${data.tahap === 'SPM/SPMV' ? 'selected' : ''}>SPM/SPMV</option>
                <option value="STPM/Diploma" ${data.tahap === 'STPM/Diploma' ? 'selected' : ''}>STPM/Diploma</option>
                <option value="Ijazah Sarjana Muda" ${data.tahap === 'Ijazah Sarjana Muda' ? 'selected' : ''}>Ijazah Sarjana Muda</option>
                <option value="Ijazah Sarjana" ${data.tahap === 'Ijazah Sarjana' ? 'selected' : ''}>Ijazah Sarjana</option>
                <option value="Ijazah Doktor Falsafah" ${data.tahap === 'Ijazah Doktor Falsafah' ? 'selected' : ''}>Ijazah Doktor Falsafah</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_institusi">Institusi</label>
              <input type="text" id="pkir_institusi" name="institusi" value="${data.institusi || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_tahun_tamat">Tahun Tamat</label>
              <input type="number" id="pkir_tahun_tamat" name="tahun_tamat" value="${data.tahun_tamat || ''}" min="1950" max="2030">
            </div>
            
            <div class="form-group">
              <label for="pkir_bidang">Bidang Pengajian</label>
              <input type="text" id="pkir_bidang" name="bidang" value="${data.bidang || ''}">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRSection('pendidikan')">
              <i class="fas fa-save"></i> Simpan Pendidikan
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create PKIR Pekerjaan section
  createPKIRPekerjaanSection() {
    const data = this.pkirData?.pekerjaan || {};
    
    return `
      <form class="pkir-form" data-section="pekerjaan">
        <div class="form-section">
          <h4>Pekerjaan Pasangan</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_status_pekerjaan">Status Pekerjaan</label>
              <select id="pkir_status_pekerjaan" name="status">
                <option value="">Pilih Status</option>
                <option value="Bekerja" ${data.status === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                <option value="Menganggur" ${data.status === 'Menganggur' ? 'selected' : ''}>Menganggur</option>
                <option value="Pelajar" ${data.status === 'Pelajar' ? 'selected' : ''}>Pelajar</option>
                <option value="Pesara" ${data.status === 'Pesara' ? 'selected' : ''}>Pesara</option>
                <option value="Suri Rumah" ${data.status === 'Suri Rumah' ? 'selected' : ''}>Suri Rumah</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="pkir_jenis_pekerjaan">Jenis Pekerjaan</label>
              <input type="text" id="pkir_jenis_pekerjaan" name="jenis" value="${data.jenis || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_majikan">Majikan/Syarikat</label>
              <input type="text" id="pkir_majikan" name="majikan" value="${data.majikan || ''}">
            </div>
            
            <div class="form-group">
              <label for="pkir_pendapatan">Pendapatan Bulanan (RM)</label>
              <input type="number" id="pkir_pendapatan" name="pendapatan_bulanan" value="${data.pendapatan_bulanan || ''}" min="0" step="0.01">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="pkir_lokasi">Lokasi Kerja</label>
              <input type="text" id="pkir_lokasi" name="lokasi" value="${data.lokasi || ''}">
            </div>
            
            <div class="form-group">
              <label for="pkir_pengalaman">Pengalaman (Tahun)</label>
              <input type="number" id="pkir_pengalaman" name="pengalaman" value="${data.pengalaman || ''}" min="0">
            </div>
          </div>
          
          <div class="form-group">
            <label for="pkir_kemahiran">Kemahiran</label>
            <textarea id="pkir_kemahiran" name="kemahiran" rows="3">${data.kemahiran || ''}</textarea>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRSection('pekerjaan')">
              <i class="fas fa-save"></i> Simpan Pekerjaan
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create PKIR Kesihatan section
  createPKIRKesihatanSection() {
    const data = this.pkirData?.kesihatan || {};
    const penyakitKronik = data.penyakit_kronik || [];
    const ubatTetap = data.ubat_tetap || [];
    
    return `
      <form class="pkir-form" data-section="kesihatan">
        <div class="form-section">
          <h4>Kesihatan Pasangan</h4>
          
          <div class="form-group">
            <label for="pkir_kumpulan_darah">Kumpulan Darah</label>
            <select id="pkir_kumpulan_darah" name="kumpulan_darah">
              <option value="">Pilih Kumpulan Darah</option>
              <option value="A+" ${data.kumpulan_darah === 'A+' ? 'selected' : ''}>A+</option>
              <option value="A-" ${data.kumpulan_darah === 'A-' ? 'selected' : ''}>A-</option>
              <option value="B+" ${data.kumpulan_darah === 'B+' ? 'selected' : ''}>B+</option>
              <option value="B-" ${data.kumpulan_darah === 'B-' ? 'selected' : ''}>B-</option>
              <option value="AB+" ${data.kumpulan_darah === 'AB+' ? 'selected' : ''}>AB+</option>
              <option value="AB-" ${data.kumpulan_darah === 'AB-' ? 'selected' : ''}>AB-</option>
              <option value="O+" ${data.kumpulan_darah === 'O+' ? 'selected' : ''}>O+</option>
              <option value="O-" ${data.kumpulan_darah === 'O-' ? 'selected' : ''}>O-</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Penyakit Kronik</label>
            <div id="pkir-penyakit-kronik-list">
              ${penyakitKronik.map((penyakit, index) => `
                <div class="dynamic-item" data-index="${index}">
                  <div class="form-row">
                    <div class="form-group">
                      <input type="text" name="penyakit_nama_${index}" value="${penyakit.nama || ''}" placeholder="Nama Penyakit">
                    </div>
                    <div class="form-group">
                      <input type="text" name="penyakit_catatan_${index}" value="${penyakit.catatan || ''}" placeholder="Catatan">
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removePenyakitKronik(${index})">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="kirProfile.addPenyakitKronik()">
              <i class="fas fa-plus"></i> Tambah Penyakit Kronik
            </button>
          </div>
          
          <div class="form-group">
            <label>Ubat Tetap</label>
            <div id="pkir-ubat-tetap-list">
              ${ubatTetap.map((ubat, index) => `
                <div class="dynamic-item" data-index="${index}">
                  <div class="form-row">
                    <div class="form-group">
                      <input type="text" name="ubat_nama_${index}" value="${ubat.nama_ubat || ''}" placeholder="Nama Ubat">
                    </div>
                    <div class="form-group">
                      <input type="text" name="ubat_dos_${index}" value="${ubat.dos || ''}" placeholder="Dos">
                    </div>
                    <div class="form-group">
                      <input type="text" name="ubat_kekerapan_${index}" value="${ubat.kekerapan || ''}" placeholder="Kekerapan">
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removeUbatTetap(${index})">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="kirProfile.addUbatTetap()">
              <i class="fas fa-plus"></i> Tambah Ubat Tetap
            </button>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="kirProfile.savePKIRSection('kesihatan')">
              <i class="fas fa-save"></i> Simpan Kesihatan
            </button>
          </div>
        </div>
      </form>
    `;
  }

  // Create Pendapatan tab
  createPendapatanTab() {
    return `
      <div class="kir-form">
        <div class="form-section">
          <h4><i class="fas fa-money-bill-wave"></i> Pendapatan KIR</h4>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="summary-display">
                <div class="summary-item">
                  <span class="summary-label">Jumlah Keseluruhan Pendapatan Bulanan:</span>
                  <span class="summary-value" id="total-pendapatan">RM 0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h4><i class="fas fa-chart-line"></i> Pendapatan Tetap</h4>
          <p class="section-description">Pendapatan yang diterima secara tetap setiap bulan (Contoh: Gaji, Pencen, Elaun Tetap, Dividen)</p>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="section-actions">
                <button class="btn btn-primary" onclick="kirProfile.openPendapatanModal('Tetap')">
                  <i class="fas fa-plus"></i> Tambah Pendapatan Tetap
                </button>
              </div>
            </div>
            
            <div class="form-group full-width">
              <div class="pendapatan-table-container" id="pendapatan-tetap-table">
                ${this.createPendapatanTable('Tetap')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h4><i class="fas fa-chart-bar"></i> Pendapatan Tidak Tetap</h4>
          <p class="section-description">Pendapatan yang tidak tetap atau berubah-ubah (Contoh: Kerja Sambilan, Bonus, Komisyen, Freelance)</p>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="section-actions">
                <button class="btn btn-primary" onclick="kirProfile.openPendapatanModal('Tidak Tetap')">
                  <i class="fas fa-plus"></i> Tambah Pendapatan Tidak Tetap
                </button>
              </div>
            </div>
            
            <div class="form-group full-width">
              <div class="pendapatan-table-container" id="pendapatan-tidak-tetap-table">
                ${this.createPendapatanTable('Tidak Tetap')}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      ${this.createPendapatanModal()}
    `;
  }

  // Create Perbelanjaan tab
  createPerbelanjaanTab() {
    return `
      <div class="kir-form">
        <div class="form-section">
          <h4><i class="fas fa-shopping-cart"></i> Perbelanjaan KIR</h4>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="summary-display">
                <div class="summary-item">
                  <span class="summary-label">Jumlah Perbelanjaan Bulanan:</span>
                  <span class="summary-value" id="total-perbelanjaan">RM 0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h4><i class="fas fa-list"></i> Senarai Perbelanjaan</h4>
          <p class="section-description">Perbelanjaan rutin bulanan mengikut kategori</p>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="section-actions">
                <button class="btn btn-primary" onclick="kirProfile.openPerbelanjaanModal()">
                  <i class="fas fa-plus"></i> Tambah Perbelanjaan
                </button>
              </div>
            </div>
            
            <div class="form-group full-width">
              <label>Tapis mengikut Kategori</label>
              <div class="category-filters">
                <button class="filter-btn active" data-category="all" onclick="kirProfile.filterPerbelanjaan('all')">
                  <i class="fas fa-th"></i> Semua
                </button>
                <button class="filter-btn" data-category="Utiliti-Air" onclick="kirProfile.filterPerbelanjaan('Utiliti-Air')">
                  <i class="fas fa-tint"></i> Air
                </button>
                <button class="filter-btn" data-category="Utiliti-Elektrik" onclick="kirProfile.filterPerbelanjaan('Utiliti-Elektrik')">
                  <i class="fas fa-bolt"></i> Elektrik
                </button>
                <button class="filter-btn" data-category="Sewa" onclick="kirProfile.filterPerbelanjaan('Sewa')">
                  <i class="fas fa-home"></i> Sewa
                </button>
                <button class="filter-btn" data-category="Ansuran" onclick="kirProfile.filterPerbelanjaan('Ansuran')">
                  <i class="fas fa-credit-card"></i> Ansuran
                </button>
                <button class="filter-btn" data-category="Makanan" onclick="kirProfile.filterPerbelanjaan('Makanan')">
                  <i class="fas fa-utensils"></i> Makanan
                </button>
                <button class="filter-btn" data-category="Sekolah-Anak" onclick="kirProfile.filterPerbelanjaan('Sekolah-Anak')">
                  <i class="fas fa-school"></i> Sekolah
                </button>
                <button class="filter-btn" data-category="Rawatan" onclick="kirProfile.filterPerbelanjaan('Rawatan')">
                  <i class="fas fa-medkit"></i> Rawatan
                </button>
                <button class="filter-btn" data-category="Lain-lain" onclick="kirProfile.filterPerbelanjaan('Lain-lain')">
                   <i class="fas fa-ellipsis-h"></i> Lain-lain
                 </button>
               </div>
             </div>
             
             <div class="form-group full-width">
               <div class="perbelanjaan-table-container" id="perbelanjaan-table">
                 ${this.createPerbelanjaanTable()}
               </div>
             </div>
             
             <div class="form-group full-width">
               <div class="perbelanjaan-subtotals" id="perbelanjaan-subtotals">
                 ${this.createPerbelanjaanSubtotals()}
               </div>
             </div>
           </div>
         </div>
       </div>
       
       ${this.createPerbelanjaanModal()}
     `;
  }

  // Create Bantuan Bulanan tab
  createBantuanBulananTab() {
    return `
      <div class="kir-form">
        <div class="form-section">
          <h4><i class="fas fa-hand-holding-usd"></i> Bantuan Bulanan KIR</h4>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="summary-display">
                <div class="summary-item">
                  <span class="summary-label">Jumlah Bantuan Bulanan (Anggaran):</span>
                  <span class="summary-value" id="total-bantuan-bulanan">RM 0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h4><i class="fas fa-list-alt"></i> Senarai Bantuan</h4>
          <p class="section-description">Bantuan bulanan yang diterima dari pelbagai agensi</p>
          
          <div class="form-grid">
            <div class="form-group full-width">
              <div class="section-actions">
                <button class="btn btn-primary" onclick="kirProfile.openBantuanBulananModal()">
                  <i class="fas fa-plus"></i> Tambah Bantuan
                </button>
              </div>
            </div>
            
            <div class="form-group full-width">
              <div class="bantuan-table-container" id="bantuan-bulanan-table">
                ${this.createBantuanBulananTable()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      ${this.createBantuanBulananModal()}
    `;
  }

  // Create Pendapatan table
  createPendapatanTable(kategori) {
    const data = this.pendapatanData?.filter(item => item.kategori === kategori) || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-money-bill-wave"></i>
          </div>
          <h4>Tiada Pendapatan ${kategori}</h4>
          <p>Belum ada pendapatan ${kategori.toLowerCase()} yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.openPendapatanModal('${kategori}')">
            <i class="fas fa-plus"></i> Tambah Pendapatan ${kategori}
          </button>
        </div>
      `;
    }
    
    // Calculate subtotal for this category
    const subtotal = data.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0);
    
    const tableRows = data.map((item, index) => `
      <tr class="data-row">
        <td class="row-number">${index + 1}</td>
        <td class="source-cell">${item.sumber}</td>
        <td class="amount-cell">${this.formatCurrency(item.jumlah)}</td>
        <td class="notes-cell">${item.catatan || '-'}</td>
        <td class="actions-cell">
          <div class="action-buttons">
            <button class="btn btn-sm btn-edit" onclick="kirProfile.editPendapatan('${item.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-delete" onclick="kirProfile.deletePendapatan('${item.id}')" title="Padam">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="professional-table-container">
        <table class="professional-data-table pendapatan-table">
          <thead>
            <tr class="table-header">
              <th class="col-number">#</th>
              <th class="col-source">Sumber Pendapatan</th>
              <th class="col-amount">Jumlah (RM)</th>
              <th class="col-notes">Catatan</th>
              <th class="col-actions">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="subtotal-row">
              <td colspan="2" class="subtotal-label"><strong>Jumlah ${kategori}:</strong></td>
              <td class="subtotal-amount"><strong>${this.formatCurrency(subtotal)}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Create Perbelanjaan table
  createPerbelanjaanTable() {
    const data = this.perbelanjaanData || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-receipt"></i>
          </div>
          <h4>Tiada Perbelanjaan</h4>
          <p>Belum ada perbelanjaan yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.openPerbelanjaanModal()">
            <i class="fas fa-plus"></i> Tambah Perbelanjaan
          </button>
        </div>
      `;
    }
    
    // Calculate total expenses
    const totalExpenses = data.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0);
    
    const tableRows = data.map((item, index) => {
      const categoryIcon = this.getCategoryIcon(item.kategori);
      return `
        <tr class="data-row" data-category="${item.kategori}">
          <td class="row-number">${index + 1}</td>
          <td class="category-cell">
            <i class="fas fa-${categoryIcon} category-icon"></i>
            ${this.formatKategoriPerbelanjaan(item.kategori)}
          </td>
          <td class="amount-cell">${this.formatCurrency(item.jumlah)}</td>
          <td class="notes-cell">${item.catatan || '-'}</td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button class="btn btn-sm btn-edit" onclick="kirProfile.editPerbelanjaan('${item.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-delete" onclick="kirProfile.deletePerbelanjaan('${item.id}')" title="Padam">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    return `
      <div class="professional-table-container">
        <table class="professional-data-table perbelanjaan-table">
          <thead>
            <tr class="table-header">
              <th class="col-number">#</th>
              <th class="col-category">Kategori Perbelanjaan</th>
              <th class="col-amount">Jumlah (RM)</th>
              <th class="col-notes">Catatan</th>
              <th class="col-actions">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="2" class="total-label"><strong>Jumlah Keseluruhan Perbelanjaan:</strong></td>
              <td class="total-amount"><strong>${this.formatCurrency(totalExpenses)}</strong></td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Create Bantuan Bulanan table
  createBantuanBulananTable() {
    const data = this.bantuanBulananData || [];
    
    if (data.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-hand-holding-usd"></i>
          </div>
          <h4>Tiada Bantuan Bulanan</h4>
          <p>Belum ada bantuan bulanan yang didaftarkan.</p>
          <button class="btn btn-primary" onclick="kirProfile.openBantuanBulananModal()">
            <i class="fas fa-plus"></i> Tambah Bantuan
          </button>
        </div>
      `;
    }
    
    // Calculate total monthly assistance
    const totalMonthlyAssistance = data.reduce((sum, item) => {
      const monthlyValue = this.calculateMonthlyValue(item.kadar, item.kekerapan);
      return sum + monthlyValue;
    }, 0);
    
    const tableRows = data.map((item, index) => {
      const monthlyValue = this.calculateMonthlyValue(item.kadar, item.kekerapan);
      const frequencyBadge = this.getFrequencyBadge(item.kekerapan);
      return `
        <tr class="data-row">
          <td class="row-number">${index + 1}</td>
          <td class="date-cell">${new Date(item.tarikh_mula).toLocaleDateString('ms-MY')}</td>
          <td class="agency-cell">
            <i class="fas fa-building agency-icon"></i>
            ${item.agensi}
          </td>
          <td class="amount-cell">${this.formatCurrency(item.kadar)}</td>
          <td class="frequency-cell">
            <span class="frequency-badge ${frequencyBadge.class}">
              <i class="fas fa-${frequencyBadge.icon}"></i>
              ${item.kekerapan}
            </span>
          </td>
          <td class="monthly-value-cell">${this.formatCurrency(monthlyValue)}</td>
          <td class="method-cell">${item.cara_terima}</td>
          <td class="notes-cell">${item.catatan || '-'}</td>
          <td class="actions-cell">
            <div class="action-buttons">
              <button class="btn btn-sm btn-edit" onclick="kirProfile.editBantuanBulanan('${item.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-delete" onclick="kirProfile.deleteBantuanBulanan('${item.id}')" title="Padam">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    return `
      <div class="professional-table-container">
        <table class="professional-data-table bantuan-table">
          <thead>
            <tr class="table-header">
              <th class="col-number">#</th>
              <th class="col-date">Tarikh Mula</th>
              <th class="col-agency">Agensi</th>
              <th class="col-rate">Kadar (RM)</th>
              <th class="col-frequency">Kekerapan</th>
              <th class="col-monthly">Anggaran Bulanan (RM)</th>
              <th class="col-method">Cara Terima</th>
              <th class="col-notes">Catatan</th>
              <th class="col-actions">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td colspan="5" class="total-label"><strong>Jumlah Anggaran Bantuan Bulanan:</strong></td>
              <td class="total-amount"><strong>${this.formatCurrency(totalMonthlyAssistance)}</strong></td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Create Pendapatan modal
  createPendapatanModal() {
    return `
      <div id="pendapatan-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="pendapatan-modal-title">Tambah Pendapatan</h3>
            <button class="modal-close" onclick="kirProfile.closePendapatanModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="pendapatan-form" onsubmit="kirProfile.savePendapatan(event)">
            <div class="modal-body">
              <input type="hidden" id="pendapatan-id" name="id">
              <input type="hidden" id="pendapatan-kategori" name="kategori">
              
              <div class="form-group">
                <label for="pendapatan-sumber">Sumber *</label>
                <input type="text" id="pendapatan-sumber" name="sumber" required>
              </div>
              
              <div class="form-group">
                <label for="pendapatan-jumlah">Jumlah (RM) *</label>
                <input type="number" id="pendapatan-jumlah" name="jumlah" step="0.01" min="0" required>
              </div>
              
              <div class="form-group">
                <label for="pendapatan-catatan">Catatan</label>
                <input type="text" id="pendapatan-catatan" name="catatan">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="kirProfile.closePendapatanModal()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Create Perbelanjaan modal
  createPerbelanjaanModal() {
    return `
      <div id="perbelanjaan-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="perbelanjaan-modal-title">Tambah Perbelanjaan</h3>
            <button class="modal-close" onclick="kirProfile.closePerbelanjaanModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="perbelanjaan-form" onsubmit="kirProfile.savePerbelanjaan(event)">
            <div class="modal-body">
              <input type="hidden" id="perbelanjaan-id" name="id">
              
              <div class="form-group">
                <label for="perbelanjaan-kategori">Kategori *</label>
                <select id="perbelanjaan-kategori" name="kategori" required>
                  <option value="">Pilih Kategori</option>
                  <option value="Utiliti-Air">Utiliti - Air</option>
                  <option value="Utiliti-Elektrik">Utiliti - Elektrik</option>
                  <option value="Sewa">Sewa</option>
                  <option value="Ansuran">Ansuran</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Sekolah-Anak">Sekolah Anak</option>
                  <option value="Rawatan">Rawatan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="perbelanjaan-jumlah">Jumlah (RM) *</label>
                <input type="number" id="perbelanjaan-jumlah" name="jumlah" step="0.01" min="0" required>
              </div>
              
              <div class="form-group">
                <label for="perbelanjaan-catatan">Catatan</label>
                <input type="text" id="perbelanjaan-catatan" name="catatan">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="kirProfile.closePerbelanjaanModal()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Create Bantuan Bulanan modal
  createBantuanBulananModal() {
    return `
      <div id="bantuan-bulanan-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="bantuan-bulanan-modal-title">Tambah Bantuan Bulanan</h3>
            <button class="modal-close" onclick="kirProfile.closeBantuanBulananModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <form id="bantuan-bulanan-form" onsubmit="kirProfile.saveBantuanBulanan(event)">
            <div class="modal-body">
              <input type="hidden" id="bantuan-bulanan-id" name="id">
              
              <div class="form-row">
                <div class="form-group">
                  <label for="bantuan-tarikh-mula">Tarikh Mula *</label>
                  <input type="date" id="bantuan-tarikh-mula" name="tarikh_mula" required>
                </div>
                
                <div class="form-group">
                  <label for="bantuan-agensi">Agensi *</label>
                  <input type="text" id="bantuan-agensi" name="agensi" required>
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="bantuan-kadar">Kadar (RM) *</label>
                  <input type="number" id="bantuan-kadar" name="kadar" step="0.01" min="0" required>
                </div>
                
                <div class="form-group">
                  <label for="bantuan-kekerapan">Kekerapan *</label>
                  <select id="bantuan-kekerapan" name="kekerapan" required>
                    <option value="">Pilih Kekerapan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Harian">Harian</option>
                    <option value="Suku-Tahunan">Suku-Tahunan</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Sekali">Sekali</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label for="bantuan-cara-terima">Cara Terima *</label>
                <select id="bantuan-cara-terima" name="cara_terima" required>
                  <option value="">Pilih Cara Terima</option>
                  <option value="Tunai">Tunai</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cek">Cek</option>
                  <option value="Voucher">Voucher</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="bantuan-catatan">Catatan</label>
                <input type="text" id="bantuan-catatan" name="catatan">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="kirProfile.closeBantuanBulananModal()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Create Perbelanjaan subtotals
  createPerbelanjaanSubtotals() {
    const data = this.perbelanjaanData || [];
    const categories = {
      'Utiliti-Air': 'Air',
      'Utiliti-Elektrik': 'Elektrik',
      'Sewa': 'Sewa',
      'Ansuran': 'Ansuran',
      'Makanan': 'Makanan',
      'Sekolah-Anak': 'Sekolah Anak',
      'Rawatan': 'Rawatan',
      'Lain-lain': 'Lain-lain'
    };
    
    const subtotals = Object.keys(categories).map(kategori => {
      const categoryData = data.filter(item => item.kategori === kategori);
      const total = categoryData.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0);
      
      return {
        kategori: categories[kategori],
        total: total
      };
    }).filter(item => item.total > 0);
    
    if (subtotals.length === 0) {
      return '';
    }
    
    const subtotalRows = subtotals.map(item => `
      <div class="subtotal-row">
        <span class="subtotal-label">${item.kategori}:</span>
        <span class="subtotal-amount">${this.formatCurrency(item.total)}</span>
      </div>
    `).join('');
    
    return `
      <div class="subtotals-container">
        <h4>Subtotal mengikut Kategori</h4>
        ${subtotalRows}
      </div>
    `;
  }

  // Financial utility methods
  formatCurrency(amount) {
    if (!amount && amount !== 0) return 'RM 0.00';
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(parseFloat(amount));
  }

  formatKategoriPerbelanjaan(kategori) {
    const mapping = {
      'Utiliti-Air': 'Utiliti - Air',
      'Utiliti-Elektrik': 'Utiliti - Elektrik',
      'Sewa': 'Sewa',
      'Ansuran': 'Ansuran',
      'Makanan': 'Makanan',
      'Sekolah-Anak': 'Sekolah Anak',
      'Rawatan': 'Rawatan',
      'Lain-lain': 'Lain-lain'
    };
    return mapping[kategori] || kategori;
  }

  calculateMonthlyValue(kadar, kekerapan) {
    const amount = parseFloat(kadar) || 0;
    const factors = {
      'Bulanan': 1,
      'Mingguan': 4.33,
      'Harian': 30,
      'Suku-Tahunan': 1/3,
      'Tahunan': 1/12,
      'Sekali': 0
    };
    return amount * (factors[kekerapan] || 0);
  }

  // Get category icon for perbelanjaan
  getCategoryIcon(kategori) {
    const iconMap = {
      'Utiliti-Air': 'tint',
      'Utiliti-Elektrik': 'bolt',
      'Sewa': 'home',
      'Ansuran': 'credit-card',
      'Makanan': 'utensils',
      'Sekolah-Anak': 'graduation-cap',
      'Rawatan': 'medkit',
      'Lain-lain': 'ellipsis-h'
    };
    return iconMap[kategori] || 'receipt';
  }

  // Get frequency badge for bantuan bulanan
  getFrequencyBadge(kekerapan) {
    const badgeMap = {
      'Bulanan': { class: 'freq-monthly', icon: 'calendar-alt' },
      'Mingguan': { class: 'freq-weekly', icon: 'calendar-week' },
      'Harian': { class: 'freq-daily', icon: 'calendar-day' },
      'Suku-Tahunan': { class: 'freq-quarterly', icon: 'calendar' },
      'Tahunan': { class: 'freq-yearly', icon: 'calendar-check' },
      'Sekali': { class: 'freq-once', icon: 'calendar-times' }
    };
    return badgeMap[kekerapan] || { class: 'freq-default', icon: 'calendar' };
  }

  calculateTotalPendapatan() {
    if (!this.pendapatanData) return 0;
    return this.pendapatanData.reduce((total, item) => {
      return total + (parseFloat(item.jumlah) || 0);
    }, 0);
  }

  calculateTotalPerbelanjaan() {
    if (!this.perbelanjaanData) return 0;
    return this.perbelanjaanData.reduce((total, item) => {
      return total + (parseFloat(item.jumlah) || 0);
    }, 0);
  }

  calculateTotalBantuanBulanan() {
    if (!this.bantuanBulananData) return 0;
    return this.bantuanBulananData.reduce((total, item) => {
      const monthlyValue = this.calculateMonthlyValue(item.kadar, item.kekerapan);
      return total + monthlyValue;
    }, 0);
  }

  updateFinancialTotals() {
    // Update Pendapatan total
    const totalPendapatan = this.calculateTotalPendapatan();
    const pendapatanElement = document.getElementById('total-pendapatan');
    if (pendapatanElement) {
      pendapatanElement.textContent = this.formatCurrency(totalPendapatan);
    }

    // Update Perbelanjaan total
    const totalPerbelanjaan = this.calculateTotalPerbelanjaan();
    const perbelanjaanElement = document.getElementById('total-perbelanjaan');
    if (perbelanjaanElement) {
      perbelanjaanElement.textContent = this.formatCurrency(totalPerbelanjaan);
    }

    // Update Bantuan Bulanan total
    const totalBantuanBulanan = this.calculateTotalBantuanBulanan();
    const bantuanElement = document.getElementById('total-bantuan-bulanan');
    if (bantuanElement) {
      bantuanElement.textContent = this.formatCurrency(totalBantuanBulanan);
    }

    // Update subtotals for Perbelanjaan
    const subtotalsContainer = document.getElementById('perbelanjaan-subtotals');
    if (subtotalsContainer) {
      subtotalsContainer.innerHTML = this.createPerbelanjaanSubtotals();
    }
  }

  // Financial data loading methods
  async loadPendapatanData() {
    try {
      this.pendapatanData = await this.kirService.listPendapatan(this.kirId);
      this.renderPendapatanTable();
      this.updateFinancialTotals();
    } catch (error) {
      console.error('Error loading pendapatan data:', error);
      this.showToast('Ralat memuat data pendapatan', 'error');
    }
  }

  async loadPerbelanjaanData() {
    try {
      this.perbelanjaanData = await this.kirService.listPerbelanjaan(this.kirId);
      this.renderPerbelanjaanTable();
      this.updateFinancialTotals();
    } catch (error) {
      console.error('Error loading perbelanjaan data:', error);
      this.showToast('Ralat memuat data perbelanjaan', 'error');
    }
  }

  async loadBantuanBulananData() {
    try {
      this.bantuanBulananData = await this.kirService.listBantuanBulanan(this.kirId);
      this.renderBantuanBulananTable();
      this.updateFinancialTotals();
    } catch (error) {
      console.error('Error loading bantuan bulanan data:', error);
      this.showToast('Ralat memuat data bantuan bulanan', 'error');
    }
  }

  // Financial table rendering methods
  renderPendapatanTable() {
    // Update Pendapatan Tetap table
    const tetapContainer = document.getElementById('pendapatan-tetap-table');
    if (tetapContainer) {
      tetapContainer.innerHTML = this.createPendapatanTable('Tetap');
    }
    
    // Update Pendapatan Tidak Tetap table
    const tidakTetapContainer = document.getElementById('pendapatan-tidak-tetap-table');
    if (tidakTetapContainer) {
      tidakTetapContainer.innerHTML = this.createPendapatanTable('Tidak Tetap');
    }
  }

  renderPerbelanjaanTable() {
    const tableContainer = document.getElementById('perbelanjaan-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = this.createPerbelanjaanTable();
    }
  }

  renderBantuanBulananTable() {
    const tableContainer = document.getElementById('bantuan-bulanan-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = this.createBantuanBulananTable();
    }
  }

  // Financial form handlers
  async handlePendapatanSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
      kategori: formData.get('kategori'),
      sumber: formData.get('sumber').trim(),
      jumlah: parseFloat(formData.get('jumlah')) || 0,
      catatan: formData.get('catatan')?.trim() || ''
    };

    // Validation
    if (!data.sumber) {
      this.showToast('Sumber pendapatan diperlukan', 'error');
      return;
    }
    if (data.jumlah < 0) {
      this.showToast('Jumlah tidak boleh negatif', 'error');
      return;
    }

    try {
      const editId = event.target.dataset.editId;
      if (editId) {
        await this.kirService.updatePendapatan(editId, data);
        this.showToast('Pendapatan berjaya dikemas kini', 'success');
      } else {
        await this.kirService.addPendapatan(this.kirId, data);
        this.showToast('Pendapatan berjaya ditambah', 'success');
      }
      
      this.closePendapatanModal();
      await this.loadPendapatanData();
    } catch (error) {
      console.error('Error saving pendapatan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat menyimpan data pendapatan';
      this.showToast(message, 'error');
    }
  }

  // Modal control methods
  openPendapatanModal(kategori = 'Tetap', editData = null) {
    const modal = document.getElementById('pendapatan-modal');
    const form = document.getElementById('pendapatan-form');
    const title = document.getElementById('pendapatan-modal-title');
    
    if (editData) {
      title.textContent = 'Edit Pendapatan';
      form.dataset.editId = editData.id;
      form.elements.kategori.value = editData.kategori;
      form.elements.sumber.value = editData.sumber;
      form.elements.jumlah.value = editData.jumlah;
      form.elements.catatan.value = editData.catatan || '';
    } else {
      title.textContent = 'Tambah Pendapatan';
      form.removeAttribute('data-edit-id');
      form.reset();
      form.elements.kategori.value = kategori;
    }
    
    modal.style.display = 'block';
    form.elements.sumber.focus();
  }

  closePendapatanModal() {
    const modal = document.getElementById('pendapatan-modal');
    const form = document.getElementById('pendapatan-form');
    modal.style.display = 'none';
    form.reset();
    form.removeAttribute('data-edit-id');
  }

  openPerbelanjaanModal(editData = null) {
    const modal = document.getElementById('perbelanjaan-modal');
    const form = document.getElementById('perbelanjaan-form');
    const title = document.getElementById('perbelanjaan-modal-title');
    
    if (editData) {
      title.textContent = 'Edit Perbelanjaan';
      form.dataset.editId = editData.id;
      form.elements.kategori.value = editData.kategori;
      form.elements.jumlah.value = editData.jumlah;
      form.elements.catatan.value = editData.catatan || '';
    } else {
      title.textContent = 'Tambah Perbelanjaan';
      form.removeAttribute('data-edit-id');
      form.reset();
    }
    
    modal.style.display = 'block';
    form.elements.kategori.focus();
  }

  closePerbelanjaanModal() {
    const modal = document.getElementById('perbelanjaan-modal');
    const form = document.getElementById('perbelanjaan-form');
    modal.style.display = 'none';
    form.reset();
    form.removeAttribute('data-edit-id');
  }

  openBantuanBulananModal(editData = null) {
    const modal = document.getElementById('bantuan-bulanan-modal');
    const form = document.getElementById('bantuan-bulanan-form');
    const title = document.getElementById('bantuan-bulanan-modal-title');
    
    if (editData) {
      title.textContent = 'Edit Bantuan Bulanan';
      form.dataset.editId = editData.id;
      form.elements.tarikh_mula.value = editData.tarikh_mula;
      form.elements.agensi.value = editData.agensi;
      form.elements.kadar.value = editData.kadar;
      form.elements.kekerapan.value = editData.kekerapan;
      form.elements.cara_terima.value = editData.cara_terima;
      form.elements.catatan.value = editData.catatan || '';
    } else {
      title.textContent = 'Tambah Bantuan Bulanan';
      form.removeAttribute('data-edit-id');
      form.reset();
    }
    
    modal.style.display = 'block';
    form.elements.tarikh_mula.focus();
  }

  closeBantuanBulananModal() {
    const modal = document.getElementById('bantuan-bulanan-modal');
    const form = document.getElementById('bantuan-bulanan-form');
    modal.style.display = 'none';
    form.reset();
    form.removeAttribute('data-edit-id');
  }

  // Delete handlers
  async deletePendapatan(id) {
    if (!confirm('Adakah anda pasti untuk memadam pendapatan ini?')) {
      return;
    }

    try {
      await this.kirService.deletePendapatan(id);
      this.showToast('Pendapatan berjaya dipadam', 'success');
      await this.loadPendapatanData();
    } catch (error) {
      console.error('Error deleting pendapatan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat memadam data pendapatan';
      this.showToast(message, 'error');
    }
  }

  async deletePerbelanjaan(id) {
    if (!confirm('Adakah anda pasti untuk memadam perbelanjaan ini?')) {
      return;
    }

    try {
      await this.kirService.deletePerbelanjaan(id);
      this.showToast('Perbelanjaan berjaya dipadam', 'success');
      await this.loadPerbelanjaanData();
    } catch (error) {
      console.error('Error deleting perbelanjaan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat memadam data perbelanjaan';
      this.showToast(message, 'error');
    }
  }

  async deleteBantuanBulanan(id) {
    if (!confirm('Adakah anda pasti untuk memadam bantuan bulanan ini?')) {
      return;
    }

    try {
      await this.kirService.deleteBantuanBulanan(id);
      this.showToast('Bantuan bulanan berjaya dipadam', 'success');
      await this.loadBantuanBulananData();
    } catch (error) {
      console.error('Error deleting bantuan bulanan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat memadam data bantuan bulanan';
      this.showToast(message, 'error');
    }
  }

  async handlePerbelanjaanSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
      kategori: formData.get('kategori'),
      jumlah: parseFloat(formData.get('jumlah')) || 0,
      catatan: formData.get('catatan')?.trim() || ''
    };

    // Validation
    if (!data.kategori) {
      this.showToast('Kategori perbelanjaan diperlukan', 'error');
      return;
    }
    if (data.jumlah < 0) {
      this.showToast('Jumlah tidak boleh negatif', 'error');
      return;
    }

    try {
      const editId = event.target.dataset.editId;
      if (editId) {
        await this.kirService.updatePerbelanjaan(editId, data);
        this.showToast('Perbelanjaan berjaya dikemas kini', 'success');
      } else {
        await this.kirService.addPerbelanjaan(this.kirId, data);
        this.showToast('Perbelanjaan berjaya ditambah', 'success');
      }
      
      this.closePerbelanjaanModal();
      await this.loadPerbelanjaanData();
    } catch (error) {
      console.error('Error saving perbelanjaan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat menyimpan data perbelanjaan';
      this.showToast(message, 'error');
    }
  }

  async handleBantuanBulananSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {
      tarikh_mula: formData.get('tarikh_mula'),
      agensi: formData.get('agensi').trim(),
      kadar: parseFloat(formData.get('kadar')) || 0,
      kekerapan: formData.get('kekerapan'),
      cara_terima: formData.get('cara_terima').trim(),
      catatan: formData.get('catatan')?.trim() || ''
    };

    // Validation
    if (!data.tarikh_mula) {
      this.showToast('Tarikh mula diperlukan', 'error');
      return;
    }
    if (!data.agensi) {
      this.showToast('Agensi diperlukan', 'error');
      return;
    }
    if (data.kadar < 0) {
      this.showToast('Kadar tidak boleh negatif', 'error');
      return;
    }
    if (!data.kekerapan) {
      this.showToast('Kekerapan diperlukan', 'error');
      return;
    }
    if (!data.cara_terima) {
      this.showToast('Cara terima diperlukan', 'error');
      return;
    }

    try {
      const editId = event.target.dataset.editId;
      if (editId) {
        await this.kirService.updateBantuanBulanan(editId, data);
        this.showToast('Bantuan bulanan berjaya dikemas kini', 'success');
      } else {
        await this.kirService.addBantuanBulanan(this.kirId, data);
        this.showToast('Bantuan bulanan berjaya ditambah', 'success');
      }
      
      this.closeBantuanBulananModal();
      await this.loadBantuanBulananData();
    } catch (error) {
      console.error('Error saving bantuan bulanan:', error);
      const message = error.message.includes('permission') ? 
        'Akses ditolak: sila semak peranan dan peraturan pangkalan data.' : 
        'Ralat menyimpan data bantuan bulanan';
      this.showToast(message, 'error');
    }
  }

  // Helper methods
  createLoadingSkeleton() {
    return `
      <div class="kir-profile">
        <div class="kir-profile-header">
          <div class="header-top">
            <div class="loading-skeleton narrow"></div>
          </div>
          <div class="header-main">
            <div class="kir-info">
              <div class="profile-avatar">
                <div class="avatar-circle" style="background: #e5e7eb;">
                  <i class="fas fa-user" style="color: #9ca3af;"></i>
                </div>
              </div>
              <div class="profile-details">
                <div class="loading-skeleton wide" style="height: 2.25rem; margin-bottom: 1rem;"></div>
                <div class="loading-skeleton medium"></div>
                <div class="loading-skeleton narrow"></div>
                <div class="loading-skeleton medium"></div>
              </div>
            </div>
            <div class="header-actions">
              <div class="loading-skeleton narrow" style="height: 2.5rem;"></div>
              <div class="loading-skeleton narrow" style="height: 2.5rem;"></div>
            </div>
          </div>
        </div>
        
        <div class="profile-layout">
          <div class="sidebar-navigation">
            ${Array(8).fill(0).map(() => '<div class="loading-skeleton narrow" style="height: 2.5rem; margin: 0.25rem;"></div>').join('')}
          </div>
          <div class="content-area">
            <div class="tab-content">
              <div class="info-card">
                <div class="loading-skeleton wide" style="height: 1.5rem; margin-bottom: 2rem;"></div>
                <div class="form-grid">
                  ${Array(6).fill(0).map(() => `
                    <div class="form-group">
                      <div class="loading-skeleton narrow" style="height: 1rem; margin-bottom: 0.5rem;"></div>
                      <div class="loading-skeleton wide" style="height: 2.5rem;"></div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createNotFoundState() {
    return `
      <div class="kir-profile">
        <div class="info-card" style="text-align: center; padding: 4rem 2rem;">
          <div style="font-size: 4rem; color: #9ca3af; margin-bottom: 1.5rem;">
            <i class="fas fa-user-slash"></i>
          </div>
          <h2 style="color: #374151; margin-bottom: 1rem; font-size: 1.5rem;">KIR tidak dijumpai</h2>
          <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1rem;">Rekod KIR yang diminta tidak wujud atau telah dipadam.</p>
          <button class="btn btn-primary" onclick="kirProfile.goBack()">
            <i class="fas fa-arrow-left"></i> Kembali ke Senarai KIR
          </button>
        </div>
      </div>
    `;
  }

  createErrorState(message) {
    return `
      <div class="kir-profile">
        <div class="alert alert-error" style="margin: 2rem;">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 1.125rem;">Ralat Memuatkan Data</h3>
            <p style="margin: 0;">${message}</p>
          </div>
        </div>
        
        <div class="info-card" style="text-align: center; padding: 4rem 2rem; margin: 2rem;">
          <div style="font-size: 4rem; color: #ef4444; margin-bottom: 1.5rem;">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h2 style="color: #374151; margin-bottom: 1rem; font-size: 1.5rem;">Tidak dapat memuatkan data KIR</h2>
          <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1rem;">Sila cuba lagi atau hubungi pentadbir sistem jika masalah berterusan.</p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button class="btn btn-primary" onclick="kirProfile.loadKIRData()">
              <i class="fas fa-refresh"></i> Cuba Lagi
            </button>
            <button class="btn btn-outline" onclick="kirProfile.goBack()">
              <i class="fas fa-arrow-left"></i> Kembali
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createSiblingsHTML(siblings) {
    if (!siblings || siblings.length === 0) {
      return '<p class="no-siblings">Tiada adik beradik didaftarkan</p>';
    }
    
    return siblings.map((sibling, index) => `
      <div class="sibling-item" data-index="${index}">
        <input type="text" name="sibling_${index}" value="${sibling}" placeholder="Nama adik beradik">
        <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removeSibling(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  getStatusChip(status) {
    const statusClass = {
      'Draf': 'status-draft',
      'Dihantar': 'status-pending',
      'Disahkan': 'status-active',
      'Tidak Aktif': 'status-inactive'
    }[status] || 'status-unknown';
    
    return `<span class="status-chip ${statusClass}">${status || 'Tidak Diketahui'}</span>`;
  }

  formatDate(dateString) {
    if (!dateString) return 'Tiada';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Tarikh tidak sah';
    }
  }

  // Calculate completeness percentage
  calculateCompleteness() {
    const requiredFields = {
      // Maklumat Asas
      'nama_penuh': this.kirData?.nama_penuh,
      'no_kp': this.kirData?.no_kp,
      'telefon_utama': this.kirData?.telefon_utama,
      'alamat': this.kirData?.alamat,
      // KAFA
      'tahap_iman': this.relatedData?.kafa?.tahap_iman,
      'tahap_islam': this.relatedData?.kafa?.tahap_islam,
      // Pekerjaan
      'status': this.relatedData?.pekerjaan?.status,
      // Kekeluargaan
      'status_perkahwinan': this.relatedData?.keluarga?.status_perkahwinan
    };
    
    const totalFields = Object.keys(requiredFields).length;
    const completedFields = Object.values(requiredFields).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
    
    return Math.round((completedFields / totalFields) * 100);
  }

  // Event handlers and utility methods
  setupEventListeners() {
    // Track form changes for dirty state
    document.addEventListener('input', (e) => {
      if (e.target.closest('.kir-form')) {
        const form = e.target.closest('.kir-form');
        const tabId = form.dataset.tab;
        this.markTabDirty(tabId);
      }
      
      // Track AIR drawer form changes
      if (e.target.closest('.air-form')) {
        const form = e.target.closest('.air-form');
        const tabId = form.dataset.drawerTab;
        this.drawerDirtyTabs.add(tabId);
        this.render();
      }
    });
    
    // Handle form validation
    document.addEventListener('change', (e) => {
      if (e.target.closest('.kir-form')) {
        this.validateField(e.target);
      }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.handleRouteChange();
    });
    
    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.dirtyTabs.size > 0) {
        e.preventDefault();
        e.returnValue = 'Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti mahu meninggalkan halaman ini?';
      }
    });
  }

  // Mark tab as dirty (has unsaved changes)
  markTabDirty(tabId) {
    this.dirtyTabs.add(tabId);
    this.updateTabNavigation();
  }

  // Clear dirty state for tab
  clearTabDirty(tabId) {
    this.dirtyTabs.delete(tabId);
    this.updateTabNavigation();
  }

  // Update sidebar navigation to show dirty indicators and active states
  updateSidebarNavigation() {
    const sidebarNav = document.querySelector('.sidebar-navigation');
    if (sidebarNav) {
      const newSidebarHTML = this.createSidebarNavigation();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newSidebarHTML;
      const newSidebarContent = tempDiv.querySelector('.sidebar-navigation');
      if (newSidebarContent) {
        sidebarNav.innerHTML = newSidebarContent.innerHTML;
      }
    }
  }

  // Legacy method for backward compatibility
  updateTabNavigation() {
    this.updateSidebarNavigation();
  }

  // Switch to different tab
  async switchTab(tabId) {
    console.log('=== Tab Switch Debug ===');
    console.log('Switching from:', this.currentTab, 'to:', tabId);
    console.log('Current kirData:', this.kirData);
    console.log('Current relatedData:', this.relatedData);
    
    if (tabId === this.currentTab) return;
    
    // Check for unsaved changes
    if (this.dirtyTabs.has(this.currentTab)) {
      const confirmed = await this.confirmUnsavedChanges();
      if (!confirmed) return;
    }
    
    this.currentTab = tabId;
    this.updateURL();
    
    console.log('After tab switch - kirData:', this.kirData);
    console.log('After tab switch - relatedData:', this.relatedData);
    
    // Update tab content
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.innerHTML = `
        <div id="tab-${tabId}" class="tab-pane active">
          ${this.createTabHTML(tabId)}
        </div>
      `;
    }
    
    // Update active tab
    this.updateTabNavigation();
    
    // Load financial data for financial tabs
    if (tabId === 'pendapatan') {
      await this.loadPendapatanData();
      this.bindFinancialEventListeners();
    } else if (tabId === 'perbelanjaan') {
      await this.loadPerbelanjaanData();
      this.bindFinancialEventListeners();
    } else if (tabId === 'bantuan-bulanan') {
      await this.loadBantuanBulananData();
      this.bindFinancialEventListeners();
    } else if (tabId === 'program') {
      await this.loadProgramData();
      this.bindProgramEventListeners();
    }
  }

  // Confirm dialog for unsaved changes
  confirmUnsavedChanges() {
    return new Promise((resolve) => {
      const confirmed = confirm('Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti mahu meninggalkan tab ini?');
      resolve(confirmed);
    });
  }

  // Save tab data
  async saveTab(tabId) {
    try {
      const form = document.querySelector(`form[data-tab="${tabId}"]`);
      if (!form) return;
      
      // Validate form
      if (!this.validateForm(form)) {
        this.showToast('Sila betulkan ralat dalam borang sebelum menyimpan.', 'error');
        return;
      }
      
      // Get form data
      const formData = this.getFormData(form, tabId);
      
      // Show loading
      this.showSaveLoading(tabId);
      
      // Save data
      await this.saveTabData(tabId, formData);
      
      // Success feedback
      this.clearTabDirty(tabId);
      this.showToast('Data berjaya disimpan.', 'success');
      
      // Refresh header data
      await this.refreshHeaderData();
      
    } catch (error) {
      console.error('Error saving tab:', error);
      const message = error.code === 'permission-denied' || error.message?.includes('permission-denied')
        ? 'Akses ditolak: sila semak peranan dan peraturan pangkalan data.'
        : 'Ralat menyimpan data. Sila cuba lagi.';
      this.showToast(message, 'error');
    } finally {
      this.hideSaveLoading(tabId);
    }
  }

  // Get form data based on tab type
  getFormData(form, tabId) {
    const formData = new FormData(form);
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // Handle special cases
    if (tabId === 'maklumat-asas') {
      // Handle siblings array
      const siblings = [];
      const siblingInputs = form.querySelectorAll('input[name^="sibling_"]');
      siblingInputs.forEach(input => {
        if (input.value.trim()) {
          siblings.push(input.value.trim());
        }
      });
      data.senarai_adik_beradik = siblings;
    } else if (tabId === 'kafa') {
      // Calculate KAFA score
      data.skor_kafa = this.calculateKAFAScore(data);
    } else if (tabId === 'kekeluargaan') {
      // Validate dates
      if (data.tarikh_nikah && data.tarikh_cerai) {
        if (new Date(data.tarikh_cerai) < new Date(data.tarikh_nikah)) {
          throw new Error('Tarikh cerai tidak boleh lebih awal daripada tarikh nikah.');
        }
      }
    }
    
    return data;
  }

  // Calculate KAFA score
  calculateKAFAScore(data) {
    const scores = [
      parseInt(data.tahap_iman) || 0,
      parseInt(data.tahap_islam) || 0,
      parseInt(data.tahap_fatihah) || 0,
      parseInt(data.tahap_taharah_wuduk_solat) || 0,
      parseInt(data.tahap_puasa_fidyah_zakat) || 0
    ];
    
    const total = scores.reduce((sum, score) => sum + score, 0);
    const average = total / scores.length;
    
    return Math.round(average * 100) / 100; // Round to 2 decimal places
  }

  // Save tab data to backend
  async saveTabData(tabId, data) {
    if (tabId === 'maklumat-asas') {
      // Update main KIR record
      await KIRService.updateKIR(this.kirId, data);
      // Update local data
      Object.assign(this.kirData, data);
    } else {
      // Update related document
      const collectionMap = {
        'kafa': 'kafa',
        'pendidikan': 'pendidikan', 
        'pekerjaan': 'pekerjaan',
        'kekeluargaan': 'keluarga',
        'kesihatan': 'kesihatan'
      };
      
      const collection = collectionMap[tabId];
      if (collection) {
        await KIRService.updateRelatedDocument(this.kirId, collection, data);
        // Update local data
        if (!this.relatedData) this.relatedData = {};
        this.relatedData[collection] = { ...this.relatedData[collection], ...data };
      }
    }
  }

  // Refresh header data after save
  async refreshHeaderData() {
    try {
      const updatedData = await KIRService.getKIRById(this.kirId);
      if (updatedData) {
        this.kirData = updatedData;
        
        // Update header
        const header = document.querySelector('.kir-profile-header');
        if (header) {
          header.innerHTML = this.createHeader().replace('<div class="kir-profile-header">', '').replace('</div>', '');
        }
      }
    } catch (error) {
      console.error('Error refreshing header:', error);
    }
  }

  // Update KIR status
  async updateStatus(newStatus) {
    const confirmed = confirm(`Adakah anda pasti mahu mengubah status kepada "${newStatus}"?`);
    if (!confirmed) return;
    
    try {
      await KIRService.updateKIR(this.kirId, { status_rekod: newStatus });
      if (this.kirData) {
        this.kirData.status_rekod = newStatus;
      }
      
      // Refresh header
      await this.refreshHeaderData();
      
      this.showToast(`Status berjaya dikemas kini kepada "${newStatus}".`, 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      const message = error.code === 'permission-denied' || error.message?.includes('permission-denied')
        ? 'Akses ditolak: sila semak peranan dan peraturan pangkalan data.'
        : 'Ralat mengemas kini status. Sila cuba lagi.';
      this.showToast(message, 'error');
    }
  }

  // AIR Form Methods (for drawer form)
  async saveAIRTab(tabName) {
    const form = document.querySelector(`form[data-drawer-tab="${tabName}"]`);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Remove empty values
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key];
      }
    });
    
    try {
      if (this.currentEditingAIR) {
        // Update existing AIR
        await AIRService.updateAIR(this.currentEditingAIR, data);
        this.showToast('AIR berjaya dikemaskini', 'success');
        this.currentEditingAIR = null;
      } else {
        // Create new AIR
        await AIRService.createAIR(this.kirId, data);
        this.showToast('AIR berjaya ditambah', 'success');
      }
      
      this.closeAIRDrawer();
      await this.loadAIRData();
      this.render();
    } catch (error) {
      console.error('Error saving AIR:', error);
      this.showToast('Ralat menyimpan AIR: ' + error.message, 'error');
    }
  }
  
  resetAIRForm() {
    const form = document.querySelector('form[data-tab="air"]');
    if (form) {
      form.reset();
    }
  }
  
  // Edit AIR record
  editAIR(airId) {
    const air = this.airData.find(a => a.id === airId);
    if (air) {
      // Populate the drawer form with existing data
      this.populateAIRDrawer(air);
      this.openAIRDrawer();
    }
  }
  
  // Delete AIR record
  async deleteAIR(airId) {
    const confirmed = confirm('Adakah anda pasti mahu menghapus ahli isi rumah ini?');
    if (!confirmed) return;
    
    try {
      await AIRService.deleteAIR(airId);
      this.showToast('AIR berjaya dihapus', 'success');
      await this.loadAIRData();
      this.render();
    } catch (error) {
      console.error('Error deleting AIR:', error);
      this.showToast('Ralat menghapus AIR: ' + error.message, 'error');
    }
  }
  
  // Populate AIR drawer with existing data
  populateAIRDrawer(air) {
    // Populate form fields with existing data
    const fields = {
      'air_nama': air.nama,
      'air_no_kp': air.no_kp,
      'air_sijil_lahir': air.sijil_lahir,
      'air_tarikh_lahir': air.tarikh_lahir,
      'air_hubungan': air.hubungan,
      'air_jantina': air.jantina,
      'air_bangsa': air.bangsa,
      'air_agama': air.agama,
      'air_status_perkahwinan': air.status_perkahwinan,
      'air_tahap_pendidikan': air.tahap_pendidikan,
      'air_pekerjaan': air.pekerjaan
    };
    
    // Set the current editing AIR ID
    this.currentEditingAIR = air.id;
    
    // Populate fields after drawer is opened
    setTimeout(() => {
      Object.keys(fields).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && fields[fieldId]) {
          field.value = fields[fieldId];
        }
      });
    }, 100);
  }
  
  // PKIR Form Methods
  async savePKIRForm() {
    const form = document.querySelector('form[data-tab="pkir"]');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Remove empty values
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key];
      }
    });
    
    try {
      if (this.pkirData) {
        // Update existing PKIR
        await PasanganService.updatePasangan(this.pkirData.id, data);
        this.showToast('PKIR berjaya dikemaskini', 'success');
      } else {
        // Create new PKIR
        const newPKIR = await PasanganService.createPasangan(this.kirId, data);
        this.showToast('PKIR berjaya ditambah', 'success');
      }
      await this.loadPKIRData();
      this.render();
    } catch (error) {
      console.error('Error saving PKIR:', error);
      this.showToast('Ralat menyimpan PKIR: ' + error.message, 'error');
    }
  }
  
  // Go back to KIR list
  goBack() {
    if (this.dirtyTabs.size > 0) {
      const confirmed = confirm('Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti mahu meninggalkan halaman ini?');
      if (!confirmed) return;
    }
    
    // Navigate back to Senarai KIR section in admin dashboard
    window.location.hash = '#/admin';
    
    // After navigation, activate the Senarai KIR section
    setTimeout(() => {
      // Update active nav item
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      const senariKirNav = document.querySelector('[data-section="senarai-kir"]');
      if (senariKirNav) {
        senariKirNav.classList.add('active');
      }
      
      // Show Senarai KIR content section
      document.querySelectorAll('.content-section').forEach(content => {
        content.classList.remove('active');
      });
      const senariKirContent = document.getElementById('senarai-kir-content');
      if (senariKirContent) {
        senariKirContent.classList.add('active');
        // Initialize KIR management for Senarai KIR section
        if (typeof initializeKIRManagement === 'function') {
          initializeKIRManagement();
        }
      }
    }, 100);
  }

  // Handle route changes
  handleRouteChange() {
    const hash = window.location.hash;
    const match = hash.match(/#\/admin\/kir\/(\w+)(?:\?tab=([\w-]+))?/);
    
    if (match) {
      const [, kirId, tab] = match;
      if (kirId !== this.kirId) {
        this.init(kirId, tab);
      } else if (tab && tab !== this.currentTab) {
        this.switchTab(tab);
      }
    }
  }

  // Sibling management
  addSibling() {
    const container = document.getElementById('siblings-container');
    if (!container) return;
    
    const siblings = container.querySelectorAll('.sibling-item');
    const index = siblings.length;
    
    const siblingHTML = `
      <div class="sibling-item" data-index="${index}">
        <input type="text" name="sibling_${index}" placeholder="Nama adik beradik">
        <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removeSibling(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    // Remove "no siblings" message if exists
    const noSiblings = container.querySelector('.no-siblings');
    if (noSiblings) {
      noSiblings.remove();
    }
    
    container.insertAdjacentHTML('beforeend', siblingHTML);
    this.markTabDirty('maklumat-asas');
  }

  removeSibling(index) {
    const siblingItem = document.querySelector(`.sibling-item[data-index="${index}"]`);
    if (siblingItem) {
      siblingItem.remove();
      this.markTabDirty('maklumat-asas');
      
      // Show "no siblings" message if no siblings left
      const container = document.getElementById('siblings-container');
      const remainingSiblings = container.querySelectorAll('.sibling-item');
      if (remainingSiblings.length === 0) {
        container.innerHTML = '<p class="no-siblings">Tiada adik beradik didaftarkan</p>';
      }
    }
  }

  // Form validation
  validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    
    // Remove existing error styling
    field.classList.remove('error');
    
    // Check required fields
    if (isRequired && !value) {
      field.classList.add('error');
      return false;
    }
    
    // Specific validations
    if (field.type === 'email' && value && !this.isValidEmail(value)) {
      field.classList.add('error');
      return false;
    }
    
    if (field.type === 'tel' && value && !this.isValidPhone(value)) {
      field.classList.add('error');
      return false;
    }
    
    return true;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  // UI feedback methods
  showSaveLoading(tabId) {
    const saveBtn = document.querySelector(`form[data-tab="${tabId}"] .btn-primary`);
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }
  }

  hideSaveLoading(tabId) {
    const saveBtn = document.querySelector(`form[data-tab="${tabId}"] .btn-primary`);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Simpan';
    }
  }

  showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-${this.getToastIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getToastIcon(type) {
    const icons = {
      'success': 'check-circle',
      'error': 'exclamation-circle',
      'warning': 'exclamation-triangle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // AIR Drawer Methods
  createAIRDrawer() {
    return `
      <div class="air-drawer ${this.isDrawerOpen ? 'open' : ''}" id="airDrawer">
        <div class="drawer-overlay" onclick="kirProfile.closeAIRDrawer()"></div>
        <div class="drawer-content">
          <div class="drawer-header">
            <h3>${this.currentAIR?.id ? 'Edit' : 'Tambah'} Ahli Isi Rumah</h3>
            <button class="drawer-close" onclick="kirProfile.closeAIRDrawer()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="drawer-body">
            <div class="drawer-tabs">
              ${this.createDrawerTabNavigation()}
            </div>
            
            <div class="drawer-tab-content">
              ${this.createDrawerTabContent()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createDrawerTabNavigation() {
    const tabs = [
      { id: 'maklumat-asas', label: 'Maklumat Asas', icon: 'user' },
      { id: 'pendidikan', label: 'Pendidikan', icon: 'graduation-cap' },
      { id: 'pekerjaan', label: 'Pekerjaan', icon: 'briefcase' },
      { id: 'kesihatan', label: 'Kesihatan', icon: 'heartbeat' }
    ];

    return tabs.map(tab => {
      const isActive = this.currentDrawerTab === tab.id;
      const isDirty = this.drawerDirtyTabs.has(tab.id);
      
      return `
        <button class="drawer-tab ${isActive ? 'active' : ''}" 
                onclick="kirProfile.switchDrawerTab('${tab.id}')">
          <i class="fas fa-${tab.icon}"></i>
          ${tab.label}
          ${isDirty ? '<span class="dirty-indicator">•</span>' : ''}
        </button>
      `;
    }).join('');
  }

  createDrawerTabContent() {
    switch (this.currentDrawerTab) {
      case 'maklumat-asas':
        return this.createAIRMaklumatAsasTab();
      case 'pendidikan':
        return this.createAIRPendidikanTab();
      case 'pekerjaan':
        return this.createAIRPekerjaanTab();
      case 'kesihatan':
        return this.createAIRKesihatanTab();
      default:
        return this.createAIRMaklumatAsasTab();
    }
  }

  // AIR Event Handlers
  openAIRDrawer(airId = null) {
    // Validate that KIR ID is available
    if (!this.kirId || this.kirId === 'null' || this.kirId === 'undefined') {
      console.error('Cannot open AIR drawer: KIR ID is not available');
      this.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
      return;
    }
    
    this.isDrawerOpen = true;
    this.currentDrawerTab = 'maklumat-asas';
    this.drawerDirtyTabs.clear();
    
    if (airId) {
      this.currentAIR = this.airData.find(air => air.id === airId) || {};
    } else {
      this.currentAIR = {};
    }
    
    this.render();
  }

  closeAIRDrawer() {
    if (this.drawerDirtyTabs.size > 0) {
      if (!confirm('Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti mahu menutup?')) {
        return;
      }
    }
    
    this.isDrawerOpen = false;
    this.currentAIR = null;
    this.currentDrawerTab = 'maklumat-asas';
    this.drawerDirtyTabs.clear();
    
    // Refresh AIR data
    this.loadAIRData().then(() => {
      this.render();
    });
  }

  switchDrawerTab(tabId) {
    this.currentDrawerTab = tabId;
    this.render();
  }

  editAIR(airId) {
    this.openAIRDrawer(airId);
  }

  async deleteAIR(airId) {
    const air = this.airData.find(a => a.id === airId);
    if (!air) return;
    
    if (!confirm(`Adakah anda pasti mahu memadam ${air.nama}?`)) {
      return;
    }
    
    try {
      await AIRService.deleteAIR(airId);
      this.showToast('AIR berjaya dipadam', 'success');
      await this.loadAIRData();
      this.render();
    } catch (error) {
      console.error('Error deleting AIR:', error);
      this.showToast('Ralat memadam AIR: ' + error.message, 'error');
    }
  }

  async saveAIRTab(tabId) {
    // Validate that KIR ID is available
    if (!this.kirId) {
      console.error('Cannot save AIR: KIR ID is not available');
      this.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
      return;
    }
    
    const form = document.querySelector(`form[data-drawer-tab="${tabId}"]`);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Remove empty values
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key];
      }
    });
    
    try {
      this.showDrawerSaveLoading(tabId);
      
      if (this.currentAIR?.id) {
        // Update existing AIR
        await AIRService.updateAIR(this.currentAIR.id, data);
        this.showToast('AIR berjaya dikemaskini', 'success');
      } else {
        // Create new AIR
        const newAIR = await AIRService.createAIR(this.kirId, data);
        this.currentAIR = newAIR;
        this.showToast('AIR berjaya ditambah', 'success');
      }
      
      this.drawerDirtyTabs.delete(tabId);
      this.render();
      
    } catch (error) {
      console.error('Error saving AIR:', error);
      this.showToast('Ralat menyimpan AIR: ' + error.message, 'error');
    } finally {
      this.hideDrawerSaveLoading(tabId);
    }
  }

  showDrawerSaveLoading(tabId) {
    const saveBtn = document.querySelector(`form[data-drawer-tab="${tabId}"] .btn-primary`);
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    }
  }

  hideDrawerSaveLoading(tabId) {
    const saveBtn = document.querySelector(`form[data-drawer-tab="${tabId}"] .btn-primary`);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Simpan';
    }
  }

  // AIR Inner Tab Content Methods
  createAIRMaklumatAsasTab() {
    const data = this.currentAIR || {};
    
    return `
      <form class="air-form" data-drawer-tab="maklumat-asas">
        <div class="form-section">
          <h4>Maklumat Asas</h4>
          
          <div class="form-group">
            <label for="air_gambar">Gambar</label>
            <input type="file" id="air_gambar" name="gambar" accept="image/*">
            ${data.gambar ? `<div class="current-image"><img src="${data.gambar}" alt="Gambar AIR" style="max-width: 100px;"></div>` : ''}
          </div>
          
          <div class="form-group">
            <label for="air_nama">Nama Penuh *</label>
            <input type="text" id="air_nama" name="nama" value="${data.nama || ''}" required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_no_kp">No. KP</label>
              <input type="text" id="air_no_kp" name="no_kp" value="${data.no_kp || ''}" placeholder="123456-12-1234">
            </div>
            
            <div class="form-group">
              <label for="air_sijil_lahir">Sijil Lahir</label>
              <input type="text" id="air_sijil_lahir" name="sijil_lahir" value="${data.sijil_lahir || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_tarikh_lahir">Tarikh Lahir *</label>
              <input type="date" id="air_tarikh_lahir" name="tarikh_lahir" value="${data.tarikh_lahir || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="air_hubungan">Hubungan *</label>
              <select id="air_hubungan" name="hubungan" required>
                <option value="">Pilih Hubungan</option>
                <option value="Suami" ${data.hubungan === 'Suami' ? 'selected' : ''}>Suami</option>
                <option value="Isteri" ${data.hubungan === 'Isteri' ? 'selected' : ''}>Isteri</option>
                <option value="Anak" ${data.hubungan === 'Anak' ? 'selected' : ''}>Anak</option>
                <option value="Ibu" ${data.hubungan === 'Ibu' ? 'selected' : ''}>Ibu</option>
                <option value="Bapa" ${data.hubungan === 'Bapa' ? 'selected' : ''}>Bapa</option>
                <option value="Adik Beradik" ${data.hubungan === 'Adik Beradik' ? 'selected' : ''}>Adik Beradik</option>
                <option value="Datuk/Nenek" ${data.hubungan === 'Datuk/Nenek' ? 'selected' : ''}>Datuk/Nenek</option>
                <option value="Lain-lain" ${data.hubungan === 'Lain-lain' ? 'selected' : ''}>Lain-lain</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveAIRTab('maklumat-asas')">Simpan</button>
        </div>
      </form>
    `;
  }

  createAIRPendidikanTab() {
    const data = this.currentAIR || {};
    
    return `
      <form class="air-form" data-drawer-tab="pendidikan">
        <div class="form-section">
          <h4>Pendidikan</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_tahap_semasa">Tahap Pendidikan Semasa</label>
              <select id="air_tahap_semasa" name="tahap_semasa">
                <option value="">Pilih Tahap</option>
                <option value="Tadika" ${data.tahap_semasa === 'Tadika' ? 'selected' : ''}>Tadika</option>
                <option value="Sekolah Rendah" ${data.tahap_semasa === 'Sekolah Rendah' ? 'selected' : ''}>Sekolah Rendah</option>
                <option value="Sekolah Menengah" ${data.tahap_semasa === 'Sekolah Menengah' ? 'selected' : ''}>Sekolah Menengah</option>
                <option value="Sijil/Diploma" ${data.tahap_semasa === 'Sijil/Diploma' ? 'selected' : ''}>Sijil/Diploma</option>
                <option value="Ijazah" ${data.tahap_semasa === 'Ijazah' ? 'selected' : ''}>Ijazah</option>
                <option value="Pascasiswazah" ${data.tahap_semasa === 'Pascasiswazah' ? 'selected' : ''}>Pascasiswazah</option>
                <option value="Tidak Bersekolah" ${data.tahap_semasa === 'Tidak Bersekolah' ? 'selected' : ''}>Tidak Bersekolah</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="air_sekolah_ipt">Sekolah/IPT</label>
              <input type="text" id="air_sekolah_ipt" name="sekolah_ipt" value="${data.sekolah_ipt || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_keperluan_sokongan">Keperluan Sokongan</label>
              <textarea id="air_keperluan_sokongan" name="keperluan_sokongan" rows="3">${data.keperluan_sokongan || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="air_keputusan">Keputusan</label>
              <input type="text" id="air_keputusan" name="keputusan" value="${data.keputusan || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_sekolah_kafa">Sekolah KAFA</label>
              <input type="text" id="air_sekolah_kafa" name="sekolah_kafa" value="${data.sekolah_kafa || ''}">
            </div>
            
            <div class="form-group">
              <label for="air_keputusan_kafa">Keputusan KAFA</label>
              <input type="text" id="air_keputusan_kafa" name="keputusan_kafa" value="${data.keputusan_kafa || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveAIRTab('pendidikan')">Simpan</button>
        </div>
      </form>
    `;
  }

  createAIRPekerjaanTab() {
    const data = this.currentAIR || {};
    
    return `
      <form class="air-form" data-drawer-tab="pekerjaan">
        <div class="form-section">
          <h4>Pekerjaan (Opsyenal)</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_status_pekerjaan">Status Pekerjaan</label>
              <select id="air_status_pekerjaan" name="status">
                <option value="">Pilih Status</option>
                <option value="Bekerja" ${data.status === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                <option value="Tidak Bekerja" ${data.status === 'Tidak Bekerja' ? 'selected' : ''}>Tidak Bekerja</option>
                <option value="Pelajar" ${data.status === 'Pelajar' ? 'selected' : ''}>Pelajar</option>
                <option value="Pesara" ${data.status === 'Pesara' ? 'selected' : ''}>Pesara</option>
                <option value="Suri Rumah" ${data.status === 'Suri Rumah' ? 'selected' : ''}>Suri Rumah</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="air_jenis_pekerjaan">Jenis Pekerjaan</label>
              <input type="text" id="air_jenis_pekerjaan" name="jenis" value="${data.jenis || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="air_pendapatan">Pendapatan Bulanan (RM)</label>
            <input type="number" id="air_pendapatan" name="pendapatan" value="${data.pendapatan || ''}" min="0" step="0.01">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveAIRTab('pekerjaan')">Simpan</button>
        </div>
      </form>
    `;
  }

  createAIRKesihatanTab() {
    const data = this.currentAIR || {};
    const statusMerokok = data.status_merokok === 'Ya';
    
    return `
      <form class="air-form" data-drawer-tab="kesihatan">
        <div class="form-section">
          <h4>Kesihatan</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_status_kesihatan">Status Kesihatan</label>
              <select id="air_status_kesihatan" name="status_kesihatan">
                <option value="">Pilih Status</option>
                <option value="Sihat" ${data.status_kesihatan === 'Sihat' ? 'selected' : ''}>Sihat</option>
                <option value="Kurang Sihat" ${data.status_kesihatan === 'Kurang Sihat' ? 'selected' : ''}>Kurang Sihat</option>
                <option value="Sakit Kronik" ${data.status_kesihatan === 'Sakit Kronik' ? 'selected' : ''}>Sakit Kronik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="air_diagnosis">Diagnosis</label>
              <input type="text" id="air_diagnosis" name="diagnosis" value="${data.diagnosis || ''}">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_rawatan_berterusan">Rawatan Berterusan</label>
              <textarea id="air_rawatan_berterusan" name="rawatan_berterusan" rows="3">${data.rawatan_berterusan || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="air_ubat">Ubat</label>
              <textarea id="air_ubat" name="ubat" rows="3">${data.ubat || ''}</textarea>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="air_oku">Status OKU</label>
              <select id="air_oku" name="oku">
                <option value="">Pilih Status</option>
                <option value="Ya" ${data.oku === 'Ya' ? 'selected' : ''}>Ya</option>
                <option value="Tidak" ${data.oku === 'Tidak' ? 'selected' : ''}>Tidak</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="air_status_merokok">Status Merokok</label>
              <select id="air_status_merokok" name="status_merokok" onchange="kirProfile.toggleSmokingFields(this.value)">
                <option value="">Pilih Status</option>
                <option value="Ya" ${data.status_merokok === 'Ya' ? 'selected' : ''}>Ya</option>
                <option value="Tidak" ${data.status_merokok === 'Tidak' ? 'selected' : ''}>Tidak</option>
              </select>
            </div>
          </div>
          
          <div class="smoking-fields" style="display: ${statusMerokok ? 'block' : 'none'}">
            <div class="form-row">
              <div class="form-group">
                <label for="air_mula_merokok">Mula Merokok (Umur)</label>
                <input type="number" id="air_mula_merokok" name="mula_merokok" value="${data.mula_merokok || ''}" min="1" max="100">
              </div>
              
              <div class="form-group">
                <label for="air_kekerapan_sehari">Kekerapan Sehari (Batang)</label>
                <input type="number" id="air_kekerapan_sehari" name="kekerapan_sehari" value="${data.kekerapan_sehari || ''}" min="1">
              </div>
            </div>
            
            <div class="form-group">
              <label for="air_jenis_rokok">Jenis Rokok</label>
              <input type="text" id="air_jenis_rokok" name="jenis_rokok" value="${data.jenis_rokok || ''}">
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveAIRTab('kesihatan')">Simpan</button>
        </div>
      </form>
    `;
  }

  toggleSmokingFields(value) {
    const smokingFields = document.querySelector('.smoking-fields');
    if (smokingFields) {
      smokingFields.style.display = value === 'Ya' ? 'block' : 'none';
    }
  }

  // PKIR Methods
  switchPKIRSection(section) {
    if (this.pkirDirtyTabs.has(this.currentPKIRSection)) {
      if (!confirm('Anda mempunyai perubahan yang belum disimpan. Adakah anda pasti untuk meninggalkan bahagian ini?')) {
        return;
      }
    }
    
    this.currentPKIRSection = section;
    this.render();
  }

  async savePKIRSection(section) {
    try {
      const form = document.querySelector(`form[data-section="${section}"]`);
      if (!form) return;

      const formData = new FormData(form);
      const sectionData = {};
      
      // Handle different section data structures
      if (section === 'maklumat-asas') {
        for (const [key, value] of formData.entries()) {
          sectionData[key] = value;
        }
        
        // Check for duplicate KIR if no_kp_pasangan is provided
        if (sectionData.no_kp_pasangan) {
          const existingKIR = await PasanganService.checkKIRByNoKp(sectionData.no_kp_pasangan);
          if (existingKIR && existingKIR.id !== this.kirId) {
            this.duplicateKIRWarning = existingKIR;
          } else {
            this.duplicateKIRWarning = null;
          }
        }
      } else if (section === 'kafa') {
        for (const [key, value] of formData.entries()) {
          sectionData[key] = value === '' ? null : (isNaN(value) ? value : parseInt(value));
        }
        // Calculate KAFA score
        sectionData.skor_kafa = PasanganService.calculateKAFAScore(sectionData);
      } else if (section === 'kesihatan') {
        // Handle basic fields
        sectionData.kumpulan_darah = formData.get('kumpulan_darah');
        
        // Handle penyakit kronik array
        sectionData.penyakit_kronik = [];
        let penyakitIndex = 0;
        while (formData.has(`penyakit_nama_${penyakitIndex}`)) {
          const nama = formData.get(`penyakit_nama_${penyakitIndex}`);
          const catatan = formData.get(`penyakit_catatan_${penyakitIndex}`);
          if (nama) {
            sectionData.penyakit_kronik.push({ nama, catatan });
          }
          penyakitIndex++;
        }
        
        // Handle ubat tetap array
        sectionData.ubat_tetap = [];
        let ubatIndex = 0;
        while (formData.has(`ubat_nama_${ubatIndex}`)) {
          const nama_ubat = formData.get(`ubat_nama_${ubatIndex}`);
          const dos = formData.get(`ubat_dos_${ubatIndex}`);
          const kekerapan = formData.get(`ubat_kekerapan_${ubatIndex}`);
          if (nama_ubat) {
            sectionData.ubat_tetap.push({ nama_ubat, dos, kekerapan });
          }
          ubatIndex++;
        }
      } else {
        // Handle other sections normally
        for (const [key, value] of formData.entries()) {
          sectionData[key] = value;
        }
      }

      // Update or create PKIR
      if (this.pkirData) {
        await PasanganService.updatePKIR(this.pkirData.id, { [section]: sectionData });
      } else {
        const newPKIR = await PasanganService.createPKIR(this.kirId, { [section]: sectionData });
        this.pkirData = { id: newPKIR.id, kir_id: this.kirId, [section]: sectionData };
      }

      // Update local data
      if (!this.pkirData[section]) this.pkirData[section] = {};
      Object.assign(this.pkirData[section], sectionData);
      
      this.pkirDirtyTabs.delete(section);
      this.showToast('Maklumat berjaya disimpan', 'success');
      this.render();
      
    } catch (error) {
      console.error('Error saving PKIR section:', error);
      this.showToast('Ralat menyimpan maklumat: ' + error.message, 'error');
    }
  }

  async createPKIRRecord() {
    try {
      const form = document.querySelector('#pkir-creation-form');
      if (!form) return;

      const formData = new FormData(form);
      const pkirData = {
        asas: {}
      };
      
      for (const [key, value] of formData.entries()) {
        pkirData.asas[key] = value;
      }

      const newPKIR = await PasanganService.createPKIR(this.kirId, pkirData);
      this.pkirData = { id: newPKIR.id, kir_id: this.kirId, ...pkirData };
      
      this.isPKIRModalOpen = false;
      this.currentPKIRSection = 'maklumat-asas';
      this.showToast('Rekod PKIR berjaya dicipta', 'success');
      this.render();
      
    } catch (error) {
      console.error('Error creating PKIR:', error);
      this.showToast('Ralat mencipta rekod PKIR: ' + error.message, 'error');
    }
  }

  async deletePKIRRecord() {
    if (!this.pkirData || !confirm('Adakah anda pasti untuk memadam rekod PKIR ini? Tindakan ini tidak boleh dibatalkan.')) {
      return;
    }

    try {
      await PasanganService.deletePKIR(this.pkirData.id);
      this.pkirData = null;
      this.showToast('Rekod PKIR berjaya dipadam', 'success');
      this.render();
    } catch (error) {
      console.error('Error deleting PKIR:', error);
      this.showToast('Ralat memadam rekod PKIR: ' + error.message, 'error');
    }
  }

  openPKIRModal() {
    this.isPKIRModalOpen = true;
    this.render();
  }

  closePKIRModal() {
    this.isPKIRModalOpen = false;
    this.render();
  }

  // Dynamic list management for Kesihatan section
  addPenyakitKronik() {
    const container = document.getElementById('pkir-penyakit-kronik-list');
    const index = container.children.length;
    
    const itemHTML = `
      <div class="dynamic-item" data-index="${index}">
        <div class="form-row">
          <div class="form-group">
            <input type="text" name="penyakit_nama_${index}" placeholder="Nama Penyakit">
          </div>
          <div class="form-group">
            <input type="text" name="penyakit_catatan_${index}" placeholder="Catatan">
          </div>
          <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removePenyakitKronik(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    this.pkirDirtyTabs.add('kesihatan');
  }

  removePenyakitKronik(index) {
    const item = document.querySelector(`#pkir-penyakit-kronik-list .dynamic-item[data-index="${index}"]`);
    if (item) {
      item.remove();
      this.pkirDirtyTabs.add('kesihatan');
    }
  }

  addUbatTetap() {
    const container = document.getElementById('pkir-ubat-tetap-list');
    const index = container.children.length;
    
    const itemHTML = `
      <div class="dynamic-item" data-index="${index}">
        <div class="form-row">
          <div class="form-group">
            <input type="text" name="ubat_nama_${index}" placeholder="Nama Ubat">
          </div>
          <div class="form-group">
            <input type="text" name="ubat_dos_${index}" placeholder="Dos">
          </div>
          <div class="form-group">
            <input type="text" name="ubat_kekerapan_${index}" placeholder="Kekerapan">
          </div>
          <button type="button" class="btn btn-danger btn-sm" onclick="kirProfile.removeUbatTetap(${index})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', itemHTML);
    this.pkirDirtyTabs.add('kesihatan');
  }

  removeUbatTetap(index) {
    const item = document.querySelector(`#pkir-ubat-tetap-list .dynamic-item[data-index="${index}"]`);
    if (item) {
      item.remove();
      this.pkirDirtyTabs.add('kesihatan');
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  navigateToRelatedKIR(kirId) {
    window.location.href = `/admin/kir/${kirId}`;
  }

  // Helper method to get Kekeluargaan data for pre-filling PKIR modal
  getKekeluargaanPasanganData() {
    const kekeluargaanData = this.relatedData?.keluarga || {};
    
    return {
      nama_pasangan: kekeluargaanData.nama_pasangan || '',
      no_kp_pasangan: kekeluargaanData.pasangan_no_kp || '',
      tarikh_lahir_pasangan: '', // Not available in Kekeluargaan tab
      telefon_pasangan: '', // Not available in Kekeluargaan tab
      alamat_pasangan: kekeluargaanData.pasangan_alamat || '',
      status_pasangan: kekeluargaanData.pasangan_status || 'Hidup'
    };
  }

  // ===== KESIHATAN KIR METHODS =====

  // Switch between Kesihatan sections
  async switchKesihatanSection(sectionId) {
    if (sectionId === this.currentKesihatanSection) return;
    
    // Check for unsaved changes
    if (this.kesihatanDirtyTabs.has(this.currentKesihatanSection)) {
      const confirmed = await this.confirmUnsavedChanges();
      if (!confirmed) return;
    }
    
    this.currentKesihatanSection = sectionId;
    
    // Update section content
    const sectionContent = document.querySelector('.kesihatan-section-content');
    if (sectionContent) {
      sectionContent.innerHTML = this.createKesihatanSectionContent();
    }
    
    // Update active section navigation
    this.updateKesihatanSectionNavigation();
  }

  // Update Kesihatan section navigation
  updateKesihatanSectionNavigation() {
    const sectionNav = document.querySelector('.kesihatan-section-navigation');
    if (sectionNav) {
      sectionNav.innerHTML = this.createKesihatanSectionNavigation().replace('<div class="kesihatan-section-navigation">', '').replace('</div>', '');
    }
  }

  // Save Kesihatan section data
  async saveKesihatanSection(sectionId, formData) {
    try {
      let sectionData = {};
      
      if (sectionId === 'ringkasan') {
        // Handle checkbox array for penyakit_kronik
        const penyakitKronik = [];
        const checkboxes = document.querySelectorAll('input[name="penyakit_kronik"]:checked');
        checkboxes.forEach(checkbox => {
          penyakitKronik.push(checkbox.value);
        });
        
        sectionData = {
          kumpulan_darah: formData.get('kumpulan_darah'),
          penyakit_kronik: penyakitKronik,
          catatan: formData.get('catatan')
        };
      } else {
        // Handle other sections normally
        for (const [key, value] of formData.entries()) {
          sectionData[key] = value;
        }
      }
      
      // Update KIR with kesihatan data
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData[sectionId] = sectionData;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData) this.relatedData = {};
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan[sectionId] = sectionData;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.kesihatanDirtyTabs.delete(sectionId);
      this.showToast('Maklumat kesihatan berjaya disimpan', 'success');
      
      // Update header timestamp
      this.updateKesihatanHeader();
      
    } catch (error) {
      console.error('Error saving kesihatan section:', error);
      this.showToast('Ralat menyimpan maklumat: ' + error.message, 'error');
    }
  }

  // Update Kesihatan header with timestamp
  updateKesihatanHeader() {
    const header = document.querySelector('.kesihatan-last-updated');
    if (header && this.relatedData?.kesihatan?.updated_at) {
      header.innerHTML = `Kemaskini terakhir: ${new Date(this.relatedData.kesihatan.updated_at).toLocaleString('ms-MY')}`;
    }
  }

  // Mark Kesihatan section as dirty
  markKesihatanSectionDirty(sectionId) {
    this.kesihatanDirtyTabs.add(sectionId);
    this.updateKesihatanSectionNavigation();
  }

  // ===== UBAT TETAP METHODS =====

  // Add new ubat tetap
  addUbatTetapKIR() {
    const modal = this.createUbatTetapModal();
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Edit ubat tetap
  editUbatTetapKIR(index) {
    const ubat = this.relatedData?.kesihatan?.ubat_tetap?.[index];
    if (!ubat) return;
    
    const modal = this.createUbatTetapModal(ubat, index);
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Delete ubat tetap
  async deleteUbatTetapKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam ubat ini?')) return;
    
    try {
      const ubatTetap = [...(this.relatedData?.kesihatan?.ubat_tetap || [])];
      ubatTetap.splice(index, 1);
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.ubat_tetap = ubatTetap;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.ubat_tetap = ubatTetap;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast('Ubat berjaya dipadam', 'success');
      this.refreshKesihatanSection();
      
    } catch (error) {
      console.error('Error deleting ubat tetap:', error);
      this.showToast('Ralat memadam ubat: ' + error.message, 'error');
    }
  }

  // Create ubat tetap modal
  createUbatTetapModal(ubat = null, index = null) {
    const isEdit = ubat !== null;
    
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h4>${isEdit ? 'Edit' : 'Tambah'} Ubat Tetap</h4>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="modal-form" onsubmit="kirProfile.saveUbatTetapKIR(event, ${index})">
            <div class="form-group">
              <label for="nama_ubat">Nama Ubat *</label>
              <input type="text" id="nama_ubat" name="nama_ubat" value="${ubat?.nama_ubat || ''}" required>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="dos">Dos</label>
                <input type="text" id="dos" name="dos" value="${ubat?.dos || ''}" placeholder="Contoh: 500mg">
              </div>
              
              <div class="form-group">
                <label for="kekerapan">Kekerapan</label>
                <input type="text" id="kekerapan" name="kekerapan" value="${ubat?.kekerapan || ''}" placeholder="Contoh: 2 kali sehari">
              </div>
            </div>
            
            <div class="form-group">
              <label for="catatan">Catatan</label>
              <textarea id="catatan" name="catatan" rows="3" placeholder="Catatan tambahan...">${ubat?.catatan || ''}</textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Save ubat tetap
  async saveUbatTetapKIR(event, index = null) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const ubatData = {
        nama_ubat: formData.get('nama_ubat'),
        dos: formData.get('dos'),
        kekerapan: formData.get('kekerapan'),
        catatan: formData.get('catatan')
      };
      
      const ubatTetap = [...(this.relatedData?.kesihatan?.ubat_tetap || [])];
      
      if (index !== null) {
        // Edit existing
        ubatTetap[index] = ubatData;
      } else {
        // Add new
        ubatTetap.push(ubatData);
      }
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.ubat_tetap = ubatTetap;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.ubat_tetap = ubatTetap;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast(`Ubat berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
      
      // Close modal
      document.querySelector('.modal-overlay').remove();
      
    } catch (error) {
      console.error('Error saving ubat tetap:', error);
      this.showToast('Ralat menyimpan ubat: ' + error.message, 'error');
    }
  }

  // ===== RAWATAN METHODS =====

  // Add new rawatan
  addRawatanKIR() {
    const modal = this.createRawatanModal();
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Edit rawatan
  editRawatanKIR(index) {
    const rawatan = this.relatedData?.kesihatan?.rawatan?.[index];
    if (!rawatan) return;
    
    const modal = this.createRawatanModal(rawatan, index);
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Delete rawatan
  async deleteRawatanKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam rawatan ini?')) return;
    
    try {
      const rawatan = [...(this.relatedData?.kesihatan?.rawatan || [])];
      rawatan.splice(index, 1);
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.rawatan = rawatan;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.rawatan = rawatan;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast('Rawatan berjaya dipadam', 'success');
      this.refreshKesihatanSection();
      
    } catch (error) {
      console.error('Error deleting rawatan:', error);
      this.showToast('Ralat memadam rawatan: ' + error.message, 'error');
    }
  }

  // Create rawatan modal
  createRawatanModal(rawatan = null, index = null) {
    const isEdit = rawatan !== null;
    
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h4>${isEdit ? 'Edit' : 'Tambah'} Rawatan / Follow-up</h4>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="modal-form" onsubmit="kirProfile.saveRawatanKIR(event, ${index})">
            <div class="form-group">
              <label for="fasiliti">Fasiliti *</label>
              <input type="text" id="fasiliti" name="fasiliti" value="${rawatan?.fasiliti || ''}" required placeholder="Contoh: Hospital Kuala Lumpur">
            </div>
            
            <div class="form-group">
              <label for="tarikh">Tarikh *</label>
              <input type="date" id="tarikh" name="tarikh" value="${rawatan?.tarikh || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="catatan">Catatan</label>
              <textarea id="catatan" name="catatan" rows="3" placeholder="Catatan rawatan...">${rawatan?.catatan || ''}</textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Save rawatan
  async saveRawatanKIR(event, index = null) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const rawatanData = {
        fasiliti: formData.get('fasiliti'),
        tarikh: formData.get('tarikh'),
        catatan: formData.get('catatan')
      };
      
      const rawatan = [...(this.relatedData?.kesihatan?.rawatan || [])];
      
      if (index !== null) {
        // Edit existing
        rawatan[index] = rawatanData;
      } else {
        // Add new
        rawatan.push(rawatanData);
      }
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.rawatan = rawatan;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.rawatan = rawatan;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast(`Rawatan berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
      
      // Close modal
      document.querySelector('.modal-overlay').remove();
      
    } catch (error) {
      console.error('Error saving rawatan:', error);
      this.showToast('Ralat menyimpan rawatan: ' + error.message, 'error');
    }
  }

  // ===== PEMBEDAHAN METHODS =====

  // Add new pembedahan
  addPembedahanKIR() {
    const modal = this.createPembedahanModal();
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Edit pembedahan
  editPembedahanKIR(index) {
    const pembedahan = this.relatedData?.kesihatan?.pembedahan?.[index];
    if (!pembedahan) return;
    
    const modal = this.createPembedahanModal(pembedahan, index);
    document.body.insertAdjacentHTML('beforeend', modal);
  }

  // Delete pembedahan
  async deletePembedahanKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam pembedahan ini?')) return;
    
    try {
      const pembedahan = [...(this.relatedData?.kesihatan?.pembedahan || [])];
      pembedahan.splice(index, 1);
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.pembedahan = pembedahan;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.pembedahan = pembedahan;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast('Pembedahan berjaya dipadam', 'success');
      this.refreshKesihatanSection();
      
    } catch (error) {
      console.error('Error deleting pembedahan:', error);
      this.showToast('Ralat memadam pembedahan: ' + error.message, 'error');
    }
  }

  // Create pembedahan modal
  createPembedahanModal(pembedahan = null, index = null) {
    const isEdit = pembedahan !== null;
    
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h4>${isEdit ? 'Edit' : 'Tambah'} Sejarah Pembedahan</h4>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form class="modal-form" onsubmit="kirProfile.savePembedahanKIR(event, ${index})">
            <div class="form-group">
              <label for="tarikh">Tarikh *</label>
              <input type="date" id="tarikh" name="tarikh" value="${pembedahan?.tarikh || ''}" required>
            </div>
            
            <div class="form-group">
              <label for="jenis_pembedahan">Jenis Pembedahan *</label>
              <input type="text" id="jenis_pembedahan" name="jenis_pembedahan" value="${pembedahan?.jenis_pembedahan || ''}" required placeholder="Contoh: Appendectomy">
            </div>
            
            <div class="form-group">
              <label for="hospital">Hospital *</label>
              <input type="text" id="hospital" name="hospital" value="${pembedahan?.hospital || ''}" required placeholder="Contoh: Hospital Kuala Lumpur">
            </div>
            
            <div class="form-group">
              <label for="status">Status *</label>
              <select id="status" name="status" required>
                <option value="">Pilih Status</option>
                <option value="Selesai" ${pembedahan?.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                <option value="Perlu Follow-up" ${pembedahan?.status === 'Perlu Follow-up' ? 'selected' : ''}>Perlu Follow-up</option>
              </select>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                Batal
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Save pembedahan
  async savePembedahanKIR(event, index = null) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const pembedahanData = {
        tarikh: formData.get('tarikh'),
        jenis_pembedahan: formData.get('jenis_pembedahan'),
        hospital: formData.get('hospital'),
        status: formData.get('status')
      };
      
      const pembedahan = [...(this.relatedData?.kesihatan?.pembedahan || [])];
      
      if (index !== null) {
        // Edit existing
        pembedahan[index] = pembedahanData;
      } else {
        // Add new
        pembedahan.push(pembedahanData);
      }
      
      const kesihatanData = { ...this.relatedData?.kesihatan };
      kesihatanData.pembedahan = pembedahan;
      kesihatanData.updated_at = new Date().toISOString();
      
      await KIRService.updateRelatedDocument(this.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.relatedData.kesihatan) this.relatedData.kesihatan = {};
      this.relatedData.kesihatan.pembedahan = pembedahan;
      this.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.showToast(`Pembedahan berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
      
      // Close modal
      document.querySelector('.modal-overlay').remove();
      
    } catch (error) {
      console.error('Error saving pembedahan:', error);
      this.showToast('Ralat menyimpan pembedahan: ' + error.message, 'error');
    }
  }

  // Refresh current kesihatan section
  refreshKesihatanSection() {
    const sectionContent = document.querySelector('.kesihatan-section-content');
    if (sectionContent) {
      sectionContent.innerHTML = this.createKesihatanSectionContent();
    }
    this.updateKesihatanHeader();
  }

  // Program & Kehadiran Tab
  createProgramTab() {
    return `
      <div class="program-tab-content">
        <div class="program-header">
          <h3>Program & Kehadiran</h3>
          <div class="program-filters">
            <input type="date" id="program-date-from" placeholder="Tarikh Mula">
            <input type="date" id="program-date-to" placeholder="Tarikh Akhir">
            <select id="program-kategori">
              <option value="">Semua Kategori</option>
              <option value="Kemahiran">Kemahiran</option>
              <option value="Kesihatan">Kesihatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Keagamaan">Keagamaan</option>
            </select>
            <input type="text" id="program-search" placeholder="Cari nama program...">
          </div>
        </div>
        
        <div class="program-table-container">
          <div class="loading-skeleton" id="program-loading">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
          </div>
          <div id="program-table"></div>
        </div>
      </div>
    `;
  }

  // Bind financial event listeners
  bindFinancialEventListeners() {
    // Pendapatan form submission
    const pendapatanForm = document.getElementById('pendapatan-form');
    if (pendapatanForm) {
      pendapatanForm.addEventListener('submit', (e) => this.handlePendapatanSubmit(e));
    }

    // Perbelanjaan form submission
    const perbelanjaanForm = document.getElementById('perbelanjaan-form');
    if (perbelanjaanForm) {
      perbelanjaanForm.addEventListener('submit', (e) => this.handlePerbelanjaanSubmit(e));
    }

    // Bantuan Bulanan form submission
    const bantuanForm = document.getElementById('bantuan-bulanan-form');
    if (bantuanForm) {
      bantuanForm.addEventListener('submit', (e) => this.handleBantuanBulananSubmit(e));
    }

    // Modal close buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('close-modal')) {
        if (e.target.closest('#pendapatan-modal')) {
          this.closePendapatanModal();
        } else if (e.target.closest('#perbelanjaan-modal')) {
          this.closePerbelanjaanModal();
        } else if (e.target.closest('#bantuan-bulanan-modal')) {
          this.closeBantuanBulananModal();
        }
      }
    });

    // Currency input formatting
    document.addEventListener('input', (e) => {
      if (e.target.type === 'number' && e.target.name === 'jumlah' || e.target.name === 'kadar') {
        // Prevent negative values
        if (parseFloat(e.target.value) < 0) {
          e.target.value = 0;
        }
      }
    });
  }

  // Program & Kehadiran data loading and methods
  async loadProgramData() {
    try {
      const loadingElement = document.getElementById('program-loading');
      const tableElement = document.getElementById('program-table');
      
      if (loadingElement) loadingElement.style.display = 'block';
      if (tableElement) tableElement.style.display = 'none';
      
      this.programData = await ProgramService.listKehadiranByKir(this.kirId);
      this.renderProgramTable();
      
      if (loadingElement) loadingElement.style.display = 'none';
      if (tableElement) tableElement.style.display = 'block';
    } catch (error) {
      console.error('Error loading program data:', error);
      this.showToast('Gagal memuat data program: ' + error.message, 'error');
    }
  }

  renderProgramTable() {
    const tableContainer = document.getElementById('program-table');
    if (!tableContainer) return;
    
    if (!this.programData || this.programData.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-alt"></i>
          <h4>Tiada program berkaitan</h4>
          <p>Belum ada program yang didaftarkan atau tiada program yang berkaitan dengan KIR ini.</p>
        </div>
      `;
      return;
    }
    
    const tableHTML = `
      <table class="program-table">
        <thead>
          <tr>
            <th>Tarikh Program</th>
            <th>Nama Program</th>
            <th>Kategori</th>
            <th>Kehadiran</th>
            <th>Catatan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${this.programData.map(program => `
            <tr data-program-id="${program.id}">
              <td>${this.formatDate(program.tarikh)}</td>
              <td>${program.nama_program || 'Tidak dinyatakan'}</td>
              <td><span class="kategori-badge kategori-${program.kategori?.toLowerCase()}">${program.kategori || 'Lain-lain'}</span></td>
              <td>
                <label class="toggle-switch">
                  <input type="checkbox" ${program.hadir ? 'checked' : ''} 
                         onchange="kirProfile.toggleKehadiran('${program.id}', this.checked)">
                  <span class="toggle-slider"></span>
                </label>
                <span class="kehadiran-status ${program.hadir ? 'hadir' : 'tidak-hadir'}">
                  ${program.hadir ? 'Hadir' : 'Tidak Hadir'}
                </span>
              </td>
              <td>
                <input type="text" class="catatan-input" 
                       value="${program.catatan || ''}" 
                       placeholder="Catatan (pilihan)"
                       onblur="kirProfile.updateCatatan('${program.id}', this.value)">
              </td>
              <td>
                <button class="btn btn-sm btn-secondary" onclick="kirProfile.viewProgramDetails('${program.id}')">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
  }

  async toggleKehadiran(programId, hadir) {
    try {
      const program = this.programData.find(p => p.id === programId);
      if (!program) return;
      
      // Optimistic update
      program.hadir = hadir;
      this.renderProgramTable();
      
      // Get catatan from input
      const catatanInput = document.querySelector(`tr[data-program-id="${programId}"] .catatan-input`);
      const catatan = catatanInput ? catatanInput.value : '';
      
      await ProgramService.setKehadiran(this.kirId, programId, hadir, catatan);
      
      // Log audit trail
      await AuditService.logProgramChange(
        this.kirId, 
        'kehadiran', 
        !hadir, 
        hadir, 
        'user'
      );
      
      this.showToast(`Kehadiran ${hadir ? 'direkod' : 'dibatalkan'} berjaya`, 'success');
    } catch (error) {
      console.error('Error toggling kehadiran:', error);
      // Rollback optimistic update
      const program = this.programData.find(p => p.id === programId);
      if (program) {
        program.hadir = !hadir;
        this.renderProgramTable();
      }
      this.showToast('Gagal mengemas kini kehadiran: ' + error.message, 'error');
    }
  }

  async updateCatatan(programId, catatan) {
    try {
      const program = this.programData.find(p => p.id === programId);
      if (!program) return;
      
      const oldCatatan = program.catatan;
      program.catatan = catatan;
      
      await ProgramService.setKehadiran(this.kirId, programId, program.hadir, catatan);
      
      // Log audit trail if catatan changed
      if (oldCatatan !== catatan) {
        await AuditService.logProgramChange(
          this.kirId, 
          'catatan', 
          oldCatatan, 
          catatan, 
          'user'
        );
      }
    } catch (error) {
      console.error('Error updating catatan:', error);
      this.showToast('Gagal mengemas kini catatan: ' + error.message, 'error');
    }
  }

  viewProgramDetails(programId) {
    const program = this.programData.find(p => p.id === programId);
    if (!program) return;
    
    // Simple alert for now - can be enhanced with modal
    alert(`Program: ${program.nama_program}\nKategori: ${program.kategori}\nTarikh: ${this.formatDate(program.tarikh)}\nLokasi: ${program.lokasi || 'Tidak dinyatakan'}\nPenerangan: ${program.penerangan || 'Tiada penerangan'}`);
  }

  bindProgramEventListeners() {
    // Filter event listeners
    const dateFromInput = document.getElementById('program-date-from');
    const dateToInput = document.getElementById('program-date-to');
    const kategoriSelect = document.getElementById('program-kategori');
    const searchInput = document.getElementById('program-search');
    
    [dateFromInput, dateToInput, kategoriSelect, searchInput].forEach(element => {
      if (element) {
        element.addEventListener('change', () => this.filterPrograms());
        if (element.type === 'text') {
          element.addEventListener('input', () => this.filterPrograms());
        }
      }
    });
  }

  filterPrograms() {
    // Simple client-side filtering for now
    const dateFrom = document.getElementById('program-date-from')?.value;
    const dateTo = document.getElementById('program-date-to')?.value;
    const kategori = document.getElementById('program-kategori')?.value;
    const search = document.getElementById('program-search')?.value?.toLowerCase();
    
    if (!this.programData) return;
    
    let filteredData = [...this.programData];
    
    if (dateFrom) {
      filteredData = filteredData.filter(p => new Date(p.tarikh) >= new Date(dateFrom));
    }
    if (dateTo) {
      filteredData = filteredData.filter(p => new Date(p.tarikh) <= new Date(dateTo));
    }
    if (kategori) {
      filteredData = filteredData.filter(p => p.kategori === kategori);
    }
    if (search) {
      filteredData = filteredData.filter(p => 
        p.nama_program?.toLowerCase().includes(search) ||
        p.penerangan?.toLowerCase().includes(search)
      );
    }
    
    // Temporarily replace data for rendering
    const originalData = this.programData;
    this.programData = filteredData;
    this.renderProgramTable();
    this.programData = originalData;
  }

  // Toast notification helper
  showToast(message, type = 'info') {
    // Simple toast implementation - can be enhanced
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Global instance
window.kirProfile = new KIRProfile();