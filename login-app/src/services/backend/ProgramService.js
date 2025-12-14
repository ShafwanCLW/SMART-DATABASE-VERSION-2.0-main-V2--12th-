// Program & Kehadiran Service
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
import { COLLECTIONS, STANDARD_FIELDS, addStandardFields, createEnvFilter, getEnvironment } from '../database/collections.js';

const pickFirst = (...values) => values.find(value => value !== undefined && value !== null);

const normalizeProgramPayload = (programData = {}, { includeDefaults = false } = {}) => {
  const data = {};

  const namaProgram = pickFirst(programData.nama_program, programData.name);
  if (namaProgram !== undefined || includeDefaults) {
    data.nama_program = namaProgram ?? 'New Program';
  }

  const penerangan = pickFirst(programData.penerangan, programData.description, programData.deskripsi);
  if (penerangan !== undefined || includeDefaults) {
    data.penerangan = penerangan ?? '';
  }

  const tarikhMula = pickFirst(programData.tarikh_mula, programData.startDate);
  if (tarikhMula !== undefined || includeDefaults) {
    data.tarikh_mula = tarikhMula ?? new Date().toISOString();
  }

  const tarikhTamat = pickFirst(programData.tarikh_tamat, programData.endDate);
  if (tarikhTamat !== undefined || includeDefaults) {
    data.tarikh_tamat = tarikhTamat ?? new Date().toISOString();
  }

  const kategori = pickFirst(programData.kategori, programData.category);
  if (kategori !== undefined || includeDefaults) {
    data.kategori = kategori ?? '';
  }

  const status = pickFirst(programData.status);
  if (status !== undefined || includeDefaults) {
    data.status = status ?? 'Upcoming';
  }

  const lokasi = pickFirst(programData.lokasi, programData.location);
  if (lokasi !== undefined || includeDefaults) {
    data.lokasi = lokasi ?? '';
  }

  const coOrganizer = pickFirst(programData.co_organizer, programData.coOrganizer);
  if (coOrganizer !== undefined || includeDefaults) {
    data.co_organizer = coOrganizer ?? '';
  }

  const expenses = pickFirst(programData.expenses, programData.perbelanjaan, programData.expense);
  if (expenses !== undefined || includeDefaults) {
    data.expenses = expenses ?? '';
  }

  const timeScale = pickFirst(programData.time_scale, programData.timeScale);
  if (timeScale !== undefined || includeDefaults) {
    data.time_scale = timeScale ?? '';
  }

  return data;
};

export class ProgramService {
  // List all programs with optional filters
  static async listProgram(options = {}) {
    try {
      const { kategori, dateFrom, dateTo, search, limit: queryLimit = 50 } = options;
      
      let q = collection(db, COLLECTIONS.PROGRAM);
      const constraints = [];
      
      // Add environment filter to ensure we only get programs for the current environment
      constraints.push(createEnvFilter());
      
      // Add kategori filter
      if (kategori) {
        constraints.push(where('kategori', '==', kategori));
      }
      
      // Add date range filter
      if (dateFrom) {
        constraints.push(where('tarikh_mula', '>=', new Date(dateFrom)));
      }
      if (dateTo) {
        constraints.push(where('tarikh_tamat', '<=', new Date(dateTo)));
      }
      
      // Add ordering and limit
      constraints.push(orderBy('tarikh_kemas_kini', 'desc'));
      constraints.push(limit(queryLimit));
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const snapshot = await getDocs(q);
      let programs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Raw programs from Firestore:', programs);
      
      // Apply text search filter (client-side for simplicity)
      if (search) {
        const searchLower = search.toLowerCase();
        programs = programs.filter(program => 
          program.nama_program?.toLowerCase().includes(searchLower) ||
          program.penerangan?.toLowerCase().includes(searchLower)
        );
      }
      
      return programs;
    } catch (error) {
      console.error('Error listing programs:', error);
      throw new Error('Gagal memuat senarai program: ' + error.message);
    }
  }
  
