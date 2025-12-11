// Utility helpers for handling Malaysian IC (No. Kad Pengenalan) values

/**
 * Derive birth date and age info from a Malaysian IC number.
 * @param {string} icValue - IC number with or without dashes.
 * @returns {{ birthDate: Date, formattedDate: string, age: number } | null}
 */
export function deriveBirthInfoFromIC(icValue = '') {
  if (!icValue) return null;

  const digits = icValue.replace(/\D/g, '');
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
  return {
    birthDate,
    formattedDate: birthDate.toISOString().split('T')[0],
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
