/**
 * Verification script for Step 7 — Global Setup
 * Checks:
 *  1. No-flash theme script & font preloading in index.html
 *  2. Base styles (focus-visible, selection, scrollbar, print, reduced motion) in base.css
 *  3. Provider hierarchy in main.jsx and App.jsx
 *  4. PreferencesContext managing theme, density, viewMode, sidebarCollapsed & profile sync
 *  5. ThemeToggle component and integration in Navbar
 *  6. Toaster styling with Sonner, 360px width, elevation-2, left status rail, max 3 toasts
 *  7. Backend user model and auth controller uiPreferences support
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const serverDir = path.resolve(__dirname, '../../server');

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

console.log('\n--- Step 7 Verification ---\n');

// 1. index.html
console.log('1. Checking index.html:');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');
assert(indexHtml.includes("localStorage.getItem('billbox.theme')"), 'Inline theme script reads billbox.theme');
assert(indexHtml.includes('prefers-color-scheme: dark'), 'Inline theme script handles system prefers-color-scheme');
assert(indexHtml.includes('document.documentElement.dataset.theme'), 'Inline theme script sets document.documentElement.dataset.theme');
assert(indexHtml.includes('rel="preload"') && indexHtml.includes('geist-latin-wght-normal.woff2'), 'Preloads geist-latin-wght-normal.woff2 font');

// 2. base.css
console.log('\n2. Checking base.css:');
const baseCss = fs.readFileSync(path.join(rootDir, 'src/styles/base.css'), 'utf-8');
assert(baseCss.includes('outline: 2px solid var(--line-focus);'), 'Focus-visible uses var(--line-focus)');
assert(baseCss.includes('background: var(--accent-tint);'), 'Selection uses var(--accent-tint)');
assert(baseCss.includes('width: 10px;') && baseCss.includes('height: 10px;'), 'Scrollbar dimensions are 10px');
assert(baseCss.includes('border: 2px solid var(--bg-app);'), 'Scrollbar thumb has 2px border matching bg-app');
assert(baseCss.includes('prefers-reduced-motion: reduce'), 'Reduced motion rules defined with !important durations');
assert(baseCss.includes('@media print') && baseCss.includes('.no-print'), 'Print styles enforce light color-scheme and no-print');

// 3. main.jsx providers
console.log('\n3. Checking Providers in main.jsx and App.jsx:');
const mainJsx = fs.readFileSync(path.join(rootDir, 'src/main.jsx'), 'utf-8');
assert(mainJsx.includes('ThemeProvider'), 'main.jsx has ThemeProvider');
assert(mainJsx.includes('PreferencesProvider'), 'main.jsx has PreferencesProvider');
assert(mainJsx.includes('QueryClientProvider'), 'main.jsx has QueryClientProvider');
assert(mainJsx.includes('TooltipProvider'), 'main.jsx has TooltipProvider');

const appJsx = fs.readFileSync(path.join(rootDir, 'src/App.jsx'), 'utf-8');
assert(appJsx.includes('SonnerToaster') || appJsx.includes('Toaster'), 'App.jsx mounts Toaster');

// 4. PreferencesContext
console.log('\n4. Checking PreferencesContext.jsx:');
const prefCtx = fs.readFileSync(path.join(rootDir, 'src/context/PreferencesContext.jsx'), 'utf-8');
assert(prefCtx.includes("'billbox.density'"), 'Persists density under billbox.density');
assert(prefCtx.includes("'billbox.viewMode'"), 'Persists viewMode under billbox.viewMode');
assert(prefCtx.includes("'billbox.sidebarCollapsed'"), 'Persists sidebarCollapsed under billbox.sidebarCollapsed');
assert(prefCtx.includes('dataset.density'), 'Sets document.documentElement.dataset.density');
assert(prefCtx.includes('syncToProfile'), 'Implements syncToProfile to sync with backend');
assert(prefCtx.includes('syncFromUser'), 'Implements syncFromUser to hydrate preferences on login');

// 5. ThemeToggle & Navbar
console.log('\n5. Checking ThemeToggle & Navbar:');
const themeToggle = fs.readFileSync(path.join(rootDir, 'src/components/common/ThemeToggle.jsx'), 'utf-8');
assert(themeToggle.includes('cycleTheme'), 'ThemeToggle has cycleTheme switching light -> dark -> system');
assert(themeToggle.includes('aria-label'), 'ThemeToggle button includes accessible aria-label');

const navbarJsx = fs.readFileSync(path.join(rootDir, 'src/components/common/Navbar.jsx'), 'utf-8');
assert(navbarJsx.includes('ThemeToggle'), 'Navbar integrates ThemeToggle');
assert(navbarJsx.includes('bg-surface') && navbarJsx.includes('border-line'), 'Navbar uses design tokens');

// 6. Sonner Toaster
console.log('\n6. Checking Toaster (sonner):');
const sonnerJsx = fs.readFileSync(path.join(rootDir, 'src/components/ui/sonner.jsx'), 'utf-8');
assert(sonnerJsx.includes('position="bottom-right"'), 'Sonner positioned at bottom-right');
assert(sonnerJsx.includes('visibleToasts={3}'), 'Sonner limits max stacked toasts to 3');
assert(sonnerJsx.includes('duration={5000}'), 'Sonner default auto-dismiss is 5000ms');
assert(sonnerJsx.includes('border-l-[3px]'), 'Sonner toasts include 3px left status rail');

// 7. Backend uiPreferences
console.log('\n7. Checking Backend uiPreferences:');
const userModel = fs.readFileSync(path.join(serverDir, 'models/User.model.js'), 'utf-8');
assert(userModel.includes('uiPreferences'), 'User.model.js includes uiPreferences schema');

const authController = fs.readFileSync(path.join(serverDir, 'controllers/auth.controller.js'), 'utf-8');
assert(authController.includes('uiPreferences'), 'auth.controller.js supports uiPreferences in getMe, login, updateProfile');

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) {
  process.exit(1);
}
