import { BaseTab } from '../shared/BaseTab.js';
import { deriveBirthInfoFromIC } from '../shared/icUtils.js';

/**
 * PKIRTab - Manages PKIR (Pasangan Ketua Isi Rumah / Spouse) functionality
 * Handles spouse information including basic info, education, employment, and health
 */
export class PKIRTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'pkir';
    this.pkirData = null;
    this.currentEditingId = null;
    this.isDirty = false;
  }

  /**
   * Render the PKIR tab content
   */
  render() {
    return `
      <form id="pkirForm" class="kir-form" data-tab="pkir">
        <!-- Maklumat Asas Section -->
        <div class="form-section">
          <div class="section-header">
            <h3><i class="fas fa-user"></i> Maklumat Asas Pasangan</h3>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="nama_pasangan">Nama Pasangan</label>
              <input type="text" id="nama_pasangan" name="nama_pasangan">
            </div>
            
            <div class="form-group">
              <label for="no_kp_pasangan">No. KP Pasangan</label>
              <input type="text" id="no_kp_pasangan" name="no_kp_pasangan">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="tarikh_lahir_pasangan">Tarikh Lahir</label>
              <input type="date" id="tarikh_lahir_pasangan" name="tarikh_lahir_pasangan">
            </div>
            
            <div class="form-group">
              <label for="umur_pasangan">Umur</label>
              <input type="number" id="umur_pasangan" name="umur_pasangan" readonly>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="jantina_pasangan">Jantina</label>
              <select id="jantina_pasangan" name="jantina_pasangan">
                <option value="">Pilih Jantina</option>
                <option value="Lelaki">Lelaki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="bangsa_pasangan">Bangsa</label>
              <input type="text" id="bangsa_pasangan" name="bangsa_pasangan">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="agama_pasangan">Agama</label>
              <input type="text" id="agama_pasangan" name="agama_pasangan">
            </div>
            
            <div class="form-group">
              <label for="telefon_pasangan">No. Telefon</label>
              <input type="tel" id="telefon_pasangan" name="telefon_pasangan">
            </div>
          </div>
        </div>

        <!-- Maklumat Pendidikan Section -->
        <div class="form-section">
          <div class="section-header">
            <h3><i class="fas fa-graduation-cap"></i> Maklumat Pendidikan</h3>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="tahap_pendidikan">Tahap Pendidikan</label>
              <select id="tahap_pendidikan" name="tahap_pendidikan">
                <option value="">Pilih Tahap</option>
                <option value="Tiada Pendidikan Formal">Tiada Pendidikan Formal</option>
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
              <label for="institusi_pendidikan">Institusi Pendidikan</label>
              <input type="text" id="institusi_pendidikan" name="institusi_pendidikan">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="bidang_pengajian">Bidang Pengajian</label>
              <input type="text" id="bidang_pengajian" name="bidang_pengajian">
            </div>
            
            <div class="form-group">
              <label for="tahun_tamat">Tahun Tamat</label>
              <input type="number" id="tahun_tamat" name="tahun_tamat" min="1950" max="2030">
            </div>
          </div>
        </div>

        <!-- Maklumat Pekerjaan Section -->
        <div class="form-section">
          <div class="section-header">
            <h3><i class="fas fa-briefcase"></i> Maklumat Pekerjaan</h3>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status_pekerjaan">Status Pekerjaan</label>
              <select id="status_pekerjaan" name="status_pekerjaan">
                <option value="">Pilih Status</option>
                <option value="Bekerja">Bekerja</option>
                <option value="Menganggur">Menganggur</option>
                <option value="Pelajar">Pelajar</option>
                <option value="Pesara">Pesara</option>
                <option value="Suri Rumah">Suri Rumah</option>
                <option value="OKU">OKU</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="jenis_pekerjaan">Jenis Pekerjaan</label>
              <input type="text" id="jenis_pekerjaan" name="jenis_pekerjaan">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="nama_majikan">Nama Majikan</label>
              <input type="text" id="nama_majikan" name="nama_majikan">
            </div>
            
            <div class="form-group">
              <label for="pendapatan_bulanan">Pendapatan Bulanan (RM)</label>
              <input type="number" id="pendapatan_bulanan" name="pendapatan_bulanan" min="0" step="0.01">
            </div>
          </div>
        </div>

        <!-- Maklumat Kesihatan Section -->
        <div class="form-section">
          <div class="section-header">
            <h3><i class="fas fa-heartbeat"></i> Maklumat Kesihatan</h3>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status_kesihatan">Status Kesihatan</label>
              <select id="status_kesihatan" name="status_kesihatan">
                <option value="">Pilih Status</option>
                <option value="Sihat">Sihat</option>
                <option value="Kurang Sihat">Kurang Sihat</option>
                <option value="Sakit Kronik">Sakit Kronik</option>
                <option value="OKU">OKU</option>
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
          
          <div class="form-row">
            <div class="form-group">
              <label for="penyakit_kronik">Penyakit Kronik</label>
              <textarea id="penyakit_kronik" name="penyakit_kronik" rows="3" placeholder="Senaraikan penyakit kronik jika ada"></textarea>
            </div>
            
            <div class="form-group">
              <label for="ubat_tetap">Ubat Tetap</label>
              <textarea id="ubat_tetap" name="ubat_tetap" rows="3" placeholder="Senaraikan ubat tetap jika ada"></textarea>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status_merokok">Status Merokok</label>
              <select id="status_merokok" name="status_merokok">
                <option value="">Pilih Status</option>
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
                <option value="Bekas Perokok">Bekas Perokok</option>
              </select>
            </div>
            
            <div class="form-group smoking-fields" style="display: none;">
              <label for="bilangan_rokok">Bilangan Rokok Sehari</label>
              <input type="number" id="bilangan_rokok" name="bilangan_rokok" min="0">
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> Simpan PKIR
          </button>
          <button type="button" class="btn btn-secondary" onclick="pkirTab.resetForm()">
            <i class="fas fa-undo"></i> Reset Form
          </button>
        </div>
      </form>

      <!-- PKIR List Section -->
      <div class="form-section">
        <div class="section-header">
          <h3><i class="fas fa-list"></i> Senarai PKIR</h3>
        </div>
        <div id="pkirList">
          ${this.createPKIRList()}
        </div>
      </div>
    `;
  }

  /**
   * Create PKIR list content
   */
  createPKIRList() {
    if (!this.pkirData || this.pkirData.length === 0) {
      return `
        <div class="empty-state">
          <div class="text-center py-4">
            <i class="fas fa-users text-muted mb-3" style="font-size: 2rem;"></i>
            <p class="text-muted">Tiada rekod PKIR dijumpai</p>
          </div>
        </div>
      `;
    }

    return this.pkirData.map(pkir => this.createPKIRCard(pkir)).join('');
  }

  /**
   * Create individual PKIR card
   */
  createPKIRCard(pkir) {
    return `
      <div class="data-card">
        <div class="card-header">
          <div class="card-title">
            <h4>${this.escapeHtml(pkir.nama_pasangan || 'Tiada Nama')}</h4>
            <span class="badge badge-info">${this.escapeHtml(pkir.no_kp_pasangan || 'Tiada No. KP')}</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="pkirTab.editPKIR('${pkir.id}')">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="pkirTab.deletePKIR('${pkir.id}')">
              <i class="fas fa-trash"></i> Padam
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <label>Jantina:</label>
              <span>${this.escapeHtml(pkir.jantina_pasangan || '-')}</span>
            </div>
            <div class="info-item">
              <label>Umur:</label>
              <span>${pkir.umur_pasangan || '-'} tahun</span>
            </div>
            <div class="info-item">
              <label>Status Pekerjaan:</label>
              <span>${this.escapeHtml(pkir.status_pekerjaan || '-')}</span>
            </div>
            <div class="info-item">
              <label>Pendapatan:</label>
              <span>RM ${pkir.pendapatan_bulanan ? parseFloat(pkir.pendapatan_bulanan).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Form handling methods
  resetForm() {
    const form = document.getElementById('pkirForm');
    if (form) {
      form.reset();
      this.currentEditingId = null;
      
      // Update form button text
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Simpan PKIR';
      }
      
      // Hide smoking fields
      this.toggleSmokingFields('');
    }
  }

  editPKIR(pkirId) {
    const pkir = this.pkirData.find(p => p.id === pkirId);
    if (!pkir) return;
    
    this.currentEditingId = pkirId;
    
    // Populate form with PKIR data
    const form = document.getElementById('pkirForm');
    if (form) {
      Object.keys(pkir).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
          input.value = pkir[key] || '';
        }
      });
      
      // Calculate and set age
      if (pkir.tarikh_lahir_pasangan) {
        const age = this.calculateAge(pkir.tarikh_lahir_pasangan);
        const ageInput = form.querySelector('[name="umur_pasangan"]');
        if (ageInput) {
          ageInput.value = age;
        }
      }
      const icInput = form.querySelector('#no_kp_pasangan');
      if (icInput && !pkir.tarikh_lahir_pasangan && icInput.value) {
        this.applyBirthInfoFromIC(icInput.value, true);
      }
      
      // Update form button text
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Kemaskini PKIR';
      }
      
      // Handle smoking fields visibility
      this.toggleSmokingFields(pkir.status_merokok || '');
      
      // Scroll to form
      form.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async deletePKIR(pkirId) {
    const pkir = this.pkirData.find(p => p.id === pkirId);
    if (!pkir) return;
    
    if (!confirm(`Adakah anda pasti mahu memadam ${pkir.nama_pasangan}?`)) {
      return;
    }
    
    try {
      await this.kirProfile.pasanganService.deletePKIR(pkirId);
      this.kirProfile.showToast('PKIR berjaya dipadam', 'success');
      await this.loadPKIRData();
      this.refreshPKIRList();
    } catch (error) {
      console.error('Error deleting PKIR:', error);
      this.kirProfile.showToast('Ralat memadam PKIR: ' + error.message, 'error');
    }
  }

  async savePKIR(formData) {
    // Validate that KIR ID is available
    if (!this.kirProfile.kirId) {
      console.error('Cannot save PKIR: KIR ID is not available');
      this.kirProfile.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
      return;
    }
    
    try {
      if (this.currentEditingId) {
        // Update existing PKIR
        await this.kirProfile.pasanganService.updatePKIR(this.currentEditingId, formData);
        this.kirProfile.showToast('PKIR berjaya dikemaskini', 'success');
      } else {
        // Create new PKIR
        await this.kirProfile.pasanganService.createPKIR(this.kirProfile.kirId, formData);
        this.kirProfile.showToast('PKIR berjaya ditambah', 'success');
      }
      
      // Refresh data and reset form
      await this.loadPKIRData();
      this.refreshPKIRList();
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving PKIR:', error);
      this.kirProfile.showToast('Ralat menyimpan PKIR: ' + error.message, 'error');
    }
  }

  refreshPKIRList() {
    const pkirListContainer = document.getElementById('pkirList');
    if (pkirListContainer) {
      pkirListContainer.innerHTML = this.createPKIRList();
    }
  }

  toggleSmokingFields(value) {
    const smokingFields = document.querySelector('.smoking-fields');
    if (smokingFields) {
      smokingFields.style.display = value === 'Ya' ? 'block' : 'none';
    }
  }

  // Data Management Methods
  async loadPKIRData() {
    try {
      if (!this.kirProfile.kirId) {
        this.pkirData = [];
        return;
      }
      
      this.pkirData = await this.kirProfile.pasanganService.getPKIRByKirId(this.kirProfile.kirId) || [];
    } catch (error) {
      console.error('Error loading PKIR data:', error);
      this.pkirData = [];
      this.kirProfile.showToast('Ralat memuatkan data PKIR: ' + error.message, 'error');
    }
  }

  // Utility Methods
  calculateAge(birthDate) {
    if (!birthDate) return '';
    
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  applyBirthInfoFromIC(icValue, clearOnInvalid = false) {
    const form = document.getElementById('pkirForm');
    if (!form) return;
    const birthInput = form.querySelector('[name="tarikh_lahir_pasangan"]');
    const ageInput = form.querySelector('[name="umur_pasangan"]');
    if (!birthInput || !ageInput) return;

    const info = deriveBirthInfoFromIC(icValue);
    if (!info) {
      if (clearOnInvalid) {
        birthInput.value = '';
        ageInput.value = '';
      }
      return;
    }

    birthInput.value = info.formattedDate;
    ageInput.value = info.age;
  }

  setupEventListeners() {
    // Set global reference for backward compatibility
    window.pkirTab = this;
    
    // Load initial data
    this.loadPKIRData();
    
    // Form submission handler
    const form = document.getElementById('pkirForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const pkirData = {};
        
        for (const [key, value] of formData.entries()) {
          pkirData[key] = value;
        }
        
        await this.savePKIR(pkirData);
      });
      
      // Age calculation on birth date change
      const birthDateInput = form.querySelector('[name="tarikh_lahir_pasangan"]');
      const ageInput = form.querySelector('[name="umur_pasangan"]');
      
      if (birthDateInput && ageInput) {
        birthDateInput.addEventListener('change', (e) => {
          const age = this.calculateAge(e.target.value);
          ageInput.value = age;
        });
      }
      
      // Smoking fields toggle
      const smokingSelect = form.querySelector('[name="status_merokok"]');
      if (smokingSelect) {
        smokingSelect.addEventListener('change', (e) => {
          this.toggleSmokingFields(e.target.value);
        });
      }

      const icInput = form.querySelector('#no_kp_pasangan');
      if (icInput) {
        icInput.addEventListener('input', (e) => {
          this.applyBirthInfoFromIC(e.target.value, true);
        });
      }
      
      // Form change tracking
      form.addEventListener('input', () => {
        this.isDirty = true;
      });
      
      form.addEventListener('change', () => {
        this.isDirty = true;
      });
    }
  }

  async save() {
    if (!this.isDirty) return true;
    
    try {
      const form = document.getElementById('pkirForm');
      if (form) {
        const formData = new FormData(form);
        const pkirData = {};
        
        for (const [key, value] of formData.entries()) {
          pkirData[key] = value;
        }
        
        await this.savePKIR(pkirData);
      }
      
      this.isDirty = false;
      return true;
    } catch (error) {
      console.error('Error saving PKIR tab:', error);
      return false;
    }
  }
}
