/**
 * Schema Validators - Light validation with field dropping
 * Per firestore-audit.md v1: drop unknown fields, ""→null
 */

import { normalizeNoKP } from '../services/database/collections.js';

// KIR Schema - scalar fields only (no ekonomi arrays)
const KIR_SCHEMA = {
  // Core identity
  id: 'string',
  no_kp: 'string',
  no_kp_raw: 'string', 
  nama_penuh: 'string',
  jantina: 'string',
  tarikh_lahir: 'timestamp',
  umur: 'number',
  bangsa: 'string',
  agama: 'string',
  warganegara: 'string',
  
  // Contact
  telefon_utama: 'string',
  telefon_kecemasan: 'string',
  email: 'string',
  
  // Address
  alamat: 'string',
  poskod: 'string',
  bandar: 'string',
  negeri: 'string',
  tempat_lahir: 'string',
  
  // Family
  status_perkahwinan: 'string',
  bilangan_anak: 'number',
  tarikh_nikah: 'timestamp',
  tarikh_cerai: 'timestamp',
  ayah_nama: 'string',
  ibu_nama: 'string',
  
  // Official numbers
  no_kwsp: 'string',
  no_perkeso: 'string',
  sijil_lahir_url: 'string',
  sijil_lahir_name: 'string',
  sijil_lahir_doc_id: 'string',
  ic_document_url: 'string',
  ic_document_name: 'string',
  ic_document_doc_id: 'string',
  
  // System fields
  status_rekod: 'string',
  env: 'string',
  is_seed: 'boolean',
  e2e_run_id: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_AIR Schema
const KIR_AIR_SCHEMA = {
  kir_id: 'string',
  nama_penuh: 'string',
  no_kp: 'string',
  hubungan: 'string',
  jantina: 'string',
  tarikh_lahir: 'timestamp',
  umur: 'number',
  status_perkahwinan: 'string',
  pekerjaan: 'string',
  pendapatan_bulanan: 'number',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_PASANGAN Schema
const KIR_PASANGAN_SCHEMA = {
  kir_id: 'string',
  nama_penuh: 'string',
  no_kp: 'string',
  tarikh_lahir: 'timestamp',
  umur: 'number',
  pekerjaan: 'string',
  pendapatan_bulanan: 'number',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_KAFA Schema
const KIR_KAFA_SCHEMA = {
  kir_id: 'string',
  kafa_sumber: 'string',
  kafa_iman: 'string',
  kafa_islam: 'string',
  kafa_fatihah: 'string',
  kafa_solat: 'string',
  kafa_puasa: 'string',
  kafa_skor: 'number',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_PENDIDIKAN Schema
const KIR_PENDIDIKAN_SCHEMA = {
  kir_id: 'string',
  tahap_pendidikan: 'string', // Standardized: Cipta KIR uses tahap_pendidikan, Profile KIR expects tahap
  tahap: 'string', // Alias for backward compatibility
  bidang_pengajian: 'string', // Standardized: Cipta KIR uses bidang_pengajian, Profile KIR expects bidang
  bidang: 'string', // Alias for backward compatibility
  institusi: 'string', // Standardized: Cipta KIR uses nama_sekolah, Profile KIR expects institusi
  nama_sekolah: 'string', // Alias for backward compatibility
  tahun_tamat: 'number',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_PEKERJAAN Schema
const KIR_PEKERJAAN_SCHEMA = {
  kir_id: 'string',
  status_pekerjaan: 'string', // Standardized: Cipta KIR uses status_pekerjaan, Profile KIR expects status
  status: 'string', // Alias for backward compatibility
  jenis_pekerjaan: 'string', // Standardized: Cipta KIR uses jenis_pekerjaan, Profile KIR expects jenis
  jenis: 'string', // Alias for backward compatibility
  nama_majikan: 'string', // Standardized: Cipta KIR uses nama_majikan, Profile KIR expects majikan
  majikan: 'string', // Alias for backward compatibility
  gaji_bulanan: 'number', // Standardized: Cipta KIR uses gaji_bulanan, Profile KIR expects pendapatan_bulanan
  pendapatan_bulanan: 'number', // Alias for backward compatibility
  alamat_kerja: 'string', // Standardized: Cipta KIR uses alamat_kerja, Profile KIR expects lokasi
  lokasi: 'string', // Alias for backward compatibility
  pengalaman_kerja: 'string', // Standardized: both use pengalaman_kerja, Profile KIR expects pengalaman
  pengalaman: 'string', // Alias for backward compatibility
  kemahiran: 'string',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_PENDAPATAN Schema
const KIR_PENDAPATAN_SCHEMA = {
  kir_id: 'string',
  kategori: 'string', // 'Tetap' | 'Tidak Tetap'
  sumber: 'string',
  jumlah: 'number',
  catatan: 'string',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_PERBELANJAAN Schema
const KIR_PERBELANJAAN_SCHEMA = {
  kir_id: 'string',
  kategori: 'string',
  jumlah: 'number',
  catatan: 'string',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_KESIHATAN Schema
const KIR_KESIHATAN_SCHEMA = {
  kir_id: 'string',
  ringkasan_kesihatan: 'string', // Standardized: Cipta KIR uses ringkasan_kesihatan, missing in Profile KIR
  kumpulan_darah: 'string',
  penyakit_kronik: 'array', // Array of chronic diseases
  ubat_tetap: 'array', // Array of regular medications
  rawatan: 'array', // Array of treatments
  pembedahan: 'array', // Array of surgeries
  catatan_kesihatan: 'string', // Standardized: Cipta KIR uses catatan_kesihatan, Profile KIR expects catatan
  catatan: 'string', // Alias for backward compatibility
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// KIR_BANTUAN_BULANAN Schema
const KIR_BANTUAN_BULANAN_SCHEMA = {
  kir_id: 'string',
  tarikh_mula: 'timestamp',
  agensi: 'string',
  kadar: 'number',
  kekerapan: 'string',
  cara_terima: 'string',
  catatan: 'string',
  env: 'string',
  tarikh_cipta: 'timestamp',
  tarikh_kemas_kini: 'timestamp'
};

// Schema registry
const SCHEMAS = {
  kir: KIR_SCHEMA,
  kir_air: KIR_AIR_SCHEMA,
  kir_pasangan: KIR_PASANGAN_SCHEMA,
  kir_kafa: KIR_KAFA_SCHEMA,
  kir_pendidikan: KIR_PENDIDIKAN_SCHEMA,
  kir_pekerjaan: KIR_PEKERJAAN_SCHEMA,
  kir_kesihatan: KIR_KESIHATAN_SCHEMA,
  kir_pendapatan: KIR_PENDAPATAN_SCHEMA,
  kir_perbelanjaan: KIR_PERBELANJAAN_SCHEMA,
  kir_bantuan_bulanan: KIR_BANTUAN_BULANAN_SCHEMA
};

/**
 * Light validator: drop unknown fields, convert "" → null
 * @param {string} collectionName - Collection name
 * @param {Object} data - Raw data object
 * @returns {Object} Cleaned data object
 */
export function validate(collectionName, data) {
  const schema = SCHEMAS[collectionName];
  if (!schema) {
    console.warn(`No schema found for collection: ${collectionName}`);
    return data;
  }
  
  const cleaned = {};
  
  // Only keep fields that exist in schema
  for (const [field, type] of Object.entries(schema)) {
    if (data.hasOwnProperty(field)) {
      let value = data[field];
      
      // Convert empty strings to null
      if (value === '') {
        value = null;
      }
      
      // Basic type coercion
      if (value !== null && value !== undefined) {
        switch (type) {
          case 'number':
            if (typeof value === 'string' && value.trim() !== '') {
              const num = parseFloat(value);
              value = isNaN(num) ? null : num;
            }
            break;
          case 'boolean':
            if (typeof value === 'string') {
              value = value.toLowerCase() === 'true';
            }
            break;
          case 'string':
            value = String(value);
            break;
          // timestamp and other types pass through
        }
      }
      
      cleaned[field] = value;
    }
  }
  
  return cleaned;
}

/**
 * Validate KIR data with special handling for no_kp normalization
 * @param {Object} data - KIR data
 * @returns {Object} Validated and normalized KIR data
 */
export function validateKIR(data) {
  const cleaned = validate('kir', data);
  
  // Special handling for no_kp normalization
  if (cleaned.no_kp_raw) {
    cleaned.no_kp = normalizeNoKP(cleaned.no_kp_raw);
  } else if (cleaned.no_kp) {
    cleaned.no_kp_raw = cleaned.no_kp;
    cleaned.no_kp = normalizeNoKP(cleaned.no_kp);
  }
  
  return cleaned;
}



export { SCHEMAS };
