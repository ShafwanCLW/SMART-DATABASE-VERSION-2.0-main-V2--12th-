// KAFA (Pendidikan Agama) Tab Component
import { BaseTab } from '../shared/BaseTab.js';

export class KAFATab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile);
    this.tabId = 'kafa';
  }

  render() {
    const data = this.data;
    
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
    const kemahiranMengaji = data.kafa_kemahiran_mengaji || data.kemahiran_mengaji || '';

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
              <label for="kafa_kemahiran_mengaji">Kemahiran Mengaji</label>
              <select id="kafa_kemahiran_mengaji" name="kafa_kemahiran_mengaji">
                <option value="">Pilih Kemahiran</option>
                <option value="Boleh Mengaji" ${kemahiranMengaji === 'Boleh Mengaji' ? 'selected' : ''}>Boleh Mengaji</option>
                <option value="Tidak Boleh Mengaji" ${kemahiranMengaji === 'Tidak Boleh Mengaji' ? 'selected' : ''}>Tidak Boleh Mengaji</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="kafa_iman">Tahap Iman</label>
              <select id="kafa_iman" name="kafa_iman">
                <option value="">Pilih Tahap</option>
                <option value="1" ${tahapIman == 1 ? 'selected' : ''}>1 - Sangat Lemah</option>
                <option value="2" ${tahapIman == 2 ? 'selected' : ''}>2 - Lemah</option>
                <option value="3" ${tahapIman == 3 ? 'selected' : ''}>3 - Sederhana</option>
                <option value="4" ${tahapIman == 4 ? 'selected' : ''}>4 - Baik</option>
                <option value="5" ${tahapIman == 5 ? 'selected' : ''}>5 - Sangat Baik</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="kafa_islam">Tahap Islam</label>
              <select id="kafa_islam" name="kafa_islam">
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

  async save() {
    try {
      const formData = this.getFormData();
      
      // Calculate KAFA score based on available ratings only
      const ratingFields = ['kafa_iman', 'kafa_islam', 'kafa_fatihah', 'kafa_solat', 'kafa_puasa'];
      const scores = ratingFields
        .map(field => parseInt(formData[field], 10))
        .filter(score => !Number.isNaN(score));
      
      if (scores.length > 0) {
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        formData.kafa_skor = Math.round(totalScore / scores.length);
      } else {
        delete formData.kafa_skor;
      }

      // Save via KIRService
      await this.kirProfile.kirService.updateRelatedDocument(this.kirProfile.kirId, 'kafa', formData);
      
      // Update local cache
      this.updateRelatedDataCache(formData);
      
      // Clear dirty state
      this.clearDirty();
      
      this.showToast('Data KAFA berjaya disimpan', 'success');
      return true;
      
    } catch (error) {
      console.error('Error saving KAFA data:', error);
      this.showToast('Ralat menyimpan data KAFA: ' + error.message, 'error');
      return false;
    }
  }
}
