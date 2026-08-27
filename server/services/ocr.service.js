const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  sharp = null;
}
const { PDFParse } = require('pdf-parse');
const { PDFDocument, PDFName, PDFRawStream, PDFStream } = require('pdf-lib');

/**
 * Preprocesses an image buffer or filepath using sharp before handing off to Tesseract.js.
 */
const preprocessImage = async (inputPathOrBuffer) => {
  if (!sharp) return inputPathOrBuffer;
  try {
    let pipeline = sharp(inputPathOrBuffer);
    const metadata = await pipeline.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;
    const minDim = Math.min(width, height);

    // 5. Upscale small images if shorter dimension is < 1500px
    if (minDim < 1500 && minDim > 0) {
      const scaleFactor = 1500 / minDim;
      const targetWidth = Math.round(width * scaleFactor);
      const targetHeight = Math.round(height * scaleFactor);
      pipeline = pipeline.resize(targetWidth, targetHeight, { fit: 'fill' });
    }

    // 4. Auto-rotate (EXIF orientation / deskewing)
    pipeline = pipeline.rotate();

    // 1. Grayscale
    pipeline = pipeline.grayscale();

    // 2. Increase contrast
    pipeline = pipeline.normalize().linear(1.2, -10);

    // 3. Binarize / Threshold to black and white
    pipeline = pipeline.threshold(165);

    const processedBuffer = await pipeline.toBuffer();
    return processedBuffer;
  } catch (err) {
    console.warn('Image preprocessing warning (falling back to raw image input):', err.message);
    return inputPathOrBuffer;
  }
};

/**
 * Runs Stage 1 OCR on an uploaded file (image or PDF).
 * Properly manages Tesseract worker lifecycle (create -> recognize -> terminate).
 *
 * @param {string} filePath - Absolute or relative path to file on disk
 * @param {string} mimeType - File MIME type (e.g. image/jpeg, application/pdf)
 * @returns {Promise<{ rawText: string, wordData: Array<{ text: string, confidence: number }>, overallConfidence: number }>}
 */
const runOCR = async (filePath, mimeType) => {
  const isPdf = mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return handlePdfOCR(filePath);
  }

  return handleImageOCR(filePath);
};

/**
 * Handles image OCR via Tesseract.js worker with sharp preprocessing
 */
const handleImageOCR = async (filePathOrBuffer) => {
  let worker = null;
  try {
    // Part A: Run sharp preprocessing on input image
    const processedInput = await preprocessImage(filePathOrBuffer);

    worker = await createWorker('eng');

    const ret = await worker.recognize(processedInput, {}, { tsv: true });
    const rawText = ret.data.text || '';
    const overallConfidence = typeof ret.data.confidence === 'number' ? ret.data.confidence : 80;

    const wordData = [];

    // Parse Tesseract TSV data output to extract real word-level confidence scores
    if (ret.data.tsv && typeof ret.data.tsv === 'string') {
      const tsvLines = ret.data.tsv.split('\n');
      tsvLines.forEach((line) => {
        const parts = line.split('\t');
        if (parts.length >= 12 && parts[0].trim() === '5') {
          const confNum = parseFloat(parts[10]);
          const wordText = parts[11] ? parts[11].trim() : '';
          if (wordText && !isNaN(confNum) && confNum > 0) {
            wordData.push({
              text: wordText,
              confidence: Math.round(confNum),
            });
          }
        }
      });
    }

    // Fallback if TSV parsing yielded 0 words
    if (wordData.length === 0 && rawText) {
      const words = rawText.split(/\s+/).filter(Boolean);
      words.forEach((w) => {
        wordData.push({
          text: w,
          confidence: Math.round(overallConfidence),
        });
      });
    }

    return { rawText, wordData, overallConfidence: Math.round(overallConfidence) };
  } catch (error) {
    console.error('Tesseract OCR error:', error.message);
    throw new Error(`OCR Processing Failed: ${error.message}`);
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (termErr) {
        console.error('Error terminating Tesseract worker:', termErr.message);
      }
    }
  }
};

/**
 * Handles PDF text extraction via pdf-parse.
 * If PDF is scanned/image-based (little/no text layer), extracts embedded image and runs Tesseract OCR.
 */
const handlePdfOCR = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let rawText = '';
    let wordData = [];

    // Step 1: Attempt digital PDF text extraction via PDFParse
    try {
      const parser = new PDFParse({ data: dataBuffer });
      await parser.load();
      const pdfRes = await parser.getText();
      const rawTextUncleaned = (pdfRes && pdfRes.text) || '';
      // Replace non-printable ASCII control characters (0x00 to 0x1F except \n and \r) with spaces
      rawText = rawTextUncleaned.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
    } catch (parseErr) {
      console.warn('PDFParse digital text extraction warning:', parseErr.message);
    }

    // Clean up header/footer page markers to measure actual text content
    const cleanTextLength = rawText
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, '')
      .replace(/\s+/g, '')
      .trim().length;

    // Step 2: If digital text length is substantial (>= 30 chars), return parsed text
    if (cleanTextLength >= 30) {
      const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      lines.forEach((lineText) => {
        const words = lineText.split(/\s+/).filter(Boolean);
        words.forEach((w) => {
          wordData.push({
            text: w,
            confidence: 95,
          });
        });
      });
      return { rawText, wordData, overallConfidence: 95 };
    }

    // Step 3: If digital text is missing/sparse (< 30 chars), PDF is scanned/image-based!
    console.log('Image-based/scanned PDF detected (sparse text layer). Extracting embedded image stream...');

    const imageBuffer = await extractFirstImageFromPdf(dataBuffer);

    if (imageBuffer) {
      // Run Tesseract OCR on extracted image (handleImageOCR will preprocess imageBuffer with sharp)
      const imageOcrResult = await handleImageOCR(imageBuffer);
      return imageOcrResult;
    }

    // Fallback if no embedded image found
    return { rawText, wordData, overallConfidence: 0 };
  } catch (error) {
    console.error('PDF OCR processing error:', error.message);
    return { rawText: '', wordData: [], overallConfidence: 0 };
  }
};

/**
 * Helper to extract embedded image stream buffer from scanned PDF using pdf-lib
 */
const extractFirstImageFromPdf = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const indirectObjects = pdfDoc.context.enumerateIndirectObjects();

    for (const [ref, obj] of indirectObjects) {
      if (obj instanceof PDFRawStream || obj instanceof PDFStream) {
        const subtype = obj.dict.get(PDFName.of('Subtype'));
        if (subtype === PDFName.of('Image')) {
          const contents = obj.getContents();
          if (contents && contents.length > 500) {
            return Buffer.from(contents);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error extracting image from PDF:', err.message);
  }
  return null;
};

module.exports = { runOCR, preprocessImage };
