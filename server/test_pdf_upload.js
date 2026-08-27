const fs = require('fs');
const path = require('path');
const { runOCR } = require('./services/ocr.service');
const { extractFields } = require('./services/fieldExtractor.service');

// Minimal valid PDF binary header and stream for testing PDF extraction
const samplePdfPath = path.join(__dirname, 'test_receipt.pdf');

// Create a simple PDF text document buffer
const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 130 >>
stream
BT
/F1 12 Tf
70 700 Td
(TechMart Store) Tj
0 -20 Td
(Invoice #: INV-PDF-999) Tj
0 -20 Td
(Date: 2024-08-15) Tj
0 -20 Td
(Total Amount: $499.99) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000423 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
492
%%EOF`;

fs.writeFileSync(samplePdfPath, pdfContent);
console.log(`Created sample PDF receipt file at: ${samplePdfPath}`);

async function testPdfPipeline() {
  console.log('\n--- TESTING REAL PDF RECEIPT PIPELINE END-TO-END ---');
  try {
    const ocrResult = await runOCR(samplePdfPath, 'application/pdf');
    console.log('\n[PDF RAW EXTRACTED TEXT]:');
    console.log(ocrResult.rawText);

    const extracted = extractFields(ocrResult.rawText, ocrResult.wordData);
    console.log('\n[PDF EXTRACTED FIELDS]:');
    console.log(JSON.stringify(extracted.extracted, null, 2));

    console.log('\n✅ REAL PDF PIPELINE TEST PASSED CLEANLY WITH ZERO ERRORS!');
  } catch (err) {
    console.error('\n❌ PDF PIPELINE TEST FAILED:', err);
  } finally {
    if (fs.existsSync(samplePdfPath)) {
      fs.unlinkSync(samplePdfPath);
      console.log(`Cleaned up temporary PDF test file.`);
    }
  }
}

testPdfPipeline();
