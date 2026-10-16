/**
 * WCAG 2.2 AA Contrast Contract & Token Discipline Verifier
 * Validates Section 3.4 of REDESIGN_PLAN.md for both Light and Dark themes.
 */

// Relative luminance formula per WCAG 2.2 specifications
function sRGBtoLin(colorChannel) {
  const c = colorChannel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance({ r, g, b }) {
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function getContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

function compositeOver(fg, bg) {
  return {
    r: Math.round(fg.r * fg.a + bg.r * (1 - fg.a)),
    g: Math.round(fg.g * fg.a + bg.g * (1 - fg.a)),
    b: Math.round(fg.b * fg.a + bg.b * (1 - fg.a)),
  };
}

console.log('='.repeat(60));
console.log('BILLBOX WCAG 2.2 AA CONTRAST CONTRACT VERIFICATION');
console.log('='.repeat(60));

const tests = [
  // Light Mode Tests
  { theme: 'Light', pair: 'fg-primary on bg-surface', fg: hexToRgb('#212A31'), bg: hexToRgb('#FFFFFF'), min: 4.5 },
  { theme: 'Light', pair: 'fg-secondary on bg-surface', fg: hexToRgb('#2E3944'), bg: hexToRgb('#FFFFFF'), min: 4.5 },
  { theme: 'Light', pair: 'fg-tertiary on bg-surface', fg: hexToRgb('#526369'), bg: hexToRgb('#FFFFFF'), min: 4.5 },
  { theme: 'Light', pair: 'fg-on-accent on accent', fg: hexToRgb('#FFFFFF'), bg: hexToRgb('#124E66'), min: 4.5 },
  { theme: 'Light', pair: 'ok-fg on ok-bg', fg: hexToRgb('#0A6B49'), bg: hexToRgb('#E8F7F1'), min: 4.5 },
  { theme: 'Light', pair: 'warn-fg on warn-bg', fg: hexToRgb('#8A5200'), bg: hexToRgb('#FEF4E0'), min: 4.5 },
  { theme: 'Light', pair: 'bad-fg on bad-bg', fg: hexToRgb('#A31B12'), bg: hexToRgb('#FDECEA'), min: 4.5 },
  { theme: 'Light', pair: 'line-focus against bg-surface (focus ring)', fg: hexToRgb('#124E66'), bg: hexToRgb('#FFFFFF'), min: 3.0 },

  // Dark Mode Tests
  { theme: 'Dark', pair: 'fg-primary on bg-surface', fg: hexToRgb('#F6F8F8'), bg: hexToRgb('#212A31'), min: 4.5 },
  { theme: 'Dark', pair: 'fg-secondary on bg-surface', fg: hexToRgb('#D3D9D4'), bg: hexToRgb('#212A31'), min: 4.5 },
  { theme: 'Dark', pair: 'fg-tertiary on bg-surface', fg: hexToRgb('#909EA1'), bg: hexToRgb('#212A31'), min: 4.5 },
  { theme: 'Dark', pair: 'fg-on-accent on accent', fg: hexToRgb('#FFFFFF'), bg: hexToRgb('#23778E'), min: 4.5 },
  { 
    theme: 'Dark', 
    pair: 'ok-fg on ok-bg (tint over surface)', 
    fg: hexToRgb('#4FD1A1'), 
    bg: compositeOver({ r: 15, g: 157, b: 107, a: 0.14 }, hexToRgb('#212A31')), 
    min: 4.5 
  },
  { 
    theme: 'Dark', 
    pair: 'warn-fg on warn-bg (tint over surface)', 
    fg: hexToRgb('#F2B24A'), 
    bg: compositeOver({ r: 199, g: 119, b: 0, a: 0.16 }, hexToRgb('#212A31')), 
    min: 4.5 
  },
  { 
    theme: 'Dark', 
    pair: 'bad-fg on bad-bg (tint over surface)', 
    fg: hexToRgb('#FF8C84'), 
    bg: compositeOver({ r: 212, g: 41, b: 31, a: 0.16 }, hexToRgb('#212A31')), 
    min: 4.5 
  },
  { theme: 'Dark', pair: 'line-focus against bg-surface (focus ring)', fg: hexToRgb('#3E97B0'), bg: hexToRgb('#212A31'), min: 3.0 },
];

let failedCount = 0;

for (const t of tests) {
  const ratio = getContrastRatio(t.fg, t.bg);
  const passed = ratio >= t.min;
  const status = passed ? 'PASS' : 'FAIL';
  if (!passed) failedCount++;

  console.log(
    `[${t.theme.toUpperCase()}] ${t.pair.padEnd(42)}: ${ratio.toFixed(2)}:1 (min ${t.min}:1) -> ${status}`
  );
}

console.log('='.repeat(60));
if (failedCount === 0) {
  console.log('All contrast tests PASSED with WCAG 2.2 AA certification.');
} else {
  console.error(`ERROR: ${failedCount} contrast tests failed!`);
  process.exit(1);
}
