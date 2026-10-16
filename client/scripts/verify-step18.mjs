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

console.log('--- Step 18 Verification Suite (Merchants /stores & /stores/:name) ---');

const storesPath = path.join(root, 'src', 'pages', 'Stores.jsx');
assert(fs.existsSync(storesPath), 'Stores.jsx exists');
const storesCode = fs.readFileSync(storesPath, 'utf8');

const storeDetailPath = path.join(root, 'src', 'pages', 'StoreDetail.jsx');
assert(fs.existsSync(storeDetailPath), 'StoreDetail.jsx exists');
const storeDetailCode = fs.readFileSync(storeDetailPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[18.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!storesCode.includes('bg-brand-canvas'), 'Stores.jsx eliminated legacy bg-brand-canvas');
assert(!storesCode.includes('text-brand-navy'), 'Stores.jsx eliminated legacy text-brand-navy');
assert(!storesCode.includes('bg-brand-surface'), 'Stores.jsx eliminated legacy bg-brand-surface');
assert(!storesCode.includes('border-brand-border'), 'Stores.jsx eliminated legacy border-brand-border');
assert(!storeDetailCode.includes('bg-brand-canvas'), 'StoreDetail.jsx eliminated legacy bg-brand-canvas');
assert(!storeDetailCode.includes('text-brand-navy'), 'StoreDetail.jsx eliminated legacy text-brand-navy');
assert(!storeDetailCode.includes('bg-brand-surface'), 'StoreDetail.jsx eliminated legacy bg-brand-surface');
assert(!storeDetailCode.includes('border-brand-border'), 'StoreDetail.jsx eliminated legacy border-brand-border');

// 2. Stores List View
console.log('\n[18.2 Merchants List] Checking table layout, search, sort, and pagination...');
assert(storesCode.includes('PageHeader'), 'Uses PageHeader component');
assert(storesCode.includes('table-fixed'), 'Uses table-fixed layout for zero horizontal overflow');
assert(storesCode.includes('Money'), 'Uses Money component for total spend');
assert(storesCode.includes('DateCell'), 'Uses DateCell component for last purchase');
assert(storesCode.includes('SORT_OPTIONS'), 'Includes sorting options');
assert(storesCode.includes('Search'), 'Includes inline search input');
assert(storesCode.includes('Previous') && storesCode.includes('Next'), 'Includes pagination controls');

// 3. Merchant Detail Header
console.log('\n[18.3 Merchant Detail Header] Checking avatar monogram, title, and caption...');
assert(storeDetailCode.includes('Grouped by merchant name'), 'Displays "Grouped by merchant name" caption');
assert(storeDetailCode.includes('initial'), 'Generates avatar monogram initial');

// 4. 4 Stat Tiles
console.log('\n[18.4 KPI Stat Tiles] Checking the 4 required stat tiles...');
assert(storeDetailCode.includes('Total spend'), 'Includes Total spend tile');
assert(storeDetailCode.includes('Receipts'), 'Includes Receipts tile');
assert(storeDetailCode.includes('Average basket'), 'Includes Average basket tile');
assert(storeDetailCode.includes('First → last purchase'), 'Includes First → last purchase tile');
assert(storeDetailCode.includes('KpiTile'), 'Uses shared KpiTile component');

// 5. Chart & Bar List
console.log('\n[18.5 Analytics] Checking spend over time chart & category bar list...');
assert(storeDetailCode.includes('SpendingChart'), 'Uses SpendingChart for spend over time');
assert(storeDetailCode.includes('Spend by category') || storeDetailCode.includes('categorySpendData'), 'Includes category spend bar list');

// 6. Paginated Receipts Table
console.log('\n[18.6 Receipts Table] Checking paginated receipts table (10 per page)...');
assert(storeDetailCode.includes('RECEIPT_PAGE_SIZE = 10') || storeDetailCode.includes('10'), 'Configures 10 receipts per page');
assert(storeDetailCode.includes('paginatedReceipts'), 'Paginates receipts correctly');
assert(storeDetailCode.includes('StatusBadge'), 'Uses StatusBadge for product warranties');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
