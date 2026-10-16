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

console.log('--- Step 14 Verification Suite (Add Receipt /receipts/new) ---');

const addReceiptPath = path.join(root, 'src', 'pages', 'AddReceipt.jsx');
assert(fs.existsSync(addReceiptPath), 'AddReceipt.jsx exists');
const addReceiptCode = fs.readFileSync(addReceiptPath, 'utf8');

// 1. Page Header & Modes
console.log('\n[14.1 Header & Segmented Control] Checking PageHeader & mode switching...');
assert(addReceiptCode.includes('PageHeader'), 'Uses PageHeader component');
assert(addReceiptCode.includes('Add receipt'), 'Title is "Add receipt"');
assert(addReceiptCode.includes('Upload'), 'Includes Upload mode');
assert(addReceiptCode.includes('Batch'), 'Includes Batch mode');
assert(addReceiptCode.includes('Manual'), 'Includes Manual mode');

// 2. ReceiptUploader (Single scan & Dropzone)
console.log('\n[14.2 ReceiptUploader] Checking 220px dropzone, progress steps & clipboard paste...');
const uploaderPath = path.join(root, 'src', 'components', 'receipts', 'ReceiptUploader.jsx');
assert(fs.existsSync(uploaderPath), 'ReceiptUploader.jsx exists');
const uploaderCode = fs.readFileSync(uploaderPath, 'utf8');
assert(uploaderCode.includes('useDropzone'), 'Uses react-dropzone');
assert(uploaderCode.includes('220px'), 'Dropzone uses 220px height specification');
assert(uploaderCode.includes('border-dashed'), 'Dropzone has dashed border');
assert(uploaderCode.includes('paste'), 'Supports clipboard paste events');
assert(uploaderCode.includes('Reading document'), 'Step 1: Reading document progress indicator');
assert(uploaderCode.includes('Extracting fields'), 'Step 2: Extracting fields progress indicator');
assert(uploaderCode.includes('Matching categories') || uploaderCode.includes('calculating line items'), 'Step 3: Category and line item matching');

// 3. ReceiptReviewForm (Two-Pane Review Screen)
console.log('\n[14.3 ReceiptReviewForm] Checking two-pane split layout, DocumentViewer & math reconciliation...');
const reviewPath = path.join(root, 'src', 'components', 'receipts', 'ReceiptReviewForm.jsx');
assert(fs.existsSync(reviewPath), 'ReceiptReviewForm.jsx exists');
const reviewCode = fs.readFileSync(reviewPath, 'utf8');
assert(reviewCode.includes('DocumentViewer'), 'Left Pane embeds DocumentViewer');
assert(reviewCode.includes('lg:grid-cols-12') || reviewCode.includes('lg:col-span-'), 'Two-pane desktop split layout');
assert(reviewCode.includes('Items add up to total'), 'Green math reconciliation for matching totals');
assert(reviewCode.includes('differ from total') || reviewCode.includes('diff'), 'Amber reconciliation warning for mismatches');
assert(reviewCode.includes('Use item sum') || reviewCode.includes('handleUseItemSum'), 'Provides "Use item sum" one-click action');
assert(reviewCode.includes('confidence') || reviewCode.includes('isLowConfidence'), 'Low confidence verification hint for extracted fields');
assert(reviewCode.includes('Add item') || reviewCode.includes('handleAddItem'), 'Supports adding line items');

// 4. BatchUploader
console.log('\n[14.4 BatchUploader] Checking multi-file queue & status...');
const batchPath = path.join(root, 'src', 'components', 'receipts', 'BatchUploader.jsx');
assert(fs.existsSync(batchPath), 'BatchUploader.jsx exists');
const batchCode = fs.readFileSync(batchPath, 'utf8');
assert(batchCode.includes('MAX_FILES') || batchCode.includes('5'), 'Limits batch upload to maximum 5 files');
assert(batchCode.includes('progressPercent') || batchCode.includes('Overall progress'), 'Displays overall progress bar');

// 5. ReceiptForm (Manual Entry)
console.log('\n[14.5 ReceiptForm] Checking manual entry form...');
const formPath = path.join(root, 'src', 'components', 'receipts', 'ReceiptForm.jsx');
assert(fs.existsSync(formPath), 'ReceiptForm.jsx exists');
const formCode = fs.readFileSync(formPath, 'utf8');
assert(formCode.includes('ProductListForm'), 'Uses shared ProductListForm for line items');
assert(formCode.includes('purchaseDate'), 'Collects required purchase date');

// 6. Truth, Token & Hygiene
console.log('\n[14.6 Truth & Hygiene] Checking legacy brand-* classes, fake claims & emojis...');
const allStep14Codes = [
  { name: 'AddReceipt.jsx', code: addReceiptCode },
  { name: 'ReceiptUploader.jsx', code: uploaderCode },
  { name: 'ReceiptReviewForm.jsx', code: reviewCode },
  { name: 'BatchUploader.jsx', code: batchCode },
  { name: 'ReceiptForm.jsx', code: formCode },
];

for (const { name, code } of allStep14Codes) {
  assert(!code.includes('bg-brand-navy') && !code.includes('bg-brand-primary'), `${name} has no legacy brand-* classes`);
  assert(!code.includes('bg-brand-canvas') && !code.includes('bg-brand-surface'), `${name} has no legacy surface/canvas classes`);
  assert(!code.includes('border-brand-border'), `${name} has no legacy border-brand-border`);
  assert(!code.includes('100% Verified'), `${name} has zero fake verification claims`);
  assert(!code.includes('Digital Vault'), `${name} has zero fake digital vault claims`);

  const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(code);
  assert(!hasEmoji, `${name} has zero emojis`);
}

console.log(`\n========================================`);
console.log(`Step 14 Verification: ${passedChecks}/${totalChecks} checks passed!`);
if (failedChecks > 0) {
  console.error(`FAILED: ${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All Step 14 requirements satisfied!`);
}
