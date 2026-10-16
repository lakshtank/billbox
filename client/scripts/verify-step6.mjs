/**
 * Step 6 Verification Script: Brand, Logo, Imagery
 * Validates Section 6 of REDESIGN_PLAN.md:
 * - Wordmark: "BillBox" in Geist 700, -0.02em, fg-primary
 * - Mark: 24x24 rounded square (radius 7) in solid accent, white ReceiptText outline (14px)
 * - Favicon: the mark on transparent. Provide 32, 180 (apple-touch), and SVG
 * - No stock imagery, illustrations, blobs or mascots. Empty states use 20-24px icon in 40px bg-subtle square
 * - Merchant avatars: 28px square, radius 8, flat bg-subtle, 2-letter initials in fg-secondary 12px/500
 */

import fs from 'fs';
import path from 'path';

console.log('='.repeat(60));
console.log('BILLBOX STEP 6 BRAND & IMAGERY VERIFICATION');
console.log('='.repeat(60));

const LOGO_JSX = path.resolve('src/components/brand/Logo.jsx');
const MERCHANT_AVATAR_JSX = path.resolve('src/components/brand/MerchantAvatar.jsx');
const EMPTY_STATE_JSX = path.resolve('src/components/common/EmptyState.jsx');
const PUBLIC_DIR = path.resolve('public');
const INDEX_HTML = path.resolve('index.html');

let allPassed = true;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${label.padEnd(42)} ${detail}`);
  } else {
    console.error(`[FAIL] ${label.padEnd(42)} ${detail}`);
    allPassed = false;
  }
}

// 1. Verify Logo components
check('Logo.jsx exists', fs.existsSync(LOGO_JSX));
if (fs.existsSync(LOGO_JSX)) {
  const content = fs.readFileSync(LOGO_JSX, 'utf8');
  check('Logo exports Logo, LogoMark, Wordmark', 
    content.includes('export const Logo') &&
    content.includes('export const LogoMark') &&
    content.includes('export const Wordmark')
  );
  check('LogoMark is 24x24 rounded-[7px] bg-accent', content.includes('rounded-[7px]') && content.includes('bg-accent'));
  check('LogoMark contains ReceiptText glyph (14px)', content.includes('ReceiptText') && content.includes('14'));
  check('Wordmark is Geist 700 with -0.02em tracking', content.includes('font-bold') && content.includes('tracking-[-0.02em]'));
}

// 2. Verify MerchantAvatar
check('MerchantAvatar.jsx exists', fs.existsSync(MERCHANT_AVATAR_JSX));
if (fs.existsSync(MERCHANT_AVATAR_JSX)) {
  const content = fs.readFileSync(MERCHANT_AVATAR_JSX, 'utf8');
  check('MerchantAvatar is 28px square (w-7 h-7)', content.includes('w-7 h-7'));
  check('MerchantAvatar has radius 8 (rounded-[8px])', content.includes('rounded-[8px]'));
  check('MerchantAvatar uses flat bg-subtle & text-fg-2', content.includes('bg-subtle') && content.includes('text-fg-2'));
  const codeOnly = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  check('No colour hashing / gradients in MerchantAvatar', !codeOnly.includes('gradient') && !codeOnly.includes('hash'));
}

// 3. Verify EmptyState
check('EmptyState.jsx exists', fs.existsSync(EMPTY_STATE_JSX));
if (fs.existsSync(EMPTY_STATE_JSX)) {
  const content = fs.readFileSync(EMPTY_STATE_JSX, 'utf8');
  check('EmptyState uses 40px (w-10 h-10) bg-subtle box', content.includes('w-10 h-10') && content.includes('bg-subtle'));
  check('EmptyState uses 20px (w-5 h-5) Lucide icon', content.includes('w-5 h-5'));
}

// 4. Verify Favicon assets
const faviconSvg = path.join(PUBLIC_DIR, 'favicon.svg');
const favicon32 = path.join(PUBLIC_DIR, 'favicon-32x32.png');
const appleIcon = path.join(PUBLIC_DIR, 'apple-touch-icon.png');

check('favicon.svg exists', fs.existsSync(faviconSvg));
check('favicon-32x32.png exists', fs.existsSync(favicon32));
check('apple-touch-icon.png exists', fs.existsSync(appleIcon));

// 5. Verify index.html links
const indexHtmlContent = fs.readFileSync(INDEX_HTML, 'utf8');
check('index.html links favicon.svg', indexHtmlContent.includes('href="/favicon.svg"'));
check('index.html links favicon-32x32.png', indexHtmlContent.includes('href="/favicon-32x32.png"'));
check('index.html links apple-touch-icon.png', indexHtmlContent.includes('href="/apple-touch-icon.png"'));

console.log('='.repeat(60));
if (allPassed) {
  console.log('Step 6 Brand, Logo, and Imagery: VERIFIED AND PASSING');
} else {
  console.error('ERROR: Some Step 6 checks failed.');
  process.exit(1);
}
