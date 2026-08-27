const path = require('path');
const { runOCR } = require('./services/ocr.service');
const { extractFields } = require('./services/fieldExtractor.service');

const samples = [
  {
    name: 'Sample 1 - FIX TOOLS Invoice',
    path: 'C:\\Users\\Laksh Tank\\.gemini\\antigravity-ide\\brain\\6f7d11d6-72c6-4d5d-a6d2-b7f0ebae3f3a\\media__1785691771297.png',
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
    path: 'C:\\Users\\Laksh Tank\\.gemini\\antigravity-ide\\brain\\6f7d11d6-72c6-4d5d-a6d2-b7f0ebae3f3a\\media__1785691778767.png',
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
    path: 'C:\\Users\\Laksh Tank\\.gemini\\antigravity-ide\\brain\\6f7d11d6-72c6-4d5d-a6d2-b7f0ebae3f3a\\media__1785691783179.png',
    mimeType: 'image/png',
    expected: {
      storeName: 'SUPERMARKET',
      totalAmount: 107.60,
    },
  },
];

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING OCR PIPELINE TEST ON REAL SAMPLE RECEIPTS');
  console.log('==================================================\n');

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    console.log(`--- ${s.name} ---`);
    try {
      const startTime = Date.now();
      const ocrResult = await runOCR(s.path, s.mimeType);
      const elapsed = Date.now() - startTime;

      console.log(`OCR Time: ${elapsed}ms`);
      console.log(`Word Count Extracted: ${ocrResult.wordData.length}`);
      console.log('\n[RAW TEXT]:');
      console.log(ocrResult.rawText);
      console.log('--------------------------------------------------');

      const extracted = extractFields(ocrResult.rawText, ocrResult.wordData);
      console.log('\n[EXTRACTED FIELDS]:');
      console.log(JSON.stringify(extracted.extracted, null, 2));
      console.log(`\nAverage Confidence: ${extracted.avgConfidence}%`);
      console.log(`Handwriting/Unreadable Flag: ${extracted.handwritingDetected}`);
      console.log('--------------------------------------------------\n');
    } catch (err) {
      console.error(`Error processing ${s.name}:`, err.message);
    }
  }
}

runTests();
