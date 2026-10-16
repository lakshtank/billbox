/**
 * Centralized Exchange Rates to Base Currency (INR)
 * Ensures 100% mathematical consistency across Dashboard aggregations, Store totals, and Frontend formatters.
 */
const EXCHANGE_RATES_TO_INR = {
  INR: 1.0,
  USD: 84.00,  // $1 USD = ₹84.00 INR
  EUR: 91.50,  // €1 EUR = ₹91.50 INR
  GBP: 108.50, // £1 GBP = ₹108.50 INR
  CAD: 61.50,  // CA$1 CAD = ₹61.50 INR
  AUD: 55.50,  // AU$1 AUD = ₹55.50 INR
  JPY: 0.56,   // ¥1 JPY = ₹0.56 INR
};

/**
 * Converts an amount from a given currency to base INR.
 * @param {number|string} amount
 * @param {string} currency
 * @returns {number} Converted amount in INR
 */
const convertToINR = (amount, currency = 'INR') => {
  const numeric = Number(amount) || 0;
  const curr = (currency || 'INR').toUpperCase();
  const rate = EXCHANGE_RATES_TO_INR[curr] || 1.0;
  return numeric * rate;
};

module.exports = {
  EXCHANGE_RATES_TO_INR,
  convertToINR,
};
