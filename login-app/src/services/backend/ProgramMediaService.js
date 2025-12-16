import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../database/firebase.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export class ProgramMediaService {
  static validateImage(file) {
    if (!file) {
      throw new Error('Tiada gambar dipilih.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Saiz gambar melebihi 5MB.');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Format gambar tidak disokong. Hanya JPG, PNG atau WEBP dibenarkan.');
    }
  }

  static sanitizeFileName(name = '') {
    return (name || 'program-image')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static resolveFolder({ programId, programCode } = {}) {
    if (programId) {
      return `program-${programId}`;
    }
    if (programCode) {
      return `code-${this.sanitizeFileName(programCode)}`;
    }
    return 'general';
  }

  static buildStoragePath(options = {}, fileName = '') {
    const folder = this.resolveFolder(options);
    const safeName = this.sanitizeFileName(fileName);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now();
    return `program-images/${folder}/${timestamp}-${randomSuffix}-${safeName}`;
  }

  static async uploadProgramImage(file, options = {}) {
    this.validateImage(file);
    const storagePath = this.buildStoragePath(options, file.name);
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return {
      url,
      storagePath,
      originalName: file.name
    };
  }

  static async deleteProgramImage(storagePath) {
    if (!storagePath) return;
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.warn('ProgramMediaService: gagal memadam gambar program', error);
    }
  }
}

export default ProgramMediaService;
