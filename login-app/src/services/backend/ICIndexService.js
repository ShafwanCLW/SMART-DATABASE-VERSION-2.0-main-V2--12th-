// Centralized IC (No. Kad Pengenalan) index management
import { doc, getDoc, deleteDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../database/firebase.js';
import { COLLECTIONS, getEnvironment, normalizeNoKP as normalizeNoKPUtil } from '../database/collections.js';

export const INDEX_OWNER_TYPES = {
  KIR: 'KIR',
  AIR: 'AIR',
  PKIR: 'PKIR'
};

export class ICIndexService {
  static normalize(noKP) {
    return normalizeNoKPUtil(noKP);
  }

  static getDocRef(normalizedNoKP) {
    return doc(db, COLLECTIONS.INDEX_NOKP, normalizedNoKP);
  }

  static buildPayload(noKP, normalized, { ownerType, ownerId, owner_id, kirId, nama }) {
    const resolvedOwnerId = ownerId || owner_id;
    return {
      no_kp: normalized,
      no_kp_display: noKP,
      no_kp_original: noKP,
      owner_type: ownerType,
      owner_id: resolvedOwnerId,
      kir_id: kirId || resolvedOwnerId,
      nama: nama || '',
      env: getEnvironment(),
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  static async register(noKP, metadata) {
    const normalized = this.normalize(noKP);
    if (!normalized) return;
    const docRef = this.getDocRef(normalized);

    await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(docRef);
      if (existing.exists()) {
        const existingData = existing.data();
        const owner = existingData.nama || existingData.owner_type || 'pengguna lain';
        throw new Error(`No. KP ${noKP} telah digunakan oleh ${owner}`);
      }

      transaction.set(docRef, this.buildPayload(noKP, normalized, metadata));
    });
  }

  static async updateMetadata(noKP, metadata = {}) {
    const normalized = this.normalize(noKP);
    if (!normalized) return;
    const docRef = this.getDocRef(normalized);

    try {
      await updateDoc(docRef, {
        ...metadata,
        updated_at: new Date()
      });
    } catch (error) {
      console.warn('Gagal mengemas kini metadata indeks No. KP:', error.message);
    }
  }

  static async transfer(oldNoKP, newNoKP, metadata) {
    const oldNormalized = this.normalize(oldNoKP);
    const newNormalized = this.normalize(newNoKP);

    if (!newNormalized) {
      throw new Error('No. KP baharu diperlukan');
    }

    if (oldNormalized === newNormalized) {
      await this.updateMetadata(newNoKP, metadata);
      return;
    }

    const oldRef = this.getDocRef(oldNormalized);
    const newRef = this.getDocRef(newNormalized);

    await runTransaction(db, async (transaction) => {
      const oldSnap = await transaction.get(oldRef);
      if (!oldSnap.exists()) {
        throw new Error('Rekod indeks lama tidak ditemui');
      }

      const newSnap = await transaction.get(newRef);
      if (newSnap.exists()) {
        const existingData = newSnap.data();
        const owner = existingData.nama || existingData.owner_type || 'pengguna lain';
        throw new Error(`No. KP ${newNoKP} telah digunakan oleh ${owner}`);
      }

      const baseData = oldSnap.data();
      transaction.delete(oldRef);
      transaction.set(newRef, {
        ...baseData,
        ...metadata,
        no_kp: newNormalized,
        no_kp_display: newNoKP,
        created_at: baseData.created_at || new Date(),
        updated_at: new Date()
      });
    });
  }

  static async unregister(noKP) {
    const normalized = this.normalize(noKP);
    if (!normalized) return;
    try {
      await deleteDoc(this.getDocRef(normalized));
    } catch (error) {
      console.warn('Gagal memadam indeks No. KP:', error.message);
    }
  }

  static async get(noKP) {
    const normalized = this.normalize(noKP);
    if (!normalized) return null;
    const snapshot = await getDoc(this.getDocRef(normalized));
    return snapshot.exists() ? snapshot.data() : null;
  }
}

export default ICIndexService;
