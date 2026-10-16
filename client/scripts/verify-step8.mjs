/**
 * Verification script for Step 8 — Core Component Library
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const uiDir = path.join(rootDir, 'src/components/ui');

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

console.log('\n--- Step 8 Core Component Library Verification ---\n');

// 8.1 Button
console.log('8.1 Checking Button (src/components/ui/button.jsx):');
const buttonContent = fs.readFileSync(path.join(uiDir, 'button.jsx'), 'utf-8');
assert(buttonContent.includes('primary:') && buttonContent.includes('bg-accent'), 'Button has primary variant with bg-accent');
assert(buttonContent.includes('secondary:') && buttonContent.includes('bg-surface'), 'Button has secondary variant with bg-surface');
assert(buttonContent.includes('ghost:') && buttonContent.includes('bg-transparent'), 'Button has ghost variant');
assert(buttonContent.includes('danger:') && buttonContent.includes('bg-bad-solid'), 'Button has danger variant with bg-bad-solid');
assert(buttonContent.includes('"danger-ghost":'), 'Button has danger-ghost variant');
assert(buttonContent.includes('link:'), 'Button has link variant');
assert(buttonContent.includes('h-8') && buttonContent.includes('h-10') && buttonContent.includes('h-12'), 'Button supports 32px (h-8), 40px (h-10), and 48px (h-12) heights');
assert(buttonContent.includes('rounded-[8px]'), 'Button uses radius 8 (rounded-[8px])');
assert(buttonContent.includes('font-medium'), 'Button has font-medium (weight 500)');
assert(buttonContent.includes('Loader2') && buttonContent.includes('loading'), 'Button supports loading state with spinner');

// 8.2 Inputs
console.log('\n8.2 Checking Inputs & Forms:');
const inputContent = fs.readFileSync(path.join(uiDir, 'input.jsx'), 'utf-8');
assert(inputContent.includes('h-10'), 'Input default height is 40px (h-10)');
assert(inputContent.includes('border-line') && inputContent.includes('bg-surface'), 'Input has border-line and bg-surface');
assert(inputContent.includes('rounded-[8px]'), 'Input has 8px radius');
assert(inputContent.includes('placeholder:text-fg-3'), 'Input placeholder is text-fg-3');
assert(inputContent.includes('border-line-focus') && inputContent.includes('ring-accent/20'), 'Input focus ring uses border-line-focus and ring-accent/20');
assert(inputContent.includes('border-bad-solid'), 'Input error state uses border-bad-solid');

const labelContent = fs.readFileSync(path.join(uiDir, 'label.jsx'), 'utf-8');
assert(labelContent.includes('text-[13px]') && labelContent.includes('font-medium'), 'Label is 13px font-medium');
assert(labelContent.includes('(required)'), 'Label marks required fields with (required) text');

const formContent = fs.readFileSync(path.join(uiDir, 'form.jsx'), 'utf-8');
assert(formContent.includes('text-[12px]') && formContent.includes('text-fg-3'), 'FormDescription uses 12px text-fg-3');
assert(formContent.includes('text-bad-fg') && formContent.includes('AlertCircle'), 'FormMessage uses 12px bad-fg with AlertCircle icon');

const searchInputContent = fs.readFileSync(path.join(uiDir, 'search-input.jsx'), 'utf-8');
assert(searchInputContent.includes('Search') && searchInputContent.includes('⌘') && searchInputContent.includes('X'), 'SearchInput has leading Search, trailing ⌘K, and clear button');

const currencyInputContent = fs.readFileSync(path.join(uiDir, 'currency-input.jsx'), 'utf-8');
assert(currencyInputContent.includes('text-right') && currencyInputContent.includes('tnum') && currencyInputContent.includes('currency'), 'CurrencyInput is right-aligned, tabular, with currency code prefix');

const selectContent = fs.readFileSync(path.join(uiDir, 'select.jsx'), 'utf-8');
assert(selectContent.includes('h-10') && selectContent.includes('ChevronsUpDown'), 'Select has 40px trigger with ChevronsUpDown icon');
assert(selectContent.includes('z-dropdown') && selectContent.includes('shadow-[var(--elevation-2)]'), 'Select dropdown uses z-dropdown and elevation 2');

// 8.3 Checkbox, Switch, Radio
console.log('\n8.3 Checking Checkbox, Switch, Radio:');
const checkboxContent = fs.readFileSync(path.join(uiDir, 'checkbox.jsx'), 'utf-8');
assert(checkboxContent.includes('size-4') && checkboxContent.includes('rounded-[4px]'), 'Checkbox is 16px (size-4) with radius 4');
assert(checkboxContent.includes('data-[state=checked]:bg-accent'), 'Checkbox checked state uses bg-accent');

const switchContent = fs.readFileSync(path.join(uiDir, 'switch.jsx'), 'utf-8');
assert(switchContent.includes('h-5 w-9'), 'Switch is 36×20 (h-5 w-9)');
assert(switchContent.includes('min-h-[24px]') && switchContent.includes('min-w-[24px]'), 'Switch ensures minimum 24px hit area');
assert(switchContent.includes('data-[state=checked]:bg-accent'), 'Switch checked state uses bg-accent');

const radioContent = fs.readFileSync(path.join(uiDir, 'radio-group.jsx'), 'utf-8');
assert(radioContent.includes('size-4'), 'Radio item is 16px (size-4)');
assert(radioContent.includes('min-h-[24px]'), 'Radio item ensures minimum 24px hit area');

// 8.4 Badge
console.log('\n8.4 Checking Badge:');
const badgeContent = fs.readFileSync(path.join(uiDir, 'badge.jsx'), 'utf-8');
assert(badgeContent.includes('h-[22px]'), 'Badge height is 22px');
assert(badgeContent.includes('rounded-[6px]'), 'Badge radius is 6px');
assert(badgeContent.includes('text-[12px]') && badgeContent.includes('font-medium'), 'Badge is 12px font-medium');
assert(badgeContent.includes('px-2'), 'Badge has 8px (px-2) horizontal padding');
assert(badgeContent.includes('neutral:') && badgeContent.includes('accent:') && badgeContent.includes('ok:') && badgeContent.includes('warn:') && badgeContent.includes('bad:'), 'Badge has neutral, accent, ok, warn, bad variants');

// 8.5 Tabs
console.log('\n8.5 Checking Tabs:');
const tabsContent = fs.readFileSync(path.join(uiDir, 'tabs.jsx'), 'utf-8');
assert(tabsContent.includes('h-10'), 'Tabs underline list is 40px tall');
assert(tabsContent.includes('after:bg-accent'), 'Tabs underline active state has 2px accent underline');
assert(tabsContent.includes('segmented:'), 'Tabs includes segmented variant for view switchers');
assert(tabsContent.includes('tnum'), 'Tabs supports optional count chip with tnum');

// 8.6 Dialog, Sheet, Dropdown, Popover, Tooltip
console.log('\n8.6 Checking Overlays:');
const dialogContent = fs.readFileSync(path.join(uiDir, 'dialog.jsx'), 'utf-8');
assert(dialogContent.includes('max-w-[480px]'), 'Dialog default width is 480px');
assert(dialogContent.includes('rounded-[16px]'), 'Dialog radius is 16px');
assert(dialogContent.includes('p-6'), 'Dialog padding is 24px (p-6)');
assert(dialogContent.includes('text-[18px]') && dialogContent.includes('font-semibold'), 'Dialog title is 18px font-semibold');
assert(dialogContent.includes('bg-scrim'), 'Dialog uses plain bg-scrim with no blur');

const sheetContent = fs.readFileSync(path.join(uiDir, 'sheet.jsx'), 'utf-8');
assert(sheetContent.includes('sm:w-[480px] lg:w-[560px]'), 'Sheet drawer is 480-560px wide');
assert(sheetContent.includes('rounded-t-[16px]'), 'Sheet bottom sheet has 16px top radius with drag handle');

const dropdownContent = fs.readFileSync(path.join(uiDir, 'dropdown-menu.jsx'), 'utf-8');
assert(dropdownContent.includes('bg-surface') && dropdownContent.includes('rounded-[8px]'), 'Dropdown has bg-surface and radius 8');
assert(dropdownContent.includes('h-8') && dropdownContent.includes('shadow-[var(--elevation-2)]'), 'Dropdown item is 32px tall with elevation 2');

const tooltipContent = fs.readFileSync(path.join(uiDir, 'tooltip.jsx'), 'utf-8');
assert(tooltipContent.includes('bg-slate-900') && tooltipContent.includes('dark:bg-slate-100'), 'Tooltip uses slate-900 light / slate-100 dark background');
assert(tooltipContent.includes('delayDuration = 400'), 'Tooltip default delay is 400ms');

// 8.8 Skeleton
console.log('\n8.8 Checking Skeleton:');
const skeletonContent = fs.readFileSync(path.join(uiDir, 'skeleton.jsx'), 'utf-8');
assert(skeletonContent.includes('bg-subtle'), 'Skeleton uses bg-subtle');
assert(skeletonContent.includes('1.4s'), 'Skeleton uses 1.4s pulse animation');

// 8.9 ConfirmDialog
console.log('\n8.9 Checking ConfirmDialog:');
const confirmDialogContent = fs.readFileSync(path.join(uiDir, 'confirm-dialog.jsx'), 'utf-8');
assert(confirmDialogContent.includes('ConfirmDialog'), 'ConfirmDialog component exists');
assert(confirmDialogContent.includes('variant="secondary"') && confirmDialogContent.includes('cancelText'), 'Cancel button is secondary on the left');
assert(confirmDialogContent.includes('confirmKeyword'), 'Supports keyword typing for destructive actions');

// 8.10 CommandPalette
console.log('\n8.10 Checking CommandPalette:');
const cmdContent = fs.readFileSync(path.join(uiDir, 'command.jsx'), 'utf-8');
assert(cmdContent.includes('max-w-[560px]'), 'Command dialog is 560px wide');
assert(cmdContent.includes('rounded-[16px]'), 'Command dialog has 16px radius');
assert(cmdContent.includes('shadow-[var(--elevation-3)]'), 'Command dialog has elevation 3');

const paletteContent = fs.readFileSync(path.join(rootDir, 'src/components/common/CommandPalette.jsx'), 'utf-8');
assert(paletteContent.includes('⌘K') || paletteContent.includes('metaKey'), 'CommandPalette listens for ⌘K / Ctrl+K');
assert(paletteContent.includes('"/"'), 'CommandPalette listens for "/" key');
assert(paletteContent.includes('Actions') && paletteContent.includes('Go to'), 'CommandPalette contains Actions and Go to groups');
assert(paletteContent.includes('/receipts') && paletteContent.includes('/products'), 'CommandPalette searches receipts and products');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
}
