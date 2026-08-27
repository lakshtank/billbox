import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object for display.
 * Respects user's dateFormat preference or falls back to 'dd MMM yyyy'.
 * Returns 'N/A' for invalid/missing dates.
 */
export const formatDate = (date, customPattern) => {
  if (!date) return 'N/A';
  try {
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return 'N/A';
    
    let pattern = customPattern || (typeof window !== 'undefined' ? localStorage.getItem('billbox_date_format') : null) || 'dd MMM yyyy';
    if (pattern === 'DD MMM YYYY') pattern = 'dd MMM yyyy';
    else if (pattern === 'MM/DD/YYYY') pattern = 'MM/dd/yyyy';
    else if (pattern === 'YYYY-MM-DD') pattern = 'yyyy-MM-dd';
    else if (pattern === 'DD/MM/YYYY') pattern = 'dd/MM/yyyy';

    return format(parsed, pattern);
  } catch {
    return 'N/A';
  }
};

const CURRENCY_LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
};

export const EXCHANGE_RATES_TO_INR = {
  INR: 1,
  USD: 95.33,   // $1 USD = ₹95.33 INR
  EUR: 111.25,  // €1 EUR = ₹111.25 INR
  GBP: 129.85,  // £1 GBP = ₹129.85 INR
  CAD: 68.74,   // CA$1 CAD = ₹68.74 INR
  AUD: 68.43,   // AU$1 AUD = ₹68.43 INR
  JPY: 0.62,    // ¥1 JPY = ₹0.62 INR
};

export const getActiveCurrency = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('billbox_default_currency') || 'INR';
  }
  return 'INR';
};

/**
 * Convert an amount from one currency to another using exchange rates.
 */
export const convertCurrency = (amount, fromCurrency = 'INR', toCurrency = 'INR') => {
  if (amount == null || isNaN(Number(amount))) return 0;
  const num = Number(amount);
  const from = (fromCurrency || 'INR').toUpperCase();
  const to = (toCurrency || 'INR').toUpperCase();

  if (from === to) return num;

  const fromRateInINR = EXCHANGE_RATES_TO_INR[from] || 1;
  const toRateInINR = EXCHANGE_RATES_TO_INR[to] || 1;

  // Convert to INR base, then to target currency
  const inINR = num * fromRateInINR;
  const converted = inINR / toRateInINR;

  return converted;
};

/**
 * Format a number as currency, performing true mathematical conversion from source currency
 * to the user's active/preferred currency (or explicitly specified target currency).
 */
export const formatCurrency = (amount, sourceCurrency = 'INR', targetCurrency) => {
  if (amount == null || isNaN(Number(amount))) return '—';

  const userPreferred = targetCurrency || getActiveCurrency();
  const from = (sourceCurrency || 'INR').toUpperCase();
  const to = (userPreferred || 'INR').toUpperCase();

  const convertedValue = convertCurrency(Number(amount), from, to);
  const locale = CURRENCY_LOCALES[to] || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: to,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedValue);
  } catch {
    const symbol = CURRENCY_SYMBOLS[to] || to;
    return `${symbol}${convertedValue.toFixed(2)}`;
  }
};

/**
 * Get display symbol for a currency code (e.g. INR -> ₹, USD -> $)
 */
export const getCurrencySymbol = (currencyCode) => {
  const userPreferred = getActiveCurrency();
  const code = (userPreferred || currencyCode || 'INR').toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
};

/**
 * Format a date for input[type="date"] value (YYYY-MM-DD).
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  try {
    let parsed;
    if (typeof date === 'string') {
      parsed = parseISO(date);
      if (!isValid(parsed)) {
        const match = date.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
        if (match) {
          parsed = new Date(Date.UTC(match[3], match[2] - 1, match[1]));
        }
      }
    } else {
      parsed = date;
    }
    if (!isValid(parsed)) return '';
    return format(parsed, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};
