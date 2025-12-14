// Utility helpers for handling Malaysian IC (No. Kad Pengenalan) values

/**
 * Normalize an IC value to digits only (max 12 digits)
 * @param {string} icValue
 * @returns {string}
 */
export function normalizeICDigits(icValue = '') {
  return (icValue || '').replace(/\D/g, '').slice(0, 12);
}

/**
 * Format an IC value using the standard xxxxxx-xx-xxxx structure
 * @param {string} icValue
 * @returns {string}
 */
export function formatICWithDashes(icValue = '') {
  const digits = normalizeICDigits(icValue);
  if (!digits) return '';
  if (digits.length <= 6) {
    return digits;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

/**
 * Derive birth date and age info from a Malaysian IC number.
 * @param {string} icValue - IC number with or without dashes.
 * @returns {{ birthDate: Date, formattedDate: string, age: number } | null}
 */
export function deriveBirthInfoFromIC(icValue = '') {
  if (!icValue) return null;

  const digits = normalizeICDigits(icValue);
  if (digits.length < 6) return null;

  const yearPart = parseInt(digits.slice(0, 2), 10);
  const monthPart = parseInt(digits.slice(2, 4), 10);
  const dayPart = parseInt(digits.slice(4, 6), 10);

  if (
    Number.isNaN(yearPart) ||
    Number.isNaN(monthPart) ||
    Number.isNaN(dayPart) ||
    monthPart < 1 ||
    monthPart > 12 ||
    dayPart < 1 ||
    dayPart > 31
  ) {
    return null;
  }

  const currentYearTwoDigits = new Date().getFullYear() % 100;
  const century = yearPart > currentYearTwoDigits ? 1900 : 2000;
  const fullYear = century + yearPart;
  const birthDate = new Date(fullYear, monthPart - 1, dayPart);

  if (Number.isNaN(birthDate.getTime()) || birthDate.getMonth() !== monthPart - 1) {
    return null;
  }

  const age = calculateAge(birthDate);
  const formattedDate = [
    fullYear.toString().padStart(4, '0'),
    monthPart.toString().padStart(2, '0'),
    dayPart.toString().padStart(2, '0')
  ].join('-');

  return {
    birthDate,
    formattedDate,
    age
  };
}

/**
 * Calculate age from a date.
 * @param {Date} birthDate
 * @returns {number}
 */
export function calculateAge(birthDate) {
  if (!birthDate) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
