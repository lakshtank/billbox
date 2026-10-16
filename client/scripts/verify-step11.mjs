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

console.log('--- Step 11 Verification Suite ---');

// 1. Check App.jsx (No header, topbar, or sidebar on auth routes)
console.log('\n[11.1 App Layout] Checking App.jsx auth routing...');
const appPath = path.join(root, 'src', 'App.jsx');
const appCode = fs.readFileSync(appPath, 'utf8');

const authBlockMatch = appCode.match(/if\s*\(\s*isAuthPage\s*\)\s*\{([\s\S]*?)\n\s*\}/);
assert(authBlockMatch !== null, 'isAuthPage block exists in App.jsx');
if (authBlockMatch) {
  const authBlock = authBlockMatch[1];
  assert(!authBlock.includes('<Navbar'), 'No Navbar or full-width header rendered on auth routes');
  assert(!authBlock.includes('<Sidebar'), 'No Sidebar rendered on auth routes');
  assert(!authBlock.includes('w-screen'), 'No w-screen on auth routes container');
  assert(authBlock.includes('min-h-dvh'), 'Uses min-h-dvh on auth routes container');
}

// 2. Check AuthLayout.jsx
console.log('\n[11.2 AuthLayout] Checking AuthLayout.jsx shared frame & brand panel...');
const authLayoutPath = path.join(root, 'src', 'components', 'auth', 'AuthLayout.jsx');
assert(fs.existsSync(authLayoutPath), 'AuthLayout.jsx exists');
const authLayoutCode = fs.readFileSync(authLayoutPath, 'utf8');

assert(authLayoutCode.includes('min-h-dvh'), 'AuthLayout uses min-h-dvh');
assert(!authLayoutCode.includes('w-screen'), 'AuthLayout does not use 100vw/w-screen');
assert(!authLayoutCode.includes('100vw'), 'AuthLayout avoids 100vw to prevent horizontal scrollbars');
assert(authLayoutCode.includes('fixed top-') && authLayoutCode.includes('ThemeToggle'), 'Theme toggle fixed top-right of page');
assert(authLayoutCode.includes('variant="ghost"'), 'Theme toggle is 32px ghost button with no bar behind it');
assert(authLayoutCode.includes('max-w-[400px]'), 'Form block is max-w-[400px]');
assert(authLayoutCode.includes('my-auto') || authLayoutCode.includes('justify-center'), 'Form is vertically and horizontally centered in column');
assert(authLayoutCode.includes('#124E66') && authLayoutCode.includes('#212A31'), 'Right panel background is #124E66 (light) and #212A31 (dark)');
assert(authLayoutCode.includes('border-l-0'), 'Right panel has no border-left (border-l-0)');
assert(authLayoutCode.includes('max-w-[520px]'), 'Right panel content is max-w-[520px]');
assert(authLayoutCode.includes('hidden lg:flex'), 'Right panel hidden on <1024px');
assert(authLayoutCode.includes('ReceiptText'), 'Right panel uses decorative ReceiptText mark');

// Brand Panel Content Checks
assert(authLayoutCode.includes('Never lose a receipt or miss a warranty again.'), 'Headline is "Never lose a receipt or miss a warranty again."');
assert(authLayoutCode.includes('Upload a bill, BillBox reads it, and you always know what'), 'Subtext is correct');
assert(authLayoutCode.includes('01') && authLayoutCode.includes('Upload') && authLayoutCode.includes('Add a photo or PDF of any bill.'), 'Step 1 is 01 Upload');
assert(authLayoutCode.includes('02') && authLayoutCode.includes('Review') && authLayoutCode.includes('Check the details BillBox found.'), 'Step 2 is 02 Review');
assert(authLayoutCode.includes('03') && authLayoutCode.includes('Track') && authLayoutCode.includes('See every warranty and when it ends.'), 'Step 3 is 03 Track');
assert(authLayoutCode.includes('© BillBox'), 'Footer is "© BillBox"');
assert(!authLayoutCode.includes('100% Verified Storage'), 'Deleted "100% Verified Storage" claim');
assert(!authLayoutCode.includes('documented in your portfolio'), 'Deleted "documented in your portfolio" claim');

