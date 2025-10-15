// KIR Data Service - Hardened with schema validation
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../database/firebase.js';
import { COLLECTIONS, addStandardFields, createEnvFilter, normalizeNoKP as normalizeNoKPUtil, getEnvironment } from '../database/collections.js';
import { validateKIR, validate } from '../../lib/validators.js';
import { PasanganService } from './PasanganService.js';
import { normalizeFieldNames, mapCiptaToProfile } from '../../lib/fieldMapper.js';

export class KIRService {
  // Create a new KIR record (CREATE-ONCE with validation)
  static async createKIR(draft) {
    try {
      console.log('KIRService.createKIR() called', { no_kp: draft.no_kp, from: 'createKIR', time: new Date().toISOString() });
      
      // Validate and clean data using schema
      const cleanedData = validateKIR(draft);
      
      // Normalize No. KP
      const normalizedNoKP = this.normalizeNoKP(cleanedData.no_kp || cleanedData.no_kp_raw);
      if (!normalizedNoKP) {
        throw new Error('No. KP is required for KIR creation');
      }
      
      // Derive birth details from No. KP when available
      const { birthDate, age } = this.deriveBirthInfoFromNoKP(normalizedNoKP);
      if (!cleanedData.tarikh_lahir && birthDate) {
        cleanedData.tarikh_lahir = birthDate;
      }
      if ((cleanedData.umur === undefined || cleanedData.umur === null) && age !== null) {
        cleanedData.umur = age;
      }

      // Validate dates after enrichment
      this.validateDates(cleanedData);
      
      // Create KIR document reference
      const kirRef = doc(collection(db, COLLECTIONS.KIR));
      const kirId = kirRef.id;
      
      // Create No. KP index first (atomic uniqueness check)
      await this.createNoKPIndex(normalizedNoKP, kirId);
      
      try {
        // Build address using helper function
        const alamat = this.joinNonEmpty([
          cleanedData.alamat,
          this.joinNonEmpty([cleanedData.poskod, cleanedData.bandar], ' '),
          cleanedData.negeri
        ], ', ');
        
        // Prepare main KIR document with validated data
        const kirData = addStandardFields({
          id: kirId,
          no_kp: normalizedNoKP,
          no_kp_raw: cleanedData.no_kp_raw || cleanedData.no_kp || '',
          nama_penuh: cleanedData.nama_penuh || '',
          jantina: cleanedData.jantina || '',
          tarikh_lahir: cleanedData.tarikh_lahir || null,
          umur: cleanedData.umur ?? null,
          bangsa: cleanedData.bangsa || '',
          agama: cleanedData.agama || '',
          warganegara: cleanedData.warganegara || '',
          telefon_utama: cleanedData.telefon_utama || cleanedData.no_telefon || '',
          telefon_kecemasan: cleanedData.telefon_kecemasan || '',
          email: cleanedData.email || '',
          alamat: alamat,
          poskod: cleanedData.poskod || '',
          bandar: cleanedData.bandar || '',
          negeri: cleanedData.negeri || '',
          tempat_lahir: cleanedData.tempat_lahir || '',
          ayah_nama: cleanedData.ayah_nama || '',
          ibu_nama: cleanedData.ibu_nama || '',
          no_kwsp: cleanedData.no_kwsp || '',
          no_perkeso: cleanedData.no_perkeso || '',
          status_rekod: cleanedData.status_rekod || 'Draf',
          tarikh_cipta: serverTimestamp(),
          tarikh_kemas_kini: serverTimestamp()
        });

        // Create main KIR document
        await setDoc(kirRef, kirData);

        // Create related documents immediately to ensure tabs have data
        await this.createRelatedDocuments(kirId, cleanedData);

        console.log('KIR created successfully', { op: 'create', kirId, from: 'createKIR', time: new Date().toISOString() });
        return { id: kirId };
        
      } catch (error) {
        // If KIR creation failed, clean up the index
        await this.deleteNoKPIndex(normalizedNoKP);
        throw error;
      }
      
    } catch (error) {
      console.error('Error creating KIR:', error);
      
      // Handle specific errors
      if (error.code === 'permission-denied') {
        throw new Error('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      }
      if (error.message && error.message.includes('already exists')) {
        throw new Error('No. KP sudah wujud dalam sistem. Sila gunakan No. KP yang berbeza.');
      }
      
      console.error('KIR creation failed', { error: error.message, from: 'createKIR', time: new Date().toISOString() });
      throw error;
    }
  }

  // Update existing KIR record (SCALAR FIELDS ONLY)
  static async updateKIR(id, partial) {
    try {
      console.log('KIRService.updateKIR() called', { kirId: id, from: 'updateKIR', time: new Date().toISOString() });
      
      const kirRef = doc(db, COLLECTIONS.KIR, id);
      
      // Check if document exists
      const kirDoc = await getDoc(kirRef);
      if (!kirDoc.exists()) {
        throw new Error('KIR record not found');
      }

      const currentData = kirDoc.data();
      
      // Validate and clean data using schema (allowlist only KIR scalar fields)
      const cleanedData = validateKIR(partial);
      

      
      // Handle No. KP changes with index updates
      if (cleanedData.no_kp && this.normalizeNoKP(cleanedData.no_kp) !== this.normalizeNoKP(currentData.no_kp)) {
        await this.updateNoKPIndex(currentData.no_kp, cleanedData.no_kp, id);
      }

      // Prepare update data (only scalar fields)
      const updateData = {
        ...cleanedData,
        tarikh_kemas_kini: serverTimestamp()
      };
      
      // Handle address concatenation if address parts are provided
      if (cleanedData.alamat || cleanedData.poskod || cleanedData.bandar || cleanedData.negeri) {
        const alamat = this.joinNonEmpty([
          cleanedData.alamat || currentData.alamat,
          this.joinNonEmpty([cleanedData.poskod || currentData.poskod, cleanedData.bandar || currentData.bandar], ' '),
          cleanedData.negeri || currentData.negeri
        ], ', ');
        updateData.alamat = alamat;
      }
      
      // Normalize No. KP if provided
      if (cleanedData.no_kp) {
        updateData.no_kp = this.normalizeNoKP(cleanedData.no_kp);
        updateData.no_kp_raw = cleanedData.no_kp_raw || cleanedData.no_kp;
      }
      
      // Enrich birth details from No. KP if missing
      const finalNoKP = updateData.no_kp || currentData.no_kp;
      if (finalNoKP) {
        const { birthDate, age } = this.deriveBirthInfoFromNoKP(finalNoKP);
        if ((updateData.tarikh_lahir === undefined || updateData.tarikh_lahir === null) && birthDate) {
          updateData.tarikh_lahir = birthDate;
        }
        if ((updateData.umur === undefined || updateData.umur === null) && age !== null) {
          updateData.umur = age;
        }
      }

      // Validate dates after enrichment
      this.validateDates(updateData);

      await updateDoc(kirRef, updateData);

      // Update related documents if needed
      await this.updateRelatedDocuments(id, cleanedData);
      
      console.log('KIR updated successfully', { op: 'update', kirId: id, from: 'updateKIR', time: new Date().toISOString() });

    } catch (error) {
      console.error('Error updating KIR:', error);
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied') {
        throw new Error('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      }
      
      throw error;
    }
  }

  // Get KIR by ID
  static async getKIRById(id) {
    try {
      const kirRef = doc(db, COLLECTIONS.KIR, id);
      const kirDoc = await getDoc(kirRef);
      
      if (!kirDoc.exists()) {
        return null;
      }

      const kirData = kirDoc.data();
      
      // Get related documents
      const relatedData = await this.getRelatedDocuments(id);
      
      return {
        ...kirData,
        ...relatedData
      };
    } catch (error) {
      console.error('Error getting KIR by ID:', error);
      throw error;
    }
  }

  // Get KIR list with filtering and pagination
  static async getKIRList(params = {}) {
    try {
      const {
        search = '',
        status = '',
        daerah = '',
        pageCursor = null,
        pageSize = 10
      } = params;

      let q = collection(db, COLLECTIONS.KIR);
      const constraints = [];

      // Add environment filter
       constraints.push(createEnvFilter());

      // Add filters
      if (status && status !== 'all') {
        constraints.push(where('status_rekod', '==', status));
      }

      if (daerah && daerah !== 'all') {
        constraints.push(where('negeri', '==', daerah));
      }

      // Add ordering
      constraints.push(orderBy('tarikh_cipta', 'desc'));

      // Apply cursor-based pagination
      if (pageCursor) {
        constraints.push(startAfter(pageCursor));
      }
      
      // Add limit (+1 to check if there are more results)
      constraints.push(limit(pageSize + 1));

      // Apply constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      // Get documents
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      // Check if there are more results
      const hasMore = docs.length > pageSize;
      const items = docs.slice(0, pageSize); // Remove the extra doc used for hasMore check
      
      // Map to data objects
      let kirItems = items.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply search filter (client-side for now)
      if (search) {
        const searchLower = search.toLowerCase();
        kirItems = kirItems.filter(item => 
          (item.nama_penuh || '').toLowerCase().includes(searchLower) ||
          (item.no_kp || '').toLowerCase().includes(searchLower) ||
          (item.email || '').toLowerCase().includes(searchLower)
        );
      }
      
      // Prepare next cursor
      const nextCursor = hasMore && items.length > 0 ? items[items.length - 1] : null;

      return {
        items: kirItems,
        nextCursor,
        hasMore,
        pageSize
      };
    } catch (error) {
      console.error('Error getting KIR list:', error);
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied') {
        throw new Error('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      }
      
      throw error;
    }
  }

  // Delete KIR record
  static async deleteKIR(id) {
    try {
      // Get KIR data first to retrieve No. KP for index cleanup
      const currentKIR = await this.getKIRById(id);
      if (!currentKIR) {
        throw new Error('KIR tidak dijumpai');
      }
      
      // Delete related documents first
      await this.deleteRelatedDocuments(id);
      
      // Delete main KIR document
      const kirRef = doc(db, COLLECTIONS.KIR, id);
      await deleteDoc(kirRef);
      
      // Delete No. KP index
      await this.deleteNoKPIndex(currentKIR.no_kp);
      
      return {
        success: true,
        message: 'KIR berjaya dipadam'
      };
      
    } catch (error) {
      console.error('Error deleting KIR:', error);
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied') {
        throw new Error('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      }
      
      throw new Error('Ralat memadam KIR');
    }
  }

  // Set KIR status
  static async setStatus(id, status) {
    try {
      const kirRef = doc(db, 'kir', id);
      await updateDoc(kirRef, {
        status_rekod: status,
        tarikh_kemas_kini: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting KIR status:', error);
      throw error;
    }
  }

  // Helper function to join non-empty address parts
  static joinNonEmpty(parts, separator) {
    return parts.filter(Boolean).join(separator);
  }
  
  // Helper method to normalize No. KP (remove spaces and dashes)
  static normalizeNoKP(noKP) {
    return noKP.replace(/[\s-]/g, '');
  }

  // Derive birth date and age from Malaysian NRIC (No. KP)
  static deriveBirthInfoFromNoKP(noKP) {
    if (!noKP) {
      return { birthDate: null, age: null };
    }

    const digits = String(noKP).replace(/\D/g, '');
    if (digits.length < 6) {
      return { birthDate: null, age: null };
    }

    const yearPart = parseInt(digits.slice(0, 2), 10);
    const monthPart = parseInt(digits.slice(2, 4), 10);
    const dayPart = parseInt(digits.slice(4, 6), 10);

    if (Number.isNaN(yearPart) || Number.isNaN(monthPart) || Number.isNaN(dayPart)) {
      return { birthDate: null, age: null };
    }

    if (monthPart < 1 || monthPart > 12 || dayPart < 1 || dayPart > 31) {
      return { birthDate: null, age: null };
    }

    const today = new Date();
    const currentCentury = Math.floor(today.getFullYear() / 100) * 100;
    const currentYearTwoDigit = today.getFullYear() % 100;
    const fullYear = yearPart > currentYearTwoDigit
      ? currentCentury - 100 + yearPart
      : currentCentury + yearPart;

    const birthDate = new Date(fullYear, monthPart - 1, dayPart);

    // Guard against invalid dates (e.g. 310299 -> Feb 31)
    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate.getFullYear() !== fullYear ||
      birthDate.getMonth() !== monthPart - 1 ||
      birthDate.getDate() !== dayPart
    ) {
      return { birthDate: null, age: null };
    }

    const age = this.calculateAgeFromDate(birthDate);
    return { birthDate, age };
  }

  static calculateAgeFromDate(birthDate) {
    if (!(birthDate instanceof Date) || Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
  
  // Atomic No. KP uniqueness using index collection
  static async createNoKPIndex(noKP, kirId) {
    const normalizedNoKP = this.normalizeNoKP(noKP);
    const indexRef = doc(db, COLLECTIONS.INDEX_NOKP, normalizedNoKP);
    
    try {
      // Attempt to create index document atomically
      await setDoc(indexRef, {
        kir_id: kirId,
        no_kp_original: noKP,
        created_at: new Date()
      }, { merge: false }); // merge: false ensures it fails if doc exists
      
      return true;
    } catch (error) {
      if (error.code === 'already-exists' || error.message.includes('already exists')) {
        throw new Error(`No. KP ${noKP} telah wujud dalam sistem`);
      }
      throw error;
    }
  }
  
  static async deleteNoKPIndex(noKP) {
    const normalizedNoKP = this.normalizeNoKP(noKP);
    const indexRef = doc(db, COLLECTIONS.INDEX_NOKP, normalizedNoKP);
    
    try {
      await deleteDoc(indexRef);
    } catch (error) {
      console.warn('Warning: Could not delete No. KP index:', error);
      // Don't throw - this is cleanup, main operation should succeed
    }
  }
  
  // S1 Requirement: Get No. KP index for ensureKirId()
  static async getNoKPIndex(normalizedNoKP) {
    try {
      const indexRef = doc(db, COLLECTIONS.INDEX_NOKP, normalizedNoKP);
      const indexDoc = await getDoc(indexRef);
      
      if (indexDoc.exists()) {
        return indexDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting No. KP index:', error);
      throw new Error('Ralat semasa memeriksa indeks No. KP');
    }
  }
  
  static async updateNoKPIndex(oldNoKP, newNoKP, kirId) {
    if (this.normalizeNoKP(oldNoKP) === this.normalizeNoKP(newNoKP)) {
      return; // No change needed
    }
    
    let newIndexCreated = false;
    try {
      // Create new index first
      await this.createNoKPIndex(newNoKP, kirId);
      newIndexCreated = true;
      
      // Delete old index
      await this.deleteNoKPIndex(oldNoKP);
    } catch (error) {
      // If new index creation failed, clean up
      if (newIndexCreated) {
        await this.deleteNoKPIndex(newNoKP);
      }
      throw error;
    }
  }
  
  
  static async checkDuplicateNoKP(noKP, excludeId = null) {
    try {
      const normalizedNoKP = this.normalizeNoKP(noKP);
      const q = query(
        collection(db, 'kir'),
        where('no_kp', '==', normalizedNoKP)
      );
      
      const querySnapshot = await getDocs(q);
      
      // If excluding an ID (for updates), filter it out
      const duplicates = querySnapshot.docs.filter(doc => 
        excludeId ? doc.id !== excludeId : true
      );
      
      return {
        exists: duplicates.length > 0,
        count: duplicates.length
      };
    } catch (error) {
      console.error('Error checking duplicate No. KP:', error);
      throw new Error('Ralat semasa memeriksa No. KP pendua');
    }
  }

  // Helper method to create related documents
  static async createRelatedDocuments(kirId, draft) {
    console.log('=== Starting createRelatedDocuments ===');
    console.log('KIR ID:', kirId);
    console.log('Draft data keys:', Object.keys(draft));
    console.log('Current environment during creation:', getEnvironment());
    console.log('Full draft data:', JSON.stringify(draft, null, 2));
    
    const results = {
      kafa: false,
      pendidikan: false,
      pekerjaan: false,
      kesihatan: false,
      keluarga: false,
      pasangan: 0,
      pendapatan: 0,
      perbelanjaan: 0,
      bantuan: 0,
      air: 0
    };
    
    try {
      // Create KAFA document (always create to ensure Profile KIR tabs work)
      const hasKAFA = this.hasKAFAData(draft);
      console.log('Has KAFA data:', hasKAFA);
      try {
        const kafaData = addStandardFields({
          kir_id: kirId,
          kafa_sumber: draft.kafa_sumber || '',
          kafa_iman: draft.kafa_iman || '',
          kafa_islam: draft.kafa_islam || '',
          kafa_fatihah: draft.kafa_fatihah || '',
          kafa_solat: draft.kafa_solat || '',
          kafa_puasa: draft.kafa_puasa || '',
          kafa_skor: draft.kafa_skor || 0,
          tarikh_cipta: serverTimestamp(),
          tarikh_kemas_kini: serverTimestamp()
        });
        console.log('KAFA data before creation:', JSON.stringify(kafaData, null, 2));
        console.log('KAFA environment field:', kafaData.env);
        const kafaDoc = await addDoc(collection(db, COLLECTIONS.KIR_KAFA), kafaData);
        console.log('✅ KAFA document created:', kafaDoc.id);
        console.log('KAFA collection name:', COLLECTIONS.KIR_KAFA);
        results.kafa = true;
      } catch (error) {
        console.error('❌ Error creating KAFA document:', error);
      }

      // Create Pendidikan document (always create to ensure Profile KIR tabs work)
      const hasPendidikan = this.hasPendidikanData(draft);
      console.log('Has Pendidikan data:', hasPendidikan);
      try {
        // Normalize field names to support both Cipta KIR and Profile KIR formats
        const rawPendidikanData = {
          kir_id: kirId,
          tahap_pendidikan: draft.tahap_pendidikan || draft.tahap || '',
          bidang_pengajian: draft.bidang_pengajian || draft.bidang || '',
          institusi: draft.nama_sekolah || draft.institusi || '',
          tahun_tamat: draft.tahun_tamat || '',
          tarikh_cipta: serverTimestamp(),
          tarikh_kemas_kini: serverTimestamp()
        };
        
        // Normalize field names for maximum compatibility
        const normalizedData = normalizeFieldNames('kir_pendidikan', rawPendidikanData);
        const pendidikanData = addStandardFields(normalizedData);
        
        console.log('Pendidikan data (normalized):', JSON.stringify(pendidikanData, null, 2));
        const pendidikanDoc = await addDoc(collection(db, COLLECTIONS.KIR_PENDIDIKAN), pendidikanData);
        console.log('✅ Pendidikan document created:', pendidikanDoc.id);
        results.pendidikan = true;
      } catch (error) {
        console.error('❌ Error creating Pendidikan document:', error);
      }

      // Create Pekerjaan document (always create to ensure Profile KIR tabs work)
      const hasPekerjaan = this.hasPekerjaanData(draft);
      console.log('Has Pekerjaan data:', hasPekerjaan);
      try {
        // Normalize field names to support both Cipta KIR and Profile KIR formats
        const rawPekerjaanData = {
          kir_id: kirId,
          status_pekerjaan: draft.status_pekerjaan || draft.status || '',
          jenis_pekerjaan: draft.jenis_pekerjaan || draft.jenis || '',
          nama_majikan: draft.nama_majikan || draft.majikan || '',
          gaji_bulanan: draft.gaji_bulanan || draft.pendapatan_bulanan || 0,
          alamat_kerja: draft.alamat_kerja || draft.lokasi || '',
          pengalaman_kerja: draft.pengalaman_kerja || draft.pengalaman || '',
          kemahiran: draft.kemahiran || '',
          tarikh_cipta: serverTimestamp(),
          tarikh_kemas_kini: serverTimestamp()
        };
        
        // Normalize field names for maximum compatibility
        const normalizedData = normalizeFieldNames('kir_pekerjaan', rawPekerjaanData);
        const pekerjaanData = addStandardFields(normalizedData);
        
        console.log('Pekerjaan data (normalized):', JSON.stringify(pekerjaanData, null, 2));
        const pekerjaanDoc = await addDoc(collection(db, COLLECTIONS.KIR_PEKERJAAN), pekerjaanData);
        console.log('✅ Pekerjaan document created:', pekerjaanDoc.id);
        results.pekerjaan = true;
      } catch (error) {
        console.error('❌ Error creating Pekerjaan document:', error);
      }

      // Create Kesihatan document (always create to ensure Profile KIR tabs work)
      const hasKesihatan = this.hasKesihatanData(draft);
      console.log('Has Kesihatan data:', hasKesihatan);
      try {
        // Normalize field names to support both Cipta KIR and Profile KIR formats
        const rawKesihatanData = {
          kir_id: kirId,
          ringkasan_kesihatan: draft.ringkasan_kesihatan || draft.ringkasan || '',
          kumpulan_darah: draft.kumpulan_darah || '',
          penyakit_kronik: draft.penyakit_kronik || [],
          ubat_tetap: draft.ubat_tetap || [],
          rawatan: draft.rawatan || [],
          pembedahan: draft.pembedahan || [],
          catatan_kesihatan: draft.catatan_kesihatan || draft.catatan || '',
          tarikh_cipta: serverTimestamp(),
          tarikh_kemas_kini: serverTimestamp()
        };
        
        // Normalize field names for maximum compatibility
        const normalizedData = normalizeFieldNames('kir_kesihatan', rawKesihatanData);
        const kesihatanData = addStandardFields(normalizedData);
        
        console.log('Kesihatan data (normalized):', JSON.stringify(kesihatanData, null, 2));
        const kesihatanDoc = await addDoc(collection(db, COLLECTIONS.KIR_KESIHATAN), kesihatanData);
        console.log('✅ Kesihatan document created:', kesihatanDoc.id);
        results.kesihatan = true;
      } catch (error) {
        console.error('❌ Error creating Kesihatan document:', error);
      }

      // Handle Kekeluargaan data
      // Note: Basic family status fields are stored in main KIR record, not as separate documents
      // Detailed spouse data is managed via PasanganService (KIR_PASANGAN collection)
      const hasKeluarga = this.hasKeluargaData(draft);
      console.log('Has Keluarga data:', hasKeluarga);
      if (hasKeluarga) {
        try {
          // Update main KIR record with family status fields
          const kirRef = doc(db, COLLECTIONS.KIR, kirId);
          const keluargaFields = {
            status_perkahwinan: draft.status_perkahwinan || '',
            tarikh_nikah: draft.tarikh_nikah || null,
            tarikh_cerai: draft.tarikh_cerai || null,
            tarikh_kemas_kini: serverTimestamp()
          };
          
          // Only include non-empty fields
          const updateFields = Object.fromEntries(
            Object.entries(keluargaFields).filter(([key, value]) => 
              value !== '' && value !== null && value !== undefined
            )
          );
          
          if (Object.keys(updateFields).length > 0) {
            await updateDoc(kirRef, updateFields);
            console.log('✅ KIR record updated with Keluarga data');
            results.keluarga = true;
          }
        } catch (error) {
          console.error('❌ Error updating KIR record with Keluarga data:', error);
        }
      }

      // Handle Spouse (Pasangan) data - create records in kir_pasangan collection
      const hasSpouseData = this.hasSpouseData(draft);
      console.log('Has Spouse data:', hasSpouseData);
      console.log('Spouse data fields:', {
        nama_pasangan: draft.nama_pasangan,
        pasangan_no_kp: draft.pasangan_no_kp,
        pasangan_alamat: draft.pasangan_alamat,
        pasangan_status: draft.pasangan_status
      });
      if (hasSpouseData) {
        try {
          const spouseData = {
            asas: {
              nama: draft.nama_pasangan || '',
              no_kp: draft.pasangan_no_kp || '',
              alamat: draft.pasangan_alamat || '',
              status_pasangan: draft.pasangan_status || 'Hidup'
            }
          };
          
          console.log('Creating PKIR with data:', spouseData);
          const spouseResult = await PasanganService.createPKIR(kirId, spouseData);
          console.log('✅ Spouse record created:', spouseResult.id);
          results.pasangan = 1;
        } catch (error) {
          console.error('❌ Error creating Spouse record:', error);
          console.error('Error details:', error.message);
          // Don't fail the entire process if spouse creation fails
        }
      }

      // Create Pendapatan records
      if (draft.pendapatan_tetap && Array.isArray(draft.pendapatan_tetap)) {
        console.log('Creating', draft.pendapatan_tetap.length, 'Pendapatan Tetap records');
        for (const pendapatan of draft.pendapatan_tetap) {
          try {
            const pendapatanData = addStandardFields({
              kir_id: kirId,
              kategori: 'Tetap',
              sumber: pendapatan.sumber || '',
              jumlah: pendapatan.jumlah || 0,
              catatan: pendapatan.catatan || '',
              tarikh_cipta: serverTimestamp(),
              tarikh_kemas_kini: serverTimestamp()
            });
            await addDoc(collection(db, COLLECTIONS.KIR_PENDAPATAN), pendapatanData);
            results.pendapatan++;
          } catch (error) {
            console.error('❌ Error creating Pendapatan Tetap record:', error);
          }
        }
      }

      if (draft.pendapatan_tidak_tetap && Array.isArray(draft.pendapatan_tidak_tetap)) {
        console.log('Creating', draft.pendapatan_tidak_tetap.length, 'Pendapatan Tidak Tetap records');
        for (const pendapatan of draft.pendapatan_tidak_tetap) {
          try {
            const pendapatanData = addStandardFields({
              kir_id: kirId,
              kategori: 'Tidak Tetap',
              sumber: pendapatan.sumber || '',
              jumlah: pendapatan.jumlah || 0,
              catatan: pendapatan.catatan || '',
              tarikh_cipta: serverTimestamp(),
              tarikh_kemas_kini: serverTimestamp()
            });
            await addDoc(collection(db, COLLECTIONS.KIR_PENDAPATAN), pendapatanData);
            results.pendapatan++;
          } catch (error) {
            console.error('❌ Error creating Pendapatan Tidak Tetap record:', error);
          }
        }
      }

      // Create Perbelanjaan records
      if (draft.perbelanjaan && Array.isArray(draft.perbelanjaan)) {
        console.log('Creating', draft.perbelanjaan.length, 'Perbelanjaan records');
        for (const perbelanjaan of draft.perbelanjaan) {
          try {
            const perbelanjaanData = addStandardFields({
              kir_id: kirId,
              kategori: perbelanjaan.kategori || '',
              jumlah: perbelanjaan.jumlah || 0,
              catatan: perbelanjaan.catatan || '',
              tarikh_cipta: serverTimestamp(),
              tarikh_kemas_kini: serverTimestamp()
            });
            await addDoc(collection(db, COLLECTIONS.KIR_PERBELANJAAN), perbelanjaanData);
            results.perbelanjaan++;
          } catch (error) {
            console.error('❌ Error creating Perbelanjaan record:', error);
          }
        }
      }

      // Create Bantuan Bulanan records
      if (draft.bantuan_bulanan && Array.isArray(draft.bantuan_bulanan)) {
        console.log('Creating', draft.bantuan_bulanan.length, 'Bantuan Bulanan records');
        for (const bantuan of draft.bantuan_bulanan) {
          try {
            const bantuanData = addStandardFields({
              kir_id: kirId,
              tarikh_mula: bantuan.tarikh_mula || null,
              agensi: bantuan.agensi || '',
              kadar: bantuan.kadar || 0,
              kekerapan: bantuan.kekerapan || '',
              cara_terima: bantuan.cara_terima || '',
              catatan: bantuan.catatan || '',
              tarikh_cipta: serverTimestamp(),
              tarikh_kemas_kini: serverTimestamp()
            });
            await addDoc(collection(db, COLLECTIONS.KIR_BANTUAN_BULANAN), bantuanData);
            results.bantuan++;
          } catch (error) {
            console.error('❌ Error creating Bantuan Bulanan record:', error);
          }
        }
      }

      // Create AIR (Ahli Isi Rumah) records
      if (draft.air && Array.isArray(draft.air)) {
        console.log('Creating', draft.air.length, 'AIR records');
        for (const airMember of draft.air) {
          try {
            // Skip empty AIR entries
            if (!airMember.nama || airMember.nama.trim() === '') {
              continue;
            }
            
            const { AIRService } = await import('./AIRService.js');
            const airData = {
              nama: airMember.nama || '',
              no_kp: airMember.no_kp || '',
              tarikh_lahir: airMember.tarikh_lahir || null,
              jantina: airMember.jantina || '',
              hubungan: airMember.hubungan || '',
              status: airMember.status || '',
              oku: airMember.oku || 'Tidak',
              pendapatan: airMember.pendapatan ? parseFloat(airMember.pendapatan) : 0,
              sekolah: airMember.sekolah || ''
            };
            
            await AIRService.createAIR(kirId, airData);
            results.air = (results.air || 0) + 1;
          } catch (error) {
            console.error('❌ Error creating AIR record:', error);
          }
        }
      }
      
      // Log final results
      console.log('=== createRelatedDocuments Results ===');
      console.log('KAFA:', results.kafa ? '✅ Created' : '❌ Skipped/Failed');
      console.log('Pendidikan:', results.pendidikan ? '✅ Created' : '❌ Skipped/Failed');
      console.log('Pekerjaan:', results.pekerjaan ? '✅ Created' : '❌ Skipped/Failed');
      console.log('Kesihatan:', results.kesihatan ? '✅ Created' : '❌ Skipped/Failed');
      console.log('Keluarga:', results.keluarga ? '✅ Updated in main KIR' : '❌ Skipped/Failed');
      console.log('Pasangan records:', results.pasangan);
      console.log('Pendapatan records:', results.pendapatan);
      console.log('Perbelanjaan records:', results.perbelanjaan);
      console.log('Bantuan records:', results.bantuan);
      console.log('AIR records:', results.air);
      console.log('=== End createRelatedDocuments ===');
      
    } catch (error) {
      console.error('❌ Fatal error in createRelatedDocuments:', error);
      // Don't throw here to avoid breaking the main KIR creation
    }
  }

  // Helper method to update related documents
  static async updateRelatedDocuments(kirId, partial) {
    // Implementation for updating related documents
    // This would involve querying and updating the related collections
    // For now, we'll keep it simple and just log
    console.log('Updating related documents for KIR:', kirId);
  }

  // Update specific related document
  static async updateRelatedDocument(kirId, collection, data) {
    try {
      const collectionMap = {
        'kafa': COLLECTIONS.KIR_KAFA,
        'pendidikan': COLLECTIONS.KIR_PENDIDIKAN,
        'pekerjaan': COLLECTIONS.KIR_PEKERJAAN,
        'kesihatan': COLLECTIONS.KIR_KESIHATAN
        // Note: 'keluarga' data should be handled via PasanganService for spouse data
        // Basic family status fields should be stored in main KIR record
      };
      
      const collectionName = collectionMap[collection];
      if (!collectionName) {
        throw new Error(`Invalid collection: ${collection}`);
      }
      
      // Find existing document
      const q = query(
        collection(db, collectionName),
        where('kir_id', '==', kirId)
      );
      const snapshot = await getDocs(q);
      
      // Normalize field names based on collection type
      const normalizedData = normalizeFieldNames(collection, data);
      
      const updateData = {
        ...normalizedData,
        kir_id: kirId,
        updated_at: serverTimestamp()
      };
      
      console.log(`Updating ${collection} data (normalized):`, JSON.stringify(updateData, null, 2));
      
      if (!snapshot.empty) {
        // Update existing document
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, updateData);
      } else {
        // Create new document
        updateData.created_at = serverTimestamp();
        await addDoc(collection(db, collectionName), updateData);
      }
      
    } catch (error) {
      console.error('Error updating related document:', error);
      
      // Handle specific Firestore permission errors
      if (error.code === 'permission-denied') {
        throw new Error('Akses ditolak: sila semak peranan dan peraturan pangkalan data.');
      }
      
      throw error;
    }
  }

  // Helper method to get related documents
  static async getRelatedDocuments(kirId) {
    try {
      console.log(`=== Getting Related Documents for KIR ID: ${kirId} ===`);
      console.log(`KIR ID type: ${typeof kirId}, length: ${kirId?.length}`);
      console.log(`KIR ID raw value: '${kirId}'`);
      const relatedData = {};
      const currentEnv = getEnvironment();
      console.log(`Current environment: ${currentEnv}`);
      console.log(`Environment filter: env == '${currentEnv}'`);

      // Get KAFA data
      // Note: KAFA has one-to-one relationship with KIR in this phase
      console.log('Querying KAFA collection...');
      const kafaQuery = query(
        collection(db, COLLECTIONS.KIR_KAFA), 
        where('kir_id', '==', kirId),
        createEnvFilter()
      );
      const kafaSnapshot = await getDocs(kafaQuery);
      console.log(`KAFA query result: ${kafaSnapshot.size} documents found`);
      if (!kafaSnapshot.empty) {
        const kafaData = kafaSnapshot.docs[0].data();
        console.log(`KAFA document kir_id: '${kafaData.kir_id}', matches: ${kafaData.kir_id === kirId}`);
        // Normalize field names for consistent access
        relatedData.kafa = normalizeFieldNames('kir_kafa', kafaData);
        console.log('✅ KAFA data loaded and normalized');
      } else {
        console.log('❌ No KAFA data found');
        // Debug: Check if any KAFA documents exist for this environment
        const allKafaQuery = query(collection(db, COLLECTIONS.KIR_KAFA), createEnvFilter());
        const allKafaSnapshot = await getDocs(allKafaQuery);
        console.log(`Total KAFA documents in ${currentEnv}: ${allKafaSnapshot.size}`);
        if (allKafaSnapshot.size > 0) {
          console.log('Sample KAFA kir_ids:', allKafaSnapshot.docs.slice(0, 3).map(doc => doc.data().kir_id));
        }
      }

      // Get Pendidikan data
      // Note: Pendidikan has one-to-one relationship with KIR in this phase
      console.log('Querying Pendidikan collection...');
      const pendidikanQuery = query(
        collection(db, COLLECTIONS.KIR_PENDIDIKAN), 
        where('kir_id', '==', kirId),
        createEnvFilter()
      );
      const pendidikanSnapshot = await getDocs(pendidikanQuery);
      console.log(`Pendidikan query result: ${pendidikanSnapshot.size} documents found`);
      if (!pendidikanSnapshot.empty) {
        const pendidikanData = pendidikanSnapshot.docs[0].data();
        // Normalize field names for consistent access
        relatedData.pendidikan = normalizeFieldNames('kir_pendidikan', pendidikanData);
        console.log('✅ Pendidikan data loaded and normalized');
      } else {
        console.log('❌ No Pendidikan data found');
      }

      // Get Pekerjaan data
      // Note: Pekerjaan has one-to-one relationship with KIR in this phase
      console.log('Querying Pekerjaan collection...');
      const pekerjaanQuery = query(
        collection(db, COLLECTIONS.KIR_PEKERJAAN), 
        where('kir_id', '==', kirId),
        createEnvFilter()
      );
      const pekerjaanSnapshot = await getDocs(pekerjaanQuery);
      console.log(`Pekerjaan query result: ${pekerjaanSnapshot.size} documents found`);
      if (!pekerjaanSnapshot.empty) {
        const pekerjaanData = pekerjaanSnapshot.docs[0].data();
        // Normalize field names for consistent access
        relatedData.pekerjaan = normalizeFieldNames('kir_pekerjaan', pekerjaanData);
        console.log('✅ Pekerjaan data loaded and normalized');
      } else {
        console.log('❌ No Pekerjaan data found');
      }

      // Get Kesihatan data
      // Note: Kesihatan has one-to-one relationship with KIR in this phase
      console.log('Querying Kesihatan collection...');
      const kesihatanQuery = query(
        collection(db, COLLECTIONS.KIR_KESIHATAN), 
        where('kir_id', '==', kirId),
        createEnvFilter()
      );
      const kesihatanSnapshot = await getDocs(kesihatanQuery);
      console.log(`Kesihatan query result: ${kesihatanSnapshot.size} documents found`);
      if (!kesihatanSnapshot.empty) {
        const kesihatanData = kesihatanSnapshot.docs[0].data();
        // Normalize field names for consistent access
        relatedData.kesihatan = normalizeFieldNames('kir_kesihatan', kesihatanData);
        console.log('✅ Kesihatan data loaded and normalized');
      } else {
        console.log('❌ No Kesihatan data found');
      }

      // Note: Keluarga (family) data is handled differently:
      // - Basic family status is stored in main KIR record
      // - Detailed spouse data is managed via PasanganService (KIR_PASANGAN collection)
      // - Household members are managed via AIRService (KIR_AIR collection)

      console.log('Final related data keys:', Object.keys(relatedData));
      console.log('=== End Getting Related Documents ===');
      return relatedData;
    } catch (error) {
      console.error('Error getting related documents:', error);
      return {};
    }
  }

  // Helper method to delete related documents
  static async deleteRelatedDocuments(kirId) {
    try {
      const collections = [
        COLLECTIONS.KIR_KAFA, 
        COLLECTIONS.KIR_PENDIDIKAN, 
        COLLECTIONS.KIR_PEKERJAAN, 
        COLLECTIONS.KIR_KESIHATAN,
        COLLECTIONS.KIR_PENDAPATAN,
        COLLECTIONS.KIR_PERBELANJAAN,
        COLLECTIONS.KIR_BANTUAN_BULANAN
      ];
      // Note: KIR_PASANGAN and KIR_AIR are managed by their respective services
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('kir_id', '==', kirId));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Error deleting related documents:', error);
    }
  }

  // Helper methods to check if data exists
  static hasKAFAData(draft) {
    // Check for any KAFA-related fields based on firestore-audit.md
    const kafaFields = {
      kafa_sumber: draft.kafa_sumber,
      kafa_iman: draft.kafa_iman,
      kafa_islam: draft.kafa_islam,
      kafa_fatihah: draft.kafa_fatihah,
      kafa_solat: draft.kafa_solat,
      kafa_puasa: draft.kafa_puasa,
      kafa_skor: draft.kafa_skor
    };
    console.log('KAFA fields check:', kafaFields);
    const hasData = draft.kafa_sumber || draft.kafa_iman || draft.kafa_islam || 
           draft.kafa_fatihah || draft.kafa_solat || draft.kafa_puasa || 
           draft.kafa_skor;
    console.log('Has KAFA data result:', hasData);
    return hasData;
  }

  static hasPendidikanData(draft) {
    // Check for any education-related fields based on firestore-audit.md
    const pendidikanFields = {
      tahap_pendidikan: draft.tahap_pendidikan,
      bidang_pengajian: draft.bidang_pengajian,
      nama_sekolah: draft.nama_sekolah,
      institusi: draft.institusi,
      tahun_tamat: draft.tahun_tamat
    };
    console.log('Pendidikan fields check:', pendidikanFields);
    const hasData = draft.tahap_pendidikan || draft.bidang_pengajian || 
           draft.nama_sekolah || draft.institusi || draft.tahun_tamat;
    console.log('Has Pendidikan data result:', hasData);
    return hasData;
  }

  static hasPekerjaanData(draft) {
    // Check for any employment-related fields based on firestore-audit.md
    const pekerjaanFields = {
      status_pekerjaan: draft.status_pekerjaan,
      jenis_pekerjaan: draft.jenis_pekerjaan,
      nama_majikan: draft.nama_majikan,
      gaji_bulanan: draft.gaji_bulanan,
      alamat_kerja: draft.alamat_kerja,
      pengalaman_kerja: draft.pengalaman_kerja,
      kemahiran: draft.kemahiran
    };
    console.log('Pekerjaan fields check:', pekerjaanFields);
    const hasData = draft.status_pekerjaan || draft.jenis_pekerjaan || draft.nama_majikan ||
           draft.gaji_bulanan || draft.alamat_kerja || draft.pengalaman_kerja ||
           draft.kemahiran;
    console.log('Has Pekerjaan data result:', hasData);
    return hasData;
  }

  static hasKeluargaData(draft) {
    return draft.status_perkahwinan || draft.nama_pasangan;
  }

  static hasSpouseData(draft) {
    return draft.nama_pasangan && draft.pasangan_no_kp;
  }

  static hasKesihatanData(draft) {
    const kesihatanFields = {
      kumpulan_darah: draft.kumpulan_darah,
      penyakit_kronik: draft.penyakit_kronik,
      ubat_tetap: draft.ubat_tetap,
      rawatan: draft.rawatan,
      pembedahan: draft.pembedahan
    };
    console.log('Kesihatan fields check:', kesihatanFields);
    const hasData = draft.kumpulan_darah || 
           (draft.penyakit_kronik && draft.penyakit_kronik.length > 0) ||
           (draft.ubat_tetap && draft.ubat_tetap.length > 0) ||
           (draft.rawatan && draft.rawatan.length > 0) ||
           (draft.pembedahan && draft.pembedahan.length > 0);
    console.log('Has Kesihatan data result:', hasData);
    return hasData;
  }

  // Validation helper
  static validateDates(draft) {
    const errors = [];
    
    if (draft.tarikh_nikah && draft.tarikh_cerai) {
      const nikahDate = new Date(draft.tarikh_nikah);
      const ceraiDate = new Date(draft.tarikh_cerai);
      
      if (ceraiDate < nikahDate) {
        errors.push('Tarikh cerai tidak boleh lebih awal daripada tarikh nikah.');
      }
    }
    
    return errors;
  }

  // ===== PENDAPATAN METHODS =====
  static async listPendapatan(kirId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.KIR_PENDAPATAN),
        where('kir_id', '==', kirId),
        orderBy('tarikh_cipta', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error listing pendapatan:', error);
      throw error;
    }
  }

  static async addPendapatan(kirId, payload) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.KIR_PENDAPATAN), {
        ...payload,
        kir_id: kirId,
        tarikh_cipta: serverTimestamp(),
        tarikh_kemas_kini: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding pendapatan:', error);
      throw error;
    }
  }

  static async updatePendapatan(pendapatanId, partial) {
    try {
      const docRef = doc(db, COLLECTIONS.KIR_PENDAPATAN, pendapatanId);
      await updateDoc(docRef, {
        ...partial,
        tarikh_kemas_kini: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating pendapatan:', error);
      throw error;
    }
  }

  static async deletePendapatan(pendapatanId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.KIR_PENDAPATAN, pendapatanId));
    } catch (error) {
      console.error('Error deleting pendapatan:', error);
      throw error;
    }
  }

  // ===== PERBELANJAAN METHODS =====
  static async listPerbelanjaan(kirId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.KIR_PERBELANJAAN),
        where('kir_id', '==', kirId),
        orderBy('tarikh_cipta', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error listing perbelanjaan:', error);
      throw error;
    }
  }

  static async addPerbelanjaan(kirId, payload) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.KIR_PERBELANJAAN), {
        ...payload,
        kir_id: kirId,
        tarikh_cipta: serverTimestamp(),
        tarikh_kemas_kini: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding perbelanjaan:', error);
      throw error;
    }
  }

