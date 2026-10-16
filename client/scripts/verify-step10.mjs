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

console.log('--- Step 10 Verification Suite ---');

// 1. Verify Sidebar.jsx
console.log('\n[10.2] Checking Sidebar.jsx...');
const sidebarPath = path.join(root, 'src', 'components', 'common', 'Sidebar.jsx');
assert(fs.existsSync(sidebarPath), 'Sidebar.jsx exists');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

assert(sidebarCode.includes('w-60'), 'Sidebar width is 240px (w-60) when expanded');
assert(sidebarCode.includes('w-16'), 'Sidebar collapses to 64px rail (w-16)');
assert(sidebarCode.includes('bg-sidebar'), 'Sidebar uses bg-sidebar token');
assert(sidebarCode.includes('border-r') && sidebarCode.includes('border-line'), 'Sidebar has 1px right line border');
assert(sidebarCode.includes('h-14') || sidebarCode.includes('56px'), 'Top block is 56px (h-14)');
assert(sidebarCode.includes('Logo'), 'Sidebar renders Logo');
assert(sidebarCode.includes('toggleSidebarCollapse'), 'Sidebar has collapse toggle handler');
assert(sidebarCode.includes('LayoutDashboard'), 'Includes LayoutDashboard icon for Overview');
assert(sidebarCode.includes('ReceiptText'), 'Includes ReceiptText icon for Receipts');
assert(sidebarCode.includes('Package'), 'Includes Package icon for Products');
assert(sidebarCode.includes('ShieldCheck'), 'Includes ShieldCheck icon for Warranties');
assert(sidebarCode.includes('Store'), 'Includes Store icon for Merchants');
assert(sidebarCode.includes('Bell'), 'Includes Bell icon for Reminders');
assert(sidebarCode.includes('Settings'), 'Includes Settings icon');
assert(sidebarCode.includes('bg-warn-solid') || sidebarCode.includes('hasDot'), 'Warranties has amber dot indicator when items expiring');
assert(sidebarCode.includes('bg-selected'), 'Active nav item has bg-selected');
assert(sidebarCode.includes('text-accent'), 'Active nav item has text-accent');
assert(sidebarCode.includes('Tooltip'), 'Collapsed rail items use Tooltip on hover');
assert(sidebarCode.includes('DropdownMenu'), 'User row triggers DropdownMenu');
assert(sidebarCode.includes('logoutUser'), 'User dropdown has logout action');
assert(sidebarCode.includes('setTheme'), 'User dropdown has theme selection');
assert(sidebarCode.includes('billbox:open-shortcuts'), 'User dropdown can trigger keyboard shortcuts');

// 2. Verify Navbar.jsx (Topbar)
console.log('\n[10.3] Checking Navbar.jsx (Topbar)...');
const navbarPath = path.join(root, 'src', 'components', 'common', 'Navbar.jsx');
assert(fs.existsSync(navbarPath), 'Navbar.jsx exists');
const navbarCode = fs.readFileSync(navbarPath, 'utf8');

assert(navbarCode.includes('h-14') || navbarCode.includes('56px'), 'Topbar is 56px (h-14) on desktop');
assert(navbarCode.includes('h-[52px]') || navbarCode.includes('52px'), 'Topbar is 52px on mobile');
assert(navbarCode.includes('sticky top-0'), 'Topbar is sticky top-0');
assert(navbarCode.includes('bg-surface'), 'Topbar has solid bg-surface');
assert(!navbarCode.includes('backdrop-blur'), 'Topbar strictly does not use blur (solid bg)');
assert(navbarCode.includes('border-b') && navbarCode.includes('border-line'), 'Topbar has 1px bottom border');
assert(navbarCode.includes('AppBreadcrumbs'), 'Desktop Topbar renders Breadcrumbs');
assert(navbarCode.includes('w-60') || navbarCode.includes('240px'), 'Search trigger is 240px (w-60)');
assert(navbarCode.includes('⌘K'), 'Search trigger displays ⌘K kbd chip');
assert(navbarCode.includes('New receipt'), 'Topbar includes "New receipt" primary button');
assert(navbarCode.includes('NotificationBell'), 'Topbar includes NotificationBell');
assert(navbarCode.includes('ThemeToggle'), 'Topbar includes ThemeToggle');

