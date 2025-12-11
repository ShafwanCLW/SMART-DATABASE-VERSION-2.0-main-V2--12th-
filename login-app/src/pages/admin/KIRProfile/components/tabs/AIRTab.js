import { BaseTab } from '../shared/BaseTab.js';
import { DokumenService } from '../../../../../services/backend/DokumenService.js';
import { deriveBirthInfoFromIC } from '../shared/icUtils.js';

export class AIRTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'air';
    this.airData = [];
    this.currentEditingId = null;
    this.isFormVisible = false;
    this.isSavingAIR = false;
    this.formMode = 'create';
    this.currentSijilLahir = null;
    this.pendingSijilRemoval = false;
    this.currentExamResults = [];
    this.isExamFormVisible = false;
    this.currentExamIndex = null;
    this.statusPelajaranValue = '';
  }

  render() {
    return `
      <div class="air-tab">
        <div class="tab-header">
          <div>
            <h3>Ahli Isi Rumah (AIR)</h3>
            <p class="tab-subtitle">Maklumat ahli isi rumah yang tinggal bersama</p>
          </div>
          <div class="tab-actions">
            <button type="button" class="btn btn-primary show-air-form-btn"
              style="${this.isFormVisible ? 'display:none;' : ''}"
              onclick="airTab.handleAddAIR()">
              <i class="fas fa-plus"></i> Tambah Ahli Isi Rumah
            </button>
          </div>
        </div>
        
        <div class="form-container air-form-container" style="${this.isFormVisible ? '' : 'display:none;'}">
          <div class="air-form-header">
            <div>
              <h4>${this.formMode === 'edit' ? 'Kemaskini Ahli Isi Rumah' : 'Tambah Ahli Isi Rumah'}</h4>
              <p>${this.formMode === 'edit' ? 'Semak dan kemaskini maklumat ahli isi rumah yang dipilih.' : 'Lengkapkan borang ini untuk menambah ahli isi rumah baharu.'}</p>
            </div>
            <button type="button" class="btn btn-light" onclick="airTab.cancelForm()">
              <i class="fas fa-arrow-left"></i> Kembali ke Senarai
            </button>
          </div>
          <form class="air-form" id="airForm">
            <!-- Maklumat Asas Section -->
            <div class="form-section">
              <h4 class="section-title">Maklumat Asas</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="nama">Nama Penuh</label>
                  <input type="text" id="nama" name="nama">
                </div>
                <div class="form-group">
                  <label for="no_kp">No. Kad Pengenalan</label>
                  <input type="text" id="no_kp" name="no_kp" placeholder="123456-12-1234">
                </div>
                <div class="form-group">
                  <label for="sijil_lahir">Sijil Lahir (PDF/JPG/PNG)</label>
                  <input type="file" id="sijil_lahir" name="sijil_lahir" accept=".pdf,image/*">
                  <div class="sijil-lahir-preview"></div>
                </div>
                <div class="form-group">
                  <label for="tarikh_lahir">Tarikh Lahir</label>
                  <input type="date" id="tarikh_lahir" name="tarikh_lahir">
                </div>
                <div class="form-group">
                  <label for="umur">Umur</label>
                  <input type="number" id="umur" name="umur" readonly>
                </div>
                <div class="form-group">
                  <label for="hubungan">Hubungan dengan KIR</label>
                  <select id="hubungan" name="hubungan">
                    <option value="">Pilih Hubungan</option>
                    <option value="Suami">Suami</option>
                    <option value="Isteri">Isteri</option>
                    <option value="Anak">Anak</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Bapa">Bapa</option>
                    <option value="Adik Beradik">Adik Beradik</option>
                    <option value="Datuk/Nenek">Datuk/Nenek</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="status_pekerjaan_asas">Status Pekerjaan</label>
                  <select id="status_pekerjaan_asas" name="status">
                    <option value="">Pilih Status</option>
                    <option value="Bekerja">Bekerja</option>
                    <option value="Tidak Bekerja">Tidak Bekerja</option>
                    <option value="Pencen">Pencen</option>
                    <option value="Pelajar">Pelajar</option>
                    <option value="Suri Rumah">Suri Rumah</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Pendidikan Section -->
            <div class="form-section">
              <h4 class="section-title">Maklumat Pendidikan</h4>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label for="status_pelajaran">Status Pelajaran</label>
                  <select id="status_pelajaran" name="status_pelajaran">
                    <option value="">Pilih Status</option>
                    <option value="Masih Belajar">Masih Belajar</option>
                    <option value="Sudah Tamat Pelajaran">Sudah Tamat Pelajaran</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="tahap_semasa">Tahap Pendidikan Semasa</label>
                  <select id="tahap_semasa" name="tahap_semasa">
                    <option value="">Pilih Tahap Pendidikan</option>
                    <option value="Tidak Bersekolah">Tidak Bersekolah</option>
                    <option value="Tadika">Tadika</option>
                    <option value="Sekolah Rendah">Sekolah Rendah</option>
                    <option value="Sekolah Menengah">Sekolah Menengah</option>
                    <option value="Sijil/Diploma">Sijil/Diploma</option>
                    <option value="Ijazah Sarjana Muda">Ijazah Sarjana Muda</option>
                    <option value="Ijazah Sarjana">Ijazah Sarjana</option>
                    <option value="Ijazah Doktor Falsafah">Ijazah Doktor Falsafah</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="sekolah_ipt">Sekolah/IPT</label>
                  <input type="text" id="sekolah_ipt" name="sekolah_ipt">
                </div>
                <div class="form-group">
                  <label for="keputusan">Keputusan</label>
                  <input type="text" id="keputusan" name="keputusan">
                </div>
                <div class="form-group">
                  <label for="sekolah_kafa">Sekolah KAFA</label>
                  <input type="text" id="sekolah_kafa" name="sekolah_kafa">
                </div>
                <div class="form-group">
                  <label for="keputusan_kafa">Keputusan KAFA</label>
                  <input type="text" id="keputusan_kafa" name="keputusan_kafa">
                </div>
                <div class="form-group full-width">
                  <label for="keperluan_sokongan">Catatan Tambahan</label>
                  <textarea id="keperluan_sokongan" name="keperluan_sokongan" rows="3"></textarea>
                </div>
              </div>
              ${this.renderExamSection()}
            </div>

            <!-- Pekerjaan Section -->
            <div class="form-section employment-section" style="display:none;">
              <h4 class="section-title">Maklumat Pekerjaan</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="jenis_pekerjaan">Jenis Pekerjaan</label>
                  <input type="text" id="jenis_pekerjaan" name="jenis_pekerjaan">
                </div>
                <div class="form-group">
                  <label for="pendapatan_bulanan">Pendapatan Bulanan (RM)</label>
                  <input type="number" id="pendapatan_bulanan" name="pendapatan_bulanan" step="0.01">
                </div>
                <div class="form-group">
                  <label for="nama_majikan">Nama Majikan</label>
                  <input type="text" id="nama_majikan" name="nama_majikan">
                </div>
                <div class="form-group full-width">
                  <label for="alamat_majikan">Alamat Majikan</label>
                  <textarea id="alamat_majikan" name="alamat_majikan" rows="3"></textarea>
                </div>
              </div>
            </div>

            <!-- Kesihatan Section -->
            <div class="form-section">
              <h4 class="section-title">Maklumat Kesihatan</h4>
              <div class="form-grid">
                <div class="form-group">
                  <label for="status_oku">Status OKU</label>
                  <select id="status_oku" name="status_oku">
                    <option value="">Pilih Status</option>
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </div>
                <div class="form-group oku-details" style="display:none;">
                  <label for="jenis_kecacatan">Jenis Kecacatan</label>
                  <input type="text" id="jenis_kecacatan" name="jenis_kecacatan">
                </div>
                <div class="form-group">
                  <label for="status_merokok">Status Merokok</label>
                  <select id="status_merokok" name="status_merokok" onchange="airTab.toggleSmokingFields(this.value)">
                    <option value="">Pilih Status</option>
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                    <option value="Bekas Perokok">Bekas Perokok</option>
                  </select>
                </div>
                <div class="form-group smoking-fields" style="display: none;">
                  <label for="bilangan_batang">Bilangan Batang Sehari</label>
                  <input type="number" id="bilangan_batang" name="bilangan_batang">
                </div>
                <div class="form-group full-width">
                  <label for="penyakit_kronik">Penyakit Kronik (Jika Ada)</label>
                  <textarea id="penyakit_kronik" name="penyakit_kronik" rows="3" placeholder="Senaraikan penyakit kronik jika ada"></textarea>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="airTab.cancelForm()">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan AIR</button>
            </div>
          </form>
        </div>

        <!-- AIR List Section -->
        <div class="air-list-section" style="${this.isFormVisible ? 'display:none;' : ''}">
          <div class="list-header">
            <h4>Senarai Ahli Isi Rumah</h4>
            <p class="tab-subtitle">Klik Edit untuk melihat butiran penuh atau Padam untuk keluarkan ahli daripada senarai.</p>
          </div>
          <div class="air-list" id="airList">
            ${this.createAIRList()}
          </div>
        </div>
      </div>
    `;
  }

  createAIRList() {
    if (!this.airData || this.airData.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-users"></i>
          </div>
          <p>Tiada ahli isi rumah didaftarkan</p>
        </div>
      `;
    }

    return this.createAIRTable();
  }

  formatDateForInput(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  populateForm(data = {}) {
    const form = document.getElementById('airForm');
    if (!form) return;

    const setValue = (name, value) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.value = value ?? '';
      }
    };

    setValue('nama', data.nama || '');
    setValue('no_kp', this.formatICForInput(data.no_kp || ''));
    const sijilInput = form.querySelector('#sijil_lahir');
    if (sijilInput) {
      sijilInput.value = '';
    }
    setValue('tarikh_lahir', this.formatDateForInput(data.tarikh_lahir));
    const ageInput = form.querySelector('[name="umur"]');
    if (ageInput) {
      ageInput.value = data.tarikh_lahir ? this.calculateAge(data.tarikh_lahir) : '';
    }
    setValue('hubungan', data.hubungan || '');

    if (!data.tarikh_lahir && data.no_kp) {
      this.applyBirthInfoFromIC(data.no_kp, true);
    }

    setValue('status_pelajaran', data.status_pelajaran || '');
    this.statusPelajaranValue = data.status_pelajaran || '';
    setValue('tahap_semasa', data.tahap_semasa || '');
    setValue('sekolah_ipt', data.sekolah_ipt || '');
    setValue('keputusan', data.keputusan || '');
    setValue('sekolah_kafa', data.sekolah_kafa || '');
    setValue('keputusan_kafa', data.keputusan_kafa || '');
    setValue('keperluan_sokongan', data.keperluan_sokongan || '');

    setValue('status', data.status || '');
    setValue('jenis_pekerjaan', data.jenis_pekerjaan || '');
    setValue('pendapatan_bulanan', data.pendapatan_bulanan ?? '');
    setValue('nama_majikan', data.nama_majikan || '');
    setValue('alamat_majikan', data.alamat_majikan || '');

    setValue('status_oku', data.status_oku || '');
    setValue('jenis_kecacatan', data.jenis_kecacatan || '');

    const smokingSelect = form.querySelector('[name="status_merokok"]');
    if (smokingSelect) {
      smokingSelect.value = data.status_merokok || '';
    }
    setValue('bilangan_batang', data.bilangan_batang ?? '');
    setValue('penyakit_kronik', data.penyakit_kronik || '');

    if (data.sijil_lahir_url) {
      this.currentSijilLahir = {
        url: data.sijil_lahir_url,
        name: data.sijil_lahir_name || this.extractFileName(data.sijil_lahir_url),
        docId: data.sijil_lahir_doc_id || null
      };
    } else if (data.sijil_lahir) {
      this.currentSijilLahir = {
        url: data.sijil_lahir,
        name: this.extractFileName(data.sijil_lahir),
        docId: data.sijil_lahir_doc_id || null
      };
    } else {
      this.currentSijilLahir = null;
    }
    this.pendingSijilRemoval = false;
    this.updateSijilPreview();

    this.currentExamResults = Array.isArray(data.keputusan_exam_tahunan) ? data.keputusan_exam_tahunan.slice() : [];
    this.isExamFormVisible = false;
    this.renderExamList();
    this.updateExamSectionVisibility();
    this.updateExamFormVisibility();

    this.toggleEmploymentSection(data.status || '');
    this.toggleOkuFields(data.status_oku || '');
    this.toggleSmokingFields(data.status_merokok || '');

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = data.id ? 'Kemaskini AIR' : 'Simpan AIR';
    }
  }


  createAIRContent() {
    if (!this.airData || this.airData.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">
            <i class="fas fa-users"></i>
          </div>
          <h4>Tiada Ahli Isi Rumah</h4>
          <p>Klik butang "Tambah AIR" untuk menambah ahli isi rumah.</p>
          <button class="btn btn-primary" onclick="airTab.openAIRDrawer()">
            <i class="fas fa-plus"></i> Tambah AIR
          </button>
        </div>
      `;
    }

    return `
      <div class="air-list">
        ${this.airData.map(air => this.createAIRCard(air)).join('')}
      </div>
      ${this.createAIRTable()}
    `;
  }

  createAIRCard(air) {
    const age = this.calculateAge(air.tarikh_lahir);
    
    return `
      <div class="air-card">
        <div class="air-card-header">
          <div class="air-info">
            <h4>${this.escapeHtml(air.nama)}</h4>
            <span class="air-relation">${this.escapeHtml(air.hubungan)}</span>
          </div>
          <div class="air-actions">
            <button class="btn btn-sm btn-outline" onclick="airTab.editAIR('${air.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="airTab.deleteAIR('${air.id}')" title="Padam">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="air-card-body">
          <div class="air-details">
            <div class="detail-item">
              <span class="label">No. KP:</span>
              <span class="value">${this.formatICForInput(air.no_kp) || 'Tiada'}</span>
            </div>
            <div class="detail-item">
              <span class="label">Umur:</span>
              <span class="value">${age} tahun</span>
            </div>
            ${air.tahap_semasa ? `
              <div class="detail-item">
                <span class="label">Pendidikan:</span>
                <span class="value">${this.escapeHtml(air.tahap_semasa)}</span>
              </div>
            ` : ''}
            ${air.status ? `
              <div class="detail-item">
                <span class="label">Pekerjaan:</span>
                <span class="value">${this.escapeHtml(air.status)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  createAIRTable() {
    return `
      <div class="air-table-container">
        <div class="table-responsive">
          <table class="air-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Hubungan</th>
                <th>No. KP</th>
                <th>Umur</th>
                <th>Pendidikan</th>
                <th>Pekerjaan</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              ${this.airData.map(air => `
                <tr>
                  <td>${this.escapeHtml(air.nama)}</td>
                  <td>${this.escapeHtml(air.hubungan)}</td>
                  <td>${this.formatICForInput(air.no_kp) || '-'}</td>
                  <td>${this.calculateAge(air.tarikh_lahir)} tahun</td>
                  <td>${air.tahap_semasa || '-'}</td>
                  <td>${air.status || '-'}</td>
                  <td>
                    <div class="action-menu">
                      <button type="button" class="btn btn-sm btn-outline action-btn" title="Edit AIR" onclick="airTab.editAIR('${air.id}')">
                        <i class="fas fa-edit"></i> Edit
                      </button>
                      <button type="button" class="btn btn-sm btn-danger action-btn" title="Padam AIR" onclick="airTab.deleteAIR('${air.id}')">
                        <i class="fas fa-trash"></i> Padam
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  handleAddAIR() {
    this.currentEditingId = null;
    this.resetForm();
    this.isFormVisible = true;
    this.updateFormVisibility(true);
    this.populateForm();
  }

  cancelForm() {
    this.resetForm();
    this.isFormVisible = false;
    this.currentEditingId = null;
    this.updateFormVisibility();
  }

  resetForm() {
    const form = document.getElementById('airForm');
    if (form) {
      form.reset();
      this.currentEditingId = null;
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Simpan AIR';
      }
      this.toggleEmploymentSection('');
      this.toggleOkuFields('');
      this.toggleSmokingFields('');
    }
    this.formMode = 'create';
    this.updateFormHeader();
    this.currentSijilLahir = null;
    this.pendingSijilRemoval = false;
    const sijilInput = document.getElementById('sijil_lahir');
    if (sijilInput) {
      sijilInput.value = '';
    }
    this.updateSijilPreview();
    this.currentExamResults = [];
    this.statusPelajaranValue = '';
    this.isExamFormVisible = false;
    this.currentExamIndex = null;
    this.renderExamList();
    this.updateExamSectionVisibility();
    this.updateExamFormVisibility();
  }

  updateFormVisibility(scrollToForm = false) {
    const formContainer = document.querySelector('.air-form-container');
    if (formContainer) {
      formContainer.style.display = this.isFormVisible ? '' : 'none';
      if (scrollToForm && this.isFormVisible) {
        const form = formContainer.querySelector('#airForm');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const focusTarget = form.querySelector('input:not([readonly]), select, textarea');
          if (focusTarget) focusTarget.focus();
        }
      }
    }
    const toggleBtn = document.querySelector('.show-air-form-btn');
    if (toggleBtn) {
      toggleBtn.style.display = this.isFormVisible ? 'none' : '';
    }
    const listSection = document.querySelector('.air-list-section');
    if (listSection) {
      listSection.style.display = this.isFormVisible ? 'none' : '';
    }
  }

  updateFormHeader() {
    const header = document.querySelector('.air-form-header');
    if (!header) return;

    const title = header.querySelector('h4');
    const subtitle = header.querySelector('p');

    if (title) {
      title.textContent = this.formMode === 'edit'
        ? 'Kemaskini Ahli Isi Rumah'
        : 'Tambah Ahli Isi Rumah';
    }

    if (subtitle) {
      subtitle.textContent = this.formMode === 'edit'
        ? 'Semak dan kemaskini maklumat ahli isi rumah yang dipilih.'
        : 'Lengkapkan borang ini untuk menambah ahli isi rumah baharu.';
    }
  }

  updateSijilPreview(selectedFile = null) {
    const preview = document.querySelector('.sijil-lahir-preview');
    if (!preview) return;

    if (selectedFile) {
      preview.innerHTML = `
        <div class="file-status success">
          <i class="fas fa-file-upload"></i>
          <span>Fail dipilih: ${this.escapeHtml(selectedFile.name)}</span>
        </div>
      `;
      return;
    }

    if (this.pendingSijilRemoval && this.currentSijilLahir) {
      preview.innerHTML = `
        <div class="file-status warning">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Dokumen semasa akan dipadam selepas anda menyimpan.</span>
        </div>
      `;
      return;
    }

    if (this.currentSijilLahir?.url) {
      const name = this.escapeHtml(this.currentSijilLahir.name || 'Sijil Lahir');
      preview.innerHTML = `
        <div class="file-status existing">
          <a href="${this.currentSijilLahir.url}" target="_blank" rel="noopener" class="file-link">
            <i class="fas fa-file"></i> ${name}
          </a>
          <button type="button" class="btn btn-sm btn-light" style="margin-left:0.5rem;" onclick="airTab.clearExistingSijilLahir()">
            Padam Dokumen
          </button>
        </div>
      `;
      return;
    }

    preview.innerHTML = '<small class="text-muted">Tiada fail dimuat naik.</small>';
  }

  clearExistingSijilLahir() {
    this.pendingSijilRemoval = true;
    const fileInput = document.getElementById('sijil_lahir');
    if (fileInput) {
      fileInput.value = '';
    }
    this.updateSijilPreview();
  }

  extractFileName(path = '') {
    if (!path) return 'Sijil Lahir';
    try {
      const url = new URL(path);
      path = url.pathname;
    } catch (err) {
      // not a URL, use as-is
    }
    const segments = path.split('/');
    return segments.pop() || 'Sijil Lahir';
  }

  async deleteExistingSijilDocument() {
    if (this.currentSijilLahir?.docId) {
      try {
        await DokumenService.deleteDokumen(this.currentSijilLahir.docId);
      } catch (error) {
        console.warn('Gagal memadam dokumen sijil lahir sedia ada:', error);
      }
    }
    this.currentSijilLahir = null;
  }

  renderExamSection() {
    return `
      <div class="exam-section" style="${this.statusPelajaranValue === 'Masih Belajar' ? '' : 'display:none;'}">
        <div class="exam-section-header">
          <div>
            <h4>Keputusan Exam Tahunan</h4>
            <p class="section-helper">Rekod keputusan tahunan bagi sehingga enam subjek.</p>
          </div>
          <button type="button" class="btn btn-primary" onclick="airTab.openExamForm()">
            <i class="fas fa-plus"></i> Tambah Keputusan
          </button>
        </div>
        <div class="exam-list" id="examResultsList">
          ${this.createExamListHTML()}
        </div>
        <div id="examModalContainer">
          ${this.renderExamFormModal()}
        </div>
      </div>
    `;
  }

  createExamListHTML() {
    if (!this.currentExamResults || this.currentExamResults.length === 0) {
      return `
        <div class="empty-state">
          <p>Tiada keputusan exam direkodkan.</p>
        </div>
      `;
    }

    return `
      <div class="exam-list-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
        ${this.currentExamResults.map((exam, index) => `
          <div class="exam-list-item" onclick="airTab.openExamForm(${index})" style="border:1px solid #e2e8f0;border-radius:12px;padding:1rem;background:#fff;box-shadow:0 6px 18px rgba(15,23,42,0.08);cursor:pointer;transition:transform .15s;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:1.1rem;font-weight:600;color:#0f172a;">${this.escapeHtml(exam.tahun || 'Tiada Tahun')}</div>
                <div style="color:#6366f1;font-weight:600;">${this.escapeHtml(exam.bulan || 'Tiada Bulan')}</div>
              </div>
                <button type="button" class="btn btn-sm btn-danger action-btn" onclick="event.stopPropagation(); airTab.confirmDeleteExamEntry(${index})">
                  <i class="fas fa-trash"></i> Padam
                </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  createExamFormHTML() {
    return `
      <div class="form-row">
        <div class="form-group">
          <label for="exam_year">Tahun</label>
          <input type="number" id="exam_year" min="2000" max="2100">
        </div>
        <div class="form-group">
          <label for="exam_month">Bulan</label>
          <select id="exam_month">
            <option value="">Pilih Bulan</option>
            ${['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember']
              .map(month => `<option value="${month}">${month}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-grid exam-subject-grid">
        ${this.createSubjectInput('Bahasa Melayu', 'grade_bm')}
        ${this.createSubjectInput('Bahasa Inggeris', 'grade_bi')}
        ${this.createSubjectInput('Matematik', 'grade_math')}
        ${this.createSubjectInput('Sains', 'grade_science')}
        ${this.createSubjectInput('Pendidikan Islam', 'grade_islam')}
        ${this.createSubjectInput('Sejarah', 'grade_history')}
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="airTab.cancelExamForm()">Batal</button>
        <button type="button" class="btn btn-primary" onclick="airTab.saveExamEntry()">Simpan Keputusan</button>
      </div>
    `;
  }

  createSubjectInput(label, id) {
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" maxlength="2" placeholder="Contoh: A+">
      </div>
    `;
  }

  renderExamList() {
    const container = document.getElementById('examResultsList');
    if (container) {
      container.innerHTML = this.createExamListHTML();
    }
  }

  updateExamSectionVisibility() {
    const section = document.querySelector('.exam-section');
    if (section) {
      section.style.display = this.statusPelajaranValue === 'Masih Belajar' ? '' : 'none';
    }
  }

  updateExamFormVisibility() {
    const container = document.getElementById('examModalContainer');
    if (container) {
      container.innerHTML = this.renderExamFormModal();
    }
  }

  openExamForm(index = null) {
    this.currentExamIndex = typeof index === 'number' ? index : null;
    this.isExamFormVisible = true;
    this.updateExamFormVisibility();
    this.populateExamForm(this.currentExamIndex);
  }

  populateExamForm(index) {
    const yearInput = document.getElementById('exam_year');
    const monthInput = document.getElementById('exam_month');
    const fields = {
      grade_bm: document.getElementById('grade_bm'),
      grade_bi: document.getElementById('grade_bi'),
      grade_math: document.getElementById('grade_math'),
      grade_science: document.getElementById('grade_science'),
      grade_islam: document.getElementById('grade_islam'),
      grade_history: document.getElementById('grade_history')
    };

    if (!yearInput || !monthInput) return;
    const entry = typeof index === 'number' ? this.currentExamResults[index] : null;
    yearInput.value = entry?.tahun || '';
    monthInput.value = entry?.bulan || '';
    Object.entries(fields).forEach(([key, input]) => {
      if (input) {
        input.value = entry ? (entry[this.subjectFieldMap(key)] || '') : '';
      }
    });
  }

  subjectFieldMap(fieldId) {
    return {
      grade_bm: 'bahasa_melayu',
      grade_bi: 'bahasa_inggeris',
      grade_math: 'matematik',
      grade_science: 'sains',
      grade_islam: 'pendidikan_islam',
      grade_history: 'sejarah'
    }[fieldId];
  }

  cancelExamForm() {
    this.isExamFormVisible = false;
    this.currentExamIndex = null;
    this.updateExamFormVisibility();
  }

  saveExamEntry() {
    const yearInput = document.getElementById('exam_year');
    const monthInput = document.getElementById('exam_month');
    if (!yearInput || !monthInput) return;

    const tahun = yearInput.value.trim();
    const bulan = monthInput.value.trim();
    if (!tahun || !bulan) {
      this.kirProfile.showToast('Sila isi Tahun dan Bulan untuk keputusan exam.', 'error');
      return;
    }

    const entry = {
      id: typeof this.currentExamIndex === 'number' ? this.currentExamResults[this.currentExamIndex]?.id : this.generateExamId(),
      tahun,
      bulan,
      bahasa_melayu: document.getElementById('grade_bm')?.value.trim() || '',
      bahasa_inggeris: document.getElementById('grade_bi')?.value.trim() || '',
      matematik: document.getElementById('grade_math')?.value.trim() || '',
      sains: document.getElementById('grade_science')?.value.trim() || '',
      pendidikan_islam: document.getElementById('grade_islam')?.value.trim() || '',
      sejarah: document.getElementById('grade_history')?.value.trim() || ''
    };

    if (typeof this.currentExamIndex === 'number') {
      this.currentExamResults[this.currentExamIndex] = entry;
    } else {
      this.currentExamResults.push(entry);
    }

    this.isExamFormVisible = false;
    this.currentExamIndex = null;
    this.renderExamList();
    this.updateExamFormVisibility();
  }

  deleteExamEntry(index) {
    if (typeof index !== 'number') return;
    this.currentExamResults.splice(index, 1);
    this.renderExamList();
  }

  confirmDeleteExamEntry(index) {
    const entry = this.currentExamResults[index];
    const label = entry ? `${entry.bulan || ''} ${entry.tahun || ''}`.trim() : '';
    const message = label ? `Adakah anda pasti mahu memadam keputusan ${label}?` : 'Adakah anda pasti mahu memadam keputusan ini?';
    if (confirm(message)) {
      this.deleteExamEntry(index);
    }
  }

  generateExamId() {
    return `exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  renderExamFormModal() {
    if (!this.isExamFormVisible) return '';
    return `
      <div class="exam-modal" style="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;">
        <div class="exam-modal-overlay" onclick="airTab.cancelExamForm()" style="position:absolute;inset:0;background:rgba(15,23,42,0.55);"></div>
        <div class="exam-modal-content" style="position:relative;background:#fff;border-radius:16px;padding:1.25rem;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(15,23,42,0.35);">
          <div class="exam-modal-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <h4>${this.currentExamIndex !== null ? 'Kemaskini' : 'Tambah'} Keputusan Exam</h4>
            <button type="button" class="btn btn-link" onclick="airTab.cancelExamForm()"> 
              <i class="fas fa-times"></i>
            </button>
          </div>
          ${this.createExamFormHTML()}
        </div>
      </div>
    `;
  }

  // AIR Drawer Methods (legacy)
  createAIRDrawer() {
    return `
      <div class="air-drawer ${this.isDrawerOpen ? 'open' : ''}" id="airDrawer">
        <div class="drawer-overlay" onclick="airTab.closeAIRDrawer()"></div>
        <div class="drawer-content">
          <div class="drawer-header">
            <h3>${this.currentAIR?.id ? 'Edit' : 'Tambah'} Ahli Isi Rumah</h3>
            <button class="drawer-close" onclick="airTab.closeAIRDrawer()">
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
                onclick="airTab.switchDrawerTab('${tab.id}')">
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
            <label for="air_nama">Nama Penuh</label>
            <input type="text" id="air_nama" name="nama" value="${data.nama || ''}">
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
              <label for="air_tarikh_lahir">Tarikh Lahir</label>
              <input type="date" id="air_tarikh_lahir" name="tarikh_lahir" value="${data.tarikh_lahir || ''}">
            </div>
            
            <div class="form-group">
              <label for="air_hubungan">Hubungan</label>
              <select id="air_hubungan" name="hubungan">
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
          <button type="button" class="btn btn-primary" onclick="airTab.saveAIRTab('maklumat-asas')">Simpan</button>
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
              <label for="air_keperluan_sokongan">Catatan Tambahan</label>
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
          <button type="button" class="btn btn-primary" onclick="airTab.saveAIRTab('pendidikan')">Simpan</button>
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
          <button type="button" class="btn btn-primary" onclick="airTab.saveAIRTab('pekerjaan')">Simpan</button>
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
              <select id="air_status_merokok" name="status_merokok" onchange="airTab.toggleSmokingFields(this.value)">
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
          <button type="button" class="btn btn-primary" onclick="airTab.saveAIRTab('kesihatan')">Simpan</button>
        </div>
      </form>
    `;
  }

  // AIR Event Handlers
  openAIRDrawer(airId = null) {
    // Validate that KIR ID is available
    if (!this.kirProfile.kirId || this.kirProfile.kirId === 'null' || this.kirProfile.kirId === 'undefined') {
      console.error('Cannot open AIR drawer: KIR ID is not available');
      this.kirProfile.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
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
    
    // Re-render the tab to show the drawer
    const tabContent = document.querySelector('[data-tab="air"]');
    if (tabContent) {
      tabContent.innerHTML = this.render();
      this.setupEventListeners();
    }
  }

  closeAIRDrawer() {
    // Removed confirm dialog - always allow closing
    
    this.isDrawerOpen = false;
    this.currentAIR = null;
    this.currentDrawerTab = 'maklumat-asas';
    this.drawerDirtyTabs.clear();
    
    // Refresh AIR data and re-render
    this.loadAIRData().then(() => {
      const tabContent = document.querySelector('[data-tab="air"]');
      if (tabContent) {
        tabContent.innerHTML = this.render();
        this.setupEventListeners();
      }
    });
  }

  switchDrawerTab(tabId) {
    this.currentDrawerTab = tabId;
    
    // Re-render just the drawer content
    const drawerTabContent = document.querySelector('.drawer-tab-content');
    if (drawerTabContent) {
      drawerTabContent.innerHTML = this.createDrawerTabContent();
    }
    
    // Update tab navigation
    const drawerTabs = document.querySelector('.drawer-tabs');
    if (drawerTabs) {
      drawerTabs.innerHTML = this.createDrawerTabNavigation();
    }
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
      await this.kirProfile.airService.deleteAIR(airId);
      this.kirProfile.showToast('AIR berjaya dipadam', 'success');
      await this.loadAIRData();
      
      // Re-render the tab
      const tabContent = document.querySelector('[data-tab="air"]');
      if (tabContent) {
        tabContent.innerHTML = this.render();
        this.setupEventListeners();
      }
    } catch (error) {
      console.error('Error deleting AIR:', error);
      this.kirProfile.showToast('Ralat memadam AIR: ' + error.message, 'error');
    }
  }

  async saveAIRTab(tabId) {
    // Validate that KIR ID is available
    if (!this.kirProfile.kirId) {
      console.error('Cannot save AIR: KIR ID is not available');
      this.kirProfile.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
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

    if (data.no_kp) {
      const normalizedIC = this.normalizeICValue(data.no_kp);
      if (normalizedIC) {
        data.no_kp = normalizedIC;
      } else {
        delete data.no_kp;
      }
    }
    
    try {
      this.showDrawerSaveLoading(tabId);
      
      if (this.currentAIR?.id) {
        // Update existing AIR
        await this.kirProfile.airService.updateAIR(this.currentAIR.id, data);
        this.kirProfile.showToast('AIR berjaya dikemaskini', 'success');
      } else {
        // Create new AIR
        const newAIR = await this.kirProfile.airService.createAIR(this.kirProfile.kirId, data);
        this.currentAIR = newAIR;
        this.kirProfile.showToast('AIR berjaya ditambah', 'success');
      }
      
      this.drawerDirtyTabs.delete(tabId);
      
      // Update drawer navigation to reflect saved state
      const drawerTabs = document.querySelector('.drawer-tabs');
      if (drawerTabs) {
        drawerTabs.innerHTML = this.createDrawerTabNavigation();
      }
      
    } catch (error) {
      console.error('Error saving AIR:', error);
      this.kirProfile.showToast('Ralat menyimpan AIR: ' + error.message, 'error');
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

  toggleSmokingFields(value) {
    const smokingFields = document.querySelector('.smoking-fields');
    if (smokingFields) {
      smokingFields.style.display = value === 'Ya' ? 'block' : 'none';
    }
  }

  toggleEmploymentSection(statusValue) {
    const section = document.querySelector('.employment-section');
    if (section) {
      section.style.display = statusValue === 'Bekerja' ? '' : 'none';
    }
  }

  toggleOkuFields(value) {
    const okuGroup = document.querySelector('.oku-details');
    if (okuGroup) {
      okuGroup.style.display = value === 'Ya' ? '' : 'none';
    }
  }

  applyBirthInfoFromIC(icValue, clearOnInvalid = false) {
    const form = document.getElementById('airForm');
    if (!form) return;
    const birthInput = form.querySelector('[name="tarikh_lahir"]');
    const ageInput = form.querySelector('[name="umur"]');
    if (!birthInput || !ageInput) return;

    const birthInfo = deriveBirthInfoFromIC(icValue);
    if (!birthInfo) {
      if (clearOnInvalid) {
        birthInput.value = '';
        ageInput.value = '';
      }
      return;
    }

    birthInput.value = birthInfo.formattedDate;
    ageInput.value = birthInfo.age;
  }

  // Data Management Methods
  async loadAIRData() {
    try {
      if (!this.kirProfile.kirId) {
        this.airData = [];
        return;
      }
      
      this.airData = await this.kirProfile.airService.listAIR(this.kirProfile.kirId) || [];
    } catch (error) {
      console.error('Error loading AIR data:', error);
      this.airData = [];
      this.kirProfile.showToast('Ralat memuatkan data AIR: ' + error.message, 'error');
    }
  }

  editAIR(airId) {
    const air = this.airData.find(a => a.id === airId);
    if (!air) return;
    
    this.resetForm();
    this.formMode = 'edit';
    this.currentEditingId = airId;
    this.isFormVisible = true;
    this.updateFormHeader();
    this.updateFormVisibility(true);
    this.populateForm(air);
  }

  async deleteAIR(airId) {
    const air = this.airData.find(a => a.id === airId);
    if (!air) return;
    
    if (!confirm(`Adakah anda pasti mahu memadam ${air.nama}?`)) {
      return;
    }
    
    try {
      await this.kirProfile.airService.deleteAIR(airId);
      this.kirProfile.showToast('AIR berjaya dipadam', 'success');
      await this.loadAIRData();
      this.refreshAIRList();
    } catch (error) {
      console.error('Error deleting AIR:', error);
      this.kirProfile.showToast('Ralat memadam AIR: ' + error.message, 'error');
    }
  }

  async saveAIR(formData, sijilLahirFile = null) {
    // Validate that KIR ID is available
    if (!this.kirProfile.kirId) {
      console.error('Cannot save AIR: KIR ID is not available');
      this.kirProfile.showToast('Ralat: ID KIR tidak tersedia. Sila muat semula halaman.', 'error');
      return;
    }

    if (this.isSavingAIR) {
      return;
    }
    this.isSavingAIR = true;
    const payload = { ...formData };
    payload.keputusan_exam_tahunan = this.currentExamResults || [];
    delete payload.sijil_lahir;
    
    try {
      if (sijilLahirFile && sijilLahirFile.name) {
        await this.deleteExistingSijilDocument();
        const uploaded = await DokumenService.uploadDokumen(
          this.kirProfile.kirId,
          sijilLahirFile,
          'Sijil Lahir'
        );
        payload.sijil_lahir_url = uploaded.url;
        payload.sijil_lahir_name = uploaded.name || sijilLahirFile.name;
        payload.sijil_lahir_doc_id = uploaded.id;
        this.pendingSijilRemoval = false;
        this.currentSijilLahir = {
          url: uploaded.url,
          name: uploaded.name || sijilLahirFile.name,
          docId: uploaded.id
        };
      } else if (this.pendingSijilRemoval) {
        await this.deleteExistingSijilDocument();
        payload.sijil_lahir_url = null;
        payload.sijil_lahir_name = null;
        payload.sijil_lahir_doc_id = null;
        this.pendingSijilRemoval = false;
      } else if (this.currentSijilLahir?.url) {
        payload.sijil_lahir_url = this.currentSijilLahir.url;
        if (this.currentSijilLahir.name) {
          payload.sijil_lahir_name = this.currentSijilLahir.name;
        }
        if (this.currentSijilLahir.docId) {
          payload.sijil_lahir_doc_id = this.currentSijilLahir.docId;
        }
      }

      ['sijil_lahir_url', 'sijil_lahir_name', 'sijil_lahir_doc_id'].forEach(field => {
        if (payload[field] === undefined) {
          delete payload[field];
        }
      });

      if (this.currentEditingId) {
        // Update existing AIR
        await this.kirProfile.airService.updateAIR(this.currentEditingId, payload);
        this.kirProfile.showToast('AIR berjaya dikemaskini', 'success');
      } else {
        // Create new AIR
        await this.kirProfile.airService.createAIR(this.kirProfile.kirId, payload);
        this.kirProfile.showToast('AIR berjaya ditambah', 'success');
      }
      
      // Refresh data and reset form
      await this.loadAIRData();
      this.refreshAIRList();
      this.resetForm();
      this.isFormVisible = false;
      this.currentEditingId = null;
      this.updateFormVisibility();
      
    } catch (error) {
      console.error('Error saving AIR:', error);
      this.kirProfile.showToast('Ralat menyimpan AIR: ' + error.message, 'error');
    } finally {
      this.isSavingAIR = false;
    }
  }

  refreshAIRList() {
    const airListContainer = document.getElementById('airList');
    if (airListContainer) {
      airListContainer.innerHTML = this.createAIRList();
    }
  }

  toggleSmokingFields(value) {
    const smokingFields = document.querySelector('.smoking-fields');
    if (smokingFields) {
      smokingFields.style.display = value === 'Ya' ? 'block' : 'none';
    }
  }

  // Data Management Methods
  async loadAIRData() {
    try {
      if (!this.kirProfile.kirId) {
        this.airData = [];
        return;
      }
      
      this.airData = await this.kirProfile.airService.listAIR(this.kirProfile.kirId) || [];
    } catch (error) {
      console.error('Error loading AIR data:', error);
      this.airData = [];
      this.kirProfile.showToast('Ralat memuatkan data AIR: ' + error.message, 'error');
    }
  }

  // Utility Methods
  calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  normalizeICValue(value = '') {
    return (value || '')
      .toString()
      .replace(/\D/g, '')
      .slice(0, 12);
  }

  formatICForInput(value = '') {
    const digits = this.normalizeICValue(value);
    if (!digits) return '';

    const part1 = digits.slice(0, 6);
    const part2 = digits.slice(6, 8);
    const part3 = digits.slice(8, 12);
    const segments = [];

    if (part1) segments.push(part1);
    if (part2) segments.push(part2);
    if (part3) segments.push(part3);

    return segments.join('-');
  }

  getICCursorPosition(digitCount, formattedValue) {
    if (digitCount <= 0) return 0;

    let digitsSeen = 0;
    for (let i = 0; i < formattedValue.length; i++) {
      if (/\d/.test(formattedValue[i])) {
        digitsSeen++;
        if (digitsSeen === digitCount) {
          return i + 1;
        }
      }
    }

    return formattedValue.length;
  }

  attachICInputMask(input) {
    if (!input) return;

    input.setAttribute('maxlength', '14');

    const formatAndMaintainCursor = (event) => {
      const rawValue = event.target.value || '';
      const selectionStart = event.target.selectionStart || rawValue.length;
      const digitsBeforeCursor = this.normalizeICValue(rawValue.slice(0, selectionStart)).length;
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

  setupEventListeners(bindOnly = false) {
    // Make the tab instance globally accessible for onclick handlers
    window.airTab = this;
    
    // Load initial data
    if (!bindOnly) {
      this.loadAIRData().then(() => {
        this.refreshAIRList();
      });
    }
    
    // Set up form submission
    const form = document.getElementById('airForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Remove empty values
        Object.keys(data).forEach(key => {
          if (data[key] === '') {
            delete data[key];
          }
        });
        
        if (data.no_kp) {
          const normalizedIC = this.normalizeICValue(data.no_kp);
          if (normalizedIC) {
            data.no_kp = normalizedIC;
          } else {
            delete data.no_kp;
          }
        }

        const sijilInput = form.querySelector('#sijil_lahir');
        const sijilFile = sijilInput && sijilInput.files ? sijilInput.files[0] || null : null;
        data.keputusan_exam_tahunan = this.currentExamResults;
        
        await this.saveAIR(data, sijilFile);
      });
      
      // Set up birth date change listener for age calculation
      const birthDateInput = form.querySelector('[name="tarikh_lahir"]');
      if (birthDateInput) {
        birthDateInput.addEventListener('change', (e) => {
          const age = this.calculateAge(e.target.value);
          const ageInput = form.querySelector('[name="umur"]');
          if (ageInput) {
            ageInput.value = age;
          }
        });
      }
      
      // Set up smoking fields toggle
      const smokingSelect = form.querySelector('[name="status_merokok"]');
      if (smokingSelect) {
        smokingSelect.addEventListener('change', (e) => {
          this.toggleSmokingFields(e.target.value);
        });
      }

      const noKpInput = form.querySelector('#no_kp');
      if (noKpInput) {
        this.attachICInputMask(noKpInput);
        noKpInput.addEventListener('input', (e) => {
          this.applyBirthInfoFromIC(e.target.value, true);
        });
      }

      const statusSelect = form.querySelector('[name="status"]');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          this.toggleEmploymentSection(e.target.value);
        });
      }

      const statusPelajaranSelect = form.querySelector('[name="status_pelajaran"]');
      if (statusPelajaranSelect) {
        statusPelajaranSelect.addEventListener('change', (e) => {
          this.statusPelajaranValue = e.target.value;
          this.updateExamSectionVisibility();
          if (this.statusPelajaranValue !== 'Masih Belajar') {
            this.isExamFormVisible = false;
            this.updateExamFormVisibility();
          }
        });
      }

      const okuSelect = form.querySelector('[name="status_oku"]');
      if (okuSelect) {
        okuSelect.addEventListener('change', (e) => {
          this.toggleOkuFields(e.target.value);
        });
      }

      const sijilInput = form.querySelector('#sijil_lahir');
      if (sijilInput) {
        sijilInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
          if (file) {
            this.pendingSijilRemoval = false;
            this.updateSijilPreview(file);
          } else {
            this.updateSijilPreview();
          }
        });
      }
    }
  }

  async save() {
    // AIR data is managed through individual CRUD operations in the drawer
    // This method can be used for any general tab-level operations
    try {
      // Refresh data to ensure consistency
      await this.loadAIRData();
      
      this.kirProfile.showToast('Data AIR berjaya disegerakkan', 'success');
      return true;
      
    } catch (error) {
      console.error('Error syncing AIR data:', error);
      this.kirProfile.showToast('Ralat menyegerakkan data AIR: ' + error.message, 'error');
      return false;
    }
  }
}