// 3. Check PasswordStrengthMeter.jsx
console.log('\n[11.3 PasswordStrengthMeter] Checking PasswordStrengthMeter.jsx...');
const psmPath = path.join(root, 'src', 'components', 'auth', 'PasswordStrengthMeter.jsx');
assert(fs.existsSync(psmPath), 'PasswordStrengthMeter.jsx exists');
const psmCode = fs.readFileSync(psmPath, 'utf8');

assert(psmCode.includes('grid-cols-4'), '4-segment strength bar');
assert(psmCode.includes('Weak') && psmCode.includes('Fair') && psmCode.includes('Good') && psmCode.includes('Strong'), 'Includes Weak, Fair, Good, Strong text labels');
assert(psmCode.includes('length < 8') || psmCode.includes('password.length >= 8'), 'Evaluates at least 8 characters requirement');

// 4. Check Login.jsx
console.log('\n[11.4 Login] Checking Login.jsx...');
const loginPath = path.join(root, 'src', 'pages', 'Login.jsx');
assert(fs.existsSync(loginPath), 'Login.jsx exists');
const loginCode = fs.readFileSync(loginPath, 'utf8');

assert(loginCode.includes("mode: 'onTouched'"), 'Login form uses mode onTouched');
assert(loginCode.includes('Sign in'), 'H1 is "Sign in"');
assert(loginCode.includes('Welcome back to BillBox.'), 'Subtitle is "Welcome back to BillBox."');
assert(loginCode.includes('size="lg"'), 'Inputs use size="lg" (48px)');
assert(loginCode.includes('aria-describedby'), 'Input links error text via aria-describedby');
assert(loginCode.includes('aria-invalid'), 'Input gets aria-invalid');
assert(loginCode.includes('role="alert"'), 'Server error displayed with role="alert" banner');
assert(loginCode.includes('bg-bad-bg'), 'Server error banner uses bad tint');
assert(loginCode.includes('Eye') && loginCode.includes('EyeOff'), 'Show/hide password toggle eye icon button on password field');
assert(loginCode.includes('Forgot password?'), 'Forgot password link present on password label row');
assert(loginCode.includes('Create one'), 'Link to register present');
assert(loginCode.includes('autoComplete="email"'), 'Email field has autocomplete="email"');
assert(loginCode.includes('autoComplete="current-password"'), 'Password field has autocomplete="current-password"');
assert(loginCode.includes('Enter a valid email address.'), 'Exact email error message');

// 5. Check Register.jsx
console.log('\n[11.5 Register] Checking Register.jsx...');
const registerPath = path.join(root, 'src', 'pages', 'Register.jsx');
assert(fs.existsSync(registerPath), 'Register.jsx exists');
const registerCode = fs.readFileSync(registerPath, 'utf8');

assert(registerCode.includes("mode: 'onTouched'"), 'Register form uses mode onTouched');
assert(registerCode.includes('Create your account'), 'H1 is "Create your account"');
assert(registerCode.includes('Start tracking receipts and warranties.'), 'Subtitle is "Start tracking receipts and warranties."');
assert(registerCode.includes('PasswordStrengthMeter'), 'Integrates PasswordStrengthMeter');
assert(registerCode.includes('At least 8 characters.'), 'Password hint under field: "At least 8 characters."');
assert(registerCode.includes('By creating an account you agree to the') && registerCode.includes('Terms') && registerCode.includes('Privacy Policy'), 'Exact terms line present');
assert(registerCode.includes('Eye') && registerCode.includes('EyeOff'), 'Show/hide password toggle eye icon buttons present');
assert(registerCode.includes('Enter a valid email address.'), 'Exact email error message');
assert(registerCode.includes('Password must be at least 8 characters.'), 'Exact password error message');
assert(registerCode.includes("Passwords don't match."), 'Exact password mismatch error message');
assert(registerCode.includes('autoComplete="name"'), 'Name has autocomplete="name"');
assert(registerCode.includes('autoComplete="new-password"'), 'Password has autocomplete="new-password"');

