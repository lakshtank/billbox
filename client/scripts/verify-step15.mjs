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

console.log('--- Step 15 Verification Suite (Receipt Detail /receipts/:id) ---');

const receiptDetailPath = path.join(root, 'src', 'pages', 'ReceiptDetail.jsx');
assert(fs.existsSync(receiptDetailPath), 'ReceiptDetail.jsx exists');
const receiptDetailCode = fs.readFileSync(receiptDetailPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens and Narrow Box Container
console.log('\n[15.1 Token & Container Audit] Checking elimination of legacy brand-* and max-w-4xl constraints...');
assert(!receiptDetailCode.includes('max-w-4xl'), 'Eliminated narrow max-w-4xl box constraint');
assert(!receiptDetailCode.includes('bg-brand-canvas'), 'Eliminated legacy bg-brand-canvas');
assert(!receiptDetailCode.includes('text-brand-navy'), 'Eliminated legacy text-brand-navy');
assert(!receiptDetailCode.includes('bg-brand-surface'), 'Eliminated legacy bg-brand-surface');
assert(!receiptDetailCode.includes('border-slate-200'), 'Eliminated legacy border-slate-200');

// 2. Header and Action Controls
console.log('\n[15.2 Header & Actions] Checking title, invoice pill, status control and action buttons...');
assert(receiptDetailCode.includes('Receipts') && receiptDetailCode.includes('to="/receipts"'), 'Includes back link to /receipts');
assert(receiptDetailCode.includes('ReceiptStatusControl'), 'Includes ReceiptStatusControl lifecycle badge');
assert(receiptDetailCode.includes('setIsEditing'), 'Includes Edit action toggle');
assert(receiptDetailCode.includes('setShowShareModal'), 'Includes Share action');
assert(receiptDetailCode.includes('handleDownload') || receiptDetailCode.includes('Download'), 'Includes Download action');
assert(receiptDetailCode.includes('setShowDeleteModal'), 'Includes Delete action trigger');

// 3. Two-Pane Document Layout
console.log('\n[15.3 Two-Pane Document Layout] Checking DocumentViewer and desktop split...');
assert(receiptDetailCode.includes('DocumentViewer'), 'Embeds DocumentViewer for receipt document/PDF inspection');
assert(receiptDetailCode.includes('lg:grid-cols-12'), 'Uses responsive two-pane grid layout on desktop');
assert(receiptDetailCode.includes('hasDocument'), 'Adapts layout based on whether a document attachment exists');

// 4. Financials, Line Items & Linked Products
console.log('\n[15.4 Financials & Linked Products] Checking key facts, grand total, breakdown and linked items...');
assert(receiptDetailCode.includes('Grand total') || receiptDetailCode.includes('grandVal'), 'Grand total display');
assert(receiptDetailCode.includes('Breakdown') || receiptDetailCode.includes('Subtotal'), 'Financial breakdown table');
assert(receiptDetailCode.includes('Line items') || receiptDetailCode.includes('products.map'), 'Line items list');
assert(receiptDetailCode.includes('Linked products') || receiptDetailCode.includes('Package'), 'Linked products section with warranty indicators');
assert(receiptDetailCode.includes('ShieldCheck'), 'Displays warranty badges for linked items');

// 5. Modals & Edit Mode
console.log('\n[15.5 Modals & Edit Integration] Checking ShareModal, ConfirmModal, and ReceiptForm...');
assert(receiptDetailCode.includes('ShareModal'), 'Integrates redesigned ShareModal');
assert(receiptDetailCode.includes('ConfirmModal'), 'Integrates accessible ConfirmModal for deletion');
assert(receiptDetailCode.includes('ReceiptForm'), 'Uses ReceiptForm for edit mode');
assert(receiptDetailCode.includes('onCancel'), 'Provides onCancel to exit edit mode');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
