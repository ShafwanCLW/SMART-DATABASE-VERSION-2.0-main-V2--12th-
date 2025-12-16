import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../database/firebase.js';
import { COLLECTIONS, createEnvFilter, getEnvironment } from '../database/collections.js';

const PARTICIPANT_COLLECTION = 'index_nokp';

const normalizeNoKP = (value = '') => value.toString().replace(/\D/g, '');
const formatDateKey = (value) => {
  if (!value) return new Date().toISOString().split('T')[0];
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

export async function getParticipantByNoKP(no_kp) {
  const normalized = normalizeNoKP(no_kp);
  if (!normalized) return null;
  const snap = await getDocs(query(collection(db, PARTICIPANT_COLLECTION), where('no_kp', '==', normalized), createEnvFilter()));
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

export async function getProgram(programId) {
  if (!programId) return null;
  const programDoc = await (await import('firebase/firestore')).getDoc(doc(db, COLLECTIONS.PROGRAM, programId));
  return programDoc.exists() ? { id: programDoc.id, ...programDoc.data() } : null;
}

export async function recordAttendance({ programId, no_kp, recordDate }) {
  const participant = await getParticipantByNoKP(no_kp);
  if (!participant) {
    throw new Error('Peserta tidak ditemui dalam index_nokp');
  }
  const program = await getProgram(programId);
  if (!program) {
    throw new Error('Program tidak ditemui');
  }

  const participantId = participant.id || participant.no_kp || normalizeNoKP(no_kp);
  const dateKey = formatDateKey(recordDate || new Date());
  const attendanceId = `${programId}_${participantId}_${dateKey}`;
  const ref = doc(db, COLLECTIONS.KEHADIRAN_PROGRAM, attendanceId);

  const payload = {
    program_id: programId,
    participant_id: participantId,
    participant_name: participant.nama || participant.name || '-',
    no_kp_display: participant.no_kp_display || participant.no_kp || normalizeNoKP(no_kp),
    hadir: true,
    source: 'qr-self-checkin',
    scanned_at: serverTimestamp(),
    record_date: dateKey,
    tarikh_kemas_kini: serverTimestamp(),
    env: getEnvironment()
  };

  await setDoc(ref, payload, { merge: true });
  return { id: attendanceId, ...payload };
}

export async function listAttendanceByProgram(programId, date, options = {}) {
  const { endDate = null } = options || {};
  const constraints = [where('program_id', '==', programId), createEnvFilter()];
  const snap = await getDocs(query(collection(db, COLLECTIONS.KEHADIRAN_PROGRAM), ...constraints));
  const startKey = date ? formatDateKey(date) : null;
  const endKey = endDate ? formatDateKey(endDate) : null;
  return snap.docs
    .map(d => {
      const data = d.data();
      const recordDate = data.record_date || (data.scanned_at ? formatDateKey(data.scanned_at.toDate ? data.scanned_at.toDate() : data.scanned_at) : '');
      return { id: d.id, ...data, record_date: recordDate };
    })
    .filter(record => {
      if (!startKey && !endKey) {
        return true;
      }
      const recordKey = record.record_date || '';
      if (startKey && endKey) {
        return recordKey >= startKey && recordKey <= endKey;
      }
      if (startKey) {
        return recordKey === startKey;
      }
      return recordKey <= endKey;
    });
}

export async function updateAttendanceStatus(attendanceId, hadir) {
  const ref = doc(db, COLLECTIONS.KEHADIRAN_PROGRAM, attendanceId);
  await updateDoc(ref, { hadir, tarikh_kemas_kini: serverTimestamp() });
  return { id: attendanceId, hadir };
}

export async function updateAttendanceNotes(attendanceId, notes) {
  const ref = doc(db, COLLECTIONS.KEHADIRAN_PROGRAM, attendanceId);
  await updateDoc(ref, { catatan: notes || '', tarikh_kemas_kini: serverTimestamp() });
  return { id: attendanceId, notes };
}

export default {
  getParticipantByNoKP,
  getProgram,
  recordAttendance,
  listAttendanceByProgram,
  updateAttendanceStatus,
  updateAttendanceNotes
};
