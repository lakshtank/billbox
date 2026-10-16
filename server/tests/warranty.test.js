const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDaysRemainingInTimezone } = require('../services/reminder.service');

test('Warranty Expiry & Milestone Calculations', async (t) => {
  const refDate = new Date('2026-10-13T12:00:00Z');

  await t.test('Same-day expiry returns 0 days remaining', () => {
    const expiryDate = new Date('2026-10-13T18:00:00Z');
    const days = calculateDaysRemainingInTimezone(expiryDate, 'UTC', refDate);
    assert.equal(days, 0);
  });

  await t.test('Future expiry (+30 days) returns exactly 30 days remaining', () => {
    const expiryDate = new Date('2026-11-12T00:00:00Z');
    const days = calculateDaysRemainingInTimezone(expiryDate, 'UTC', refDate);
    assert.equal(days, 30);
  });

  await t.test('Future expiry (+90 days) returns exactly 90 days remaining', () => {
    const expiryDate = new Date('2027-01-11T00:00:00Z');
    const days = calculateDaysRemainingInTimezone(expiryDate, 'UTC', refDate);
    assert.equal(days, 90);
  });

  await t.test('Past expiry (-15 days) returns negative days remaining', () => {
    const expiryDate = new Date('2026-09-28T00:00:00Z');
    const days = calculateDaysRemainingInTimezone(expiryDate, 'UTC', refDate);
    assert.equal(days, -15);
  });

  await t.test('Works correctly with custom timezone (Asia/Kolkata)', () => {
    const expiryDate = new Date('2026-10-20T00:00:00Z');
    const days = calculateDaysRemainingInTimezone(expiryDate, 'Asia/Kolkata', refDate);
    assert.equal(days, 7);
  });
});
