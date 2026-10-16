/**
 * Verification script for Step 9 — Data Components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'src/components/data');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ ${testName}`);
    failed++;
  }
}

console.log('\n--- Step 9 Data Components Verification ---\n');

// 9.1 DataTable
console.log('9.1 Checking DataTable (src/components/data/DataTable.jsx):');
const dtContent = fs.readFileSync(path.join(dataDir, 'DataTable.jsx'), 'utf-8');
assert(dtContent.includes('@tanstack/react-table'), 'DataTable uses TanStack Table');
assert(dtContent.includes('rounded-[12px]') && dtContent.includes('border-line') && dtContent.includes('bg-surface'), 'DataTable container has radius 12, border line, and bg-surface');
assert(dtContent.includes('h-9') && dtContent.includes('bg-subtle') && dtContent.includes('sticky'), 'Header row is 36px (h-9), bg-subtle, and sticky');
assert(dtContent.includes('h-10') && dtContent.includes('h-8'), 'Body rows support comfortable (h-10) and compact (h-8) densities');
assert(dtContent.includes('border-l-2 border-l-accent'), 'Selected rows have 2px accent left rail');
assert(dtContent.includes('text-right tnum'), 'Numeric columns are right-aligned with .tnum');
assert(dtContent.includes('selectedCount > 0'), 'Includes bulk action bar when rows are selected');
assert(dtContent.includes('Showing') && dtContent.includes('Rows per page'), 'Footer includes pagination summary and page size selector');
assert(dtContent.includes('TableRowActions'), 'Exports TableRowActions helper with standard row menu items');

// 9.2 Money
console.log('\n9.2 Checking Money (src/components/data/Money.jsx):');
const moneyContent = fs.readFileSync(path.join(dataDir, 'Money.jsx'), 'utf-8');
assert(moneyContent.includes('tnum'), 'Money component uses .tnum tabular numbers');
assert(moneyContent.includes('en-IN') && moneyContent.includes('INR'), 'Money component handles en-IN grouping for INR');
assert(moneyContent.includes('text-bad-fg') && moneyContent.includes('−'), 'Negative values render in text-bad-fg with minus sign');
assert(moneyContent.includes('—'), 'Missing / null values render em-dash (—)');
assert(moneyContent.includes('Converted') && moneyContent.includes('Tooltip'), 'Converted prop appends Converted tooltip chip');

// 9.3 DateCell
console.log('\n9.3 Checking DateCell (src/components/data/DateCell.jsx):');
const dateContent = fs.readFileSync(path.join(dataDir, 'DateCell.jsx'), 'utf-8');
assert(dateContent.includes('<time') && dateContent.includes('dateTime='), 'DateCell renders semantic <time datetime="..."> tag');
assert(dateContent.includes('relative') && dateContent.includes('Tooltip'), 'Supports relative warranty mode with exact date on tooltip');
assert(dateContent.includes('daysRemaining'), 'Prioritizes server-provided daysRemaining');

// 9.4 StatusBadge
console.log('\n9.4 Checking StatusBadge (src/components/data/StatusBadge.jsx):');
const badgeContent = fs.readFileSync(path.join(dataDir, 'StatusBadge.jsx'), 'utf-8');
assert(badgeContent.includes('STATUS_MAP'), 'Defines STATUS_MAP single source of truth');
assert(badgeContent.includes('active:') && badgeContent.includes('Covered') && badgeContent.includes('ShieldCheck'), 'STATUS_MAP has active -> Covered with ShieldCheck');
assert(badgeContent.includes('expiring:') && badgeContent.includes('Expiring') && badgeContent.includes('Clock'), 'STATUS_MAP has expiring -> Expiring with Clock');
assert(badgeContent.includes('expired:') && badgeContent.includes('Expired') && badgeContent.includes('ShieldOff'), 'STATUS_MAP has expired -> Expired with ShieldOff');
assert(badgeContent.includes('none:') && badgeContent.includes('No cover') && badgeContent.includes('Minus'), 'STATUS_MAP has none -> No cover with Minus');
assert(badgeContent.includes('needs_review:') && badgeContent.includes('Needs review') && badgeContent.includes('AlertTriangle'), 'STATUS_MAP has needs_review -> Needs review');
assert(badgeContent.includes('reconciled:') && badgeContent.includes('Matched') && badgeContent.includes('Check'), 'STATUS_MAP has reconciled -> Matched');
assert(badgeContent.includes('failed:') && badgeContent.includes('Failed') && badgeContent.includes('XCircle'), 'STATUS_MAP has failed -> Failed');
assert(badgeContent.includes('processing:') && badgeContent.includes('Processing') && badgeContent.includes('Loader2'), 'STATUS_MAP has processing -> Processing');
assert(badgeContent.includes('not_configured:') && badgeContent.includes('Not configured') && badgeContent.includes('PlugZap'), 'STATUS_MAP has not_configured -> Not configured');

// 9.5 KpiTile
console.log('\n9.5 Checking KpiTile (src/components/data/KpiTile.jsx):');
const kpiContent = fs.readFileSync(path.join(dataDir, 'KpiTile.jsx'), 'utf-8');
assert(kpiContent.includes('rounded-[12px]') && kpiContent.includes('border-line') && kpiContent.includes('bg-surface'), 'KpiTile uses radius 12, border line, and bg-surface');
assert(kpiContent.includes('text-[11px]') && kpiContent.includes('uppercase') && kpiContent.includes('text-fg-3'), 'KpiTile has 11px uppercase overline label');
assert(kpiContent.includes('text-[28px]') && kpiContent.includes('tnum'), 'KpiTile has display 28px tnum value');
assert(kpiContent.includes('vs previous 30 days') || kpiContent.includes('deltaLabel'), 'KpiTile includes delta comparison line');
assert(kpiContent.includes('Link') || kpiContent.includes('onClick'), 'KpiTile navigates when interactive');

// 9.6 SpendingChart
console.log('\n9.6 Checking SpendingChart (src/components/data/SpendingChart.jsx):');
const chartContent = fs.readFileSync(path.join(dataDir, 'SpendingChart.jsx'), 'utf-8');
assert(chartContent.includes('recharts'), 'SpendingChart uses Recharts');
assert(chartContent.includes('var(--chart-1)'), 'Uses chart-1 stroke token');
assert(chartContent.includes('vertical={false}'), 'Horizontal gridlines only');
assert(chartContent.includes('isAnimationActive={false}'), 'No load animation on charts');
assert(chartContent.includes('role="img"'), 'Chart has role="img" accessibility attribute');
assert(chartContent.includes('View as table') || chartContent.includes('viewAsTable'), 'Provides text alternative table toggle');

// 9.7 FilterBar
console.log('\n9.7 Checking FilterBar (src/components/data/FilterBar.jsx):');
const filterContent = fs.readFileSync(path.join(dataDir, 'FilterBar.jsx'), 'utf-8');
assert(filterContent.includes('SearchInput'), 'FilterBar includes SearchInput');
assert(filterContent.includes('Category') && filterContent.includes('Popover'), 'FilterBar includes Category filter popover');
assert(filterContent.includes('Warranty') || filterContent.includes('warrantyStatus'), 'FilterBar includes Warranty filter');
assert(filterContent.includes('setDensity'), 'FilterBar includes row density toggle');
assert(filterContent.includes('setViewMode'), 'FilterBar includes Table/Grid view switch');
assert(filterContent.includes('Active filters:'), 'FilterBar displays removable active filter chips');

// 9.8 Timeline
console.log('\n9.8 Checking Timeline (src/components/data/Timeline.jsx):');
const tlContent = fs.readFileSync(path.join(dataDir, 'Timeline.jsx'), 'utf-8');
assert(tlContent.includes('bg-line'), 'Timeline has vertical connector line in line token');
assert(tlContent.includes('size-2 rounded-full'), 'Timeline uses 8px status dots');
assert(tlContent.includes('text-[13px]'), 'Timeline uses 13px text');
assert(tlContent.includes('tnum') && tlContent.includes('text-fg-3'), 'Timeline has right-aligned relative time in fg-3');

// 9.9 DocumentViewer
console.log('\n9.9 Checking DocumentViewer (src/components/data/DocumentViewer.jsx):');
const docContent = fs.readFileSync(path.join(dataDir, 'DocumentViewer.jsx'), 'utf-8');
assert(docContent.includes('bg-subtle') && docContent.includes('rounded-[12px]'), 'DocumentViewer frame has bg-subtle and radius 12');
assert(docContent.includes('ZoomIn') && docContent.includes('ZoomOut') && docContent.includes('RotateCw'), 'DocumentViewer toolbar includes zoom and rotate controls');
assert(docContent.includes('<object') && docContent.includes('Download PDF'), 'DocumentViewer supports PDF object with download fallback');
assert(docContent.includes('onLoad'), 'DocumentViewer uses real onLoad event handling');

// 9.10 ErrorState
console.log('\n9.10 Checking ErrorState (src/components/data/ErrorState.jsx):');
const errContent = fs.readFileSync(path.join(dataDir, 'ErrorState.jsx'), 'utf-8');
assert(errContent.includes('size-10') && errContent.includes('bg-bad-bg'), 'ErrorState has 40px icon tile in bad-bg');
assert(errContent.includes('text-[15px]') && errContent.includes('font-semibold'), 'ErrorState title is 15px font-semibold');
assert(errContent.includes('text-sm text-fg-2'), 'ErrorState description is 14px in fg-2');
assert(errContent.includes('Button'), 'ErrorState contains primary action button');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
}
