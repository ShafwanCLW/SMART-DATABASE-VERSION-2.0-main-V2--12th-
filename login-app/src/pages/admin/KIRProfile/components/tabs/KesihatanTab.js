import { BaseTab } from '../shared/BaseTab.js';
import { FormHelpers } from '../shared/FormHelpers.js';

export class KesihatanTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile, 'kesihatan');
    this.currentKesihatanSection = 'ringkasan';
    this.kesihatanDirtyTabs = new Set();
  }

  render() {
    const data = this.kirProfile.relatedData?.kesihatan || {};
    
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

  createKesihatanSectionNavigation() {
    // Navigation removed: Kesihatan is now a single flow page
    return `
      <div class="kesihatan-section-navigation"></div>
    `;
  }

  createKesihatanSectionContent() {
    // Single-flow: render all sections sequentially
    const content = [
      this.createRingkasanKesihatanSection(),
      this.createUbatTetapSection(),
      this.createRawatanSection(),
      this.createPembedahanSection(),
      // Bottom page actions: move Simpan Ringkasan Kesihatan button here
      `
      <div class="page-actions">
        <button type="button" class="btn btn-primary" onclick="kesihatanTab.save()">
          <i class="fas fa-save"></i> Simpan Ringkasan Kesihatan
        </button>
      </div>
      `
    ].join('');

    return content;
  }

  createRingkasanKesihatanSection() {
    const data = this.kirProfile.relatedData?.kesihatan || {};
    
    const kumpulanDarah = data.kumpulan_darah || data.blood_type || '';
    const penyakitKronik = data.penyakit_kronik || data.chronic_diseases || [];
    const catatanKesihatan = data.catatan_kesihatan || '';
    const statusMerokok = data.status_merokok || '';
    
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
            <div class="form-group">
              <label for="status_merokok">Status Merokok</label>
              <select id="status_merokok" name="status_merokok">
                <option value="">Pilih Status</option>
                <option value="Ya" ${statusMerokok === 'Ya' ? 'selected' : ''}>Ya</option>
                <option value="Tidak" ${statusMerokok === 'Tidak' ? 'selected' : ''}>Tidak</option>
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
            <label for="catatan_kesihatan">Catatan Tahap Kesihatan</label>
            <textarea id="catatan_kesihatan" name="catatan_kesihatan" rows="4" placeholder="Catatan tambahan mengenai kesihatan...">${FormHelpers.escapeHtml(catatanKesihatan)}</textarea>
          </div>
          
          <!-- Save button moved to bottom page actions -->
        </div>
      </form>
    `;
  }

  createUbatTetapSection() {
    const data = this.kirProfile.relatedData?.kesihatan?.ubat_tetap || [];
    
    const tableRows = (data.length === 0)
      ? `<tr class="empty-row"><td colspan="5">Tiada Ubat-ubatan Tetap</td></tr>`
      : data.map((ubat, index) => `
      <tr>
        <td>${FormHelpers.escapeHtml(ubat.nama_ubat || '')}</td>
        <td>${FormHelpers.escapeHtml(ubat.dos || '')}</td>
        <td>${FormHelpers.escapeHtml(ubat.kekerapan || '')}</td>
        <td>${FormHelpers.escapeHtml(ubat.catatan || '')}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kesihatanTab.editUbatTetapKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kesihatanTab.deleteUbatTetapKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Ubat-ubatan Tetap</h4>
        <button class="btn btn-primary" onclick="kesihatanTab.addUbatTetapKIR()">
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

  createRawatanSection() {
    const data = this.kirProfile.relatedData?.kesihatan?.rawatan || [];
    
    const tableRows = (data.length === 0)
      ? `<tr class="empty-row"><td colspan="4">Tiada Rawatan / Follow-up</td></tr>`
      : data.map((rawatan, index) => `
      <tr>
        <td>${FormHelpers.escapeHtml(rawatan.fasiliti || '')}</td>
        <td>${rawatan.tarikh ? new Date(rawatan.tarikh).toLocaleDateString('ms-MY') : ''}</td>
        <td>${FormHelpers.escapeHtml(rawatan.catatan || '')}</td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kesihatanTab.editRawatanKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kesihatanTab.deleteRawatanKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Rawatan / Follow-up Berkala</h4>
        <button class="btn btn-primary" onclick="kesihatanTab.addRawatanKIR()">
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

  createPembedahanSection() {
    const data = this.kirProfile.relatedData?.kesihatan?.pembedahan || [];
    
    const timelineItems = (data.length === 0)
      ? `<div class="empty-row">Tiada Sejarah Pembedahan</div>`
      : data
        .sort((a, b) => new Date(b.tarikh) - new Date(a.tarikh))
        .map(pembedahan => `
        <div class="timeline-item">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h5>${FormHelpers.escapeHtml(pembedahan.jenis_pembedahan || 'Pembedahan')}</h5>
              <span class="timeline-date">${pembedahan.tarikh ? new Date(pembedahan.tarikh).toLocaleDateString('ms-MY') : ''}</span>
            </div>
            <div class="timeline-body">
              <p><strong>Hospital:</strong> ${FormHelpers.escapeHtml(pembedahan.hospital || 'Tidak dinyatakan')}</p>
              <span class="status-badge ${pembedahan.status === 'Selesai' ? 'status-success' : 'status-warning'}">
                ${FormHelpers.escapeHtml(pembedahan.status || 'Perlu Follow-up')}
              </span>
            </div>
          </div>
        </div>
      `).join('');
    
    const tableRows = (data.length === 0)
      ? `<tr class="empty-row"><td colspan="5">Tiada Sejarah Pembedahan</td></tr>`
      : data.map((pembedahan, index) => `
      <tr>
        <td>${pembedahan.tarikh ? new Date(pembedahan.tarikh).toLocaleDateString('ms-MY') : ''}</td>
        <td>${FormHelpers.escapeHtml(pembedahan.jenis_pembedahan || '')}</td>
        <td>${FormHelpers.escapeHtml(pembedahan.hospital || '')}</td>
        <td>
          <span class="status-badge ${pembedahan.status === 'Selesai' ? 'status-success' : 'status-warning'}">
            ${FormHelpers.escapeHtml(pembedahan.status || 'Perlu Follow-up')}
          </span>
        </td>
        <td>
          <div class="action-menu">
            <button class="action-menu-btn" title="Edit" onclick="kesihatanTab.editPembedahanKIR(${index})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-menu-btn" title="Padam" onclick="kesihatanTab.deletePembedahanKIR(${index})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
    
    return `
      <div class="section-header">
        <h4>Sejarah Pembedahan</h4>
        <button class="btn btn-primary" onclick="kesihatanTab.addPembedahanKIR()">
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

  updateKesihatanSectionNavigation() {
    const sectionNav = document.querySelector('.kesihatan-section-navigation');
    if (sectionNav) {
      sectionNav.innerHTML = this.createKesihatanSectionNavigation().replace('<div class="kesihatan-section-navigation">', '').replace('</div>', '');
    }
  }

  async confirmUnsavedChanges() {
    return true; // Always allow navigation without popup
  }

  // Ubat Tetap Methods
  addUbatTetapKIR() {
    const modal = this.createUbatTetapModal();
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  editUbatTetapKIR(index) {
    const ubat = this.kirProfile.relatedData?.kesihatan?.ubat_tetap?.[index];
    if (!ubat) return;
    
    const modal = this.createUbatTetapModal(ubat, index);
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  async deleteUbatTetapKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam ubat ini?')) return;
    
    try {
      const ubatTetap = [...(this.kirProfile.relatedData?.kesihatan?.ubat_tetap || [])];
      ubatTetap.splice(index, 1);
      
      const kesihatanData = { ...this.kirProfile.relatedData?.kesihatan };
      kesihatanData.ubat_tetap = ubatTetap;
      kesihatanData.updated_at = new Date().toISOString();
      
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.kirProfile.relatedData.kesihatan) this.kirProfile.relatedData.kesihatan = {};
      this.kirProfile.relatedData.kesihatan.ubat_tetap = ubatTetap;
      this.kirProfile.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      
      this.kirProfile.showToast('Ubat berjaya dipadam', 'success');
      this.refreshKesihatanSection();
      
    } catch (error) {
      console.error('Error deleting ubat tetap:', error);
      this.kirProfile.showToast('Ralat memadam ubat: ' + error.message, 'error');
    }
  }

  createUbatTetapModal(ubat = null, index = null) {
    const isEdit = ubat !== null;
    
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-info">
              <span class="modal-eyebrow">Ubat-ubatan Tetap</span>
              <h4>${isEdit ? 'Kemaskini' : 'Tambah'} Ubat Tetap</h4>
              <p class="modal-subtitle">Lengkapkan maklumat ubat untuk memastikan rekod kesihatan kekal tepat.</p>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="wizard-steps">
            <div class="step-indicator active">
              <span class="step-index">1</span>
              <div class="step-label">
                <span class="step-title">Maklumat Ubat</span>
                <span class="step-subtitle">Nama, dos & kekerapan</span>
              </div>
            </div>
            <div class="step-indicator">
              <span class="step-index">2</span>
              <div class="step-label">
                <span class="step-title">Catatan & Semakan</span>
                <span class="step-subtitle">Nota tambahan sebelum simpan</span>
              </div>
            </div>
          </div>
          
          <form class="modal-form" onsubmit="kesihatanTab.saveUbatTetapKIR(event, ${index})">
            <div class="wizard-step active" data-step="1">
              <div class="wizard-step-body">
                <p class="wizard-intro">Isi maklumat asas ubat bagi membantu pegawai kesihatan membuat rujukan pantas.</p>
                <div class="form-group">
                  <label for="nama_ubat">Nama Ubat *</label>
                  <input type="text" id="nama_ubat" name="nama_ubat" value="${FormHelpers.escapeHtml(ubat?.nama_ubat || '')}" required placeholder="Contoh: Metformin 500mg">
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="dos">Dos</label>
                    <input type="text" id="dos" name="dos" value="${FormHelpers.escapeHtml(ubat?.dos || '')}" placeholder="Contoh: 500mg">
                  </div>
                  
                  <div class="form-group">
                    <label for="kekerapan">Kekerapan</label>
                    <input type="text" id="kekerapan" name="kekerapan" value="${FormHelpers.escapeHtml(ubat?.kekerapan || '')}" placeholder="Contoh: 2 kali sehari">
                  </div>
                </div>
              </div>
              
              <div class="wizard-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                <button type="button" class="btn btn-primary" onclick="kesihatanTab.nextWizardStep(this)">Seterusnya</button>
              </div>
            </div>
            
            <div class="wizard-step" data-step="2">
              <div class="wizard-step-body">
                <p class="wizard-intro">Catatan membantu mengingat arahan atau perubahan terbaharu kepada ubat ini.</p>
                <div class="form-group">
                  <label for="catatan">Catatan</label>
                  <textarea id="catatan" name="catatan" rows="4" placeholder="Catatan tambahan...">${FormHelpers.escapeHtml(ubat?.catatan || '')}</textarea>
                </div>
              </div>
              <div class="wizard-footer wizard-footer--end">
                <button type="button" class="btn btn-secondary" onclick="kesihatanTab.prevWizardStep(this)">Kembali</button>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

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
      
      const ubatTetap = [...(this.kirProfile.relatedData?.kesihatan?.ubat_tetap || [])];
      
      if (index !== null) {
        ubatTetap[index] = ubatData;
      } else {
        ubatTetap.push(ubatData);
      }
      
      const kesihatanData = { ...(this.kirProfile.relatedData?.kesihatan || {}) };
      kesihatanData.ubat_tetap = ubatTetap;
      kesihatanData.updated_at = new Date().toISOString();
      
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      
      // Update local data
      if (!this.kirProfile.relatedData) this.kirProfile.relatedData = {};
      this.kirProfile.relatedData.kesihatan = {
        ...(this.kirProfile.relatedData.kesihatan || {}),
        ...kesihatanData
      };
      
      const overlay = event.target.closest('.modal-overlay');
      if (overlay) overlay.remove();

      this.kirProfile.showToast(`Ubat berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
      
    } catch (error) {
      console.error('Error saving ubat tetap:', error);
      this.kirProfile.showToast('Ralat menyimpan ubat: ' + error.message, 'error');
    }
  }

  // Rawatan Methods
  addRawatanKIR() {
    const modal = this.createRawatanModal();
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  editRawatanKIR(index) {
    const rawatan = this.kirProfile.relatedData?.kesihatan?.rawatan?.[index];
    if (!rawatan) return;
    const modal = this.createRawatanModal(rawatan, index);
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  async deleteRawatanKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam rawatan ini?')) return;
    try {
      const rawatan = [...(this.kirProfile.relatedData?.kesihatan?.rawatan || [])];
      rawatan.splice(index, 1);
      const kesihatanData = { ...this.kirProfile.relatedData?.kesihatan };
      kesihatanData.rawatan = rawatan;
      kesihatanData.updated_at = new Date().toISOString();
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      if (!this.kirProfile.relatedData.kesihatan) this.kirProfile.relatedData.kesihatan = {};
      this.kirProfile.relatedData.kesihatan.rawatan = rawatan;
      this.kirProfile.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      this.kirProfile.showToast('Rawatan berjaya dipadam', 'success');
      this.refreshKesihatanSection();
    } catch (error) {
      console.error('Error deleting rawatan:', error);
      this.kirProfile.showToast('Ralat memadam rawatan: ' + error.message, 'error');
    }
  }

  createRawatanModal(rawatan = null, index = null) {
    const isEdit = rawatan !== null;
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-info">
              <span class="modal-eyebrow">Rawatan Berkala</span>
              <h4>${isEdit ? 'Kemaskini' : 'Tambah'} Rawatan / Follow-up</h4>
              <p class="modal-subtitle">Jejak temujanji dan rawatan susulan untuk pemantauan kesihatan yang lebih menyeluruh.</p>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="wizard-steps">
            <div class="step-indicator active">
              <span class="step-index">1</span>
              <div class="step-label">
                <span class="step-title">Maklumat Rawatan</span>
                <span class="step-subtitle">Fasiliti & tarikh temujanji</span>
              </div>
            </div>
            <div class="step-indicator">
              <span class="step-index">2</span>
              <div class="step-label">
                <span class="step-title">Catatan Lanjutan</span>
                <span class="step-subtitle">Perincian tambahan rawatan</span>
              </div>
            </div>
          </div>
          <form class="modal-form" onsubmit="kesihatanTab.saveRawatanKIR(event, ${index})">
            <div class="wizard-step active" data-step="1">
              <div class="wizard-step-body">
                <p class="wizard-intro">Berikan maklumat asas rawatan untuk memudahkan susulan dan rujukan seterusnya.</p>
                <div class="form-group">
                  <label for="fasiliti">Fasiliti *</label>
                  <input type="text" id="fasiliti" name="fasiliti" value="${FormHelpers.escapeHtml(rawatan?.fasiliti || '')}" required placeholder="Contoh: Hospital Kuala Lumpur">
                </div>
                <div class="form-group">
                  <label for="tarikh">Tarikh *</label>
                  <input type="date" id="tarikh" name="tarikh" value="${FormHelpers.escapeHtml(rawatan?.tarikh || '')}" required>
                </div>
              </div>
              <div class="wizard-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                <button type="button" class="btn btn-primary" onclick="kesihatanTab.nextWizardStep(this)">Seterusnya</button>
              </div>
            </div>
            <div class="wizard-step" data-step="2">
              <div class="wizard-step-body">
                <p class="wizard-intro">Catatkan ringkasan temuan penting atau tindakan susulan yang diperlukan.</p>
                <div class="form-group">
                  <label for="catatan">Catatan</label>
                  <textarea id="catatan" name="catatan" rows="4" placeholder="Catatan rawatan...">${FormHelpers.escapeHtml(rawatan?.catatan || '')}</textarea>
                </div>
              </div>
              <div class="wizard-footer wizard-footer--end">
                <button type="button" class="btn btn-secondary" onclick="kesihatanTab.prevWizardStep(this)">Kembali</button>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async saveRawatanKIR(event, index = null) {
    event.preventDefault();
    try {
      const formData = new FormData(event.target);
      const rawatanData = {
        fasiliti: formData.get('fasiliti'),
        tarikh: formData.get('tarikh'),
        catatan: formData.get('catatan')
      };
      const rawatan = [...(this.kirProfile.relatedData?.kesihatan?.rawatan || [])];
      if (index !== null) {
        rawatan[index] = rawatanData;
      } else {
        rawatan.push(rawatanData);
      }
      const kesihatanData = { ...(this.kirProfile.relatedData?.kesihatan || {}) };
      kesihatanData.rawatan = rawatan;
      kesihatanData.updated_at = new Date().toISOString();
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      if (!this.kirProfile.relatedData) this.kirProfile.relatedData = {};
      this.kirProfile.relatedData.kesihatan = {
        ...(this.kirProfile.relatedData.kesihatan || {}),
        ...kesihatanData
      };
      const overlay = event.target.closest('.modal-overlay');
      if (overlay) overlay.remove();
      this.kirProfile.showToast(`Rawatan berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
    } catch (error) {
      console.error('Error saving rawatan:', error);
      this.kirProfile.showToast('Ralat menyimpan rawatan: ' + error.message, 'error');
    }
  }

  // Pembedahan Methods
  addPembedahanKIR() {
    const modal = this.createPembedahanModal();
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  editPembedahanKIR(index) {
    const pembedahan = this.kirProfile.relatedData?.kesihatan?.pembedahan?.[index];
    if (!pembedahan) return;
    const modal = this.createPembedahanModal(pembedahan, index);
    document.body.insertAdjacentHTML('beforeend', modal);
    this.ensureModalStyles();
  }

  async deletePembedahanKIR(index) {
    if (!confirm('Adakah anda pasti mahu memadam pembedahan ini?')) return;
    try {
      const pembedahan = [...(this.kirProfile.relatedData?.kesihatan?.pembedahan || [])];
      pembedahan.splice(index, 1);
      const kesihatanData = { ...this.kirProfile.relatedData?.kesihatan };
      kesihatanData.pembedahan = pembedahan;
      kesihatanData.updated_at = new Date().toISOString();
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      if (!this.kirProfile.relatedData.kesihatan) this.kirProfile.relatedData.kesihatan = {};
      this.kirProfile.relatedData.kesihatan.pembedahan = pembedahan;
      this.kirProfile.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
      this.kirProfile.showToast('Pembedahan berjaya dipadam', 'success');
      this.refreshKesihatanSection();
    } catch (error) {
      console.error('Error deleting pembedahan:', error);
      this.kirProfile.showToast('Ralat memadam pembedahan: ' + error.message, 'error');
    }
  }

  createPembedahanModal(pembedahan = null, index = null) {
    const isEdit = pembedahan !== null;
    return `
      <div class="modal-overlay" onclick="this.remove()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-header-info">
              <span class="modal-eyebrow">Sejarah Pembedahan</span>
              <h4>${isEdit ? 'Kemaskini' : 'Tambah'} Sejarah Pembedahan</h4>
              <p class="modal-subtitle">Rekodkan butiran pembedahan bagi memudahkan rujukan kes dan susulan pesakit.</p>
            </div>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="wizard-steps">
            <div class="step-indicator active">
              <span class="step-index">1</span>
              <div class="step-label">
                <span class="step-title">Butiran Pembedahan</span>
                <span class="step-subtitle">Tarikh & jenis prosedur</span>
              </div>
            </div>
            <div class="step-indicator">
              <span class="step-index">2</span>
              <div class="step-label">
                <span class="step-title">Hospital & Status</span>
                <span class="step-subtitle">Kemaskini status semasa</span>
              </div>
            </div>
          </div>
          <form class="modal-form" onsubmit="kesihatanTab.savePembedahanKIR(event, ${index})">
            <div class="wizard-step active" data-step="1">
              <div class="wizard-step-body">
                <p class="wizard-intro">Catat tarikh dan jenis pembedahan bagi memastikan sejarah lengkap tersedia.</p>
                <div class="form-group">
                  <label for="tarikh">Tarikh *</label>
                  <input type="date" id="tarikh" name="tarikh" value="${FormHelpers.escapeHtml(pembedahan?.tarikh || '')}" required>
                </div>
                <div class="form-group">
                  <label for="jenis_pembedahan">Jenis Pembedahan *</label>
                  <input type="text" id="jenis_pembedahan" name="jenis_pembedahan" value="${FormHelpers.escapeHtml(pembedahan?.jenis_pembedahan || '')}" required placeholder="Contoh: Appendectomy">
                </div>
              </div>
              <div class="wizard-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Batal</button>
                <button type="button" class="btn btn-primary" onclick="kesihatanTab.nextWizardStep(this)">Seterusnya</button>
              </div>
            </div>
            <div class="wizard-step" data-step="2">
              <div class="wizard-step-body">
                <p class="wizard-intro">Nyatakan hospital terlibat dan status semasa bagi tindakan susulan yang tepat.</p>
                <div class="form-group">
                  <label for="hospital">Hospital *</label>
                  <input type="text" id="hospital" name="hospital" value="${FormHelpers.escapeHtml(pembedahan?.hospital || '')}" required placeholder="Contoh: Hospital Kuala Lumpur">
                </div>
                <div class="form-group">
                  <label for="status">Status *</label>
                  <select id="status" name="status" required>
                    <option value="">Pilih Status</option>
                    <option value="Selesai" ${pembedahan?.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    <option value="Perlu Follow-up" ${pembedahan?.status === 'Perlu Follow-up' ? 'selected' : ''}>Perlu Follow-up</option>
                  </select>
                </div>
              </div>
              <div class="wizard-footer wizard-footer--end">
                <button type="button" class="btn btn-secondary" onclick="kesihatanTab.prevWizardStep(this)">Kembali</button>
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> ${isEdit ? 'Kemaskini' : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

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
      const pembedahan = [...(this.kirProfile.relatedData?.kesihatan?.pembedahan || [])];
      if (index !== null) {
        pembedahan[index] = pembedahanData;
      } else {
        pembedahan.push(pembedahanData);
      }
      const kesihatanData = { ...(this.kirProfile.relatedData?.kesihatan || {}) };
      kesihatanData.pembedahan = pembedahan;
      kesihatanData.updated_at = new Date().toISOString();
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
      if (!this.kirProfile.relatedData) this.kirProfile.relatedData = {};
      this.kirProfile.relatedData.kesihatan = {
        ...(this.kirProfile.relatedData.kesihatan || {}),
        ...kesihatanData
      };
      const overlay = event.target.closest('.modal-overlay');
      if (overlay) overlay.remove();
      this.kirProfile.showToast(`Pembedahan berjaya ${index !== null ? 'dikemaskini' : 'ditambah'}`, 'success');
      this.refreshKesihatanSection();
    } catch (error) {
      console.error('Error saving pembedahan:', error);
      this.kirProfile.showToast('Ralat menyimpan pembedahan: ' + error.message, 'error');
    }
  }

  refreshKesihatanSection() {
    const sectionContent = document.querySelector('.kesihatan-section-content');
    if (sectionContent) {
      sectionContent.innerHTML = this.createKesihatanSectionContent();
      // Re-bind events for newly rendered content
      this.setupEventListeners();
    }
    this.updateKesihatanHeader();
  }

  updateKesihatanHeader() {
    const header = document.querySelector('.kesihatan-last-updated');
    if (header && this.kirProfile.relatedData?.kesihatan?.updated_at) {
      header.innerHTML = `Kemaskini terakhir: ${new Date(this.kirProfile.relatedData.kesihatan.updated_at).toLocaleString('ms-MY')}`;
    }
  }

  setupEventListeners() {
    // Make the tab instance globally accessible for onclick handlers
    window.kesihatanTab = this;
    this.ensureModalStyles();
    
    // Set up form change tracking for the current section
    const form = document.querySelector('.kesihatan-form');
    if (form) {
      form.addEventListener('input', () => {
        this.kesihatanDirtyTabs.add(this.currentKesihatanSection);
        this.updateKesihatanSectionNavigation();
      });
      
      form.addEventListener('change', () => {
        this.kesihatanDirtyTabs.add(this.currentKesihatanSection);
        this.updateKesihatanSectionNavigation();
      });
    }
  }

  // Wizard navigation helpers
  nextWizardStep(buttonEl) {
    const modal = buttonEl.closest('.modal-content');
    if (!modal) return;
    const steps = Array.from(modal.querySelectorAll('.wizard-step'));
    const indicators = Array.from(modal.querySelectorAll('.step-indicator'));
    const activeIndex = steps.findIndex(step => step.classList.contains('active'));
    if (activeIndex === -1) return;

    const currentStep = steps[activeIndex];
    const requiredFields = Array.from(currentStep.querySelectorAll('[required]'));
    let firstInvalid = null;

    requiredFields.forEach(field => {
      const value = typeof field.value === 'string' ? field.value.trim() : field.value;
      const isCheckbox = field.type === 'checkbox' || field.type === 'radio';
      const isEmpty = isCheckbox
        ? !currentStep.querySelectorAll(`[name="${field.name}"]:checked`).length
        : !value;
      if (isEmpty) {
        if (!firstInvalid) firstInvalid = field;
        field.classList.add('input-error');
      } else {
        field.classList.remove('input-error');
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      if (typeof firstInvalid.reportValidity === 'function') {
        firstInvalid.reportValidity();
      }
      return;
    }

    if (activeIndex < steps.length - 1) {
      steps[activeIndex].classList.remove('active');
      steps[activeIndex + 1].classList.add('active');
      if (indicators[activeIndex]) {
        indicators[activeIndex].classList.add('completed');
        indicators[activeIndex].classList.remove('active');
      }
      if (indicators[activeIndex + 1]) {
        indicators[activeIndex + 1].classList.add('active');
      }
      const firstField = steps[activeIndex + 1].querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }
  }

  prevWizardStep(buttonEl) {
    const modal = buttonEl.closest('.modal-content');
    if (!modal) return;
    const steps = Array.from(modal.querySelectorAll('.wizard-step'));
    const indicators = Array.from(modal.querySelectorAll('.step-indicator'));
    const activeIndex = steps.findIndex(step => step.classList.contains('active'));
    if (activeIndex === -1) return;

    if (activeIndex > 0) {
      steps[activeIndex].classList.remove('active');
      if (indicators[activeIndex]) {
        indicators[activeIndex].classList.remove('active');
      }

      const previousIndex = activeIndex - 1;
      steps[previousIndex].classList.add('active');
      if (indicators[previousIndex]) {
        indicators[previousIndex].classList.add('active');
        indicators[previousIndex].classList.remove('completed');
      }
      steps[previousIndex].querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      const firstField = steps[previousIndex].querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }
  }

  // Ensure modal styles exist to prevent layout shrinking
  ensureModalStyles() {
    if (document.getElementById('kesihatan-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'kesihatan-modal-styles';
    style.textContent = `
      .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background-color: rgba(15,23,42,0.45); display:flex; justify-content:center; align-items:center; z-index: 1000; padding:16px; box-sizing:border-box; }
      .modal-content { background:#ffffff; border-radius:18px; box-shadow:0 30px 60px rgba(15,23,42,0.18); width:min(680px,100%); max-height:92vh; display:flex; flex-direction:column; overflow:hidden; }
      .modal-header { padding:24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:flex-start; gap:16px; background:linear-gradient(120deg, rgba(59,130,246,0.08), rgba(14,165,233,0.08)); }
      .modal-header-info { display:flex; flex-direction:column; gap:6px; }
      .modal-eyebrow { font-size:0.75rem; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#2563eb; margin:0; }
      .modal-header h4 { margin:0; font-size:1.3rem; color:#0f172a; }
      .modal-subtitle { margin:0; font-size:0.9rem; color:#475569; max-width:420px; line-height:1.4; }
      .modal-close { background:none; border:none; font-size:20px; color:#475569; cursor:pointer; padding:4px; line-height:1; transition:color 0.2s ease; }
      .modal-close:hover { color:#1d4ed8; }
      .wizard-steps { display:flex; align-items:center; gap:12px; padding:18px 24px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
      .step-indicator { flex:1; display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; border:1px solid #e2e8f0; background:#ffffff; transition:all 0.25s ease; }
      .step-index { width:32px; height:32px; border-radius:50%; background:#e0e7ff; color:#1d4ed8; display:flex; align-items:center; justify-content:center; font-weight:600; }
      .step-label { display:flex; flex-direction:column; gap:3px; }
      .step-title { font-size:0.95rem; font-weight:600; color:#0f172a; }
      .step-subtitle { font-size:0.78rem; color:#64748b; }
      .step-indicator.active { border-color:#2563eb; background:#eff6ff; box-shadow:0 12px 24px rgba(37,99,235,0.14); }
      .step-indicator.active .step-index { background:#2563eb; color:#fff; }
      .step-indicator.completed { border-color:#10b981; background:#ecfdf5; }
      .step-indicator.completed .step-index { background:#10b981; color:#fff; }
      .modal-form { padding:24px; overflow-y:auto; }
      .wizard-step { display:none; animation:wizardFade 0.25s ease; }
      .wizard-step.active { display:block; }
      .wizard-step-body { display:flex; flex-direction:column; gap:18px; }
      .wizard-intro { margin:0; font-size:0.9rem; color:#475569; background:#f1f5f9; border-radius:10px; padding:12px 14px; }
      .modal-content .form-group { display:flex; flex-direction:column; gap:6px; }
      .modal-content .form-group label { font-size:0.9rem; font-weight:600; color:#1e293b; }
      .modal-content .form-group input,
      .modal-content .form-group select,
      .modal-content .form-group textarea { border:1px solid #d0d7e9; border-radius:10px; padding:10px 12px; font-size:0.95rem; transition:border-color 0.2s ease, box-shadow 0.2s ease; background:#fff; }
      .modal-content .form-group input:focus,
      .modal-content .form-group select:focus,
      .modal-content .form-group textarea:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.15); }
      .modal-content .form-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; }
      .modal-content textarea { resize:vertical; min-height:120px; }
      .wizard-footer { margin-top:24px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .wizard-footer--end { justify-content:flex-end; }
      .wizard-footer .btn { min-width:120px; }
      .modal-content .input-error { border-color:#dc2626 !important; box-shadow:0 0 0 3px rgba(220,38,38,0.12); }
      .page-actions { margin-top:24px; display:flex; justify-content:flex-end; }
      @keyframes wizardFade { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      @media (max-width: 640px) {
        .modal-content { border-radius:14px; }
        .modal-header { padding:20px; }
        .wizard-steps { flex-direction:column; align-items:stretch; }
        .wizard-footer { flex-direction:column-reverse; align-items:stretch; }
        .wizard-footer .btn { width:100%; }
      }
    `;
    document.head.appendChild(style);
  }

  async save() {
    // For Kesihatan tab, we save per section, not the entire tab
    // This method can be used to save the current section
    const form = document.querySelector('.kesihatan-form');
    if (!form) {
      throw new Error('Form tidak dijumpai');
    }

    const formData = new FormData(form);
    const sectionId = form.dataset.section;
    
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
        status_merokok: formData.get('status_merokok'),
        catatan_kesihatan: formData.get('catatan_kesihatan')
      };
    } else {
      // Handle other sections normally
      for (const [key, value] of formData.entries()) {
        sectionData[key] = value;
      }
    }
    
    // Update KIR with kesihatan data
    const kesihatanData = { ...this.kirProfile.relatedData?.kesihatan };
    kesihatanData[sectionId] = sectionData;
    kesihatanData.updated_at = new Date().toISOString();
    
    await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kesihatan', kesihatanData);
    
    // Update local data
    if (!this.kirProfile.relatedData) this.kirProfile.relatedData = {};
    if (!this.kirProfile.relatedData.kesihatan) this.kirProfile.relatedData.kesihatan = {};
    this.kirProfile.relatedData.kesihatan[sectionId] = sectionData;
    this.kirProfile.relatedData.kesihatan.updated_at = kesihatanData.updated_at;
    
    this.kesihatanDirtyTabs.delete(sectionId);
    this.updateKesihatanSectionNavigation();
    this.updateKesihatanHeader();
    
    return sectionData;
  }
}