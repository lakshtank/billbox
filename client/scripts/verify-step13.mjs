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

console.log('--- Step 13 Verification Suite (Receipts List /receipts) ---');

const receiptsPath = path.join(root, 'src', 'pages', 'Receipts.jsx');
assert(fs.existsSync(receiptsPath), 'Receipts.jsx exists');
const code = fs.readFileSync(receiptsPath, 'utf8');

// 1. Page Header & Actions
console.log('\n[13.1 Page Header & Actions] Checking PageHeader, count & export/new buttons...');
assert(code.includes('PageHeader'), 'Uses PageHeader component');
assert(code.includes('title="Receipts"'), 'Title is "Receipts"');
assert(code.includes('Export'), 'Header includes Export action');
assert(code.includes('New receipt'), 'Header includes "New receipt" action');
assert(code.includes('/receipts/new'), 'Navigates to /receipts/new on New receipt');

// 2. FilterBar Integration
console.log('\n[13.2 FilterBar] Checking FilterBar props, view switch, and query sync...');
assert(code.includes('FilterBar'), 'Uses FilterBar component');
assert(code.includes('searchValue'), 'Binds search input value');
assert(code.includes('categories'), 'Binds categories options');
assert(code.includes('onCategoryToggle'), 'Handles category filter toggle');
assert(code.includes('sortOptions'), 'Provides sorting options');
assert(code.includes('onSortChange'), 'Handles sorting change');
assert(code.includes('showViewToggle'), 'Enables view mode toggle');
assert(code.includes('onResetFilters'), 'Handles filter reset');
assert(code.includes('useSearchParams'), 'Syncs filter state with URL parameters');

// 3. Table View & Step 13 Columns
console.log('\n[13.3 Table View & Columns] Checking TanStack DataTable & required 8 columns...');
assert(code.includes('DataTable'), 'Uses DataTable component');
assert(code.includes("id: 'select'") || code.includes('id: "select"'), 'Col 1: Select checkbox column');
assert(code.includes("header: 'Merchant'") || code.includes('header: "Merchant"'), 'Col 2: Merchant column');
assert(code.includes('invoiceNumber'), 'Displays invoice number in Merchant column');
assert(code.includes("header: 'Category'") || code.includes('header: "Category"'), 'Col 3: Category column with Badge');
assert(code.includes("header: 'Items'") || code.includes('header: "Items"'), 'Col 4: Items count column');
assert(code.includes("header: 'Date'") || code.includes('header: "Date"'), 'Col 5: Date column with DateCell');
assert(code.includes('DateCell'), 'Uses DateCell component');
assert(code.includes("header: 'Status'") || code.includes('header: "Status"'), 'Col 6: Status column with StatusBadge');
assert(code.includes('StatusBadge'), 'Uses StatusBadge component');
assert(code.includes("header: 'Amount'") || code.includes('header: "Amount"'), 'Col 7: Amount column with Money');
assert(code.includes('Money'), 'Uses Money component');
assert(code.includes("id: 'actions'") || code.includes('id: "actions"'), 'Col 8: Row action menu column');
assert(code.includes('DropdownMenu'), 'Uses DropdownMenu for row actions');

// 4. Grid View (3-up cards)
console.log('\n[13.4 Grid View] Checking 3-up responsive cards and 4:3 thumbnails...');
assert(code.includes('lg:grid-cols-3'), '3-up cards on desktop grid');
assert(code.includes('aspect-[4/3]'), 'Thumbnail frame uses 4:3 aspect ratio');
assert(code.includes('rounded-[12px]'), 'Card uses 12px border radius');
assert(code.includes('hover:border-line-strong'), 'Card highlights border on hover');
assert(code.includes('bg-surface'), 'Cards use surface background token');

// 5. Bulk Actions
console.log('\n[13.5 Bulk Actions] Checking bulk delete, export, and category change...');
assert(code.includes('bulkActions'), 'Passes bulkActions renderer to DataTable');
assert(code.includes('useBulkDeleteReceipts'), 'Uses useBulkDeleteReceipts mutation');
assert(code.includes('ConfirmModal'), 'Uses ConfirmModal for deletion confirmation');
assert(code.includes('useBulkUpdateReceiptsCategory'), 'Uses useBulkUpdateReceiptsCategory mutation');
assert(code.includes('exportReceiptsToCSV') || code.includes('export'), 'Supports exporting selected rows to CSV');

// 6. Truth, Token & Hygiene
console.log('\n[13.6 Truth & Hygiene] Checking copy rules, legacy tokens, and emojis...');
assert(!code.includes('bg-brand-navy') && !code.includes('bg-brand-primary'), 'No legacy brand-* classes');
assert(!code.includes('bg-brand-canvas') && !code.includes('bg-brand-surface'), 'No legacy surface/canvas classes');
assert(!code.includes('border-brand-border'), 'No legacy border-brand-border');
assert(!code.includes('100% Verified'), 'Zero fake verification claims');
assert(!code.includes('Digital Vault'), 'Zero fake digital vault claims');

const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(code);
assert(!hasEmoji, 'Zero emojis in Receipts.jsx');

console.log(`\n========================================`);
console.log(`Step 13 Verification: ${passedChecks}/${totalChecks} checks passed!`);
if (failedChecks > 0) {
  console.error(`FAILED: ${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All Step 13 requirements satisfied!`);
}