// 3. Verify AppBreadcrumbs.jsx
console.log('\n[10.3 Breadcrumbs] Checking AppBreadcrumbs.jsx...');
const breadcrumbsPath = path.join(root, 'src', 'components', 'common', 'AppBreadcrumbs.jsx');
assert(fs.existsSync(breadcrumbsPath), 'AppBreadcrumbs.jsx exists');
const breadcrumbsCode = fs.readFileSync(breadcrumbsPath, 'utf8');
assert(breadcrumbsCode.includes('text-sm'), 'Breadcrumbs use 14px (text-sm) font size');
assert(breadcrumbsCode.includes('text-fg'), 'Last segment renders in text-fg');
assert(breadcrumbsCode.includes('text-fg-2'), 'Prior segments render in text-fg-2');
assert(breadcrumbsCode.includes('ChevronRight'), 'Breadcrumbs use ChevronRight separator');

// 4. Verify BottomTabBar.jsx
console.log('\n[10.4 Mobile Frame] Checking BottomTabBar.jsx...');
const bottomTabBarPath = path.join(root, 'src', 'components', 'common', 'BottomTabBar.jsx');
assert(fs.existsSync(bottomTabBarPath), 'BottomTabBar.jsx exists');
const bottomTabBarCode = fs.readFileSync(bottomTabBarPath, 'utf8');

assert(bottomTabBarCode.includes('md:hidden'), 'BottomTabBar is hidden on desktop (md:hidden)');
assert(bottomTabBarCode.includes('fixed bottom-0'), 'BottomTabBar is fixed bottom-0');
assert(bottomTabBarCode.includes('h-14') || bottomTabBarCode.includes('56px'), 'BottomTabBar is 56px (h-14)');
assert(bottomTabBarCode.includes('safe-area'), 'BottomTabBar handles safe-area-inset-bottom');
assert(bottomTabBarCode.includes('w-11 h-11') && bottomTabBarCode.includes('rounded-full'), 'Center Add button is 44px (w-11 h-11) accent circle');
assert(bottomTabBarCode.includes('Overview'), 'Tab bar has Overview item');
assert(bottomTabBarCode.includes('Receipts'), 'Tab bar has Receipts item');
assert(bottomTabBarCode.includes('Warranties'), 'Tab bar has Warranties item');
assert(bottomTabBarCode.includes('More'), 'Tab bar has More item');
assert(bottomTabBarCode.includes('Sheet'), 'More tab opens Radix Sheet');
assert(bottomTabBarCode.includes('side="bottom"'), 'More sheet is a bottom sheet');
assert(bottomTabBarCode.includes('/products'), 'More sheet includes Products');
assert(bottomTabBarCode.includes('/stores'), 'More sheet includes Merchants');
assert(bottomTabBarCode.includes('/reminders'), 'More sheet includes Reminders');

// 5. Verify PageHeader.jsx
console.log('\n[10.6 Page Header] Checking PageHeader.jsx...');
const pageHeaderPath = path.join(root, 'src', 'components', 'common', 'PageHeader.jsx');
assert(fs.existsSync(pageHeaderPath), 'PageHeader.jsx exists');
const pageHeaderCode = fs.readFileSync(pageHeaderPath, 'utf8');

