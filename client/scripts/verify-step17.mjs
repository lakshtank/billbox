import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${message}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('--- Step 17 Verification Suite (Products /products & /products/:id) ---');

const productsPath = path.join(root, 'src', 'pages', 'Products.jsx');
assert(fs.existsSync(productsPath), 'Products.jsx exists');
const productsCode = fs.readFileSync(productsPath, 'utf8');

const productDetailPath = path.join(root, 'src', 'pages', 'ProductDetail.jsx');
assert(fs.existsSync(productDetailPath), 'ProductDetail.jsx exists');
const productDetailCode = fs.readFileSync(productDetailPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[17.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!productsCode.includes('bg-brand-canvas'), 'Products.jsx eliminated legacy bg-brand-canvas');
assert(!productsCode.includes('text-brand-navy'), 'Products.jsx eliminated legacy text-brand-navy');
assert(!productsCode.includes('border-slate-200/90'), 'Products.jsx eliminated legacy border-slate-200/90');
assert(!productDetailCode.includes('bg-brand-canvas'), 'ProductDetail.jsx eliminated legacy bg-brand-canvas');
assert(!productDetailCode.includes('text-brand-navy'), 'ProductDetail.jsx eliminated legacy text-brand-navy');
assert(!productDetailCode.includes('bg-brand-surface'), 'ProductDetail.jsx eliminated legacy bg-brand-surface');

// 2. Products List View & Filters
console.log('\n[17.2 Products List] Checking table-first, filters, and status badges...');
assert(productsCode.includes('PageHeader'), 'Uses PageHeader component');
assert(productsCode.includes('table-fixed'), 'Uses table-fixed layout');
assert(productsCode.includes('StatusBadge'), 'Uses StatusBadge for warranty lifecycle');
assert(productsCode.includes('WARRANTY_FILTERS'), 'Includes warranty status filter options');
assert(productsCode.includes('SORT_OPTIONS'), 'Includes sorting options');
assert(productsCode.includes('LayoutList') && productsCode.includes('LayoutGrid'), 'Supports Table and Grid view modes');

// 3. Product Detail Header & Actions
console.log('\n[17.3 Product Detail Header] Checking title, status badge and edit/delete actions...');
assert(productDetailCode.includes('StatusBadge'), 'Displays StatusBadge in product header');
assert(productDetailCode.includes('handleOpenEdit'), 'Includes Edit action trigger');
assert(productDetailCode.includes('setShowDeleteModal'), 'Includes Delete action trigger');

// 4. Warranty Timeline
console.log('\n[17.4 Warranty Timeline] Checking horizontal bar, nodes & large days readout...');
assert(productDetailCode.includes('Purchased') && productDetailCode.includes('Expires'), 'Includes timeline nodes');
assert(productDetailCode.includes('elapsedPercent'), 'Computes elapsed coverage percentage');
assert(productDetailCode.includes('text-3xl'), 'Displays days remaining in prominent text-3xl');

// 5. Cards & Edit Form
console.log('\n[17.5 Detail Cards & Edit Form] Checking Purchase, Warranty, Switch & Edit form...');
assert(productDetailCode.includes('Purchase details') || productDetailCode.includes('storeName'), 'Purchase details card');
assert(productDetailCode.includes('Warranty coverage'), 'Warranty coverage card');
assert(productDetailCode.includes('Switch'), 'Uses Switch for expiry alerts');
assert(productDetailCode.includes('warrantyPeriodValue') && productDetailCode.includes('warrantyPeriodUnit'), 'Edit form collects warranty period + unit');
assert(productDetailCode.includes('ConfirmModal'), 'Uses ConfirmModal for deletion');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
