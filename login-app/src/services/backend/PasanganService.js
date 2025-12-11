// PKIR (Pasangan Ketua Isi Rumah) Service for managing spouse data
import { db } from '../database/firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { COLLECTIONS, addStandardFields, createEnvFilter } from '../database/collections.js';
import ICIndexService, { INDEX_OWNER_TYPES } from './ICIndexService.js';

export class PasanganService {

  /**
   * Get PKIR record for a specific KIR
   * @param {string} kirId - The KIR ID
   * @returns {Promise<object|null>} PKIR record or null if not found
   */
  static async getPKIRByKirId(kirId) {
    try {
      if (!kirId) {
        throw new Error('KIR ID is required');
      }

      const pkirQuery = query(
        collection(db, COLLECTIONS.KIR_PASANGAN),
        where('kir_id', '==', kirId),
        createEnvFilter()
      );

      const querySnapshot = await getDocs(pkirQuery);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to readable dates
        tarikh_cipta: data.tarikh_cipta?.toDate?.() || data.tarikh_cipta,
        tarikh_kemas_kini: data.tarikh_kemas_kini?.toDate?.() || data.tarikh_kemas_kini,
        asas: {
          ...data.asas,
          tarikh_lahir: data.asas?.tarikh_lahir?.toDate?.() || data.asas?.tarikh_lahir
        }
      };
    } catch (error) {
      console.error('Error getting PKIR by KIR ID:', error);
      throw new Error(`Failed to get PKIR: ${error.message}`);
    }
  }

  // Backward compatibility alias
  static async getPKIRByKIRId(kirId) {
    return this.getPKIRByKirId(kirId);
  }

  /**
   * Create a new PKIR record
   * @param {string} kirId - The KIR ID
   * @param {object} payload - PKIR data
   * @returns {Promise<{id: string}>} Created PKIR ID
   */
  static async createPKIR(kirId, payload) {
    try {
      if (!kirId) {
        throw new Error('KIR ID is required');
      }

      // Check if PKIR already exists for this KIR
      const existingPKIR = await this.getPKIRByKirId(kirId);
      if (existingPKIR) {
        throw new Error('PKIR already exists for this KIR');
      }

      const now = Timestamp.now();
      const pkirData = {
        kir_id: kirId,
        asas: {
          gambar: payload.asas?.gambar || '',
          nama: payload.asas?.nama || '',
          no_kp: payload.asas?.no_kp || '',
          tarikh_lahir: payload.asas?.tarikh_lahir ? Timestamp.fromDate(new Date(payload.asas.tarikh_lahir)) : null,
          telefon: payload.asas?.telefon || '',
          alamat: payload.asas?.alamat || '',
          status_pasangan: payload.asas?.status_pasangan || 'Hidup',
          oku: payload.asas?.oku || 'Tidak'
        },
        kafa: {
          sumber_pengetahuan: payload.kafa?.sumber_pengetahuan || '',
          tahap_iman: payload.kafa?.tahap_iman || '',
          tahap_islam: payload.kafa?.tahap_islam || '',
          tahap_fatihah: payload.kafa?.tahap_fatihah || '',
          tahap_taharah_wuduk_solat: payload.kafa?.tahap_taharah_wuduk_solat || '',
          tahap_puasa_fidyah_zakat: payload.kafa?.tahap_puasa_fidyah_zakat || '',
          skor_kafa: payload.kafa?.skor_kafa || 0
        },
        pendidikan: {
          tahap: payload.pendidikan?.tahap || '',
          institusi: payload.pendidikan?.institusi || '',
          tahun_tamat: payload.pendidikan?.tahun_tamat || '',
          bidang: payload.pendidikan?.bidang || ''
        },
        pekerjaan: {
          status: payload.pekerjaan?.status || '',
          jenis: payload.pekerjaan?.jenis || '',
          majikan: payload.pekerjaan?.majikan || '',
          pendapatan_bulanan: payload.pekerjaan?.pendapatan_bulanan || 0,
          lokasi: payload.pekerjaan?.lokasi || '',
          pengalaman: payload.pekerjaan?.pengalaman || '',
          kemahiran: payload.pekerjaan?.kemahiran || ''
        },
        kesihatan: {
          kumpulan_darah: payload.kesihatan?.kumpulan_darah || '',
          penyakit_kronik: payload.kesihatan?.penyakit_kronik || [],
          ubat_tetap: payload.kesihatan?.ubat_tetap || []
        },
        dokumen: payload.dokumen || [],
        tarikh_cipta: now,
        tarikh_kemas_kini: now
      };

      const pasanganRef = doc(collection(db, COLLECTIONS.KIR_PASANGAN));
      const pasanganId = pasanganRef.id;
      const icValue = this.extractNoKP(payload);
      const nama = this.extractNama(payload);
      let indexReserved = false;

      if (icValue) {
        await ICIndexService.register(icValue, {
          ownerType: INDEX_OWNER_TYPES.PKIR,
          owner_id: pasanganId,
          kirId,
          nama
        });
        indexReserved = true;
      }

      try {
        await setDoc(pasanganRef, addStandardFields(pkirData));
        return { id: pasanganId };
      } catch (error) {
        if (indexReserved) {
          await ICIndexService.unregister(icValue);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating PKIR:', error);
      throw new Error(`Failed to create PKIR: ${error.message}`);
    }
  }

  /**
   * Update PKIR record
   * @param {string} pkirId - The PKIR document ID
   * @param {object} partial - Partial PKIR data to update
   * @returns {Promise<void>}
   */
  static async updatePKIR(pkirId, partial = {}) {
    try {
      if (!pkirId) {
        throw new Error('PKIR ID is required');
      }

      const docRef = doc(db, COLLECTIONS.KIR_PASANGAN, pkirId);
      const existingDoc = await getDoc(docRef);
      if (!existingDoc.exists()) {
        throw new Error('PKIR record not found');
      }

      const currentData = existingDoc.data();
      const currentNoKP = this.extractNoKP(currentData);
      const nextNoKP = this.extractNoKP(partial);
      const metadata = {
        ownerType: INDEX_OWNER_TYPES.PKIR,
        owner_id: pkirId,
        kirId: currentData.kir_id,
        nama: this.extractNama(partial) || this.extractNama(currentData)
      };
      let icTransferred = false;
      let icCleared = false;

      const icFieldProvided = partial.asas?.no_kp !== undefined ||
        partial.no_kp_pasangan !== undefined ||
        partial.no_kp !== undefined;

      if (icFieldProvided) {
        if (nextNoKP) {
          await ICIndexService.transfer(currentNoKP, nextNoKP, metadata);
          icTransferred = true;
        } else if (currentNoKP) {
          await ICIndexService.unregister(currentNoKP);
          icCleared = true;
        }
      } else if (currentNoKP && (partial.asas?.nama || partial.nama_pasangan)) {
        await ICIndexService.updateMetadata(currentNoKP, metadata);
      }

      const updateData = {
        ...partial,
        tarikh_kemas_kini: Timestamp.now()
      };

      if (partial.asas?.tarikh_lahir) {
        updateData.asas = {
          ...partial.asas,
          tarikh_lahir: Timestamp.fromDate(new Date(partial.asas.tarikh_lahir))
        };
      }

      try {
        await updateDoc(docRef, updateData);
      } catch (error) {
        if (icTransferred) {
          await ICIndexService.transfer(nextNoKP, currentNoKP, metadata);
        } else if (icCleared && currentNoKP) {
          await ICIndexService.register(currentNoKP, metadata);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating PKIR:', error);
      throw new Error(`Failed to update PKIR: ${error.message}`);
    }
  }

  /**
   * Delete PKIR record
   * @param {string} pkirId - The PKIR document ID
   * @returns {Promise<void>}
   */
  static async deletePKIR(pkirId) {
    try {
      if (!pkirId) {
        throw new Error('PKIR ID is required');
      }

      const docRef = doc(db, COLLECTIONS.KIR_PASANGAN, pkirId);
      const existingDoc = await getDoc(docRef);
      if (!existingDoc.exists()) {
        throw new Error('PKIR record not found');
      }

      const currentNoKP = this.extractNoKP(existingDoc.data());

      await deleteDoc(docRef);
      if (currentNoKP) {
        await ICIndexService.unregister(currentNoKP);
      }
    } catch (error) {
      console.error('Error deleting PKIR:', error);
      throw new Error(`Failed to delete PKIR: ${error.message}`);
    }
  }

  static extractNoKP(record = {}) {
    return record?.asas?.no_kp || record?.no_kp_pasangan || record?.no_kp || '';
  }

  static extractNama(record = {}) {
    return record?.asas?.nama || record?.nama_pasangan || record?.nama || '';
  }

  /**
   * Check if a No. KP exists in KIR records
   * @param {string} noKp - The No. KP to check
   * @returns {Promise<object|null>} KIR record if found, null otherwise
   */
  static async checkKIRByNoKp(noKp) {
    try {
      if (!noKp) {
        return null;
      }

      const kirQuery = query(
        collection(db, COLLECTIONS.KIR),
        where('no_kp', '==', noKp),
        createEnvFilter()
      );

      const querySnapshot = await getDocs(kirQuery);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error checking KIR by No. KP:', error);
      return null;
    }
  }

  /**
   * Calculate KAFA score based on assessment levels
   * @param {object} kafaData - KAFA assessment data
   * @returns {number} Calculated KAFA score
   */
  static calculateKAFAScore(kafaData) {
    const scoreMap = {
      'Sangat Baik': 5,
      'Baik': 4,
      'Sederhana': 3,
      'Lemah': 2,
      'Sangat Lemah': 1
    };

    const fields = [
      'tahap_iman',
      'tahap_islam', 
      'tahap_fatihah',
      'tahap_taharah_wuduk_solat',
      'tahap_puasa_fidyah_zakat'
    ];

    let totalScore = 0;
    let validFields = 0;

    fields.forEach(field => {
      if (kafaData[field] && scoreMap[kafaData[field]]) {
        totalScore += scoreMap[kafaData[field]];
        validFields++;
      }
    });

    return validFields > 0 ? Math.round((totalScore / validFields) * 20) : 0; // Convert to percentage
  }

  /**
   * Upload document for PKIR
   * @param {string} pkirId - The PKIR document ID
   * @param {File} file - File to upload
   * @returns {Promise<{url: string, name: string, size: number, uploadedAt: Date}>}
   */
  static async uploadPasanganDokumen(pkirId, file) {
    try {
  
      // In a real application, you would upload to Firebase Storage
      // and return the download URL
      
      const mockUrl = `https://storage.googleapis.com/pkir-documents/${pkirId}/${file.name}`;
      
      return {
        url: mockUrl,
        name: file.name,
        size: file.size,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Format date for display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    if (!date) return '';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Tarikh tidak sah';
    }
  }

  /**
   * Calculate age from birth date
   * @param {Date|string} birthDate - Birth date
   * @returns {number} Age in years
   */
  static calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    try {
      const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 0;
    }
  }
}
