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

console.log('--- Step 21 Verification Suite (Public receipt, 404, Error boundary & Offline banner) ---');

const publicReceiptPath = path.join(root, 'src', 'pages', 'PublicReceipt.jsx');
assert(fs.existsSync(publicReceiptPath), 'PublicReceipt.jsx exists');
const publicReceiptCode = fs.readFileSync(publicReceiptPath, 'utf8');

const notFoundPath = path.join(root, 'src', 'pages', 'NotFound.jsx');
assert(fs.existsSync(notFoundPath), 'NotFound.jsx exists');
const notFoundCode = fs.readFileSync(notFoundPath, 'utf8');

const errorBoundaryPath = path.join(root, 'src', 'components', 'common', 'ErrorBoundary.jsx');
assert(fs.existsSync(errorBoundaryPath), 'ErrorBoundary.jsx exists');
const errorBoundaryCode = fs.readFileSync(errorBoundaryPath, 'utf8');

const appPath = path.join(root, 'src', 'App.jsx');
assert(fs.existsSync(appPath), 'App.jsx exists');
const appCode = fs.readFileSync(appPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[21.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!publicReceiptCode.includes('bg-brand-canvas'), 'PublicReceipt.jsx eliminated legacy bg-brand-canvas');
assert(!publicReceiptCode.includes('text-brand-navy'), 'PublicReceipt.jsx eliminated legacy text-brand-navy');
assert(!publicReceiptCode.includes('bg-brand-surface'), 'PublicReceipt.jsx eliminated legacy bg-brand-surface');
assert(!notFoundCode.includes('btn-primary'), 'NotFound.jsx eliminated legacy btn-primary');
assert(!notFoundCode.includes('text-ink'), 'NotFound.jsx eliminated legacy text-ink');

// 2. Public Receipt Specifications
console.log('\n[21.2 Public Receipt] Checking 680px printable column, header, buttons & invalid token...');
assert(publicReceiptCode.includes('max-w-[680px]'), 'Uses 680px printable column');
assert(publicReceiptCode.includes('Shared receipt'), 'Includes "Shared receipt" neutral badge');
assert(publicReceiptCode.includes('View document'), 'Includes "View document" button');
assert(publicReceiptCode.includes('Download'), 'Includes "Download" button');
assert(publicReceiptCode.includes('Shared on'), 'Includes "Shared on" footer date');
assert(publicReceiptCode.includes('This link is no longer available.'), 'Includes exact invalid token text "This link is no longer available."');

// 3. 404 Page Specifications
console.log('\n[21.3 404 Page] Checking icon tile, title-1, and navigation buttons...');
assert(notFoundCode.includes('Page not found'), 'Includes "Page not found" title');
assert(notFoundCode.includes('Back to overview'), 'Includes "Back to overview" primary button');
assert(notFoundCode.includes('Go to receipts'), 'Includes "Go to receipts" secondary button');

// 4. Error Boundary Specifications
console.log('\n[21.4 Error Boundary] Checking icon tile, title, Reload and Copy buttons...');
assert(errorBoundaryCode.includes('Something went wrong'), 'Includes "Something went wrong" title');
assert(errorBoundaryCode.includes('Reload page'), 'Includes "Reload page" primary button');
assert(errorBoundaryCode.includes('Copy error details'), 'Includes "Copy error details" ghost button');

// 5. Offline Banner
console.log('\n[21.5 Offline Banner] Checking sticky amber offline banner...');
assert(appCode.includes("You're offline. Changes won't be saved."), 'Includes exact offline banner text');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