  // Get attendance records for a specific KIR with program details
  static async listKehadiranByKir(kirId) {
    try {
      // Get attendance records for this KIR
      const kehadiranQuery = query(
        collection(db, 'kehadiran_program'),
        where('kir_id', '==', kirId),
        orderBy('tarikh', 'desc')
      );
      
      const kehadiranSnapshot = await getDocs(kehadiranQuery);
      const currentEnv = getEnvironment();
      const kehadiranRecords = kehadiranSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(record => !record.env || record.env === currentEnv);
      
      // Get all programs to join with attendance data
      const programs = await ProgramService.listProgram();
      
      // Create a map of program_id to attendance status
      const kehadiranMap = new Map();
      kehadiranRecords.forEach(record => {
        kehadiranMap.set(record.program_id, {
          hadir: record.hadir,
          catatan: record.catatan,
          kehadiran_id: record.id,
          tarikh_kehadiran: record.tarikh
        });
      });
      
      // Combine programs with attendance status
      const result = programs.map(program => {
        const kehadiran = kehadiranMap.get(program.id);
        return {
          ...program,
          hadir: kehadiran?.hadir || false,
          catatan: kehadiran?.catatan || '',
          kehadiran_id: kehadiran?.kehadiran_id || null,
          tarikh_kehadiran: kehadiran?.tarikh_kehadiran || null
        };
      });
      
      return result;
    } catch (error) {
      console.error('Error listing kehadiran by KIR:', error);
      throw new Error('Gagal memuat rekod kehadiran: ' + error.message);
    }
  }
  
  // Set attendance for a KIR in a specific program
  static async setKehadiran(kirId, programId, hadir, catatan = '') {
    try {
      // Check if attendance record already exists
      const existingQuery = query(
        collection(db, 'kehadiran_program'),
        where('kir_id', '==', kirId),
        where('program_id', '==', programId)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      const attendanceData = {
        kir_id: kirId,
        program_id: programId,
        hadir,
        catatan: catatan || '',
        tarikh_kemas_kini: serverTimestamp(),
        env: getEnvironment()
      };
      
      if (existingSnapshot.empty) {
        // Create new attendance record
        attendanceData.tarikh_cipta = serverTimestamp();
        attendanceData.tarikh = serverTimestamp();
        
        const docRef = await addDoc(collection(db, 'kehadiran_program'), attendanceData);
        return { id: docRef.id, ...attendanceData };
      } else {
        // Update existing attendance record
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(doc(db, 'kehadiran_program', existingDoc.id), attendanceData);
        return { id: existingDoc.id, ...attendanceData };
      }
    } catch (error) {
      console.error('Error setting kehadiran:', error);
      throw new Error('Gagal menyimpan rekod kehadiran: ' + error.message);
    }
  }
  
  // Get attendance records for a specific program (cross-KIR view)
  static async listKehadiranByProgram(programId) {
    try {
      const kehadiranQuery = query(
        collection(db, COLLECTIONS.KEHADIRAN_PROGRAM),
        where('program_id', '==', programId),
        orderBy('tarikh', 'desc')
      );
      
      const snapshot = await getDocs(kehadiranQuery);
      const currentEnv = getEnvironment();
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => !record.env || record.env === currentEnv);
    } catch (error) {
      console.error('Error listing kehadiran by program:', error);
      throw new Error('Gagal memuat rekod kehadiran program: ' + error.message);
    }
  }
  
