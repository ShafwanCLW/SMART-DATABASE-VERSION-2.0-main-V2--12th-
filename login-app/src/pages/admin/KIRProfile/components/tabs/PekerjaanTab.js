// Pekerjaan Tab Component
import { BaseTab } from '../shared/BaseTab.js';

export class PekerjaanTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'pekerjaan';
  }

  render() {
    const data = this.data;
    
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

    // Parse pengalaman kerja list if present
    const pengalamanList = (() => {
      try {
        return JSON.parse(data.pengalaman_kerja_list || '[]');
      } catch (e) {
        return [];
      }
    })();
    const pengalamanListAttrVal = JSON.stringify(pengalamanList).replace(/"/g, '&quot;');
    const pengalamanItemsHTML = pengalamanList.length
      ? pengalamanList.map((item, idx) => `
          <div class="experience-item" data-index="${idx}">
            <div class="experience-main">
              <strong>${item.jawatan || 'Jawatan tidak dinyatakan'}</strong>
              <span>di ${item.majikan || 'Majikan tidak dinyatakan'}</span>
              <span>(${item.tempoh || 'Tempoh tidak dinyatakan'})</span>
            </div>
            ${item.catatan ? `<div class="experience-note">${item.catatan}</div>` : ''}
            <button type="button" class="btn btn-sm btn-danger" onclick="pekerjaanTab.removeExperience(${idx})">Buang</button>
          </div>
        `).join('')
      : '<p class="empty-state">Tiada pengalaman kerja ditambah.</p>';
    
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
                <option value="Berniaga" ${statusPekerjaan === 'Berniaga' ? 'selected' : ''}>Berniaga</option>
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
              <label for="gaji_bulanan">Gaji Kasar Bulanan (RM)</label>
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

        <div class="form-section">
          <h3>Pengalaman Kerja</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="exp_jawatan">Jawatan</label>
              <input type="text" id="exp_jawatan" name="exp_jawatan" placeholder="Contoh: Jurujual">
            </div>
            <div class="form-group">
              <label for="exp_majikan">Majikan</label>
              <input type="text" id="exp_majikan" name="exp_majikan" placeholder="Contoh: Syarikat ABC">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="exp_tempoh">Tempoh</label>
              <input type="text" id="exp_tempoh" name="exp_tempoh" placeholder="Contoh: Jan 2020 - Dis 2022">
            </div>
            <div class="form-group full-width">
              <label for="exp_catatan">Catatan (Opsional)</label>
              <textarea id="exp_catatan" name="exp_catatan" rows="2" placeholder="Penerangan ringkas mengenai tanggungjawab"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="pekerjaanTab.addExperience()">Tambah Pengalaman</button>
            <input type="hidden" id="pengalaman_kerja_list" name="pengalaman_kerja_list" value="${pengalamanListAttrVal}">
          </div>
          <div id="pengalaman_list" class="experience-list">
            ${pengalamanItemsHTML}
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('pekerjaan')">Simpan</button>
        </div>
      </form>
    `;
  }

  async save() {
    try {
      const formData = this.getFormData();
      
      // Validate salary if provided
      if (formData.gaji_bulanan && parseFloat(formData.gaji_bulanan) < 0) {
        this.showToast('Gaji bulanan tidak boleh negatif', 'error');
        return false;
      }
      
      // Validate experience years if provided
      if (formData.pengalaman_kerja && parseInt(formData.pengalaman_kerja) < 0) {
        this.showToast('Pengalaman kerja tidak boleh negatif', 'error');
        return false;
      }

      // Save via KIRService
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'pekerjaan', formData);
      
      // Update local cache
      this.updateRelatedDataCache(formData);
      
      // Clear dirty state
      this.clearDirty();
      
      this.showToast('Data pekerjaan berjaya disimpan', 'success');
      return true;
      
    } catch (error) {
      console.error('Error saving Pekerjaan data:', error);
      this.showToast('Ralat menyimpan data pekerjaan: ' + error.message, 'error');
      return false;
    }
  }

  validate() {
    // Pekerjaan tab has no required fields, so always valid
    return true;
  }

  setupEventListeners() {
    // Add event listener for status_pekerjaan change to show/hide relevant fields
    const statusSelect = document.getElementById('status_pekerjaan');
    if (statusSelect) {
      let initializingStatus = true;
      statusSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        const workRelatedGroups = [
          'jenis_pekerjaan_group',
          'nama_majikan_group', 
          'gaji_bulanan_group',
          'alamat_kerja_group'
        ];
        
        // Show/hide work-related fields based on employment status
        if (value === 'Bekerja') {
          workRelatedGroups.forEach(groupId => {
            const group = document.getElementById(groupId);
            if (group) group.style.display = 'block';
          });
        } else {
          workRelatedGroups.forEach(groupId => {
            const group = document.getElementById(groupId);
            if (group) group.style.display = 'none';
          });
        }
        
        if (!initializingStatus) {
          this.markDirty();
        }
      });
      
      // Trigger initial state
      statusSelect.dispatchEvent(new Event('change'));
      initializingStatus = false;
    }

    const jenisInput = document.getElementById('jenis_pekerjaan');
    if (jenisInput && this.kirProfile?.updatePendapatanFromPekerjaan) {
      const syncJenis = () => {
        this.kirProfile.updatePendapatanFromPekerjaan({
          sumberPendapatanUtama: jenisInput.value || ''
        });
      };
      jenisInput.addEventListener('input', syncJenis);
      syncJenis();
    }

    const gajiInput = document.getElementById('gaji_bulanan');
    if (gajiInput && this.kirProfile?.updatePendapatanFromPekerjaan) {
      const syncGaji = () => {
        this.kirProfile.updatePendapatanFromPekerjaan({
          jumlahPendapatanUtama: gajiInput.value || ''
        });
      };
      gajiInput.addEventListener('input', syncGaji);
      syncGaji();
    }

    // Expose tab instance for inline handlers
    window.pekerjaanTab = this;
  }

  // Add experience item to the list
  addExperience() {
    const jawatan = document.getElementById('exp_jawatan')?.value?.trim();
    const majikan = document.getElementById('exp_majikan')?.value?.trim();
    const tempoh = document.getElementById('exp_tempoh')?.value?.trim();
    const catatan = document.getElementById('exp_catatan')?.value?.trim();

    if (!jawatan && !majikan && !tempoh) {
      this.showToast('Sila isi sekurang-kurangnya Jawatan, Majikan atau Tempoh', 'error');
      return;
    }

    const hiddenInput = document.getElementById('pengalaman_kerja_list');
    let list = [];
    try {
      list = JSON.parse(hiddenInput?.value || '[]');
    } catch (e) {
      list = [];
    }

    list.push({ jawatan, majikan, tempoh, catatan });
    if (hiddenInput) hiddenInput.value = JSON.stringify(list);

    // Update UI list
    const listContainer = document.getElementById('pengalaman_list');
    if (listContainer) {
      listContainer.innerHTML = list.map((item, idx) => `
        <div class="experience-item" data-index="${idx}">
          <div class="experience-main">
            <strong>${item.jawatan || 'Jawatan tidak dinyatakan'}</strong>
            <span>di ${item.majikan || 'Majikan tidak dinyatakan'}</span>
            <span>(${item.tempoh || 'Tempoh tidak dinyatakan'})</span>
          </div>
          ${item.catatan ? `<div class=\"experience-note\">${item.catatan}</div>` : ''}
          <button type="button" class="btn btn-sm btn-danger" onclick="pekerjaanTab.removeExperience(${idx})">Buang</button>
        </div>
      `).join('');
    }

    // Clear inputs
    ['exp_jawatan','exp_majikan','exp_tempoh','exp_catatan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    this.markDirty();
  }

  // Remove experience item by index
  removeExperience(index) {
    const hiddenInput = document.getElementById('pengalaman_kerja_list');
    if (!hiddenInput) return;
    let list = [];
    try {
      list = JSON.parse(hiddenInput.value || '[]');
    } catch (e) {
      list = [];
    }
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    hiddenInput.value = JSON.stringify(list);

    const listContainer = document.getElementById('pengalaman_list');
    if (listContainer) {
      listContainer.innerHTML = list.length
        ? list.map((item, idx) => `
            <div class="experience-item" data-index="${idx}">
              <div class="experience-main">
                <strong>${item.jawatan || 'Jawatan tidak dinyatakan'}</strong>
                <span>di ${item.majikan || 'Majikan tidak dinyatakan'}</span>
                <span>(${item.tempoh || 'Tempoh tidak dinyatakan'})</span>
              </div>
              ${item.catatan ? `<div class=\"experience-note\">${item.catatan}</div>` : ''}
              <button type="button" class="btn btn-sm btn-danger" onclick="pekerjaanTab.removeExperience(${idx})">Buang</button>
            </div>
          `).join('')
        : '<p class="empty-state">Tiada pengalaman kerja ditambah.</p>';
    }

    this.markDirty();
  }
}
