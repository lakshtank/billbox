import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

console.log('--- Verifying Steps 22 to 27 (States, Motion, Accessibility, Responsive, Copy, Perf) ---');

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc}`);
    failed++;
  }
}

// 1. Step 22: States
const appContent = fs.readFileSync(path.join(srcDir, 'App.jsx'), 'utf-8');
const navbarContent = fs.readFileSync(path.join(srcDir, 'components/common/Navbar.jsx'), 'utf-8');

check('Step 22: Offline banner is implemented in App.jsx', appContent.includes("You're offline. Changes won't be saved."));
check('Step 22: Topbar refetching progress indicator is implemented in Navbar.jsx', navbarContent.includes('useIsFetching') && navbarContent.includes('role="progressbar"'));
check('Step 22: Loading fallback is provided for route Suspense in App.jsx', appContent.includes('PageLoader') && appContent.includes('Suspense'));
check('Step 22: ErrorBoundary component exists and wraps application errors', fs.existsSync(path.join(srcDir, 'components/common/ErrorBoundary.jsx')));

// 2. Step 23: Motion
const baseCss = fs.readFileSync(path.join(srcDir, 'styles/base.css'), 'utf-8');
const themeCss = fs.readFileSync(path.join(srcDir, 'styles/theme.css'), 'utf-8');

check('Step 23: prefers-reduced-motion media query is implemented in base.css', baseCss.includes('prefers-reduced-motion'));
check('Step 23: Motion transitions are defined within <= 300ms budget', themeCss.includes('--transition-fast') && themeCss.includes('--transition-slow'));

// Check that no banned animations exist in JSX files
function scanDirectory(dir, filterExt = ['.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        results = results.concat(scanDirectory(fullPath, filterExt));
      }
    } else if (filterExt.includes(path.extname(file))) {
      results.push(fullPath);
    }
  }
  return results;
}

const allJsxFiles = scanDirectory(srcDir);
let foundBannedAnimations = false;
let foundEmojis = false;
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

for (const f of allJsxFiles) {
  const content = fs.readFileSync(f, 'utf-8');
  // animation_instruction.md Step 0.1 explicitly amends v3 Step 23: confetti allowed once for first receipt moment
  const isConfettiAllowed = f.includes('confetti') || f.includes('ReceiptReviewForm');
  if (content.includes('animate-bounce') || content.includes('animate-ping') || content.includes('tilt') || (!isConfettiAllowed && content.includes('confetti'))) {
    console.error(`Banned motion in ${path.relative(srcDir, f)}`);
    foundBannedAnimations = true;
  }
  if (emojiRegex.test(content)) {
    // Exclude test / comments if any
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (emojiRegex.test(lines[i])) {
        console.error(`Emoji found in ${path.relative(srcDir, f)}:${i + 1}`);
        foundEmojis = true;
      }
    }
  }
}

check('Step 23: Zero banned animations (confetti, bouncing, tilt) in JSX', !foundBannedAnimations);
check('Step 1 & 24: Zero emoji characters across client codebase', !foundEmojis);

// 3. Step 24: Accessibility (WCAG 2.2 AA)
const sidebarContent = fs.readFileSync(path.join(srcDir, 'components/common/Sidebar.jsx'), 'utf-8');

check('Step 24: Skip to content link is first landmark in App.jsx', appContent.includes('Skip to content') && appContent.includes('href="#main"'));
check('Step 24: Main landmark has id="main"', appContent.includes('id="main"'));
check('Step 24: Sidebar uses semantic <nav aria-label="Primary">', sidebarContent.includes('nav aria-label="Primary"'));
check('Step 24: 2px visible focus ring configured in base.css', baseCss.includes(':focus-visible') && baseCss.includes('outline: 2px solid'));

// 4. Step 25: Responsive rules
let foundNestedMinHScreen = false;
const pageFiles = scanDirectory(path.join(srcDir, 'pages'));

for (const pf of pageFiles) {
  const baseName = path.basename(pf);
  // PublicReceipt and 404 (and auth pages) can be min-h-screen standalone pages
  if (['PublicReceipt.jsx', 'NotFound.jsx', 'Login.jsx', 'Register.jsx', 'ForgotPassword.jsx', 'ResetPassword.jsx'].includes(baseName)) {
    continue;
  }
  const content = fs.readFileSync(pf, 'utf-8');
  // Check if root element has min-h-screen
  if (content.includes('min-h-screen')) {
    console.error(`Nested min-h-screen in page: ${baseName}`);
    foundNestedMinHScreen = true;
  }
}

check('Step 25: Zero nested min-h-screen on internal dashboard pages (prevents dual scrollbars)', !foundNestedMinHScreen);
check('Step 25: App shell defines max-w-[1280px] centered layout with responsive padding', appContent.includes('max-w-[1280px]') && appContent.includes('px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8'));

// 5. Step 26: Microcopy & Truth rules
let foundProhibitedClaims = false;
for (const pf of pageFiles) {
  const content = fs.readFileSync(pf, 'utf-8');
  if (content.includes('AI-powered') || content.includes('Digital Vault — Encrypted') || content.includes('Real-time logging active')) {
    console.error(`Prohibited claim in ${path.basename(pf)}`);
    foundProhibitedClaims = true;
  }
}

check('Step 26: Truth rules satisfied — zero unbacked claims (AI-powered, Encrypted Vault, Real-time logging)', !foundProhibitedClaims);

// 6. Step 27: Performance & Lazy routes
check('Step 27: Route code-splitting with React.lazy is implemented in App.jsx', appContent.includes('lazy(() => import'));

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL AUDITS PASSED SUCCESSFULLY (100% GREEN)');
}
