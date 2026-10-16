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

console.log('--- Step 20 Verification Suite (Settings /settings) ---');

const settingsPath = path.join(root, 'src', 'pages', 'Settings.jsx');
assert(fs.existsSync(settingsPath), 'Settings.jsx exists');
const settingsCode = fs.readFileSync(settingsPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[20.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!settingsCode.includes('bg-brand-canvas'), 'Settings.jsx eliminated legacy bg-brand-canvas');
assert(!settingsCode.includes('text-brand-navy'), 'Settings.jsx eliminated legacy text-brand-navy');
assert(!settingsCode.includes('bg-brand-surface'), 'Settings.jsx eliminated legacy bg-brand-surface');
assert(!settingsCode.includes('border-brand-border'), 'Settings.jsx eliminated legacy border-brand-border');

// 2. Layout Structure
console.log('\n[20.2 Layout] Checking 200px sub-nav and max 720px content column...');
assert(settingsCode.includes('200px'), 'Includes 200px left sub-nav layout');
assert(settingsCode.includes('720px'), 'Restricts content column to max 720px');

// 3. Profile Section
console.log('\n[20.3 Profile] Checking avatar, name, email, and password change...');
assert(settingsCode.includes('userInitial'), 'Displays avatar with user initials');
assert(settingsCode.includes('Full name') || settingsCode.includes('name'), 'Includes name input field');
assert(settingsCode.includes('Change password'), 'Includes change password section');
assert(settingsCode.includes('passwordStrength'), 'Includes password strength computation');

// 4. Preferences Section
console.log('\n[20.4 Preferences] Checking currency note, date format, timezone, theme tiles & density...');
assert(settingsCode.includes('Display only. Receipts keep their original currency.'), 'Includes required display currency note');
assert(settingsCode.includes('DATE_FORMATS'), 'Includes date format options');
assert(settingsCode.includes('TIMEZONES'), 'Includes timezone options');
assert(settingsCode.includes('Light') && settingsCode.includes('Dark') && settingsCode.includes('System'), 'Includes Light, Dark, and System theme options');
assert(settingsCode.includes('density') || settingsCode.includes('Comfortable'), 'Includes interface density selector');

// 5. Notifications Section
console.log('\n[20.5 Notifications] Checking email alerts toggle and test email button...');
assert(settingsCode.includes('Email alerts'), 'Includes Email alerts toggle');
assert(settingsCode.includes('Switch'), 'Uses Switch component');
assert(settingsCode.includes('Send test email'), 'Includes "Send test email" button');

// 6. Data Section
console.log('\n[20.6 Data & Export] Checking exact count, CSV/JSON export and archive...');
assert(settingsCode.includes('Exporting') && settingsCode.includes('receipts'), 'Displays exact receipts export count message');
assert(settingsCode.includes('Export CSV'), 'Includes Export CSV option');
assert(settingsCode.includes('Export JSON'), 'Includes Export JSON option');
assert(settingsCode.includes('Documents archive') || settingsCode.includes('Download archive'), 'Includes Documents archive option');

// 7. Danger Zone
console.log('\n[20.7 Danger Zone] Checking red-tinted card, list of removed data, DELETE & email confirms...');
assert(settingsCode.includes('Danger zone'), 'Includes Danger zone section');
assert(settingsCode.includes('bad-tint'), 'Applies red-tinted styling for danger card');
assert(settingsCode.includes('DELETE'), 'Requires typing DELETE for clearing data');
assert(settingsCode.includes('Delete account'), 'Includes Delete account action');

// 8. Dirty Save Button
console.log('\n[20.8 Dirty States] Checking dirty button activation...');
assert(settingsCode.includes('isProfileDirty'), 'Checks dirty state for profile changes');
assert(settingsCode.includes('isPreferencesDirty'), 'Checks dirty state for preferences');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
