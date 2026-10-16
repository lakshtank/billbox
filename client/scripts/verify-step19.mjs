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

console.log('--- Step 19 Verification Suite (Reminders /reminders) ---');

const remindersPath = path.join(root, 'src', 'pages', 'ReminderCenter.jsx');
assert(fs.existsSync(remindersPath), 'ReminderCenter.jsx exists');
const remindersCode = fs.readFileSync(remindersPath, 'utf8');

// 1. Elimination of Legacy Brand Tokens
console.log('\n[19.1 Token Audit] Checking elimination of legacy brand-* classes...');
assert(!remindersCode.includes('bg-brand-canvas'), 'ReminderCenter.jsx eliminated legacy bg-brand-canvas');
assert(!remindersCode.includes('text-brand-navy'), 'ReminderCenter.jsx eliminated legacy text-brand-navy');
assert(!remindersCode.includes('bg-brand-surface'), 'ReminderCenter.jsx eliminated legacy bg-brand-surface');
assert(!remindersCode.includes('border-brand-border'), 'ReminderCenter.jsx eliminated legacy border-brand-border');

// 2. Warn Banner for unconfigured email
console.log('\n[19.2 Warn Banner] Checking email configuration alert banner...');
assert(remindersCode.includes("Email delivery isn't configured. Reminders won't be sent."), 'Displays exact warn text for unconfigured email');
assert(remindersCode.includes('/settings'), 'Links to /settings in email warn banner');

// 3. Tabs: Upcoming and History
console.log('\n[19.3 Tabs] Checking Upcoming and History tabs...');
assert(remindersCode.includes('Upcoming') && remindersCode.includes('History'), 'Includes Upcoming and History tabs');

// 4. Upcoming Table
console.log('\n[19.4 Upcoming Table] Checking columns, dates, channel, and switch...');
assert(remindersCode.includes('Next reminder date'), 'Includes Next reminder date column');
assert(remindersCode.includes('Channel'), 'Includes Channel column');
assert(remindersCode.includes('Email'), 'Shows Email channel');
assert(remindersCode.includes('Switch'), 'Uses Radix Switch for reminder toggling');
assert(remindersCode.includes('DateCell'), 'Uses DateCell for semantic dates');
assert(!remindersCode.includes('LEAD_DAYS_OPTIONS'), 'Removed lead-time options that backend cron does not honour');

// 5. History Table
console.log('\n[19.5 History Table] Checking sent at, recipient, and delivery statuses...');
assert(remindersCode.includes('Sent at'), 'Includes Sent at column');
assert(remindersCode.includes('Recipient'), 'Includes Recipient column');
assert(remindersCode.includes('Delivery status'), 'Includes Delivery status column');
assert(remindersCode.includes('StatusBadge'), 'Uses StatusBadge for delivery statuses (Sent, Failed, Not configured)');

console.log('\n-------------------------------------------------------------');
console.log(`Results: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('-------------------------------------------------------------\n');

if (failedChecks > 0) {
  process.exit(1);
}
