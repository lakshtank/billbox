const test = require('node:test');
const assert = require('node:assert/strict');
const { convertToINR, EXCHANGE_RATES_TO_INR } = require('../constants/currency.constants');

test('Currency Constants & Conversions', async (t) => {
  await t.test('Base currency INR rate is 1.0', () => {
    assert.equal(EXCHANGE_RATES_TO_INR.INR, 1.0);
  });

  await t.test('Major foreign currency rates are defined and positive', () => {
    const requiredCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];
    for (const curr of requiredCurrencies) {
      assert.ok(EXCHANGE_RATES_TO_INR[curr] > 0, `${curr} must have a positive exchange rate`);
    }
  });

  await t.test('convertToINR correctly calculates known amounts', () => {
    assert.equal(convertToINR(100, 'INR'), 100);
    assert.equal(convertToINR(100, 'USD'), 8400);
    assert.equal(convertToINR(10, 'EUR'), 915);
    assert.equal(convertToINR(1, 'GBP'), 108.5);
  });

  await t.test('convertToINR handles case-insensitive currency codes', () => {
    assert.equal(convertToINR(50, 'usd'), 4200);
    assert.equal(convertToINR(20, 'eur'), 1830);
  });

  await t.test('convertToINR handles undefined, empty, or unknown currencies gracefully', () => {
    assert.equal(convertToINR(500), 500); // defaults to INR
    assert.equal(convertToINR(500, ''), 500);
    assert.equal(convertToINR(500, 'XYZ'), 500); // fallback rate 1.0
  });

  await t.test('convertToINR handles zero or non-numeric amounts', () => {
    assert.equal(convertToINR(0, 'USD'), 0);
    assert.equal(convertToINR('abc', 'USD'), 0);
  });
});
