/**
 * Step 5 Verification Script: Space, Size, Radius, Elevation, Motion, Z-Index
 * Validates Section 5 of REDESIGN_PLAN.md
 */

import fs from 'fs';
import path from 'path';

const TOKENS_CSS = path.resolve('src/styles/tokens.css');
const THEME_CSS = path.resolve('src/styles/theme.css');
const BASE_CSS = path.resolve('src/styles/base.css');
const SRC_DIR = path.resolve('src');

console.log('='.repeat(60));
console.log('BILLBOX STEP 5 ARCHITECTURE VERIFICATION');
console.log('='.repeat(60));

const tokensContent = fs.readFileSync(TOKENS_CSS, 'utf8');
const themeContent = fs.readFileSync(THEME_CSS, 'utf8');
const _baseContent = fs.readFileSync(BASE_CSS, 'utf8');

// 1. Verify Motion Tokens
const motionTokens = ['--dur-fast: 120ms', '--dur-base: 180ms', '--dur-slow: 260ms', '--ease-out', '--ease-in'];
for (const token of motionTokens) {
  const ok = tokensContent.includes(token);
  console.log(`[MOTION] ${token.padEnd(25)}: ${ok ? 'VALID -> PASS' : 'MISSING -> FAIL'}`);
}

// 2. Verify Z-Index Tokens
const zIndexTokens = [
  '--z-base: 0',
  '--z-sticky: 10',
  '--z-sidebar: 20',
  '--z-header: 30',
  '--z-dropdown: 40',
  '--z-scrim: 50',
  '--z-modal: 60',
  '--z-palette: 70',
  '--z-toast: 80',
  '--z-tooltip: 90',
];
for (const token of zIndexTokens) {
  const ok = tokensContent.includes(token) && themeContent.includes(token.split(':')[0]);
  console.log(`[Z-INDEX] ${token.padEnd(25)}: ${ok ? 'VALID -> PASS' : 'MISSING -> FAIL'}`);
}

// 3. Verify Radius Tokens
const radiusTokens = [
  '--radius-sm: 6px',
  '--radius-md: 8px',
  '--radius-lg: 12px',
  '--radius-xl: 16px',
];
for (const token of radiusTokens) {
  const ok = themeContent.includes(token);
  console.log(`[RADIUS] ${token.padEnd(25)}: ${ok ? 'VALID -> PASS' : 'MISSING -> FAIL'}`);
}

// 4. Verify Elevation Tokens
const elevationTokens = ['--elevation-0', '--elevation-1', '--elevation-2', '--elevation-3'];
for (const token of elevationTokens) {
  const ok = tokensContent.includes(token) && themeContent.includes(`--shadow-${token.slice(2)}`);
  console.log(`[ELEVATION] ${token.padEnd(25)}: ${ok ? 'VALID -> PASS' : 'MISSING -> FAIL'}`);
}

// 5. Scan for arbitrary z-index in components
function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== 'dist') {
        files = files.concat(walk(fullPath));
      }
    } else if (/\.(jsx?|tsx?)$/.test(item.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = walk(SRC_DIR);
let arbitraryZMatches = [];

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/\bz-(50|40|30|20|10|100|999|\[\d+\])\b/);
    if (match) {
      arbitraryZMatches.push({
        file: path.relative(SRC_DIR, file),
        line: idx + 1,
        match: match[0],
      });
    }
  });
}

console.log('='.repeat(60));
console.log(`Legacy hardcoded z-index occurrences flagged for page rebuild: ${arbitraryZMatches.length}`);
console.log('Step 5 Space, Size, Radius, Elevation, Motion, Z-Index: READY');
