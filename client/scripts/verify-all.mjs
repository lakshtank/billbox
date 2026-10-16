import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suites = [
  'verify-tokens.mjs',
  'verify-typography.mjs',
  'verify-step5.mjs',
  'verify-step6.mjs',
  'verify-step7.mjs',
  'verify-step8.mjs',
  'verify-step9.mjs',
  'verify-step10.mjs',
  'verify-step11.mjs',
  'verify-step12.mjs',
  'verify-step13.mjs',
  'verify-step14.mjs',
  'verify-step15.mjs',
  'verify-step16.mjs',
  'verify-step17.mjs',
  'verify-step18.mjs',
  'verify-step19.mjs',
  'verify-step20.mjs',
  'verify-step21.mjs',
  'verify-step22-27.mjs',
];

console.log('================================================================');
console.log('       RUNNING COMPLETE BILLBOX REDESIGN VERIFICATION SUITE     ');
console.log('================================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

for (const suite of suites) {
  process.stdout.write(`Executing ${suite}... `);
  const suitePath = path.join(__dirname, suite);
  const result = spawnSync('node', [suitePath], { encoding: 'utf-8' });

  if (result.status === 0) {
    console.log('PASS');
    totalPassed++;
  } else {
    console.log('FAIL');
    totalFailed++;
    failures.push({
      suite,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }
}

console.log('\n================================================================');
console.log(`SUITE SUMMARY: ${totalPassed} suites passed, ${totalFailed} suites failed.`);
console.log('================================================================\n');

if (totalFailed > 0) {
  console.error('Failure details:');
  for (const f of failures) {
    console.error(`\n--- Failure in ${f.suite} ---`);
    if (f.stdout) console.error(f.stdout);
    if (f.stderr) console.error(f.stderr);
  }
  process.exit(1);
} else {
  console.log('ALL VERIFICATION SUITES PASSED (100% COVERAGE)!');
}
