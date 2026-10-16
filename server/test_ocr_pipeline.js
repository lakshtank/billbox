const path = require('path');
const fs = require('fs');
const { runOCR } = require('./services/ocr.service');
const { extractFields } = require('./services/fieldExtractor.service');

// Fixtures directory located portably inside server/test-fixtures/
const FIXTURES_DIR = path.join(__dirname, 'test-fixtures');

const samples = [
  {
    name: 'Sample 1 - FIX TOOLS Invoice',
    filename: 'sample1-fixtools.png',
    path: path.join(FIXTURES_DIR, 'sample1-fixtools.png'),
    mimeType: 'image/png',
    expected: {
      storeName: 'FIX TOOLS',
      invoiceNumber: '45THY32',
      purchaseDate: '2023-05-25',
      totalAmount: 16.35,
    },
  },
  {
    name: 'Sample 2 - Consumer Electronics Store',
    filename: 'sample2-electronics.png',
    path: path.join(FIXTURES_DIR, 'sample2-electronics.png'),
    mimeType: 'image/png',
    expected: {
      storeName: 'Consumer Electronics Store',
      invoiceNumber: 'INV-1001',
      purchaseDate: '2024-06-18',
      totalAmount: 1650.00,
    },
  },
  {
    name: 'Sample 3 - SUPERMARKET Thermal Receipt',
    filename: 'sample3-supermarket.png',
    path: path.join(FIXTURES_DIR, 'sample3-supermarket.png'),
    mimeType: 'image/png',
    expected: {
      storeName: 'SUPERMARKET',
      totalAmount: 107.60,
    },
  },
];

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING OCR PIPELINE TEST ON TEST FIXTURES');
  console.log('==================================================\n');

  // Allow CLI argument to test an individual file
  const cliTargetFile = process.argv[2];
  let testQueue = samples;

  if (cliTargetFile) {
    const resolvedPath = path.resolve(cliTargetFile);
    console.log(`Custom test file provided via CLI: ${resolvedPath}\n`);
    testQueue = [
      {
        name: `Custom Test File (${path.basename(resolvedPath)})`,
        path: resolvedPath,
        mimeType: resolvedPath.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      },
    ];
  }

  let totalRun = 0;
  let totalSuccess = 0;
  let totalSkipped = 0;

  for (let i = 0; i < testQueue.length; i++) {
    const s = testQueue[i];
    console.log(`--- ${s.name} ---`);
    console.log(`Target: ${s.path}`);

    if (!fs.existsSync(s.path)) {
      console.warn(`[SKIPPED] Test fixture not found at path: ${s.path}\n`);
      totalSkipped++;
      continue;
    }

    try {
      totalRun++;
      const startTime = Date.now();
      const ocrResult = await runOCR(s.path, s.mimeType);
      const elapsed = Date.now() - startTime;

      console.log(`OCR Processing Time: ${elapsed}ms`);
      console.log(`Word Count Extracted: ${ocrResult.wordData ? ocrResult.wordData.length : 0}`);
      console.log('\n[RAW TEXT SAMPLE]:');
      console.log(ocrResult.rawText ? ocrResult.rawText.substring(0, 300) + '...' : '(none)');
      console.log('--------------------------------------------------');

      const extracted = await extractFields(ocrResult.rawText, ocrResult.wordData);
      console.log('\n[EXTRACTED FIELDS]:');
      console.log(JSON.stringify(extracted.extracted, null, 2));
      console.log(`\nAverage Confidence: ${extracted.avgConfidence}%`);
      console.log(`Handwriting/Unreadable Flag: ${extracted.handwritingDetected}`);

      if (s.expected) {
        console.log('\n[FIELD VALIDATION]:');
        let matches = 0;
        let checks = 0;
        for (const [key, val] of Object.entries(s.expected)) {
          checks++;
          const actualRaw = extracted.extracted ? extracted.extracted[key] : undefined;
          const actualVal = actualRaw && typeof actualRaw === 'object' && 'value' in actualRaw ? actualRaw.value : actualRaw;
          const matched = String(actualVal || '').toLowerCase().includes(String(val).toLowerCase()) || actualVal == val;
          if (matched) matches++;
          console.log(`  - ${key}: expected "${val}", got "${actualVal}" -> ${matched ? '✓ MATCH' : '⚠ DIFF'}`);
        }
      }

      console.log('--------------------------------------------------\n');
      totalSuccess++;
    } catch (err) {
      console.error(`Error processing ${s.name}:`, err.message);
      console.log('--------------------------------------------------\n');
    }
  }

  console.log('==================================================');
  console.log(`TEST RUN SUMMARY: Total: ${testQueue.length} | Executed: ${totalRun} | Succeeded: ${totalSuccess} | Skipped: ${totalSkipped}`);
  console.log('==================================================\n');
}

runTests();
