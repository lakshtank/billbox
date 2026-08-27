const { addDays, addMonths, addYears } = require('date-fns');

const parseFlexibleDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  const str = String(dateVal).trim();
  if (!str) return null;

  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  // Handle DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Handle YYYY-MM-DD or YYYY/MM/DD
  const yyyymmddMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1;
    const day = parseInt(yyyymmddMatch[3], 10);
    d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

/**
 * Calculates the warranty expiry date given purchase date, value, and unit ('days'|'weeks'|'months'|'years').
 * Uses exact calendar date arithmetic per unit (addDays, addMonths, addYears).
 *
 * @param {Date|string} purchaseDate
 * @param {number} warrantyPeriodValue
 * @param {string} [warrantyPeriodUnit='months']
 * @returns {Date|null}
 */
const calculateWarrantyExpiryDate = (purchaseDate, warrantyPeriodValue, warrantyPeriodUnit = 'months') => {
  const dateObj = parseFlexibleDate(purchaseDate);
  if (
    !dateObj ||
    warrantyPeriodValue == null ||
    isNaN(Number(warrantyPeriodValue)) ||
    Number(warrantyPeriodValue) <= 0
  ) {
    return null;
  }

  const value = Number(warrantyPeriodValue);
  const unit = (warrantyPeriodUnit || 'months').toLowerCase();

  switch (unit) {
    case 'days':
    case 'day':
      return addDays(dateObj, value);
    case 'weeks':
    case 'week':
      return addDays(dateObj, value * 7);
    case 'years':
    case 'year':
      return addYears(dateObj, value);
    case 'months':
    case 'month':
    default:
      return addMonths(dateObj, value);
  }
};

/**
 * Calculates warrantyStatus ('none' | 'expired' | 'expiring_soon' | 'active')
 * based on today's UTC date vs warrantyExpiryDate.
 *
 * @param {Date|string} warrantyExpiryDate
 * @param {Date} [referenceDate=new Date()]
 * @returns {'none'|'expired'|'expiring_soon'|'active'}
 */
const calculateWarrantyStatus = (warrantyExpiryDate, referenceDate = new Date()) => {
  if (!warrantyExpiryDate) {
    return 'none';
  }
  const expiry = new Date(warrantyExpiryDate);
  if (isNaN(expiry.getTime())) {
    return 'none';
  }

  // Normalize reference date (today) to UTC start of day
  const today = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), referenceDate.getUTCDate()));
  const expiryUTC = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate()));

  const thirtyDaysFromToday = new Date(today.getTime());
  thirtyDaysFromToday.setUTCDate(thirtyDaysFromToday.getUTCDate() + 30);

  if (expiryUTC < today) {
    return 'expired';
  }
  if (expiryUTC <= thirtyDaysFromToday) {
    return 'expiring_soon';
  }
  return 'active';
};

module.exports = {
  calculateWarrantyExpiryDate,
  calculateWarrantyStatus,
  parseFlexibleDate,
};
