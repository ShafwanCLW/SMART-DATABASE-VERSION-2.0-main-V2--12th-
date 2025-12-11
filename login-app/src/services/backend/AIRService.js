// AIR (Ahli Isi Rumah) Service for managing household members
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

export class AIRService {
  static COLLECTION_NAME = COLLECTIONS.KIR_AIR;

  /**
   * Get all AIR records for a specific KIR
   * @param {string} kirId - The KIR ID
   * @returns {Promise<Array>} Array of AIR records
   */
  static async listAIR(kirId) {
    try {
      if (!kirId) {
        throw new Error('KIR ID is required');
      }

      const airQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('kir_id', '==', kirId),
        createEnvFilter(),
        orderBy('tarikh_cipta', 'desc')
      );

      const querySnapshot = await getDocs(airQuery);
      const airList = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        airList.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to readable dates
          tarikh_cipta: data.tarikh_cipta?.toDate?.() || data.tarikh_cipta,
          tarikh_kemas_kini: data.tarikh_kemas_kini?.toDate?.() || data.tarikh_kemas_kini,
          tarikh_lahir: data.tarikh_lahir?.toDate?.() || data.tarikh_lahir
        });
      });

      return airList;
    } catch (error) {
      console.error('Error fetching AIR list:', error);
      throw error;
    }
  }

  // Backward compatibility alias
  static async getAIRByKIRId(kirId) {
    return this.listAIR(kirId);
  }

  /**
   * Create a new AIR record
   * @param {string} kirId - The KIR ID
   * @param {Object} payload - AIR data
   * @returns {Promise<string>} Created AIR document ID
   */
  static async createAIR(kirId, payload) {
    try {
      if (!kirId) {
        throw new Error('KIR ID is required');
      }

      if (!payload.nama) {
        throw new Error('Nama is required');
      }

      const now = Timestamp.now();
      
      // Prepare the document data
      const airData = addStandardFields({
        kir_id: kirId,
        ...payload,
        // Convert date strings to Firestore timestamps if needed
        tarikh_lahir: payload.tarikh_lahir ? 
          (payload.tarikh_lahir instanceof Date ? 
            Timestamp.fromDate(payload.tarikh_lahir) : 
            Timestamp.fromDate(new Date(payload.tarikh_lahir))
          ) : null,
        tarikh_cipta: now,
        tarikh_kemas_kini: now
      });

      const airRef = doc(collection(db, this.COLLECTION_NAME));
      const airId = airRef.id;
      const noKpValue = payload.no_kp;
      let indexReserved = false;

      if (noKpValue) {
        await ICIndexService.register(noKpValue, {
          ownerType: INDEX_OWNER_TYPES.AIR,
          owner_id: airId,
          kirId,
          nama: payload.nama || ''
        });
        indexReserved = true;
      }

      try {
        await setDoc(airRef, airData);
        return airId;
      } catch (error) {
        if (indexReserved) {
          await ICIndexService.unregister(noKpValue);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error creating AIR:', error);
      throw error;
    }
  }

  /**
   * Update an existing AIR record
   * @param {string} airId - The AIR document ID
   * @param {Object} payload - Updated AIR data
   * @returns {Promise<void>}
   */
  static async updateAIR(airId, payload) {
    try {
      if (!airId) {
        throw new Error('AIR ID is required');
      }

      const airRef = doc(db, this.COLLECTION_NAME, airId);
      
      // Check if document exists
      const airDoc = await getDoc(airRef);
      if (!airDoc.exists()) {
        throw new Error('AIR record not found');
      }
      const currentData = airDoc.data();
      const currentNoKP = currentData.no_kp;
      const nextNoKP = payload.no_kp;
      const metadata = {
        ownerType: INDEX_OWNER_TYPES.AIR,
        owner_id: airId,
        kirId: currentData.kir_id,
        nama: payload.nama || currentData.nama || ''
      };
      let icTransferred = false;
      let icCleared = false;

      if (nextNoKP !== undefined) {
        if (nextNoKP) {
          await ICIndexService.transfer(currentNoKP, nextNoKP, metadata);
          icTransferred = true;
        } else if (currentNoKP) {
          await ICIndexService.unregister(currentNoKP);
          icCleared = true;
        }
      } else if (currentNoKP && (payload.nama || payload.status || payload.hubungan)) {
        await ICIndexService.updateMetadata(currentNoKP, metadata);
      }

      // Prepare update data
      const updateData = {
        ...payload,
        // Convert date strings to Firestore timestamps if needed
        tarikh_lahir: payload.tarikh_lahir ? 
          (payload.tarikh_lahir instanceof Date ? 
            Timestamp.fromDate(payload.tarikh_lahir) : 
            Timestamp.fromDate(new Date(payload.tarikh_lahir))
          ) : undefined,
        tarikh_kemas_kini: Timestamp.now()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      try {
        await updateDoc(airRef, updateData);
      } catch (error) {
        if (icTransferred) {
          await ICIndexService.transfer(nextNoKP, currentNoKP, metadata);
        } else if (icCleared && currentNoKP) {
          await ICIndexService.register(currentNoKP, metadata);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating AIR:', error);
      throw error;
    }
  }

  /**
   * Delete an AIR record
   * @param {string} airId - The AIR document ID
   * @returns {Promise<void>}
   */
  static async deleteAIR(airId) {
    try {
      if (!airId) {
        throw new Error('AIR ID is required');
      }

      const airRef = doc(db, this.COLLECTION_NAME, airId);
      
      // Check if document exists
      const airDoc = await getDoc(airRef);
      if (!airDoc.exists()) {
        throw new Error('AIR record not found');
      }
      const currentData = airDoc.data();
      const currentNoKP = currentData.no_kp;

      await deleteDoc(airRef);
      if (currentNoKP) {
        await ICIndexService.unregister(currentNoKP);
      }
    } catch (error) {
      console.error('Error deleting AIR:', error);
      throw error;
    }
  }

  /**
   * Get a single AIR record by ID
   * @param {string} airId - The AIR document ID
   * @returns {Promise<Object|null>} AIR record or null if not found
   */
  static async getAIRById(airId) {
    try {
      if (!airId) {
        throw new Error('AIR ID is required');
      }

      const airRef = doc(db, this.COLLECTION_NAME, airId);
      const airDoc = await getDoc(airRef);

      if (!airDoc.exists()) {
        return null;
      }

      const data = airDoc.data();
      return {
        id: airDoc.id,
        ...data,
        // Convert Firestore timestamps to readable dates
        tarikh_cipta: data.tarikh_cipta?.toDate?.() || data.tarikh_cipta,
        tarikh_kemas_kini: data.tarikh_kemas_kini?.toDate?.() || data.tarikh_kemas_kini,
        tarikh_lahir: data.tarikh_lahir?.toDate?.() || data.tarikh_lahir
      };
    } catch (error) {
      console.error('Error getting AIR by ID:', error);
      throw error;
    }
  }

  // Helper methods
  static calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return 'N/A';
    }
  }

  static formatDate(dateString) {
    if (!dateString) return 'Tiada';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Tarikh tidak sah';
    }
  }
}
