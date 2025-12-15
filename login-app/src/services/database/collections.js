/**
 * Firestore Collection Names Constants
 * Standardized collection names to avoid typos and ensure consistency
 */
import { where } from 'firebase/firestore';

// Get current environment
export const getEnvironment = () => {
  return import.meta.env.VITE_ENV || 'dev';
};

// Collection names - CANONICAL (per firestore-audit.md v1)
// Source of truth: ONLY these collections are allowed
export const COLLECTIONS = {
  // Core KIR collections
  KIR: 'kir',
  KIR_AIR: 'kir_air',
  KIR_PASANGAN: 'kir_pasangan', 
  KIR_KAFA: 'kir_kafa',
  KIR_PENDIDIKAN: 'kir_pendidikan',
  KIR_PEKERJAAN: 'kir_pekerjaan',
  KIR_KESIHATAN: 'kir_kesihatan',
  KIR_PENDAPATAN: 'kir_pendapatan',
  KIR_PERBELANJAAN: 'kir_perbelanjaan',
  KIR_BANTUAN_BULANAN: 'kir_bantuan_bulanan',
  KIR_DOKUMEN: 'kir_dokumen',
  
  // Program and attendance
  PROGRAM: 'program',
  KEHADIRAN_PROGRAM: 'kehadiran_program',
  
  // Financial tracking
  FINANCIAL_INCOME: 'financial_income',
  FINANCIAL_EXPENSES: 'financial_expenses',
  FINANCIAL_GRANTS: 'financial_grants',
  FINANCIAL_TRANSACTIONS: 'financial_transactions',
  
  // Index and support
  INDEX_NOKP: 'index_nokp',
  USERS: 'users',
  ACTIVITIES: 'activities',
  AUDIT_LOG: 'audit_log',
  DIAGNOSTICS: 'diagnostics'
};

// WHITELIST: Only these collections should exist in Firestore
export const CANONICAL_COLLECTIONS = Object.values(COLLECTIONS);

// Standard fields that should be present in all documents
export const STANDARD_FIELDS = {
  ENV: 'env',
  IS_SEED: 'is_seed',
  E2E_RUN_ID: 'e2e_run_id',
  TARIKH_CIPTA: 'tarikh_cipta',
  TARIKH_KEMAS_KINI: 'tarikh_kemas_kini',
  KIR_ID: 'kir_id' // For sub-collections
};

// Valid status values
export const STATUS_REKOD = {
  DRAF: 'Draf',
  DIHANTAR: 'Dihantar',
  DISAHKAN: 'Disahkan',
  TIDAK_AKTIF: 'Tidak Aktif'
};

// Environment values
export const ENVIRONMENTS = {
  DEV: 'dev',
  PROD: 'prod'
};

// Helper function to add standard fields to document data
export const addStandardFields = (data, kirId = null) => {
  const standardFields = {
    [STANDARD_FIELDS.ENV]: getEnvironment(),
    [STANDARD_FIELDS.TARIKH_KEMAS_KINI]: new Date()
  };
  
  // Add kir_id for sub-collections
  if (kirId) {
    standardFields[STANDARD_FIELDS.KIR_ID] = kirId;
  }
  
  // Add creation date if not updating
  if (!data[STANDARD_FIELDS.TARIKH_CIPTA]) {
    standardFields[STANDARD_FIELDS.TARIKH_CIPTA] = new Date();
  }
  
  return {
    ...data,
    ...standardFields
  };
};

// Helper function to create environment filter
export const createEnvFilter = () => {
  return where(STANDARD_FIELDS.ENV, '==', getEnvironment());
};

// Utility function to normalize no_kp (digits only)
export const normalizeNoKP = (noKP) => {
  if (!noKP) return '';
  return noKP.toString().replace(/\D/g, '');
};

// Helper function to validate status_rekod
export const isValidStatusRekod = (status) => {
  return Object.values(STATUS_REKOD).includes(status);
};



export default COLLECTIONS;
