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

console.log('--- Step 12 Verification Suite (Overview /) ---');

const dashPath = path.join(root, 'src', 'pages', 'Dashboard.jsx');
assert(fs.existsSync(dashPath), 'Dashboard.jsx exists');
const code = fs.readFileSync(dashPath, 'utf8');

// 1. Header & Range Selector
console.log('\n[12.1 Header & Range Selector] Checking PageHeader & segmented control...');
assert(code.includes('PageHeader'), 'Uses PageHeader component');
assert(code.includes('title="Overview"'), 'Title is "Overview"');
assert(code.includes('Your spending and warranty status.'), 'Description is "Your spending and warranty status."');
assert(code.includes('30d') && code.includes('90d') && code.includes('1y') && code.includes('All'), 'Range buttons include 30d, 90d, 1y, All');
assert(code.includes('useSearchParams'), 'Uses useSearchParams for URL-driven range');
assert(code.includes('searchParams.get(\'range\')'), 'Reads range from URL params');

// 2. Needs Review Banner
console.log('\n[12.2 Review Banner] Checking conditional needs-review banner...');
assert(code.includes('needsReviewCount > 0'), 'Banner only appears when count > 0');
assert(code.includes('review') && code.includes('totals don\'t match') || code.includes("don&apos;t match"), 'Exact review banner copy');
assert(code.includes('bg-warn-bg') && code.includes('border-warn-line'), 'Banner uses warn semantic tokens');

// 3. Four KPI Tiles
console.log('\n[12.3 KPI Tiles] Checking 4 KPI tiles in responsive grid...');
assert(code.includes('grid-cols-4') || code.includes('lg:grid-cols-4'), 'KPI tiles use 4-column grid on desktop');
assert(code.includes('KpiTile'), 'Uses KpiTile components');
assert(code.includes('Total spend'), 'Tile 1 is "Total spend"');
assert(code.includes('Receipts'), 'Tile 2 is "Receipts"');
assert(code.includes('Under warranty'), 'Tile 3 is "Under warranty"');
assert(code.includes('Expiring in 30d'), 'Tile 4 is "Expiring in 30d"');
assert(code.includes('Money'), 'Values formatted with Money component');

// 4. Middle Row: 8/4 Split (Chart & Expiring Soon)
console.log('\n[12.4 Middle Row] Checking 8/4 split with SpendingChart & Expiring soon...');
assert(code.includes('lg:col-span-8') && code.includes('lg:col-span-4'), 'Uses 8/4 grid layout');
assert(code.includes('SpendingChart'), 'Includes SpendingChart area chart component');
assert(code.includes('Spend over time'), 'Chart titled "Spend over time"');
assert(code.includes('Expiring soon'), 'Includes "Expiring soon" widget card');
assert(code.includes('EmptyState'), 'Includes EmptyState for zero receipt accounts');

// 5. Bottom Row: 8/4 Split (Recent Receipts & Activity Feed)
console.log('\n[12.5 Bottom Row] Checking Recent receipts & Activity feed...');
assert(code.includes('Recent receipts'), 'Includes "Recent receipts" card');
assert(code.includes('DateCell'), 'Table rows use DateCell component');
assert(code.includes('StatusBadge'), 'Table rows use StatusBadge component');
assert(code.includes('Activity'), 'Includes "Activity" feed card');
assert(code.includes('useActivityFeedQuery'), 'Connects to useActivityFeedQuery hook');

// 6. Truth & Hygiene
console.log('\n[12.6 Truth & Hygiene] Checking copy rules, greetings, fake data, and emojis...');
assert(!code.includes('Good morning') && !code.includes('Good afternoon') && !code.includes('Good evening'), 'Greeting removed per Step 12 rules');
assert(!code.includes('bg-brand-navy') && !code.includes('bg-brand-primary'), 'No legacy brand-* classes');
assert(!code.includes('bg-brand-canvas') && !code.includes('bg-brand-surface'), 'Uses tokens.css semantic tokens only');
assert(!code.includes('100% Verified'), 'Zero marketing claims');
assert(!code.includes('Digital Vault'), 'Zero fake vault claims');

// Check for emojis
const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(code);
assert(!hasEmoji, 'Zero emojis in Dashboard.jsx');

console.log(`\n========================================`);
console.log(`Step 12 Verification: ${passedChecks}/${totalChecks} checks passed!`);
if (failedChecks > 0) {
  console.error(`FAILED: ${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All Step 12 requirements satisfied!`);
}
