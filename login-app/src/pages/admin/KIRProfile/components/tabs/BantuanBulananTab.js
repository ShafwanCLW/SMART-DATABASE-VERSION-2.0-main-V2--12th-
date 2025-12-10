import { BaseTab } from '../shared/BaseTab.js';

export class BantuanBulananTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'bantuan_bulanan';
  }

  render() {
    const data = this.data || {};
    
    return `
      <form class="kir-form" data-tab="bantuan_bulanan">
        <div class="form-section">
          <h3>Bantuan Bulanan</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="bantuan_jkm">Bantuan JKM (RM)</label>
              <input type="number" id="bantuan_jkm" name="bantuan_jkm" value="${data.bantuan_jkm || ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="catatan_bantuan_jkm">Catatan Bantuan JKM</label>
              <textarea id="catatan_bantuan_jkm" name="catatan_bantuan_jkm" rows="3" placeholder="Catatan tambahan bagi bantuan JKM">${data.catatan_bantuan_jkm || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="bantuan_zakat">Bantuan Zakat (RM)</label>
              <input type="number" id="bantuan_zakat" name="bantuan_zakat" value="${data.bantuan_zakat || ''}" step="0.01" min="0" placeholder="0.00">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="bantuan_baitulmal">Bantuan Baitulmal (RM)</label>
              <input type="number" id="bantuan_baitulmal" name="bantuan_baitulmal" value="${data.bantuan_baitulmal || ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            
            <div class="form-group">
              <label for="bantuan_kerajaan_negeri">Bantuan Kerajaan Negeri (RM)</label>
              <input type="number" id="bantuan_kerajaan_negeri" name="bantuan_kerajaan_negeri" value="${data.bantuan_kerajaan_negeri || ''}" step="0.01" min="0" placeholder="0.00">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="bantuan_lain_lain">Bantuan Lain-lain (RM)</label>
              <input type="number" id="bantuan_lain_lain" name="bantuan_lain_lain" value="${data.bantuan_lain_lain || ''}" step="0.01" min="0" placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="catatan_bantuan_lain_lain">Catatan Bantuan Lain-lain</label>
              <textarea id="catatan_bantuan_lain_lain" name="catatan_bantuan_lain_lain" rows="3" placeholder="Catatan bagi bantuan lain-lain">${data.catatan_bantuan_lain_lain || ''}</textarea>
            </div>
          </div>
          
          <div class="form-group">
            <label for="jumlah_keseluruhan_bantuan">Jumlah Keseluruhan Bantuan Bulanan (RM)</label>
            <input type="number" id="jumlah_keseluruhan_bantuan" name="jumlah_keseluruhan_bantuan" value="${data.jumlah_keseluruhan_bantuan || ''}" step="0.01" min="0" readonly>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('bantuan_bulanan')">Simpan</button>
        </div>
      </form>
    `;
  }

  async save() {
    // Validate form first
    if (!this.validate()) {
      this.showToast('Sila lengkapkan semua medan yang diperlukan', 'error');
      return false;
    }

    try {
      const formData = this.getFormData();
      
      // Calculate total assistance automatically
      const bantuan_jkm = parseFloat(formData.bantuan_jkm) || 0;
      const bantuan_zakat = parseFloat(formData.bantuan_zakat) || 0;
      const bantuan_baitulmal = parseFloat(formData.bantuan_baitulmal) || 0;
      const bantuan_kerajaan_negeri = parseFloat(formData.bantuan_kerajaan_negeri) || 0;
      const bantuan_lain_lain = parseFloat(formData.bantuan_lain_lain) || 0;
      
      formData.jumlah_keseluruhan_bantuan = bantuan_jkm + bantuan_zakat + bantuan_baitulmal + 
                                           bantuan_kerajaan_negeri + bantuan_lain_lain;

      // Save via KIRService
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'bantuan_bulanan', formData);
      
      // Update local data
      if (!this.kirProfile.relatedData) {
        this.kirProfile.relatedData = {};
      }
      this.kirProfile.relatedData.bantuan_bulanan = { ...this.kirProfile.relatedData.bantuan_bulanan, ...formData };
      
      // Clear dirty state
      this.clearDirty();
      
      this.showToast('Data bantuan bulanan berjaya disimpan', 'success');
      return true;
      
    } catch (error) {
      console.error('Error saving bantuan bulanan data:', error);
      this.showToast('Ralat menyimpan data bantuan bulanan: ' + error.message, 'error');
      return false;
    }
  }

  validate() {
    const form = document.querySelector(`[data-tab="${this.tabId}"]`);
    if (!form) return false;

    // Basic validation - at least one assistance should be provided
    const assistanceFields = [
      'bantuan_jkm', 'bantuan_zakat',
      'bantuan_baitulmal', 'bantuan_kerajaan_negeri', 'bantuan_lain_lain'
    ];
    
    const hasAnyAssistance = assistanceFields.some(fieldName => {
      const value = form.querySelector(`[name="${fieldName}"]`)?.value;
      return value && parseFloat(value) > 0;
    });
    
    if (!hasAnyAssistance) {
      this.showToast('Sila masukkan sekurang-kurangnya satu bantuan', 'error');
      return false;
    }

    return true;
  }

  setupEventListeners() {
    // Auto-calculate total when individual amounts change
    const assistanceFields = [
      'bantuan_jkm', 'bantuan_zakat',
      'bantuan_baitulmal', 'bantuan_kerajaan_negeri', 'bantuan_lain_lain'
    ];
    
    assistanceFields.forEach(fieldName => {
      const field = document.getElementById(fieldName);
      if (field) {
        field.addEventListener('input', () => {
          this.calculateAndUpdateTotal();
        });
      }
    });

    // Mark as dirty when form changes
    const form = document.querySelector(`[data-tab="${this.tabId}"]`);
    if (form) {
      form.addEventListener('input', () => {
        this.markDirty();
      });
    }
  }

  calculateAndUpdateTotal() {
    const assistanceFields = [
      'bantuan_jkm', 'bantuan_zakat',
      'bantuan_baitulmal', 'bantuan_kerajaan_negeri', 'bantuan_lain_lain'
    ];
    
    const total = assistanceFields.reduce((sum, fieldName) => {
      const value = parseFloat(document.getElementById(fieldName)?.value) || 0;
      return sum + value;
    }, 0);
    
    const totalField = document.getElementById('jumlah_keseluruhan_bantuan');
    if (totalField) {
      totalField.value = total.toFixed(2);
    }
  }
}
