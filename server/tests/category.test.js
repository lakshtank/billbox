const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_CATEGORIES } = require('../constants/category.constants');

test('Category Constants Integrity', async (t) => {
  await t.test('DEFAULT_CATEGORIES is a non-empty array', () => {
    assert.ok(Array.isArray(DEFAULT_CATEGORIES));
    assert.ok(DEFAULT_CATEGORIES.length > 0);
  });

  await t.test('Contains essential categories', () => {
    const required = ['Electronics', 'Groceries', 'Appliances', 'Others'];
    for (const cat of required) {
      assert.ok(DEFAULT_CATEGORIES.includes(cat), `Expected category "${cat}" to be in DEFAULT_CATEGORIES`);
    }
  });

  await t.test('Has no duplicate or empty category names', () => {
    const unique = new Set(DEFAULT_CATEGORIES);
    assert.equal(unique.size, DEFAULT_CATEGORIES.length, 'No duplicates allowed in DEFAULT_CATEGORIES');

    for (const cat of DEFAULT_CATEGORIES) {
      assert.ok(typeof cat === 'string' && cat.trim().length > 0, 'Category names must be non-empty strings');
    }
  });
});
