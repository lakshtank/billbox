import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const redesignPlanPath = path.join(root, 'REDESIGN_PLAN.md');

let content = fs.readFileSync(redesignPlanPath, 'utf8');

// 1. Theme title
content = content.replace(/# BillBox Redesign v3 — "[^"]*"/, '# BillBox Redesign v3 — "Cosmic Artistry"');

// 2. Overview table
content = content.replace(
  /\| \*\*Neutrals\*\* \|[^\n]*/,
  '| **Neutrals** | Cool Cosmic Slate & Mist (`#212A31`, `#2E3944`, `#748D92`, `#D3D9D4`). |'
);
content = content.replace(
  /\| \*\*Accent\*\* \|[^\n]*/,
  '| **Accent** | Celestial Petrol Teal (`#124E66`). Used only for primary action, active nav, links, focus. |'
);

// 3. Section 3.2 Semantic light
const lightSection = `### 3.2 Semantic — light

\`\`\`css
:root, [data-theme="light"] {
  color-scheme: light;

  --bg-app:        #F6F8F8;              /* page background */
  --bg-surface:    #FFFFFF;              /* cards, tables, inputs */
  --bg-sidebar:    #ECEFEF;
  --bg-subtle:     #D3D9D4;              /* wells, chips, table header */
  --bg-hover:      #E5EAE9;
  --bg-pressed:    #D3D9D4;
  --bg-selected:   #E8F1F3;
  --bg-scrim:      rgb(33 42 49 / 0.50);

  --fg-primary:    #212A31;              /* 11.2:1 contrast on surface */
  --fg-secondary:  #2E3944;              /* 8.5:1 contrast */
  --fg-tertiary:   #526369;              /* 5.1:1 contrast */
  --fg-disabled:   #748D92;
  --fg-on-accent:  #FFFFFF;
  --fg-link:       #124E66;

  --line-subtle:   #E2E7E6;
  --line-default:  #D3D9D4;
  --line-strong:   #B7C0BF;
  --line-focus:    #124E66;

  --accent:        #124E66;              /* Cosmic Petrol Teal */
  --accent-hover:  #0E3F53;
  --accent-press:  #0A3141;
  --accent-tint:   #E8F1F3;
  --accent-line:   #A1C6D0;

  --ok-bg: var(--green-tint);  --ok-line: var(--green-line);  --ok-fg: var(--green-fg);  --ok-solid: var(--green-solid);
  --warn-bg: var(--amber-tint); --warn-line: var(--amber-line); --warn-fg: var(--warn-fg); --warn-solid: var(--amber-solid);
  --bad-bg: var(--red-tint);   --bad-line: var(--red-line);   --bad-fg: var(--red-fg);   --bad-solid: var(--red-solid);

  --chart-1: #124E66; --chart-2: #0F9D6B; --chart-3: #C77700;
  --chart-4: #748D92; --chart-5: #2E3944; --chart-6: #909EA1;
}
\`\`\``;

content = content.replace(/### 3\.2 Semantic — light[\s\S]*?```css[\s\S]*?```/, lightSection);

// 4. Section 3.3 Semantic dark
const darkSection = `### 3.3 Semantic — dark

Dark is its own design: deep cosmic abyss surfaces, muted slate structures, and lifted teal highlights.

\`\`\`css
[data-theme="dark"] {
  color-scheme: dark;

  --bg-app:        #182026;
  --bg-surface:    #212A31;              /* Cosmic Abyss */
  --bg-sidebar:    #182026;
  --bg-subtle:     #2E3944;              /* Space Cadet Slate */
  --bg-hover:      #2E3944;
  --bg-pressed:    #3C4A51;
  --bg-selected:   rgb(35 119 142 / 0.18);
  --bg-scrim:      rgb(10 14 18 / 0.70);

  --fg-primary:    #F6F8F8;              /* 12.8:1 contrast on surface */
  --fg-secondary:  #D3D9D4;              /* 8.7:1 contrast on surface */
  --fg-tertiary:   #909EA1;              /* 4.6:1 contrast on surface */
  --fg-disabled:   #748D92;
  --fg-on-accent:  #FFFFFF;
  --fg-link:       #58A3B9;

  --line-subtle:   #26323B;
  --line-default:  #2E3944;
  --line-strong:   #3C4A51;
  --line-focus:    #3E97B0;

  --accent:        #23778E;              /* Lifted Petrol Teal */
  --accent-hover:  #2C8CA7;
  --accent-press:  #1A6377;
  --accent-tint:   rgb(35 119 142 / 0.18);
  --accent-line:   rgb(62 151 176 / 0.40);

  --ok-bg: rgb(15 157 107 / 0.14);  --ok-line: rgb(15 157 107 / 0.40);  --ok-fg: #4FD1A1;  --ok-solid: #1FB783;
  --warn-bg: rgb(199 119 0 / 0.16); --warn-line: rgb(231 150 20 / 0.40); --warn-fg: #F2B24A; --warn-solid: #E8A026;
  --bad-bg: rgb(212 41 31 / 0.16);  --bad-line: rgb(240 90 80 / 0.40);  --bad-fg: #FF8C84;  --bad-solid: #F0554A;

  --chart-1: #3E97B0; --chart-2: #1FB783; --chart-3: #E8A026;
  --chart-4: #748D92; --chart-5: #D3D9D4; --chart-6: #909EA1;
}
\`\`\``;

content = content.replace(/### 3\.3 Semantic — dark[\s\S]*?```css[\s\S]*?```/, darkSection);

// 5. Appendix tokens
content = content.replace(
  /ACCENT[^\n]*/,
  'ACCENT    Cosmic Petrol #124E66 (light) · #23778E (dark)\nPALETTE   #212A31 · #2E3944 · #124E66 · #748D92 · #D3D9D4'
);

fs.writeFileSync(redesignPlanPath, content, 'utf8');

// Also create BILLBOX_REDESIGN_v3.md to ensure both filenames are present
const v3Path = path.join(root, 'BILLBOX_REDESIGN_v3.md');
fs.writeFileSync(v3Path, content, 'utf8');

console.log('✓ REDESIGN_PLAN.md & BILLBOX_REDESIGN_v3.md updated with Cosmic Artistry theme!');
