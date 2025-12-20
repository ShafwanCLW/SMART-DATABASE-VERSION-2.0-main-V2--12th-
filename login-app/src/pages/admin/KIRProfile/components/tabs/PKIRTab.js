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
              <select id="bangsa_pasangan" name="bangsa_pasangan">
                <option value="">Pilih Bangsa</option>
                <option value="Melayu">Melayu</option>
                <option value="Cina">Cina</option>
                <option value="India">India</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="agama_pasangan">Agama</label>
              <select id="agama_pasangan" name="agama_pasangan">
                <option value="">Pilih Agama</option>
                <option value="Islam">Islam</option>
                <option value="Kristian">Kristian</option>
                <option value="Buddha">Buddha</option>
                <option value="Hindu">Hindu</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="telefon_pasangan">No. Telefon</label>
              <input type="tel" id="telefon_pasangan" name="telefon_pasangan">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="kemahiran_mengaji">Kemahiran Mengaji</label>
              <select id="kemahiran_mengaji" name="kemahiran_mengaji">
                <option value="">Pilih Kemahiran</option>
                <option value="Boleh Mengaji">Boleh Mengaji</option>
                <option value="Tidak Boleh Mengaji">Tidak Boleh Mengaji</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="status_bantuan_pasangan">Bantuan</label>
              <select id="status_bantuan_pasangan" name="status_bantuan_pasangan">
                <option value="">Pilih Status</option>
                <option value="Ya">Menerima Bantuan</option>
                <option value="Tidak">Tidak Menerima Bantuan</option>
              </select>
            </div>
            <div class="form-group bantuan-details" style="display:none;">
              <label for="jenis_bantuan_pasangan">Jenis Bantuan</label>
              <input type="text" id="jenis_bantuan_pasangan" name="jenis_bantuan_pasangan" placeholder="Contoh: JKM, Zakat">
            </div>
          </div>

          <div class="form-row bantuan-details" style="display:none;">
            <div class="form-group">
              <label for="jumlah_bantuan_pasangan">Jumlah Bantuan (RM)</label>
              <input type="number" id="jumlah_bantuan_pasangan" name="jumlah_bantuan_pasangan" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label for="catatan_bantuan_pasangan">Catatan Bantuan</label>
              <textarea id="catatan_bantuan_pasangan" name="catatan_bantuan_pasangan" rows="2" placeholder="Maklumat ringkas bantuan"></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="jenis_kenderaan_pasangan">Jenis Kenderaan</label>
              <select id="jenis_kenderaan_pasangan" name="jenis_kenderaan">
                <option value="Kereta Sendiri">Kereta Sendiri</option>
                <option value="Moto">Moto</option>
                <option value="Tiada" selected>Tiada</option>
              </select>
            </div>
            <div class="form-group pkir-kenderaan-ansuran" style="display:none;">
              <label for="ansuran_kenderaan_pasangan">Ansuran Kenderaan (RM)</label>
              <input type="number" id="ansuran_kenderaan_pasangan" name="ansuran_kenderaan" min="0" step="0.01">
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
                <option value="Tidak Bekerja">Tidak Bekerja</option>
                <option value="Pelajar">Pelajar</option>
                <option value="Pesara">Pesara</option>
                <option value="Suri Rumah">Suri Rumah</option>
                <option value="OKU">OKU</option>
              </select>
            </div>
            
            <div class="form-group pkir-pekerjaan-fields">
              <label for="jenis_pekerjaan">Jenis Pekerjaan</label>
              <select id="jenis_pekerjaan" name="jenis_pekerjaan">
                <option value="">Pilih Jenis</option>
                <option value="Makan Gaji">Makan Gaji</option>
                <option value="Bekerja Sendiri">Bekerja Sendiri</option>
              </select>
            </div>

            <div class="form-group pkir-pekerjaan-fields">
              <label for="nama_jenis_pekerjaan">Nama Jenis Pekerjaan</label>
              <input type="text" id="nama_jenis_pekerjaan" name="nama_jenis_pekerjaan">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group pekerjaan-sendiri pkir-pekerjaan-fields" style="display:none;">
              <label for="jenis_pekerjaan_sendiri">Jenis Pekerjaan Sendiri</label>
              <select id="jenis_pekerjaan_sendiri" name="jenis_pekerjaan_sendiri">
                <option value="">Pilih Jenis</option>
                <option value="Perkhidmatan Product">Perkhidmatan Product</option>
                <option value="Part time">Part time</option>
                <option value="Full time">Full time</option>
                <option value="Berasaskan Rumah">Berasaskan Rumah</option>
              </select>
            </div>
            <div class="form-group pkir-pekerjaan-fields">
              <label for="nama_majikan">Nama Majikan</label>
              <input type="text" id="nama_majikan" name="nama_majikan">
            </div>
            
            <div class="form-group pkir-pekerjaan-fields">
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
        <div class="form-actions form-actions-right">
          <button type="button" class="btn btn-light" onclick="pkirTab.resetForm()">
            <i class="fas fa-undo"></i> Reset
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> Simpan PKIR
          </button>
        </div>
      </form>
    `;
  }

  // Form handling methods
  resetForm(forceClear = false) {
    const form = document.getElementById('pkirForm');
    if (!form) return;

    form.reset();
    this.currentEditingId = null;
    this.toggleSmokingFields('');
    this.togglePekerjaanSendiri('');
    this.toggleKenderaanAnsuran('');
    this.toggleBantuanFields('');

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan PKIR';
    }

    if (!forceClear && this.pkirData) {
      this.populateForm(this.pkirData);
    } else {
      this.isDirty = false;
      if (this.kirProfile?.captureTabSnapshot) {
        setTimeout(() => this.kirProfile.captureTabSnapshot(this.tabId), 0);
        this.kirProfile.clearTabDirty(this.tabId);
      }
    }
  }

  populateForm(pkir) {
    const form = document.getElementById('pkirForm');
    if (!form || !pkir) return;

    form.reset();

    Object.keys(pkir).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (key === 'no_kp_pasangan') {
          input.value = this.formatICForInput(pkir[key] || '');
        } else {
          input.value = pkir[key] || '';
        }
      }
    });

    if (pkir.tarikh_lahir_pasangan) {
      const age = this.calculateAge(pkir.tarikh_lahir_pasangan);
      const ageInput = form.querySelector('[name="umur_pasangan"]');
      if (ageInput) {
        ageInput.value = age;
      }
    } else {
      const icInput = form.querySelector('#no_kp_pasangan');
      if (icInput && icInput.value) {
        this.applyBirthInfoFromIC(icInput.value, true);
      }
    }

    this.togglePekerjaanSendiri(pkir.jenis_pekerjaan || '');
    this.toggleSmokingFields(pkir.status_merokok || '');
    this.toggleKenderaanAnsuran(pkir.jenis_kenderaan || '');
    this.toggleBantuanFields(pkir.status_bantuan_pasangan || pkir.bantuan_status || '');

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Kemaskini PKIR';
    }

    this.currentEditingId = pkir.id || null;
    this.isDirty = false;
    if (this.kirProfile?.captureTabSnapshot) {
      setTimeout(() => this.kirProfile.captureTabSnapshot(this.tabId), 0);
      this.kirProfile.clearTabDirty(this.tabId);
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
      const payload = this.mapFormToPayload(formData);

      if (this.currentEditingId) {
        // Update existing PKIR
        await this.kirProfile.pasanganService.updatePKIR(this.currentEditingId, payload);
        this.kirProfile.showToast('PKIR berjaya dikemaskini', 'success');
      } else {
        // Create new PKIR
        await this.kirProfile.pasanganService.createPKIR(this.kirProfile.kirId, payload);
        this.kirProfile.showToast('PKIR berjaya ditambah', 'success');
      }
      
      // Refresh data and reset form
      await this.loadPKIRData();
      this.resetForm();
      
    } catch (error) {
      console.error('Error saving PKIR:', error);
      this.kirProfile.showToast('Ralat menyimpan PKIR: ' + error.message, 'error');
    }
  }

  toggleSmokingFields(value) {
    const smokingFields = document.querySelector('.smoking-fields');
    if (smokingFields) {
      smokingFields.style.display = value === 'Ya' ? 'block' : 'none';
    }
  }

  togglePekerjaanSendiri(value) {
    const field = document.querySelector('.pekerjaan-sendiri');
    if (field) {
      field.style.display = value === 'Bekerja Sendiri' ? '' : 'none';
    }
  }

  togglePekerjaanFields(statusValue) {
    const fields = document.querySelectorAll('.pkir-pekerjaan-fields');
    const shouldHide = statusValue === 'Tidak Bekerja';
    fields.forEach(field => {
      field.style.display = shouldHide ? 'none' : '';
    });
    if (shouldHide) {
      this.togglePekerjaanSendiri('');
    } else {
      const jenisSelect = document.querySelector('#jenis_pekerjaan');
      if (jenisSelect) {
        this.togglePekerjaanSendiri(jenisSelect.value);
      }
    }
  }

  toggleKenderaanAnsuran(value) {
    const group = document.querySelector('.pkir-kenderaan-ansuran');
    if (group) {
      const shouldShow = value && value !== 'Tiada';
      group.style.display = shouldShow ? '' : 'none';
      if (!shouldShow) {
        const input = group.querySelector('input');
        if (input) {
          input.value = '';
        }
      }
    }
  }

  toggleBantuanFields(value) {
    const sections = document.querySelectorAll('.bantuan-details');
    const shouldShow = value === 'Ya';
    sections.forEach(section => {
      section.style.display = shouldShow ? '' : 'none';
      if (!shouldShow) {
        section.querySelectorAll('input, textarea').forEach(input => {
          input.value = '';
        });
      }
    });
  }

  // Data Management Methods
  async loadPKIRData() {
    try {
      if (!this.kirProfile.kirId) {
        this.pkirData = null;
        this.currentEditingId = null;
        return;
      }

      const rawData = await this.kirProfile.pasanganService.getPKIRByKirId(this.kirProfile.kirId);
      this.currentEditingId = rawData?.id || null;
      this.pkirData = rawData ? this.mapBackendToForm(rawData) : null;
    } catch (error) {
      console.error('Error loading PKIR data:', error);
      this.pkirData = null;
      this.currentEditingId = null;
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
    const icInput = form.querySelector('#no_kp_pasangan');
    if (!birthInput || !ageInput) return;

    if (this.isPassportValue(icValue)) {
      if (icInput) {
        icInput.setCustomValidity('');
      }
      return;
    }

    const digits = this.normalizeICValue(icValue);
    if (this.isPassportValue(digits)) {
      if (icInput) {
        icInput.setCustomValidity('');
      }
      return;
    }

    const info = deriveBirthInfoFromIC(digits);
    if (!info) {
      if (clearOnInvalid) {
        birthInput.value = '';
        ageInput.value = '';
      }
      if (icInput) {
        if (digits.length >= 6) {
          icInput.setCustomValidity('No. KP mesti bermula dengan tarikh lahir (format YYMMDD) yang sah.');
        } else {
          icInput.setCustomValidity('');
        }
      }
      return;
    }

    if (icInput) {
      icInput.setCustomValidity('');
    }

    birthInput.value = info.formattedDate;
    ageInput.value = info.age;
  }

  normalizeICValue(value = '') {
    const raw = (value || '').toString();
    if (this.isPassportValue(raw)) {
      return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    }
    return raw.replace(/\D/g, '').slice(0, 12);
  }

  isPassportValue(value = '') {
    return /[A-Za-z]/.test((value || '').toString());
  }

  formatICForInput(value = '') {
    const normalized = this.normalizeICValue(value);
    if (!normalized) return '';
    if (this.isPassportValue(normalized)) {
      return normalized;
    }
    const seg1 = normalized.slice(0, 6);
    const seg2 = normalized.slice(6, 8);
    const seg3 = normalized.slice(8, 12);
    return [seg1, seg2, seg3].filter(Boolean).join('-');
  }

  getICCursorPosition(digitCount, formattedValue) {
    if (digitCount <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < formattedValue.length; i++) {
      if (/\d/.test(formattedValue[i])) {
        seen++;
        if (seen === digitCount) return i + 1;
      }
    }
    return formattedValue.length;
  }

  attachICInputMask(input) {
    if (!input) return;
    input.setAttribute('maxlength', '20');

    const formatAndMaintainCursor = (event) => {
      const rawValue = event.target.value || '';
      if (this.isPassportValue(rawValue)) {
        const normalized = this.normalizeICValue(rawValue);
        event.target.value = normalized;
        return;
      }

      const selectionStart = event.target.selectionStart || rawValue.length;
      const digitsBeforeCursor = this.normalizeICValue(rawValue.slice(0, selectionStart)).replace(/\D/g, '').length;
      const formattedValue = this.formatICForInput(rawValue);
      event.target.value = formattedValue;

      const cursorPosition = this.getICCursorPosition(digitsBeforeCursor, formattedValue);
      window.requestAnimationFrame(() => {
        event.target.setSelectionRange(cursorPosition, cursorPosition);
      });
    };

    input.addEventListener('input', formatAndMaintainCursor);
    input.addEventListener('blur', () => {
      input.value = this.formatICForInput(input.value);
    });
  }

  setupEventListeners() {
    // Set global reference for backward compatibility
    window.pkirTab = this;
    
    // Load initial data and populate the form once ready
    this.loadPKIRData()
      .then(() => {
        if (this.pkirData) {
          this.populateForm(this.pkirData);
        } else {
          this.resetForm(true);
          if (this.kirProfile?.prefillPKIRFormFromPending) {
            this.kirProfile.prefillPKIRFormFromPending({ onlyIfEmpty: true });
          }
        }
      })
      .catch(error => console.error('PKIR initial load failed:', error));
    
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

        if (pkirData.no_kp_pasangan) {
          pkirData.no_kp_pasangan = this.normalizeICValue(pkirData.no_kp_pasangan);
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

      const jenisPekerjaanSelect = form.querySelector('#jenis_pekerjaan');
      if (jenisPekerjaanSelect) {
        jenisPekerjaanSelect.addEventListener('change', (e) => {
          this.togglePekerjaanSendiri(e.target.value);
        });
      }

      const statusPekerjaanSelect = form.querySelector('#status_pekerjaan');
      if (statusPekerjaanSelect) {
        statusPekerjaanSelect.addEventListener('change', (e) => {
          this.togglePekerjaanFields(e.target.value);
        });
        this.togglePekerjaanFields(statusPekerjaanSelect.value);
      }

      const icInput = form.querySelector('#no_kp_pasangan');
      if (icInput) {
        this.attachICInputMask(icInput);
        const handleIcChange = (value) => {
          window.requestAnimationFrame(() => {
            this.applyBirthInfoFromIC(value, true);
          });
        };
        icInput.addEventListener('input', (e) => {
          handleIcChange(e.target.value);
        });
        icInput.addEventListener('blur', (e) => {
          handleIcChange(e.target.value);
        });
        if (icInput.value) {
          handleIcChange(icInput.value);
        }
      }

      const jenisKenderaanSelect = form.querySelector('#jenis_kenderaan_pasangan');
      if (jenisKenderaanSelect) {
        const toggleAnsuran = () => {
          this.toggleKenderaanAnsuran(jenisKenderaanSelect.value);
        };
        jenisKenderaanSelect.addEventListener('change', toggleAnsuran);
        toggleAnsuran();
      }
      
      const statusBantuanSelect = form.querySelector('#status_bantuan_pasangan');
      if (statusBantuanSelect) {
        statusBantuanSelect.addEventListener('change', (e) => {
          this.toggleBantuanFields(e.target.value);
        });
        this.toggleBantuanFields(statusBantuanSelect.value);
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

  parseListField(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return value
      .split(/[\n,;]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  formatListForDisplay(value) {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    return value;
  }

  mapFormToPayload(formData) {
    const normalize = (val) => (val ?? '').toString().trim();
    const normalizedIC = this.normalizeICValue(formData.no_kp_pasangan);
    
    const toNumber = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const jenisKenderaanValue = normalize(formData.jenis_kenderaan) || 'Tiada';
    const ansuranKenderaanValue = jenisKenderaanValue === 'Tiada' ? '' : toNumber(formData.ansuran_kenderaan);
    const bantuanStatus = normalize(formData.status_bantuan_pasangan);
    const bantuanJenis = normalize(formData.jenis_bantuan_pasangan);
    const bantuanJumlah = toNumber(formData.jumlah_bantuan_pasangan);
    const bantuanCatatan = normalize(formData.catatan_bantuan_pasangan);

    const payload = {
      nama_pasangan: normalize(formData.nama_pasangan),
      no_kp_pasangan: normalizedIC,
      tarikh_lahir_pasangan: normalize(formData.tarikh_lahir_pasangan),
      jantina_pasangan: normalize(formData.jantina_pasangan),
      bangsa_pasangan: normalize(formData.bangsa_pasangan),
      agama_pasangan: normalize(formData.agama_pasangan),
      telefon_pasangan: normalize(formData.telefon_pasangan),
      kemahiran_mengaji: normalize(formData.kemahiran_mengaji),
      status_bantuan_pasangan: bantuanStatus,
      jenis_bantuan_pasangan: bantuanJenis,
      jumlah_bantuan_pasangan: bantuanJumlah,
      catatan_bantuan_pasangan: bantuanCatatan,
      tahap_pendidikan: normalize(formData.tahap_pendidikan),
      institusi_pendidikan: normalize(formData.institusi_pendidikan),
      bidang_pengajian: normalize(formData.bidang_pengajian),
      tahun_tamat: normalize(formData.tahun_tamat),
      status_pekerjaan: normalize(formData.status_pekerjaan),
      jenis_pekerjaan: normalize(formData.jenis_pekerjaan),
      nama_jenis_pekerjaan: normalize(formData.nama_jenis_pekerjaan),
      jenis_pekerjaan_sendiri: normalize(formData.jenis_pekerjaan_sendiri),
      nama_majikan: normalize(formData.nama_majikan),
      pendapatan_bulanan: toNumber(formData.pendapatan_bulanan),
      status_kesihatan: normalize(formData.status_kesihatan),
      kumpulan_darah: normalize(formData.kumpulan_darah),
      penyakit_kronik: normalize(formData.penyakit_kronik),
      ubat_tetap: normalize(formData.ubat_tetap),
      status_merokok: normalize(formData.status_merokok),
      bilangan_rokok: toNumber(formData.bilangan_rokok),
      jenis_kenderaan: jenisKenderaanValue,
      ansuran_kenderaan: ansuranKenderaanValue,
      bantuan: {
        status: bantuanStatus,
        jenis: bantuanJenis,
        jumlah: bantuanJumlah,
        catatan: bantuanCatatan
      },
      asas: {
        nama: normalize(formData.nama_pasangan),
        no_kp: normalizedIC,
        tarikh_lahir: normalize(formData.tarikh_lahir_pasangan) || null,
        telefon: normalize(formData.telefon_pasangan),
        jantina: normalize(formData.jantina_pasangan),
        bangsa: normalize(formData.bangsa_pasangan),
        agama: normalize(formData.agama_pasangan),
        kemahiran_mengaji: normalize(formData.kemahiran_mengaji)
      },
      pendidikan: {
        tahap: normalize(formData.tahap_pendidikan),
        institusi: normalize(formData.institusi_pendidikan),
        bidang: normalize(formData.bidang_pengajian),
        tahun_tamat: normalize(formData.tahun_tamat)
      },
      pekerjaan: {
        status: normalize(formData.status_pekerjaan),
        jenis: normalize(formData.jenis_pekerjaan),
        nama_jenis_pekerjaan: normalize(formData.nama_jenis_pekerjaan),
        jenis_pekerjaan_sendiri: normalize(formData.jenis_pekerjaan_sendiri),
        majikan: normalize(formData.nama_majikan),
        pendapatan_bulanan: toNumber(formData.pendapatan_bulanan) ?? 0
      },
      kesihatan: {
        status: normalize(formData.status_kesihatan),
        kumpulan_darah: normalize(formData.kumpulan_darah),
        penyakit_kronik: this.parseListField(formData.penyakit_kronik),
        ubat_tetap: this.parseListField(formData.ubat_tetap),
        status_merokok: normalize(formData.status_merokok),
        bilangan_rokok: toNumber(formData.bilangan_rokok) ?? 0
      }
    };

    if (payload.kesihatan.bilangan_rokok === 0 && !formData.bilangan_rokok) {
      delete payload.kesihatan.bilangan_rokok;
      if (payload.bilangan_rokok === '') {
        delete payload.bilangan_rokok;
      }
    }

    return payload;
  }

  mapBackendToForm(record) {
    if (!record) return null;
    const asas = record.asas || {};
    const pendidikan = record.pendidikan || {};
    const pekerjaan = record.pekerjaan || {};
    const kesihatan = record.kesihatan || {};

    let formattedBirthDate = record.tarikh_lahir_pasangan || '';
    if (asas.tarikh_lahir) {
      if (typeof asas.tarikh_lahir.toDate === 'function') {
        formattedBirthDate = asas.tarikh_lahir.toDate().toISOString().split('T')[0];
      } else if (asas.tarikh_lahir instanceof Date) {
        formattedBirthDate = asas.tarikh_lahir.toISOString().split('T')[0];
      } else {
        const parsedDate = new Date(asas.tarikh_lahir);
        if (!Number.isNaN(parsedDate.getTime())) {
          formattedBirthDate = parsedDate.toISOString().split('T')[0];
        }
      }
    }

    const noKp = asas.no_kp || record.no_kp_pasangan || '';

    return {
      id: record.id,
      nama_pasangan: asas.nama || record.nama_pasangan || '',
      no_kp_pasangan: this.formatICForInput(noKp),
      tarikh_lahir_pasangan: formattedBirthDate,
      umur_pasangan: formattedBirthDate ? this.calculateAge(formattedBirthDate) : (record.umur_pasangan || ''),
      jantina_pasangan: asas.jantina || record.jantina_pasangan || '',
      bangsa_pasangan: asas.bangsa || record.bangsa_pasangan || '',
      agama_pasangan: asas.agama || record.agama_pasangan || '',
      telefon_pasangan: asas.telefon || record.telefon_pasangan || '',
      kemahiran_mengaji: asas.kemahiran_mengaji || record.kemahiran_mengaji || '',
      status_bantuan_pasangan: record.status_bantuan_pasangan || record.bantuan?.status || '',
      jenis_bantuan_pasangan: record.jenis_bantuan_pasangan || record.bantuan?.jenis || '',
      jumlah_bantuan_pasangan: record.jumlah_bantuan_pasangan ?? record.bantuan?.jumlah ?? '',
      catatan_bantuan_pasangan: record.catatan_bantuan_pasangan || record.bantuan?.catatan || '',
      tahap_pendidikan: pendidikan.tahap || record.tahap_pendidikan || '',
      institusi_pendidikan: pendidikan.institusi || record.institusi_pendidikan || '',
      bidang_pengajian: pendidikan.bidang || record.bidang_pengajian || '',
      tahun_tamat: pendidikan.tahun_tamat || record.tahun_tamat || '',
      status_pekerjaan: (pekerjaan.status || record.status_pekerjaan) === 'Menganggur'
        ? 'Tidak Bekerja'
        : (pekerjaan.status || record.status_pekerjaan || ''),
      jenis_pekerjaan: pekerjaan.jenis || record.jenis_pekerjaan || '',
      nama_jenis_pekerjaan: pekerjaan.nama_jenis_pekerjaan || record.nama_jenis_pekerjaan || '',
      jenis_pekerjaan_sendiri: pekerjaan.jenis_pekerjaan_sendiri || record.jenis_pekerjaan_sendiri || '',
      nama_majikan: pekerjaan.majikan || record.nama_majikan || '',
      pendapatan_bulanan: pekerjaan.pendapatan_bulanan ?? record.pendapatan_bulanan ?? '',
      status_kesihatan: kesihatan.status || record.status_kesihatan || '',
      kumpulan_darah: kesihatan.kumpulan_darah || record.kumpulan_darah || '',
      penyakit_kronik: this.formatListForDisplay(kesihatan.penyakit_kronik || record.penyakit_kronik),
      ubat_tetap: this.formatListForDisplay(kesihatan.ubat_tetap || record.ubat_tetap),
      status_merokok: kesihatan.status_merokok || record.status_merokok || '',
      bilangan_rokok: kesihatan.bilangan_rokok ?? record.bilangan_rokok ?? '',
      jenis_kenderaan: record.jenis_kenderaan || 'Tiada',
      ansuran_kenderaan: record.ansuran_kenderaan ?? ''
    };
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
