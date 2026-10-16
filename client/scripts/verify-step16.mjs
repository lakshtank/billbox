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

console.log('--- Step 16 Verification Suite (Warranties /warranties) ---');

const warrantiesPath = path.join(root, 'src', 'pages', 'WarrantyTracker.jsx');
assert(fs.existsSync(warrantiesPath), 'WarrantyTracker.jsx exists');
const warrantiesCode = fs.readFileSync(warrantiesPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[16.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!warrantiesCode.includes('bg-brand-canvas'), 'Eliminated legacy bg-brand-canvas');
assert(!warrantiesCode.includes('text-brand-navy'), 'Eliminated legacy text-brand-navy');
assert(!warrantiesCode.includes('bg-brand-surface'), 'Eliminated legacy bg-brand-surface');
assert(!warrantiesCode.includes('border-slate-200/90'), 'Eliminated legacy border-slate-200/90');
assert(!warrantiesCode.includes('bg-brand-primary'), 'Eliminated legacy bg-brand-primary');

// 2. Tabs and Default View
console.log('\n[16.2 Tabs & Default View] Checking Expiring default, All, Covered, Expired, No cover...');
assert(warrantiesCode.includes("'expiring_soon'"), 'Includes expiring_soon status');
assert(warrantiesCode.includes('useState(\'expiring_soon\')'), 'Defaults to Expiring tab (the urgency view)');
assert(warrantiesCode.includes('Covered'), 'Includes Covered tab');
assert(warrantiesCode.includes('Expired'), 'Includes Expired tab');
assert(warrantiesCode.includes('No cover'), 'Includes No cover tab');

// 3. Right-Side 4-Stat Shortcut Strip
console.log('\n[16.3 Summary Stat Strip] Checking 4 inline stat shortcuts...');
assert(warrantiesCode.includes('counts.active'), 'Displays Covered count in summary strip');
assert(warrantiesCode.includes('counts.expiring_soon'), 'Displays Expiring count in summary strip');
assert(warrantiesCode.includes('counts.expired'), 'Displays Expired count in summary strip');
assert(warrantiesCode.includes('counts.none'), 'Displays No cover count in summary strip');

// 4. Table Columns & Features
console.log('\n[16.4 Table Architecture] Checking product, merchant, dates, days left, cover bar & switch...');
assert(warrantiesCode.includes('Days left') || warrantiesCode.includes('daysText'), 'Displays days left in tabular numbers');
assert(warrantiesCode.includes('elapsedPercent'), 'Computes elapsed warranty percentage');
assert(warrantiesCode.includes('w-24') && warrantiesCode.includes('h-1'), 'Renders 4px tall 96px wide cover bar');
assert(warrantiesCode.includes('Switch'), 'Uses Radix Switch for per-item reminder toggling');
assert(warrantiesCode.includes('handleToggleReminder'), 'Handles reminder toggle mutation');

// 5. Row Accents & Navigation
console.log('\n[16.5 Row Accents & Navigation] Checking static 3px rails and row click...');
assert(warrantiesCode.includes('border-l-3 border-warn-line'), 'Static 3px warn rail for expiring items');
assert(warrantiesCode.includes('border-l-3 border-bad-line'), 'Static 3px bad rail for expired items');
assert(warrantiesCode.includes('/products/'), 'Row click navigates to product detail');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