  static async updatePerbelanjaan(perbelanjaanId, partial) {
    try {
      const docRef = doc(db, COLLECTIONS.KIR_PERBELANJAAN, perbelanjaanId);
      await updateDoc(docRef, {
        ...partial,
        tarikh_kemas_kini: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating perbelanjaan:', error);
      throw error;
    }
  }

  static async deletePerbelanjaan(perbelanjaanId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.KIR_PERBELANJAAN, perbelanjaanId));
    } catch (error) {
      console.error('Error deleting perbelanjaan:', error);
      throw error;
    }
  }

  // ===== BANTUAN BULANAN METHODS =====
  static async listBantuanBulanan(kirId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.KIR_BANTUAN_BULANAN),
        where('kir_id', '==', kirId),
        orderBy('tarikh_cipta', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error listing bantuan bulanan:', error);
      throw error;
    }
  }

  static async addBantuanBulanan(kirId, payload) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.KIR_BANTUAN_BULANAN), {
        ...payload,
        kir_id: kirId,
        tarikh_cipta: serverTimestamp(),
        tarikh_kemas_kini: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding bantuan bulanan:', error);
      throw error;
    }
  }

  static async updateBantuanBulanan(bantuanId, partial) {
    try {
      const docRef = doc(db, COLLECTIONS.KIR_BANTUAN_BULANAN, bantuanId);
      await updateDoc(docRef, {
        ...partial,
        tarikh_kemas_kini: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating bantuan bulanan:', error);
      throw error;
    }
  }

  static async deleteBantuanBulanan(bantuanId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.KIR_BANTUAN_BULANAN, bantuanId));
    } catch (error) {
      console.error('Error deleting bantuan bulanan:', error);
      throw error;
    }
  }
}

// Export for use in other modules
export default KIRService;