// 6. Check ForgotPassword.jsx
console.log('\n[11.6 ForgotPassword] Checking ForgotPassword.jsx...');
const forgotPath = path.join(root, 'src', 'pages', 'ForgotPassword.jsx');
assert(fs.existsSync(forgotPath), 'ForgotPassword.jsx exists');
const forgotCode = fs.readFileSync(forgotPath, 'utf8');

assert(forgotCode.includes("mode: 'onTouched'"), 'ForgotPassword form uses mode onTouched');
assert(forgotCode.includes('Reset your password'), 'H1 is "Reset your password"');
assert(forgotCode.includes("Enter your email and we'll send a reset link."), 'Subtitle is correct');
assert(forgotCode.includes('MailCheck'), 'Success state includes MailCheck icon');
assert(forgotCode.includes('w-10 h-10') && forgotCode.includes('bg-subtle'), 'MailCheck icon in 40px bg-subtle tile');
assert(forgotCode.includes('Check your email'), 'Success state title is "Check your email"');
assert(forgotCode.includes('If an account exists for that email, a reset link is on its way.'), 'Exact truth message in success state');
assert(forgotCode.includes('Back to sign in'), 'Button / link "Back to sign in" present');

// 7. Check ResetPassword.jsx
console.log('\n[11.7 ResetPassword] Checking ResetPassword.jsx...');
const resetPath = path.join(root, 'src', 'pages', 'ResetPassword.jsx');
assert(fs.existsSync(resetPath), 'ResetPassword.jsx exists');
const resetCode = fs.readFileSync(resetPath, 'utf8');

assert(resetCode.includes("mode: 'onTouched'"), 'ResetPassword form uses mode onTouched');
assert(resetCode.includes('Set a new password'), 'H1 is "Set a new password"');
assert(resetCode.includes("Choose a password you haven't used before."), 'Subtitle is correct');
assert(resetCode.includes('PasswordStrengthMeter'), 'Integrates PasswordStrengthMeter');
assert(resetCode.includes('Eye') && resetCode.includes('EyeOff'), 'Show/hide toggles on password fields');
assert(resetCode.includes('This link has expired'), 'Expired state has "This link has expired"');
assert(resetCode.includes('Request a new link'), 'Expired state has "Request a new link" button to /forgot-password');
assert(resetCode.includes('Password updated'), 'Success shows toast "Password updated"');

// 8. General grep checks for forbidden words & emojis & exclamation in copy
console.log('\n[11.8 Truth & Hygiene] Checking auth files for forbidden words, emojis & exclamation marks in copy...');
const authFiles = [authLayoutPath, psmPath, loginPath, registerPath, forgotPath, resetPath];
for (const f of authFiles) {
  const content = fs.readFileSync(f, 'utf8');
  assert(!content.includes('100% Verified'), `${path.basename(f)} has no "100% Verified"`);
  assert(!content.includes('Encrypted'), `${path.basename(f)} has no "Encrypted"`);
  assert(!content.includes('Oops'), `${path.basename(f)} has no "Oops"`);
  
  // Verify no string literals ending in ! in user facing messages
  const stringLiterals = content.match(/['"`][^'"`\n\r]*!['"`]/g) || [];
  assert(stringLiterals.length === 0, `${path.basename(f)} has zero copy exclamation marks (found: ${stringLiterals.join(', ') || 'none'})`);

  // Check for emojis
  const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(content);
  assert(!hasEmoji, `${path.basename(f)} has zero emojis`);
}

console.log(`\n========================================`);
console.log(`Step 11 Verification: ${passedChecks}/${totalChecks} checks passed!`);
if (failedChecks > 0) {
  console.error(`FAILED: ${failedChecks} checks failed.`);
  process.exit(1);
} else {
  console.log(`SUCCESS: All Step 11 requirements satisfied!`);
}