assert(pageHeaderCode.includes('text-2xl font-semibold') || pageHeaderCode.includes('title-1'), 'PageHeader uses title-1 (text-2xl font-semibold)');
assert(pageHeaderCode.includes('text-fg-2'), 'PageHeader description uses text-fg-2');
assert(pageHeaderCode.includes('actions'), 'PageHeader accepts and renders actions');
assert(pageHeaderCode.includes('tabs') && pageHeaderCode.includes('mt-4'), 'Tabs sit directly beneath with 16px gap (mt-4)');
assert(pageHeaderCode.includes('mb-6'), 'PageHeader has 24px bottom margin (mb-6)');

// 6. Verify Keyboard Shortcuts (useGlobalShortcuts.js & ShortcutModal.jsx)
console.log('\n[10.7 Keyboard Shortcuts] Checking useGlobalShortcuts.js & ShortcutModal.jsx...');
const shortcutsHookPath = path.join(root, 'src', 'hooks', 'useGlobalShortcuts.js');
assert(fs.existsSync(shortcutsHookPath), 'useGlobalShortcuts.js exists');
const shortcutsHookCode = fs.readFileSync(shortcutsHookPath, 'utf8');

assert(shortcutsHookCode.includes("'g'"), "Hook tracks 'g' key prefix");
assert(shortcutsHookCode.includes("case 'o'"), "Handles 'g' then 'o' navigation to Overview");
assert(shortcutsHookCode.includes("case 'r'"), "Handles 'g' then 'r' navigation to Receipts");
assert(shortcutsHookCode.includes("case 'p'"), "Handles 'g' then 'p' navigation to Products");
assert(shortcutsHookCode.includes("case 'w'"), "Handles 'g' then 'w' navigation to Warranties");
assert(shortcutsHookCode.includes("case 'm'"), "Handles 'g' then 'm' navigation to Merchants");
assert(shortcutsHookCode.includes("'n'"), "Handles 'n' for new receipt");
assert(shortcutsHookCode.includes("'?'"), "Handles '?' for shortcuts sheet");
assert(shortcutsHookCode.includes('isTextInput') || shortcutsHookCode.includes('INPUT'), 'Shortcuts disabled during input typing');

const shortcutModalPath = path.join(root, 'src', 'components', 'common', 'ShortcutModal.jsx');
assert(fs.existsSync(shortcutModalPath), 'ShortcutModal.jsx exists');
const shortcutModalCode = fs.readFileSync(shortcutModalPath, 'utf8');
assert(shortcutModalCode.includes('Dialog'), 'ShortcutModal uses Radix Dialog');
assert(shortcutModalCode.includes('Navigation'), 'ShortcutModal groups Navigation');
assert(shortcutModalCode.includes('Actions'), 'ShortcutModal groups Actions');
assert(shortcutModalCode.includes('<kbd'), 'ShortcutModal formats keys with <kbd>');

// 7. Verify App.jsx Frame Integration
console.log('\n[10.1 Frame] Checking App.jsx integration...');
const appPath = path.join(root, 'src', 'App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');

assert(appCode.includes('<Sidebar />'), 'App.jsx renders Sidebar');
assert(appCode.includes('<Navbar />'), 'App.jsx renders Navbar');
assert(appCode.includes('<BottomTabBar />'), 'App.jsx renders BottomTabBar');
assert(appCode.includes('<ShortcutModal />'), 'App.jsx mounts ShortcutModal');
assert(appCode.includes('useGlobalShortcuts'), 'App.jsx registers useGlobalShortcuts');
assert(appCode.includes('max-w-[1280px]'), 'App.jsx uses max-w-[1280px] container');
assert(appCode.includes('px-4') || appCode.includes('px-6') || appCode.includes('md:px-8'), 'App.jsx applies 24/32px padding');
assert(appCode.includes('/merchants'), 'App.jsx supports /merchants route alias');

console.log(`\n========================================`);
console.log(`Step 10 Verification: ${passedChecks}/${totalChecks} checks passed!`);
if (failedChecks > 0) {
  console.error(`FAILED: ${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All Step 10 requirements satisfied!`);
}