  // Create a new program (admin function)
  static async createProgram(programData) {
    try {
      const data = {
        ...normalizeProgramPayload(programData, { includeDefaults: true }),
        tarikh_cipta: serverTimestamp(),
        tarikh_kemas_kini: serverTimestamp(),
        env: getEnvironment()
      };
      
      // Check if a program with the same name already exists to prevent duplicates
      const existingProgramQuery = query(
        collection(db, COLLECTIONS.PROGRAM),
        where('nama_program', '==', data.nama_program),
        where('env', '==', getEnvironment())
      );
      
      const existingProgramSnapshot = await getDocs(existingProgramQuery);
      
      if (!existingProgramSnapshot.empty) {
        throw new Error('Program with this name already exists. Please use a different name or edit the existing program.');
      }
      
      const docRef = await addDoc(collection(db, COLLECTIONS.PROGRAM), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error creating program:', error);
      throw new Error('Failed to create program: ' + error.message);
    }
  }
  
  // Get a program by ID
  static async getProgramById(programId) {
    try {
      const docRef = doc(db, COLLECTIONS.PROGRAM, programId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting program:', error);
      throw new Error('Failed to get program: ' + error.message);
    }
  }
  
  // Update an existing program
  static async updateProgram(programId, programData) {
    try {
      const data = {
        ...normalizeProgramPayload(programData),
        tarikh_kemas_kini: serverTimestamp()
      };
      
      const docRef = doc(db, COLLECTIONS.PROGRAM, programId);
      await updateDoc(docRef, data);
      return { id: programId, ...data };
    } catch (error) {
      console.error('Error updating program:', error);
      throw new Error('Failed to update program: ' + error.message);
    }
  }
  
  // Delete a program
  static async deleteProgram(programId) {
    try {
      const docRef = doc(db, COLLECTIONS.PROGRAM, programId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting program:', error);
      throw new Error('Failed to delete program: ' + error.message);
    }
  }
  
  // List all attendance records
  static async listAllAttendance() {
    try {
      // Get all KIR, PKIR, and AIR records
      const kirQuery = query(
        collection(db, 'kir'),
        createEnvFilter()
      );
      
      const pkirQuery = query(
        collection(db, 'pkir'),
        createEnvFilter()
      );
      
      const airQuery = query(
        collection(db, 'air'),
        createEnvFilter()
      );
      
      const [kirSnapshot, pkirSnapshot, airSnapshot] = await Promise.all([
        getDocs(kirQuery),
        getDocs(pkirQuery),
        getDocs(airQuery)
      ]);
      
      // Get all programs
      const programQuery = query(
        collection(db, 'program'),
        createEnvFilter()
      );
      
      const programSnapshot = await getDocs(programQuery);
      const programs = programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get all attendance records
      const attendanceSnapshot = await getDocs(collection(db, COLLECTIONS.KEHADIRAN_PROGRAM));
      const currentEnv = getEnvironment();
      const attendanceRecords = attendanceSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => !record.env || record.env === currentEnv);
      
      // Create a map of attendance records by participant ID and program ID
      const attendanceMap = new Map();
      attendanceRecords.forEach(record => {
        const key = `${record.kir_id || record.pkir_id || record.air_id}_${record.program_id}`;
        attendanceMap.set(key, record);
      });
      
      // Create attendance records for all participants and programs
      const result = [];
      
      // Process KIR records
      kirSnapshot.docs.forEach(kirDoc => {
        const kir = { id: kirDoc.id, ...kirDoc.data() };
        programs.forEach(program => {
          const key = `${kir.id}_${program.id}`;
          const attendanceRecord = attendanceMap.get(key);
          
          result.push({
            id: attendanceRecord?.id || `${kir.id}_${program.id}`,
            participantId: kir.id,
            participantName: kir.nama_penuh || kir.nama || 'Unknown',
            participantType: 'KIR',
            programId: program.id,
            programName: program.nama_program || program.name || 'Unknown Program',
            present: attendanceRecord?.hadir || false,
            notes: attendanceRecord?.catatan || '',
            date: program.tarikh_mula || program.startDate || program.tarikh || null
          });
        });
      });
      
      // Process PKIR records
      pkirSnapshot.docs.forEach(pkirDoc => {
        const pkir = { id: pkirDoc.id, ...pkirDoc.data() };
        programs.forEach(program => {
          const key = `${pkir.id}_${program.id}`;
          const attendanceRecord = attendanceMap.get(key);
          
          result.push({
            id: attendanceRecord?.id || `${pkir.id}_${program.id}`,
            participantId: pkir.id,
            participantName: pkir.nama || pkir.asas?.nama || 'Unknown',
            participantType: 'PKIR',
            programId: program.id,
            programName: program.nama_program || program.name || 'Unknown Program',
            present: attendanceRecord?.hadir || false,
            notes: attendanceRecord?.catatan || '',
            date: program.tarikh_mula || program.startDate || program.tarikh || null
          });
        });
      });
      
      // Process AIR records
      airSnapshot.docs.forEach(airDoc => {
        const air = { id: airDoc.id, ...airDoc.data() };
        programs.forEach(program => {
          const key = `${air.id}_${program.id}`;
          const attendanceRecord = attendanceMap.get(key);
          
          result.push({
            id: attendanceRecord?.id || `${air.id}_${program.id}`,
            participantId: air.id,
            participantName: air.nama || 'Unknown',
            participantType: 'AIR',
            programId: program.id,
            programName: program.nama_program || program.name || 'Unknown Program',
            present: attendanceRecord?.hadir || false,
            notes: attendanceRecord?.catatan || '',
            date: program.tarikh_mula || program.startDate || program.tarikh || null
          });
        });
      });
      
      return result;
    } catch (error) {
      console.error('Error listing all attendance:', error);
      throw new Error('Failed to load attendance records: ' + error.message);
    }
  }
  
  // List attendance records filtered by program and date
  static async listAttendanceByFilters(programId, date) {
    try {
      const allAttendance = await this.listAllAttendance();
      
      // Apply filters
      return allAttendance.filter(record => {
        let matchesProgram = true;
        let matchesDate = true;
        
        if (programId) {
          matchesProgram = record.programId === programId;
        }
        
        if (date) {
          const recordDate = new Date(record.date).toISOString().split('T')[0];
          matchesDate = recordDate === date;
        }
        
        return matchesProgram && matchesDate;
      });
    } catch (error) {
      console.error('Error filtering attendance:', error);
      throw new Error('Failed to filter attendance records: ' + error.message);
    }
  }
  
  // Get attendance record by ID
  static async getAttendanceById(attendanceId) {
    try {
      // Check if it's a real attendance record ID
      if (attendanceId.includes('_')) {
        // This is a generated ID, not a real one
        const [participantId, programId] = attendanceId.split('_');
        
        // Get all attendance records
        const allAttendance = await this.listAllAttendance();
        
        // Find the matching record
        return allAttendance.find(record => 
          record.participantId === participantId && record.programId === programId
        );
      } else {
        // This is a real attendance record ID
        const docRef = doc(db, 'kehadiran_program', attendanceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Get participant details
          let participantName = 'Unknown';
          let participantType = 'Unknown';
          
          if (data.kir_id) {
            const kirDoc = await getDoc(doc(db, 'kir', data.kir_id));
            if (kirDoc.exists()) {
              participantName = kirDoc.data().nama || 'Unknown';
              participantType = 'KIR';
            }
          } else if (data.pkir_id) {
            const pkirDoc = await getDoc(doc(db, 'pkir', data.pkir_id));
            if (pkirDoc.exists()) {
              participantName = pkirDoc.data().nama || 'Unknown';
              participantType = 'PKIR';
            }
          } else if (data.air_id) {
            const airDoc = await getDoc(doc(db, 'air', data.air_id));
            if (airDoc.exists()) {
              participantName = airDoc.data().nama || 'Unknown';
              participantType = 'AIR';
            }
          }
          
          // Get program details
          let programName = 'Unknown';
          let date = null;
          
          if (data.program_id) {
            const programDoc = await getDoc(doc(db, 'program', data.program_id));
            if (programDoc.exists()) {
              programName = programDoc.data().name || 'Unknown';
              date = programDoc.data().startDate;
            }
          }
          
          return {
            id: docSnap.id,
            participantId: data.kir_id || data.pkir_id || data.air_id,
            participantName,
            participantType,
            programId: data.program_id,
            programName,
            present: data.hadir || false,
            notes: data.catatan || '',
            date
          };
        } else {
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting attendance record:', error);
      throw new Error('Failed to get attendance record: ' + error.message);
    }
  }
  
  // Update attendance status
  static async updateAttendanceStatus(attendanceId, present) {
    try {
      // Check if it's a real attendance record ID
      if (attendanceId.includes('_')) {
        // This is a generated ID, not a real one
        const [participantId, programId] = attendanceId.split('_');
        
        // Create a new attendance record
        const data = {
          program_id: programId,
          hadir: present,
          tarikh_kemas_kini: serverTimestamp(),
          env: getEnvironment()
        };
        
        // Determine participant type and set the appropriate ID
        const participantType = await ProgramService.getParticipantType(participantId);
        if (participantType === 'KIR') {
          data.kir_id = participantId;
        } else if (participantType === 'PKIR') {
          data.pkir_id = participantId;
        } else if (participantType === 'AIR') {
          data.air_id = participantId;
        } else {
          throw new Error('Unknown participant type');
        }
        
        // Add the new attendance record
        const docRef = await addDoc(collection(db, 'kehadiran_program'), data);
        return { id: docRef.id, ...data };
      } else {
        // This is a real attendance record ID
        const docRef = doc(db, 'kehadiran_program', attendanceId);
        await updateDoc(docRef, {
          hadir: present,
          tarikh_kemas_kini: serverTimestamp()
        });
        
        return { id: attendanceId, present };
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw new Error('Failed to update attendance status: ' + error.message);
    }
  }
  
  // Update attendance notes
  static async updateAttendanceNotes(attendanceId, notes) {
    try {
      // Check if it's a real attendance record ID
      if (attendanceId.includes('_')) {
        // This is a generated ID, not a real one
        const [participantId, programId] = attendanceId.split('_');
        
        // Create a new attendance record
        const data = {
          program_id: programId,
          catatan: notes,
          tarikh_kemas_kini: serverTimestamp(),
          env: getEnvironment()
        };
        
        // Determine participant type and set the appropriate ID
        const participantType = await ProgramService.getParticipantType(participantId);
        if (participantType === 'KIR') {
          data.kir_id = participantId;
        } else if (participantType === 'PKIR') {
          data.pkir_id = participantId;
        } else if (participantType === 'AIR') {
          data.air_id = participantId;
        } else {
          throw new Error('Unknown participant type');
        }
        
        // Add the new attendance record
        const docRef = await addDoc(collection(db, 'kehadiran_program'), data);
        return { id: docRef.id, ...data };
      } else {
        // This is a real attendance record ID
        const docRef = doc(db, 'kehadiran_program', attendanceId);
        await updateDoc(docRef, {
          catatan: notes,
          tarikh_kemas_kini: serverTimestamp()
        });
        
        return { id: attendanceId, notes };
      }
    } catch (error) {
      console.error('Error updating attendance notes:', error);
      throw new Error('Failed to update attendance notes: ' + error.message);
    }
  }
  
  // Helper method to determine participant type
  static async getParticipantType(participantId) {
    try {
      // Check if participant exists in KIR collection
      const kirDoc = await getDoc(doc(db, 'kir', participantId));
      if (kirDoc.exists()) {
        return 'KIR';
      }
      
      // Check if participant exists in PKIR collection
      const pkirDoc = await getDoc(doc(db, 'pkir', participantId));
      if (pkirDoc.exists()) {
        return 'PKIR';
      }
      
      // Check if participant exists in AIR collection
      const airDoc = await getDoc(doc(db, 'air', participantId));
      if (airDoc.exists()) {
        return 'AIR';
      }
      
      return 'Unknown';
    } catch (error) {
      console.error('Error determining participant type:', error);
      throw new Error('Failed to determine participant type: ' + error.message);
    }
  }
  
  // Get attendance summary statistics
  static async getAttendanceSummary() {
    try {
      // Get all attendance records
      const allAttendance = await ProgramService.listAllAttendance();
      
      // Get all programs
      const programQuery = query(
        collection(db, 'program'),
        createEnvFilter()
      );
      
      const programSnapshot = await getDocs(programQuery);
      const totalPrograms = programSnapshot.docs.length;
      
      // Calculate total participants
      const participantIds = new Set();
      allAttendance.forEach(record => {
        participantIds.add(record.participantId);
      });
      
      const totalParticipants = participantIds.size;
      
      // Calculate average attendance
      const presentCount = allAttendance.filter(record => record.present).length;
      const totalRecords = allAttendance.length;
      const averageAttendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;
      
      return {
        totalPrograms,
        totalParticipants,
        averageAttendance
      };
    } catch (error) {
      console.error('Error getting attendance summary:', error);
      throw new Error('Failed to get attendance summary: ' + error.message);
    }
  }
  
  // Get top participants by attendance count
  static async getTopParticipants(limit = 3) {
    try {
      // Get all attendance records
      const allAttendance = await ProgramService.listAllAttendance();
      
      // Group attendance records by participant
      const participantMap = new Map();
      
      allAttendance.forEach(record => {
        if (!participantMap.has(record.participantId)) {
          participantMap.set(record.participantId, {
            id: record.participantId,
            name: record.participantName,
            type: record.participantType,
            attendanceCount: 0,
            totalPrograms: 0
          });
        }
        
        const participant = participantMap.get(record.participantId);
        participant.totalPrograms++;
        
        if (record.present) {
          participant.attendanceCount++;
        }
      });
      
      // Calculate attendance percentage for each participant
      const participants = Array.from(participantMap.values()).map(participant => ({
        ...participant,
        attendancePercentage: participant.totalPrograms > 0 
          ? Math.round((participant.attendanceCount / participant.totalPrograms) * 100) 
          : 0
      }));
      
      // Sort participants by attendance count (descending)
      participants.sort((a, b) => b.attendanceCount - a.attendanceCount);
      
      // Return top N participants
      return participants.slice(0, limit);
    } catch (error) {
      console.error('Error getting top participants:', error);
      throw new Error('Failed to get top participants: ' + error.message);
    }
  }
  
  // Get program participation data
  static async getProgramParticipation() {
    try {
      // Get all programs
      const programQuery = query(
        collection(db, 'program'),
        createEnvFilter()
      );
      
      const programSnapshot = await getDocs(programQuery);
      const programs = programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Get all attendance records
      const allAttendance = await ProgramService.listAllAttendance();
      
      // Group attendance records by program
      const programMap = new Map();
      
      programs.forEach(program => {
        programMap.set(program.id, {
          id: program.id,
          name: program.name,
          startDate: program.startDate,
          endDate: program.endDate,
          participantCount: 0,
          presentCount: 0,
          attendancePercentage: 0
        });
      });
      
      // Count participants and attendance for each program
      allAttendance.forEach(record => {
        if (programMap.has(record.programId)) {
          const program = programMap.get(record.programId);
          program.participantCount++;
          
          if (record.present) {
            program.presentCount++;
          }
        }
      });
      
      // Calculate attendance percentage for each program
      programMap.forEach(program => {
        program.attendancePercentage = program.participantCount > 0 
          ? Math.round((program.presentCount / program.participantCount) * 100) 
          : 0;
      });
      
      // Convert map to array and sort by date (newest first)
      const result = Array.from(programMap.values());
      result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      
      return result;
    } catch (error) {
      console.error('Error getting program participation:', error);
      throw new Error('Failed to get program participation data: ' + error.message);
    }
  }
  
  // Update an existing program
  static async updateProgram(programId, updates) {
    try {
      const data = {
        ...normalizeProgramPayload(updates),
        tarikh_kemas_kini: serverTimestamp()
      };
      
      await updateDoc(doc(db, COLLECTIONS.PROGRAM, programId), data);
      return { id: programId, ...data };
    } catch (error) {
      console.error('Error updating program:', error);
      throw new Error('Gagal mengemaskini program: ' + error.message);
    }
  }
  
  // Delete a program and all related attendance records
  static async deleteProgram(programId) {
    try {
      // Delete all attendance records for this program
      const kehadiranQuery = query(
        collection(db, 'kehadiran_program'),
        where('program_id', '==', programId)
      );
      
      const kehadiranSnapshot = await getDocs(kehadiranQuery);
      const deletePromises = kehadiranSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      
      // Delete the program itself
      await deleteDoc(doc(db, 'program', programId));
      
      return true;
    } catch (error) {
      console.error('Error deleting program:', error);
      throw new Error('Gagal memadam program: ' + error.message);
    }
  }
  
  // Get program by ID
  static async getProgramById(programId) {
    try {
      const docRef = doc(db, COLLECTIONS.PROGRAM, programId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Program tidak dijumpai');
      }
    } catch (error) {
      console.error('Error getting program by ID:', error);
      throw new Error('Gagal memuat program: ' + error.message);
    }
  }
}

export default ProgramService;
