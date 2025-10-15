import { BaseTab } from '../shared/BaseTab.js';
import { FormHelpers } from '../shared/FormHelpers.js';

export class KekeluargaanTab extends BaseTab {
  constructor(kirProfile) {
    super(kirProfile, 'kekeluargaan');
  }

  render() {
    const data = this.kirProfile.kirData || {};
    
    console.log('=== Kekeluargaan Tab Render Debug ===');
    console.log('KIR data object:', data);
    console.log('Available fields:', Object.keys(data));
    console.log('=== End Kekeluargaan Debug ===');
    
    return `
      <form class="kir-form" data-tab="kekeluargaan">
        <div class="form-section">
          <h3>Kekeluargaan</h3>
          
          ${this.createMaritalStatusSection(data)}
          ${this.createSpouseSection(data)}
          ${this.createSiblingsSection(data)}
          ${this.createParentsSection(data)}
        </div>
        
        ${this.createPKIRIntegrationPanel()}
        
        <div class="form-actions">
          <button type="button" class="btn btn-primary" onclick="kirProfile.saveTab('kekeluargaan')">Simpan</button>
        </div>
      </form>
    `;
  }

  createMaritalStatusSection(data) {
    return `
      <div class="form-group">
        <label for="status_perkahwinan">Status Perkahwinan</label>
        <select id="status_perkahwinan" name="status_perkahwinan">
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
    `;
  }

  createSpouseSection(data) {
    return `
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
    `;
  }

  createSiblingsSection(data) {
    return `
      <div class="form-group">
        <label for="senarai_adik_beradik">Senarai Adik Beradik</label>
        <div id="siblings-container">
          ${this.createSiblingsHTML(data.senarai_adik_beradik || [])}
        </div>
        <button type="button" class="btn btn-secondary" onclick="kekeluargaanTab.addSibling()">Tambah Adik Beradik</button>
      </div>
    `;
  }

  createParentsSection(data) {
    return `
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
    `;
  }

  createPKIRIntegrationPanel() {
    return `
      <!-- PKIR Integration Panel -->
      <div class="pkir-integration-panel">
        <div class="integration-card">
          <div class="integration-header">
            <h4><i class="fas fa-users"></i> PKIR (Pasangan Ketua Isi Rumah)</h4>
          </div>
          <div class="integration-content">
            ${this.kirProfile.pkirData ? 
              `<p>Rekod PKIR telah wujud untuk pasangan ini.</p>
               <button type="button" class="btn btn-secondary" onclick="window.location.hash = '#/admin/kir/${this.kirProfile.kirId}?tab=pkir'">
                 <i class="fas fa-eye"></i> Lihat/Urus PKIR
               </button>` :
              `<p>Cipta rekod PKIR lengkap untuk pasangan berdasarkan maklumat di atas.</p>
               <button type="button" class="btn btn-outline-primary" onclick="kekeluargaanTab.openPKIRModal()">
                 <i class="fas fa-arrow-up"></i> Promosi ke PKIR
               </button>`
            }
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
        <input type="text" name="sibling_${index}" value="${FormHelpers.escapeHtml(sibling)}" placeholder="Nama adik beradik">
        <button type="button" class="btn btn-danger btn-sm" onclick="kekeluargaanTab.removeSibling(${index})">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `).join('');
  }

  addSibling() {
    const container = document.getElementById('siblings-container');
    if (!container) return;
    
    const siblings = container.querySelectorAll('.sibling-item');
    const index = siblings.length;
    
    const siblingHTML = `
      <div class="sibling-item" data-index="${index}">
        <input type="text" name="sibling_${index}" placeholder="Nama adik beradik">
        <button type="button" class="btn btn-danger btn-sm" onclick="kekeluargaanTab.removeSibling(${index})">
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
    this.markTabDirty();
  }

  removeSibling(index) {
    const siblingItem = document.querySelector(`.sibling-item[data-index="${index}"]`);
    if (siblingItem) {
      siblingItem.remove();
      this.markTabDirty();
      
      // Show "no siblings" message if no siblings left
      const container = document.getElementById('siblings-container');
      const remainingSiblings = container.querySelectorAll('.sibling-item');
      if (remainingSiblings.length === 0) {
        container.innerHTML = '<p class="no-siblings">Tiada adik beradik didaftarkan</p>';
      }
    }
  }

  openPKIRModal() {
    this.kirProfile.isPKIRModalOpen = true;
    this.kirProfile.render();
  }

  setupEventListeners() {
    // Make the tab instance globally accessible for onclick handlers
    window.kekeluargaanTab = this;
    
    // Set up form change tracking
    const form = document.querySelector('[data-tab="kekeluargaan"]');
    if (form) {
      form.addEventListener('input', () => {
        this.markTabDirty();
      });
      
      form.addEventListener('change', () => {
        this.markTabDirty();
      });
    }
  }

  async save() {
    const form = document.querySelector('[data-tab="kekeluargaan"]');
    if (!form) {
      throw new Error('Form tidak dijumpai');
    }

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        field.focus();
        throw new Error(`Sila isi medan ${field.previousElementSibling?.textContent || field.name}`);
      }
    }

    // Collect form data
    const formData = new FormData(form);
    const data = {};
    
    // Basic form fields
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('sibling_')) {
        data[key] = value;
      }
    }
    
    // Collect siblings data
    const siblings = [];
    const siblingInputs = form.querySelectorAll('input[name^="sibling_"]');
    siblingInputs.forEach(input => {
      if (input.value.trim()) {
        siblings.push(input.value.trim());
      }
    });
    
    if (siblings.length > 0) {
      data.senarai_adik_beradik = siblings;
    }

    // Save via KIR service
    await this.kirProfile.KIRService.updateKIR(this.kirProfile.kirId, data);
    
    // Update local data
    Object.assign(this.kirProfile.kirData, data);
    
    return data;
  }
}
