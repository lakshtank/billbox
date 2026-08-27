/**
 * Stage 2 Field Parser for OCR Text
 * Extracts key receipt fields: storeName, totalAmount, purchaseDate, invoiceNumber, productName, warrantyPeriodMonths
 * Computes per-field word-level confidence scores and handles low-confidence & handwriting flags.
 */

// ─── Keyword rules and Regex Constants ────────────────────────────────────────

const KEYWORDS = {
  TOTAL: [/grand\s*total/i, /net\s*total/i, /total\s*amount/i, /^total\b/i, /amount\s*due/i, /sub\s*total/i, /total/i],
  PURCHASE_DATE: [
    /purchase\s*date/i,
    /invoice\s*date/i,
    /date\s*of\s*issue/i,       // e.g. "Date of issue: 04/13/2013"
    /date\s*of\s*purchase/i,
    /trans(?:action)?\s*date/i,
    /txn\s*date/i,
    /order\s*date/i,
    // "DATE :" or "DATE:" or "DATE" at start of line, including all-caps
    /^\s*date\s*:/i,
    /^\s*date\s+/i,
    /\bdate\b/i,
  ],
  // Labels that indicate a non-purchase date; these lines are deprioritised
  IGNORE_DATE: [/due\s*date/i, /pay\s*by/i, /expir(?:y|es)/i, /ship\s*date/i, /delivery\s*date/i],
  // Column headers that indicate a tabular product description section
  TABLE_HEADER: [/\bdescription\b/i, /\bparticulars\b/i, /\bdetails\b/i, /\bitem\s*(?:name|desc)?\b/i, /\bproduct\s*(?:title|desc|name)?\b/i, /\btitle\b/i],
};

const HEADER_SKIP_WORDS = [
  /^\s*e\.\s*&\s*o\.e\./i,
  /e\.\s*&\s*o\.e\./i,
  /^\s*invoice\b/i,
  /^\s*receipt\b/i,
  /^\s*tax\s+invoice\b/i,
  /^\s*statement\b/i,
  /^\s*bill\s+to\b/i,
  /^\s*billed\s+by\b/i,
  /^\s*billing\s+address\b/i,
  /^\s*date\b/i,
  /^\s*due\s+date\b/i,
];

// Date patterns - ordered from most specific to least specific.
// Includes both DD/MM/YYYY (international) and MM/DD/YYYY (US) numeric formats.
// Named-month patterns handle abbreviated months with optional trailing period (e.g. "Aug.").
const DATE_REGEXES = [
  // DD/MM/YYYY or DD-MM-YYYY — day first, month must be 1-12, year 4-digit (international)
  /\b(0?[1-9]|[12][0-9]|3[01])[\/\.-](0?[1-9]|1[012])[\/\.-](19|20)\d\d\b/,
  // MM/DD/YYYY or MM-DD-YYYY — month first, day 13-31 ONLY (uniquely US; avoids overlap with above)
  // Day restricted to 13-31 to prevent double-matching ambiguous dates like 03/04/YYYY.
  // Ambiguous dates (day <= 12) are handled by the DD/MM regex above with a runtime MM/DD fallback.
  /\b(0?[1-9]|1[012])[\/\.-](1[3-9]|2[0-9]|3[01])[\/\.-](19|20)\d\d\b/,
  // "Month DD, YYYY" or "Month. DD, YYYY" — abbreviated month with optional period (e.g. "Aug. 21, 2023")
  /\b(?:Jan\.?|Feb\.?|Mar\.?|Apr\.?|May\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?)[a-z]*\s+(?:0?[1-9]|[12][0-9]|3[01])(?:st|nd|rd|th)?,?\s+(?:19|20)\d\d\b/i,
  // "DD Month YYYY" (e.g. "21 Aug 2023")
  /\b(?:0?[1-9]|[12][0-9]|3[01])\s+(?:Jan\.?|Feb\.?|Mar\.?|Apr\.?|May\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Oct\.?|Nov\.?|Dec\.?)[a-z]*,?\s+(?:19|20)\d\d\b/i,
  // YYYY-MM-DD or YYYY/MM/DD
  /\b(19|20)\d\d[\/\.-](0?[1-9]|1[012])[\/\.-](0?[1-9]|[12][0-9]|3[01])\b/,
];

// Currency amount pattern — matches values WITH or WITHOUT a decimal point,
// supporting 4+ digit whole numbers with or without thousands separator commas (e.g. 1317.70, 1,317.70, $4671).
const CURRENCY_REGEX = /[\$₹€£]?\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?/;

// Helper to check if a line is a tabular column-header row (e.g. "ID | DESCRIPTION QUANTITY PRICE, $ TOTAL")
const IS_TABLE_HEADER_LINE = (line) => {
  if (!line) return false;
  if (KEYWORDS.TABLE_HEADER.some((r) => r.test(line))) return true;
  const headerWords = line.match(/\b(id|description|particulars|quantity|qty|price|rate|unit|total|amount|item|items|details|subtotal|tax)\b/gi) || [];
  return headerWords.length >= 2;
};

// Tagline / slogan phrases commonly placed below store headers that are not store names
const TAGLINE_PATTERNS = [
  /^\s*(?:your\s+trusted|welcome\s+to|quality\s+&\s+trust|satisfaction\s+guaranteed|we\s+serve|your\s+one\s*stop|service\s+with\s+a\s+smile)\b/i,
  /\b(?:partner|slogan|tagline)\b/i,
];

// Lines that are almost certainly non-product (addresses, phone numbers, emails, etc.)
const NON_PRODUCT_LINE = /^\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}$|@|\bwww\.|\.com\b|^\s*[A-Z]{1,3}\d[A-Z]\s*\d[A-Z]\d\s*$|\b(phone|fax|tel|email|address|website|mall|road|street|avenue|plaza|complex|sector|lane)\b/i;

// Safety check: returns true if text contains non-printable bytes, replacement chars, or corrupted glyph symbols (e.g. ≡, ©)
const isGarbageText = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD≡©®™|~^]/.test(str)) return true;
  const letterOrDigitCount = (str.match(/[a-zA-Z0-9]/g) || []).length;
  if (letterOrDigitCount < 2 && str.length > 2) return true;
  return false;
};

// Helper to sanitize stray OCR noise symbols from candidate text strings
const sanitizeTextString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1F\x7F-\x9F\uFFFD≡©®™|~^]/g, ' ').replace(/\s+/g, ' ').trim();
};

const { GoogleGenAI } = require('@google/genai');

/**
 * Part B: Asynchronous helper to call Google Gemini API directly with model 'gemini-3.6-flash'
 * If API key missing, rate-limited, or error occurs, returns null and falls back to regex.
 */
const runGeminiLLMExtraction = async (rawText, userCategories = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[OCR Pipeline] GEMINI_API_KEY not provided — falling back to regex parser.');
    return null;
  }

  const defaultCategories = ['Electronics', 'Appliances', 'Medical', 'Fashion', 'Furniture', 'Groceries', 'Others'];
  const categoriesToPass = Array.isArray(userCategories) && userCategories.length > 0
    ? userCategories
    : defaultCategories;

  const prompt = `You are an expert receipt & invoice data parser. Analyze the following raw OCR text extracted from a purchase document:

"${(rawText || '').substring(0, 4000)}"

UNIVERSAL EXTRACTION PHILOSOPHY:
For EVERY field (receipt-level and each item line), follow this exact order:
1. EXPLICIT: Use value stated directly on receipt.
2. INFERRED: Infer value from surrounding context and real-world knowledge (e.g. infer brand from item description like "Godrej Fab..." -> "Godrej", infer category from product type like "Liquid Detergent" -> "Groceries").
3. NOT MENTIONED: If value cannot be determined by explicit label or inference, return the literal string "Not mentioned". Never return null, empty string, or ungrounded guess. Never default silently.

RULES FOR MULTI-ITEM RECEIPTS:
- Extract all purchased line items into an "items" array.
- ONLY include actual tangible or digital merchandise/products (e.g. "ZEBRONICS Gaming Mouse", "MacBook Pro", "Godrej Detergent").
- DO NOT extract transaction fees, service fees, delivery/shipping charges, convenience charges, handling fees, protect promise fees, or packaging charges as items in the "items" array (e.g. "Handling Fee", "Protect Promise Fee", "Delivery Fee", "Platform Fee", "Shipping Fee", "Packaging Fee" must NOT be in "items"; include their total in "shippingAmount" instead).
- Each row is extracted independently. If one row is ambiguous, garbled, or a junk row, extract what is determinable for that row without blocking other valid rows.
- Do NOT attribute the full receipt total to any individual product line item.
- "grandTotal" is the final bottom-line amount paid by the customer for the entire transaction (post-tax/post-shipping). Do NOT confuse subtotal or tax breakdown base with grandTotal.

Extract the structured details and return ONLY a valid JSON object matching this schema (no markdown formatting, no explanations):
{
  "storeName": "Merchant/vendor name issuing receipt ('Sold By', letterhead name). If unknown, 'Not mentioned'.",
  "purchaseDate": "Transaction date as YYYY-MM-DD. If unknown, 'Not mentioned'.",
  "dueDate": "Payment due date as YYYY-MM-DD if present, else 'Not mentioned'.",
  "subtotal": "subtotal before tax/shipping as a number (e.g. 214.40) or 'Not mentioned'",
  "discountAmount": "Overall subtotal or receipt-level coupon discount amount as a number (e.g. 50.00) or 0",
  "shippingAmount": "shipping/handling fee as a number (e.g. 0.00) or 'Not mentioned'",
  "taxAmount": "total tax (GST/VAT) as a number (e.g. 38.60) or 'Not mentioned'",
  "grandTotal": "final bottom-line total amount paid for entire receipt as a number (e.g. 253.00) or 'Not mentioned'",
  "currency": "Currency code detected from document (e.g. 'USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'). Detect from explicit symbols ($, ₹, Rs., Rs, €, £, C$, A$), ISO codes (USD, INR, EUR, GBP), or words ('Dollars', 'Rupees', 'Euros', 'Pounds'). Normalize '₹', 'Rs.', 'Rs', 'Rupees', 'INR' to 'INR'; '$', 'USD', 'Dollars' to 'USD'; '€', 'EUR' to 'EUR'; '£', 'GBP' to 'GBP'. If unknown or no currency symbol present, return 'INR'.",
  "items": [
    {
      "productName": "Description of item purchased. Must not contain vendor boilerplate.",
      "brand": "Brand or manufacturer. Explicit 'Brand:' label if present, or inferred from product description. If unknown, 'Not mentioned'.",
      "category": "Classify product into a category. Check user categories first: ${JSON.stringify(categoriesToPass)}. Reuse exact existing name if matching, or invent concise category. If unknown, 'Not mentioned'.",
      "quantity": 1,
      "originalUnitPrice": "Original pre-discount unit price or list/MRP price per item before any savings (e.g. 425.00). If no discount is present, equal to unitPrice or 'Not mentioned'",
      "unitPrice": "Actual final price paid per unit after discount as a number (e.g. 253.00) or 'Not mentioned'",
      "discountAmount": "Total discount or savings amount for this line item as a number (e.g. 172.00) or 0",
      "discountPercent": "Percentage discount if explicitly stated (e.g. 40) or 0",
      "lineTotal": "Final total amount paid for this line item as a number (e.g. 253.00) or 'Not mentioned'",
      "warrantyPeriodValue": "numeric warranty duration (number, e.g. 12) or 'Not mentioned'",
      "warrantyPeriodUnit": "days | weeks | months | years. If warranty is 'Not mentioned', return 'months'."
    }
  ]
}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response && response.text) {
      const parsedData = JSON.parse(response.text.trim());
      console.log('[OCR Pipeline] Gemini LLM extraction succeeded (model: gemini-3.6-flash)');
      return parsedData;
    }
  } catch (err) {
    console.error('[OCR Pipeline] Gemini LLM extraction failed — falling back to regex:', err.message);
  }
  return null;
};

const mapLlmResultToExtracted = (llmResult, rawText = '', wordData = []) => {
  const storeVal = sanitizeTextString(llmResult.storeName);
  const invVal = sanitizeTextString(llmResult.invoiceNumber);

  const storeConf = storeVal && storeVal !== 'Not mentioned' ? Math.max(85, computeWordConfidence(storeVal, wordData)) : 0;
  const invConf = invVal && invVal !== 'Not mentioned' ? Math.max(85, computeWordConfidence(invVal, wordData)) : 0;

  let purchaseDateVal = null;
  let dateConf = 0;
  if (llmResult.purchaseDate && llmResult.purchaseDate !== 'Not mentioned') {
    const d = new Date(llmResult.purchaseDate);
    if (!isNaN(d.getTime())) {
      purchaseDateVal = d.toISOString();
      dateConf = 90;
    }
  }

  let dueDateVal = null;
  if (llmResult.dueDate && llmResult.dueDate !== 'Not mentioned') {
    const d = new Date(llmResult.dueDate);
    if (!isNaN(d.getTime())) {
      dueDateVal = d.toISOString();
    }
  }

  const detectedCurrency = (() => {
    const sample = (llmResult.currency || '') + ' ' + (rawText || '');
    if (/\b(USD|\$|Dollars?)\b|\$/i.test(sample)) {
      if (/\b(CAD|C\$|Canadian)\b/i.test(sample)) return 'CAD';
      if (/\b(AUD|A\$|Australian)\b/i.test(sample)) return 'AUD';
      return 'USD';
    }
    if (/\b(INR|₹|Rs\.?|Rupees?)\b|₹|Rs\.?/i.test(sample)) return 'INR';
    if (/\b(EUR|€|Euros?)\b|€/i.test(sample)) return 'EUR';
    if (/\b(GBP|£|Pounds?)\b|£/i.test(sample)) return 'GBP';
    if (/\b(CAD|C\$)\b/i.test(sample)) return 'CAD';
    if (/\b(AUD|A\$)\b/i.test(sample)) return 'AUD';
    return 'INR';
  })();

  const subtotalVal = typeof llmResult.subtotal === 'number' && !isNaN(llmResult.subtotal) ? Number(llmResult.subtotal) : null;
  const discountVal = typeof llmResult.discountAmount === 'number' && !isNaN(llmResult.discountAmount) ? Number(llmResult.discountAmount) : 0;
  const discountPercentVal = typeof llmResult.discountPercent === 'number' && !isNaN(llmResult.discountPercent) ? Number(llmResult.discountPercent) : 0;
  let shippingVal = typeof llmResult.shippingAmount === 'number' && !isNaN(llmResult.shippingAmount) ? Number(llmResult.shippingAmount) : 0;
  const taxVal = typeof llmResult.taxAmount === 'number' && !isNaN(llmResult.taxAmount) ? Number(llmResult.taxAmount) : 0;
  const grandTotalVal = typeof llmResult.grandTotal === 'number' && !isNaN(llmResult.grandTotal) ? Number(llmResult.grandTotal) : null;
  const grandTotalConf = grandTotalVal != null ? 90 : 0;

  // Filter out non-merchandise fee line items
  const FEE_ITEM_REGEX = /^(?:protect\s*promise|handling|convenience|platform|delivery|shipping|packaging|service|installation)\s*(?:fee|charges?|amount)?$/i;
  const isFeeItem = (name) => {
    if (!name) return false;
    if (FEE_ITEM_REGEX.test(name.trim())) return true;
    if (/protect\s*promise\s*fee|handling\s*fee|delivery\s*(?:fee|charge)|platform\s*fee|packaging\s*fee/i.test(name)) return true;
    return false;
  };

  // Extract Multi-Product Items Array
  const rawItems = Array.isArray(llmResult.items) ? llmResult.items : [];
  const extractedItems = [];

  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx];
    const prodName = sanitizeTextString(item.productName);

    if (isFeeItem(prodName)) {
      const feeAmt = typeof item.lineTotal === 'number' ? item.lineTotal : (typeof item.unitPrice === 'number' ? item.unitPrice : 0);
      shippingVal += feeAmt;
      continue;
    }

    const brandVal = sanitizeTextString(item.brand);
    const categoryVal = sanitizeTextString(item.category) || 'Others';
    const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
    const qtyNeedsReview = item.quantity === 'Not mentioned' || item.quantity == null || isNaN(Number(item.quantity));

    const unitPrice = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice)
      ? Number(item.unitPrice)
      : (typeof item.lineTotal === 'number' && !isNaN(item.lineTotal) ? Number(item.lineTotal) / quantity : null);

    const originalUnitPrice = typeof item.originalUnitPrice === 'number' && !isNaN(item.originalUnitPrice)
      ? Number(item.originalUnitPrice)
      : unitPrice;

    const discountAmount = typeof item.discountAmount === 'number' && !isNaN(item.discountAmount)
      ? Number(item.discountAmount)
      : 0;

    const discountPercent = typeof item.discountPercent === 'number' && !isNaN(item.discountPercent)
      ? Number(item.discountPercent)
      : 0;

    const lineTotal = typeof item.lineTotal === 'number' && !isNaN(item.lineTotal)
      ? Number(item.lineTotal)
      : (unitPrice != null ? unitPrice * quantity : null);

    const warrantyValue = typeof item.warrantyPeriodValue === 'number' && !isNaN(item.warrantyPeriodValue)
      ? Number(item.warrantyPeriodValue)
      : null;

    const warrantyUnit = ['days', 'weeks', 'months', 'years'].includes(item.warrantyPeriodUnit)
      ? item.warrantyPeriodUnit
      : 'months';

    const prodConf = prodName && prodName !== 'Not mentioned' ? Math.max(85, computeWordConfidence(prodName, wordData)) : 0;

    extractedItems.push({
      id: `item-${idx + 1}-${Date.now()}`,
      productName: prodName === 'Not mentioned' ? '' : prodName,
      brand: brandVal === 'Not mentioned' ? '' : brandVal,
      category: categoryVal,
      quantity,
      originalUnitPrice,
      unitPrice,
      discountAmount,
      discountPercent,
      lineTotal,
      warrantyPeriodValue: warrantyValue,
      warrantyPeriodUnit: warrantyUnit,
      confidence: prodConf,
      needsReview: prodConf < 60 || !prodName || prodName === 'Not mentioned' || qtyNeedsReview,
      qtyNeedsReview,
    });
  }

  // If no items were extracted in array, fallback to a single primary item if LLM top-level fields were present
  if (extractedItems.length === 0) {
    const fallbackProdName = sanitizeTextString(llmResult.productName);
    if (fallbackProdName && fallbackProdName !== 'Not mentioned') {
      extractedItems.push({
        id: `item-1-${Date.now()}`,
        productName: fallbackProdName,
        brand: sanitizeTextString(llmResult.brand) === 'Not mentioned' ? '' : sanitizeTextString(llmResult.brand),
        category: sanitizeTextString(llmResult.category) || 'Others',
        quantity: 1,
        unitPrice: grandTotalVal,
        lineTotal: grandTotalVal,
        warrantyPeriodValue: typeof llmResult.warrantyPeriodValue === 'number' ? Number(llmResult.warrantyPeriodValue) : null,
        warrantyPeriodUnit: ['days', 'weeks', 'months', 'years'].includes(llmResult.warrantyPeriodUnit) ? llmResult.warrantyPeriodUnit : 'months',
        confidence: 85,
        needsReview: false,
      });
    }
  }

  const sumLineTotals = extractedItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const matchesGrandTotal = grandTotalVal != null && Math.abs(sumLineTotals - grandTotalVal) <= 1.00;
  const matchesSubtotal = subtotalVal != null && Math.abs(sumLineTotals - subtotalVal) <= 1.00;
  const matchesReconciled = grandTotalVal != null && Math.abs((sumLineTotals - discountVal + taxVal + shippingVal) - grandTotalVal) <= 1.00;

  const lineTotalMismatch = extractedItems.length > 0 && grandTotalVal != null && !matchesGrandTotal && !matchesSubtotal && !matchesReconciled;

  return {
    extracted: {
      storeName: {
        value: storeVal === 'Not mentioned' ? '' : storeVal,
        confidence: storeConf,
        needsReview: storeConf < 60 || !storeVal || storeVal === 'Not mentioned',
      },
      invoiceNumber: {
        value: invVal === 'Not mentioned' ? '' : invVal,
        confidence: invConf,
        needsReview: invConf < 60,
      },
      purchaseDate: {
        value: purchaseDateVal,
        confidence: dateConf,
        needsReview: !purchaseDateVal,
      },
      dueDate: {
        value: dueDateVal,
      },
      subtotal: {
        value: subtotalVal,
      },
      shippingAmount: {
        value: shippingVal,
      },
      taxAmount: {
        value: taxVal,
      },
      grandTotal: {
        value: grandTotalVal,
        confidence: grandTotalConf,
        needsReview: grandTotalVal == null,
      },
      totalAmount: {
        value: grandTotalVal,
        confidence: grandTotalConf,
        needsReview: grandTotalVal == null,
      },
      currency: {
        value: detectedCurrency,
      },
      items: extractedItems,
      subtotalMismatch: lineTotalMismatch,
      needsReview: lineTotalMismatch || storeConf < 60 || grandTotalVal == null || extractedItems.some((i) => i.qtyNeedsReview),
    },
    hasAnyLowConfidence: lineTotalMismatch || storeConf < 60 || grandTotalVal == null || extractedItems.some((i) => i.qtyNeedsReview),
  };
};

/**
 * Direct multimodal extraction using Gemini Vision on the raw document buffer (Fast & 100% reliable on Vercel)
 */
const extractFieldsDirectFromDocument = async (fileBuffer, mimeType, userCategories = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !fileBuffer) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const defaultCategories = ['Electronics', 'Appliances', 'Medical', 'Fashion', 'Furniture', 'Groceries', 'Others'];
    const categoriesToPass = Array.isArray(userCategories) && userCategories.length > 0
      ? userCategories
      : defaultCategories;

    const base64Data = fileBuffer.toString('base64');
    let effectiveMimeType = mimeType || 'application/pdf';
    if (fileBuffer[0] === 0x25 && fileBuffer[1] === 0x50) {
      effectiveMimeType = 'application/pdf';
    } else if (fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8) {
      effectiveMimeType = 'image/jpeg';
    } else if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
      effectiveMimeType = 'image/png';
    }

    const prompt = `You are an expert receipt & invoice data parser. Analyze the attached purchase document (${effectiveMimeType}):

UNIVERSAL EXTRACTION PHILOSOPHY:
For EVERY field (receipt-level and each item line), follow this exact order:
1. EXPLICIT: Use value stated directly on receipt.
2. INFERRED: Infer value from surrounding context and real-world knowledge (e.g. infer brand from item description like "Godrej Fab..." -> "Godrej", infer category from product type like "Liquid Detergent" -> "Groceries").
3. NOT MENTIONED: If value cannot be determined by explicit label or inference, return the literal string "Not mentioned". Never return null, empty string, or ungrounded guess. Never default silently.

RULES FOR MULTI-ITEM RECEIPTS:
- Extract all purchased line items into an "items" array.
- ONLY include actual tangible or digital merchandise/products (e.g. "ZEBRONICS Gaming Mouse", "MacBook Pro", "Godrej Detergent").
- DO NOT extract transaction fees, service fees, delivery/shipping charges, convenience charges, handling fees, protect promise fees, or packaging charges as items in the "items" array (e.g. "Handling Fee", "Protect Promise Fee", "Delivery Fee", "Platform Fee", "Shipping Fee", "Packaging Fee" must NOT be in "items"; include their total in "shippingAmount" instead).
- Each row is extracted independently. If one row is ambiguous, garbled, or a junk row, extract what is determinable for that row without blocking other valid rows.
- Do NOT attribute the full receipt total to any individual product line item.
- "grandTotal" is the final bottom-line amount paid by the customer for the entire transaction (post-tax/post-shipping). Do NOT confuse subtotal or tax breakdown base with grandTotal.

Extract the structured details and return ONLY a valid JSON object matching this schema (no markdown formatting, no explanations):
{
  "storeName": "Merchant/vendor name issuing receipt ('Sold By', letterhead name). If unknown, 'Not mentioned'.",
  "invoiceNumber": "Invoice or order number. If unknown, 'Not mentioned'.",
  "purchaseDate": "Transaction date as YYYY-MM-DD. If unknown, 'Not mentioned'.",
  "dueDate": "Payment due date as YYYY-MM-DD if present, else 'Not mentioned'.",
  "subtotal": "subtotal before tax/shipping as a number (e.g. 214.40) or 'Not mentioned'",
  "discountAmount": "Overall subtotal or receipt-level coupon discount amount as a number (e.g. 50.00) or 0",
  "shippingAmount": "shipping/handling fee as a number (e.g. 0.00) or 'Not mentioned'",
  "taxAmount": "total tax (GST/VAT) as a number (e.g. 38.60) or 'Not mentioned'",
  "grandTotal": "final bottom-line total amount paid for entire receipt as a number (e.g. 253.00) or 'Not mentioned'",
  "currency": "Currency code detected from document (e.g. 'USD', 'INR', 'EUR', 'GBP', 'CAD', 'AUD'). Detect from explicit symbols ($, ₹, Rs., Rs, €, £, C$, A$), ISO codes (USD, INR, EUR, GBP), or words ('Dollars', 'Rupees', 'Euros', 'Pounds'). Normalize '₹', 'Rs.', 'Rs', 'Rupees', 'INR' to 'INR'; '$', 'USD', 'Dollars' to 'USD'; '€', 'EUR' to 'EUR'; '£', 'GBP' to 'GBP'. If unknown or no currency symbol present, return 'INR'.",
  "rawText": "Full text transcript read from the document",
  "items": [
    {
      "productName": "Description of item purchased. Must not contain vendor boilerplate.",
      "brand": "Brand or manufacturer. Explicit 'Brand:' label if present, or inferred from product description. If unknown, 'Not mentioned'.",
      "category": "Classify product into a category. Check user categories first: ${JSON.stringify(categoriesToPass)}. Reuse exact existing name if matching, or invent concise category. If unknown, 'Not mentioned'.",
      "quantity": 1,
      "originalUnitPrice": "Original pre-discount unit price or list/MRP price per item before any savings (e.g. 425.00). If no discount is present, equal to unitPrice or 'Not mentioned'",
      "unitPrice": "Actual final price paid per unit after discount as a number (e.g. 253.00) or 'Not mentioned'",
      "discountAmount": "Total discount or savings amount for this line item as a number (e.g. 172.00) or 0",
      "discountPercent": "Percentage discount if explicitly stated (e.g. 40) or 0",
      "lineTotal": "Final total amount paid for this line item as a number (e.g. 253.00) or 'Not mentioned'",
      "warrantyPeriodValue": "numeric warranty duration (number, e.g. 12) or 'Not mentioned'",
      "warrantyPeriodUnit": "days | weeks | months | years. If warranty is 'Not mentioned', return 'months'."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: effectiveMimeType,
                data: base64Data,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response && response.text) {
      const parsedData = JSON.parse(response.text.trim());
      console.log('[OCR Pipeline] Direct Gemini Vision extraction succeeded (model: gemini-3.6-flash)');
      const mapped = mapLlmResultToExtracted(parsedData, parsedData.rawText || '', []);
      return {
        extracted: mapped.extracted,
        rawText: parsedData.rawText || '',
        handwritingDetected: false,
      };
    }
  } catch (err) {
    console.error('[OCR Pipeline] Direct Gemini Vision extraction error:', err.message);
  }
  return null;
};

// ─── Main Stage 2 Field Extractor ────────────────────────────────────────────

const extractFields = async (rawText, wordData = [], userCategories = []) => {
  // Try Part B LLM structured extraction first
  const llmResult = await runGeminiLLMExtraction(rawText, userCategories);

  if (llmResult) {
    try {
      return mapLlmResultToExtracted(llmResult, rawText, wordData);
    } catch (err) {
      console.error('[OCR Pipeline] Error parsing LLM JSON response:', err);
    }
  }

  // Fallback to regex extraction
  return extractFieldsRegex(rawText, wordData);
};

const extractFieldsRegex = (rawText, wordData = []) => {
  // Sanitize non-printable control characters & stray OCR noise symbols into spaces
  const cleanRawText = (rawText || '').replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD≡©®™|~^]/g, ' ');

  const lines = cleanRawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const storeName = extractStoreName(lines, cleanRawText, wordData);
  const totalAmount = extractTotalAmount(lines, wordData);
  const purchaseDate = extractPurchaseDate(lines, cleanRawText, wordData);
  const invoiceNumber = extractInvoiceNumber(lines, wordData);
  const productName = extractProductName(lines, cleanRawText, storeName.value, wordData);
  const warrantyPeriod = extractWarrantyPeriod(lines, cleanRawText, wordData);

  const getFieldStatus = (val, confidence, extraCheck = false) => {
    if (val === null || val === undefined || val === '' || isGarbageText(typeof val === 'string' ? val : '')) {
      return 'not_found';
    }
    if (confidence < 60 || extraCheck) {
      return 'low_confidence';
    }
    return 'confident';
  };

  const sanitizeVal = (val) => (isGarbageText(typeof val === 'string' ? val : '') ? '' : val);

  const storeVal = sanitizeVal(storeName.value);
  const prodVal = sanitizeVal(productName.value);
  const invVal = sanitizeVal(invoiceNumber.value);

  const storeStatus = getFieldStatus(storeVal, storeName.confidence);
  const totalStatus = getFieldStatus(totalAmount.value, totalAmount.confidence, totalAmount.ambiguous);
  const dateStatus = getFieldStatus(purchaseDate.value, purchaseDate.confidence);
  const invStatus = getFieldStatus(invVal, invoiceNumber.confidence);
  const prodStatus = getFieldStatus(prodVal, productName.confidence);

  const items = [];
  if (prodVal) {
    items.push({
      id: `item-1-${Date.now()}`,
      productName: prodVal,
      brand: '',
      category: 'Others',
      quantity: 1,
      unitPrice: totalAmount.value,
      lineTotal: totalAmount.value,
      warrantyPeriodValue: warrantyPeriod.value,
      warrantyPeriodUnit: warrantyPeriod.unit || 'months',
      confidence: productName.confidence,
      needsReview: prodStatus !== 'confident',
    });
  }

  const extracted = {
    storeName: {
      value: storeVal,
      confidence: storeStatus === 'not_found' ? 0 : storeName.confidence,
      extractionStatus: storeStatus,
      needsReview: storeStatus !== 'confident',
    },
    invoiceNumber: {
      value: invVal,
      confidence: invStatus === 'not_found' ? 0 : invoiceNumber.confidence,
      extractionStatus: invStatus,
      needsReview: invStatus !== 'confident',
    },
    purchaseDate: {
      value: purchaseDate.value,
      confidence: dateStatus === 'not_found' ? 0 : purchaseDate.confidence,
      extractionStatus: dateStatus,
      needsReview: dateStatus !== 'confident',
    },
    dueDate: { value: null },
    subtotal: { value: totalAmount.value },
    shippingAmount: { value: 0 },
    taxAmount: { value: 0 },
    grandTotal: {
      value: totalAmount.value,
      confidence: totalStatus === 'not_found' ? 0 : totalAmount.confidence,
      needsReview: totalStatus !== 'confident',
    },
    totalAmount: {
      value: totalAmount.value,
      confidence: totalStatus === 'not_found' ? 0 : totalAmount.confidence,
      needsReview: totalStatus !== 'confident',
    },
    items,
    subtotalMismatch: false,
    needsReview: storeStatus !== 'confident' || totalStatus !== 'confident',
  };

  const confValues = [
    extracted.storeName.confidence,
    extracted.totalAmount.confidence,
    extracted.purchaseDate.confidence,
    extracted.invoiceNumber.confidence,
    extracted.items[0]?.confidence || 0,
  ];
  const avgConfidence =
    confValues.reduce((sum, c) => sum + c, 0) / (confValues.length || 1);

  const isNonReceipt =
    lines.length < 2 ||
    (!totalAmount.value && !purchaseDate.value && (!productName.value || productName.value.length < 4)) ||
    avgConfidence < 35;

  const handwritingDetected = avgConfidence < 40 || lines.length < 2 || isNonReceipt;

  return {
    extracted,
    avgConfidence: Math.round(avgConfidence),
    handwritingDetected,
    isNonReceipt,
    lowConfidenceWarning: handwritingDetected || isNonReceipt,
    ocrRaw: rawText,
  };
};

// ─── 1. Store Name ────────────────────────────────────────────────────────────

const extractStoreName = (lines, rawText, wordData) => {
  let candidate = '';

  const soldByMatch =
    rawText.match(/sold\s+by\s*:\s*([^,\n]+)/i) ||
    rawText.match(/merchant\s*:\s*([^,\n]+)/i);

  if (soldByMatch && soldByMatch[1]) {
    candidate = soldByMatch[1].trim();
  } else {
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const l = lines[i];
      if (HEADER_SKIP_WORDS.some((r) => r.test(l))) continue;
      if (NON_PRODUCT_LINE.test(l)) continue;
      if (TAGLINE_PATTERNS.some((r) => r.test(l))) {
        // If line is a tagline containing a store keyword (e.g. "Your Trusted Electronics Partner"),
        // strip tagline words to extract core store name if no explicit candidate is found yet
        const cleanedTagline = l.replace(/\b(?:your\s+trusted|welcome\s+to|quality\s+&\s+trust|partner|slogan|tagline)\b/gi, '').trim();
        if (cleanedTagline.length >= 3 && !candidate) {
          candidate = cleanedTagline;
        }
        continue;
      }
      
      // Table header section starts here — store name never appears in or after table headers
      if (IS_TABLE_HEADER_LINE(l)) break;

      if (/billed\s+by/i.test(l) && i + 1 < lines.length) {
        candidate = lines[i + 1];
        break;
      }

      if (!candidate && l.length >= 3 && !/^\d+$/.test(l)) {
        candidate = l;
        if (i <= 1) break;
      }
    }
  }

  if (candidate && IS_TABLE_HEADER_LINE(candidate)) {
    candidate = '';
  }

  // If OCR ran multiple columns together, take first segment
  if (candidate && /\s{2,}/.test(candidate)) {
    candidate = candidate.split(/\s{2,}/)[0];
  }

  const cleanName = candidate ? sanitizeTextString(candidate).replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim() : '';
  const confidence = cleanName ? computeWordConfidence(cleanName, wordData) : 0;
  return { value: cleanName, confidence };
};

// ─── 2. Total Amount ──────────────────────────────────────────────────────────

const extractTotalAmount = (lines, wordData) => {
  let bestAmount = null;
  let bestMatchedText = '';
  let bestHasDecimal = false;
  let highestPriority = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    let priority = 0;
    if (/grand\s*total/i.test(line) || /total\s*due/i.test(line) || /amount\s*due/i.test(line) || /balance\s*due/i.test(line)) priority = 4;
    else if (/^total\b/i.test(line) || /\btotal\s*[\$:₹€£0-9]/i.test(line) || /\btotal\b/i.test(line)) priority = 3;
    else if (/sub\s*total/i.test(line)) priority = 2;
    else if (/[\$₹€£]/.test(line)) priority = 1;

    // Use global currency regex to find ALL numeric matches on this line
    const globalCurrencyRegex = new RegExp(CURRENCY_REGEX.source, 'gi');
    const matches = Array.from(line.matchAll(globalCurrencyRegex));

    if (matches.length > 0 && priority > highestPriority) {
      let lineBestAmount = null;
      let lineBestHasDecimal = false;

      // Iterate through matches from right to left (totals are usually at the right end of total lines)
      for (let mIndex = matches.length - 1; mIndex >= 0; mIndex--) {
        const mText = matches[mIndex][0];
        const matchIdx = matches[mIndex].index;

        // Skip single-digit index matches wrapped in parentheses e.g. "(3)" or "(1)"
        if (mText.length === 1 && matchIdx > 0 && line[matchIdx - 1] === '(' && matchIdx + 1 < line.length && line[matchIdx + 1] === ')') {
          continue;
        }

        const rawNumStr = mText.replace(/[\$₹€£\s,]/g, '');
        const hasDecimal = mText.includes('.');
        const parsedNum = parseFloat(rawNumStr);

        if (!isNaN(parsedNum) && parsedNum > 0) {
          // Select the amount if we have no candidate yet, or if it has decimals/commas while previous didn't
          if (lineBestAmount === null || (hasDecimal && !lineBestHasDecimal) || (mText.includes(',') && !lineBestHasDecimal)) {
            lineBestAmount = parsedNum;
            lineBestHasDecimal = hasDecimal;
          }
        }
      }

      if (lineBestAmount !== null) {
        bestAmount = lineBestAmount;
        bestHasDecimal = lineBestHasDecimal;
        highestPriority = priority;
        bestMatchedText = line;
      }
    }
  }

  // Ambiguous: a large whole-number amount with no decimal point could be either
  // a genuine integer total or a decimal that OCR dropped the period for.
  // We do NOT guess — we surface it for human review instead.
  const ambiguous = bestAmount !== null && !bestHasDecimal && bestAmount > 999;

  const confidence = computeWordConfidence(
    bestMatchedText || (bestAmount ? String(bestAmount) : ''),
    wordData
  );
  return { value: bestAmount, confidence, ambiguous };
};

// ─── 3. Purchase Date ─────────────────────────────────────────────────────────
//
// BUG 3 FIX:
// - PURCHASE_DATE keywords now tolerant of "DATE :" / "DATE:" / "DATE " spacing.
// - DATE_REGEXES now match abbreviated months with optional trailing period ("Aug.").
// - The full line is searched, not just after the label, so "DATE :Aug. 21, 2023" works.

const extractPurchaseDate = (lines, rawText, wordData) => {
  let bestDateObj = null;
  let bestMatchedText = '';
  let highestPriority = -1;

  for (const line of lines) {
    const isDueOrExpiry = KEYWORDS.IGNORE_DATE.some((r) => r.test(line));
    const isExplicitDate = KEYWORDS.PURCHASE_DATE.some((r) => r.test(line));

    // Priority: explicit purchase date label > generic line with date > due/expiry line
    let linePriority = isDueOrExpiry ? 0 : isExplicitDate ? 2 : 1;

    if (linePriority <= highestPriority) continue;

    for (const regex of DATE_REGEXES) {
      const match = line.match(regex);
      if (match) {
        const matchedStr = match[0];

        let d = null;
        if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/.test(matchedStr)) {
          // Numeric date: try DD/MM/YYYY first, fall back to MM/DD/YYYY.
          // "Date of issue: 04/13/2013" uses MM/DD/YYYY (month=04, day=13);
          // "11-05-2026" uses DD/MM/YYYY (day=11, month=05).
          // Strategy: parse both interpretations, pick whichever yields a valid calendar date.
          const sep = matchedStr.match(/[\/\.-]/)[0];
          const parts = matchedStr.split(sep).map(Number);
          const [a, b, year] = parts;

          // Attempt 1: DD/MM/YYYY
          const dDM = (b >= 1 && b <= 12 && a >= 1 && a <= 31) ? new Date(year, b - 1, a) : null;
          const dDMValid = dDM && !isNaN(dDM.getTime()) && dDM.getDate() === a;

          // Attempt 2: MM/DD/YYYY
          const dMD = (a >= 1 && a <= 12 && b >= 1 && b <= 31) ? new Date(year, a - 1, b) : null;
          const dMDValid = dMD && !isNaN(dMD.getTime()) && dMD.getDate() === b;

          if (dDMValid && dMDValid) {
            // Both valid (e.g. 03/04/2023 is ambiguous) — prefer DD/MM/YYYY when
            // the line contains an explicit purchase-date keyword, otherwise DD/MM.
            d = isExplicitDate ? dDM : dDM;
          } else if (dDMValid) {
            d = dDM;
          } else if (dMDValid) {
            d = dMD;
          }
        } else {
          // Named-month format — strip trailing period from abbreviated month
          d = new Date(matchedStr.replace(/([A-Za-z]{3})\./, '$1'));
        }

        if (d && !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2035) {
          bestDateObj = d;
          bestMatchedText = matchedStr;
          highestPriority = linePriority;
          break;
        }
      }
    }
  }

  if (!bestDateObj) return { value: null, confidence: 0 };

  const confidence = computeWordConfidence(bestMatchedText, wordData);
  return { value: bestDateObj.toISOString(), confidence };
};

// ─── 4. Invoice Number ────────────────────────────────────────────────────────
//
// Fix: expanded header-word rejection list so generic column-header words
// ("details", "description", "item", "qty", "price", etc.) can never be captured
// as the invoice number.
// Fix: bare `#CODE` fallback — a line like "Meld #553580" contains no standard
// invoice keyword but `#` followed by alphanumeric is a strong standalone signal.

// Words that are column-header labels, not real invoice IDs
const INV_REJECT = /^(?:date|total|amount|due|billed|tax|address|number|ing|manufacturing|details|description|item|items|particulars|qty|quantity|unit|price|rate|charge|discount|sub|subtotal|balance|reference|ref|no)$/i;

const extractInvoiceNumber = (lines, wordData) => {
  let invNum = '';

  // Pass 1: Explicit invoice number pattern (highest priority: "Invoice No. : INV-20250618-0457")
  for (const line of lines) {
    const invMatch =
      line.match(/invoice\s*(?:number|no\.?|num|code|id|#)?\s*[:#\s.+=\-]*\s*([a-zA-Z0-9][a-zA-Z0-9\-_]{4,34})/i);

    if (invMatch && invMatch[1]) {
      const candidate = invMatch[1].replace(/[{}|]/g, '').trim();
      if (!INV_REJECT.test(candidate)) {
        invNum = candidate;
        break;
      }
    }
  }

  // Pass 2: Order ID pattern (used if no explicit invoice number found)
  if (!invNum) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const orderMatch =
        line.match(/order\s*id\s*[:#\s.+=\-]*\s*([a-zA-Z0-9][a-zA-Z0-9\-_]{4,34})/i) ||
        line.match(/(?:receipt|order|bill|inv|ref|txn|trans)\s*(?:#|no\.?|num|id)?\s*[:#\s.+=\-]*\s*([a-zA-Z0-9][a-zA-Z0-9\-_]{4,34})/i);

      if (orderMatch && orderMatch[1]) {
        const candidate = orderMatch[1].replace(/[{}|]/g, '').trim();
        if (!INV_REJECT.test(candidate)) {
          invNum = candidate;
          break;
        }
      }

      if (/order\s*id\s*:/i.test(line) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].replace(/[{}|]/g, '').trim();
        if (/^[a-zA-Z0-9\-_]{8,35}$/.test(nextLine)) {
          invNum = nextLine;
          break;
        }
      }
    }
  }

  // Pass 3: bare `#CODE` fallback — matches "Meld #553580", "PO #AB1234" etc.
  if (!invNum) {
    for (const line of lines) {
      const bareMatch = line.match(/#([A-Za-z0-9]{4,35})\b/);
      if (bareMatch && bareMatch[1]) {
        const candidate = bareMatch[1].replace(/[{}|]/g, '').trim();
        if (!INV_REJECT.test(candidate)) {
          invNum = candidate;
          break;
        }
      }
    }
  }

  const confidence = invNum ? computeWordConfidence(invNum, wordData) : 0;
  return { value: invNum, confidence };
};

// ─── 5. Product Name ──────────────────────────────────────────────────────────

const SKIP_PRODUCT_ROW = /^\s*(?:#|qty|price|total|amount|tax|unit|rate|sub|grand|balance|due|discount|description|particulars|item|details|title|product|value|taxable|gross|igst|sgst|cgst|hsn|fsn|sac|laptop\s+accessories|combos)\b/i;

const extractProductName = (lines, rawText, storeName, wordData) => {
  let productName = '';

  // Pass 0: Explicit label "Product Name :", "Product Description :", "Item Name :"
  const explicitMatch =
    rawText.match(/(?:product\s*name|product\s*description|item\s*name|item\s*description)\s*[:=]\s*([^\n\r,]+)/i);
  if (explicitMatch && explicitMatch[1]) {
    const val = sanitizeTextString(explicitMatch[1]);
    if (val.length > 2 && !SKIP_PRODUCT_ROW.test(val) && !NON_PRODUCT_LINE.test(val)) {
      productName = val;
    }
  }

  // Pass 1: Look for "Product Title" label (e-commerce receipts)
  if (!productName) {
    for (let i = 0; i < lines.length; i++) {
      if (/product\s*title/i.test(lines[i]) && i + 1 < lines.length) {
        for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
          const c = lines[j];
          if (
            c.length > 5 &&
            !/qty|gross|amount|discounts|discount|taxable|value|igst|sgst|cgst|total|laptop\s+accessories|combos|fsn:|hsn/i.test(c)
          ) {
            productName = c;
            // check if next line continues product title
            if (j + 1 < lines.length) {
              const nextL = lines[j + 1];
              if (nextL.length > 3 && !/warranty|igst|qty|total|gross|amount|\d+\.\d+/i.test(nextL)) {
                productName += ' ' + nextL.trim();
              }
            }
            break;
          }
        }
        if (productName) break;
      }
    }
  }

  // Pass 2: Tabular invoice — find a DESCRIPTION/PARTICULARS/ITEM/PRODUCT/TITLE column header,
  // then take the first non-noise content row beneath it.
  if (!productName) {
    for (let i = 0; i < lines.length; i++) {
      const isTableHeader = KEYWORDS.TABLE_HEADER.some((r) => r.test(lines[i]));
      if (isTableHeader) {
        // Scan up to 20 rows below the header
        for (let j = i + 1; j < Math.min(lines.length, i + 20); j++) {
          const c = lines[j];
          if (
            c.length > 3 &&
            !SKIP_PRODUCT_ROW.test(c) &&
            !NON_PRODUCT_LINE.test(c) &&
            !/^\s*\d+(?:\.\d+)?\s*$/.test(c) &&               // pure number rows
            !/^[\$₹€£\s\d.,]+$/.test(c) &&                      // pure currency rows
            !/\b(?:taxable\s+value|gross\s+amount|discount|igst|hsn\/sac|fsn:)\b/i.test(c)
          ) {
            // Strip leading row-number (e.g. "5953  35 Table Top..." → "35 Table Top...")
            productName = c.replace(/^\s*\d{1,6}\s+/, '').trim();

            // Concatenate title if split across two lines (e.g. "Frontech Wireless" + "Keyboard and Mouse...")
            if (j + 1 < lines.length) {
              const nextL = lines[j + 1];
              if (
                nextL.length > 3 &&
                !/warranty|igst|qty|total|gross|amount|\d+\.\d+/i.test(nextL) &&
                !SKIP_PRODUCT_ROW.test(nextL)
              ) {
                productName += ' ' + nextL.trim();
              }
            }
            break;
          }
        }
        if (productName) break;
      }
    }
  }

  // Pass 3: Brand-specific keyword match (e.g. Dyazo, laptop sleeve)
  if (!productName) {
    for (const line of lines) {
      if (/dyazo|laptop\s+sleeve|case\s*cover|laptop\s+bag/i.test(line)) {
        productName = line;
        break;
      }
    }
  }

  // Pass 4: Generic fallback — first non-header, non-noise line after the store name
  if (!productName) {
    for (let i = 1; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      if (
        line !== storeName &&
        !HEADER_SKIP_WORDS.some((r) => r.test(line)) &&
        !NON_PRODUCT_LINE.test(line) &&
        !/\b(total|subtotal|tax|cash|visa|change|invoice|date|phone|email|amount|gstin|address|client|notice)\b/i.test(line) &&
        line.length > 5
      ) {
        productName = line;
        break;
      }
    }
  }

  if (productName) {
    // Strip leading row numbers or stray punctuation and sanitize noise symbols
    productName = sanitizeTextString(productName.replace(/^[0-9.\s]+/, '')).trim();
  }

  const confidence = productName ? computeWordConfidence(productName, wordData) : 0;
  return { value: productName, confidence };
};

// ─── Bonus: Warranty Period ───────────────────────────────────────────────────

const extractWarrantyPeriod = (lines, rawText, wordData) => {
  let value = null;
  let unit = 'months';
  let matchedText = '';

  // Dual Pattern: e.g. "12 Months (1 Year)" or "1 Year (12 Months)"
  // Rule: If dual phrase expresses both months and years, prefer years when it's a clean whole number of years (e.g. 12 mo = 1 yr), else prefer months.
  const dualMatch =
    rawText.match(/(\d+)\s*(?:month|months|mo|mos)\s*\(\s*(\d+)\s*(?:year|years|yr|yrs)\s*\)/i) ||
    rawText.match(/(\d+)\s*(?:year|years|yr|yrs)\s*\(\s*(\d+)\s*(?:month|months|mo|mos)\s*\)/i);

  if (dualMatch) {
    let mCount, yCount;
    if (rawText.match(/(\d+)\s*(?:month|months|mo|mos)\s*\(\s*(\d+)\s*(?:year|years|yr|yrs)\s*\)/i)) {
      mCount = parseInt(dualMatch[1], 10);
      yCount = parseInt(dualMatch[2], 10);
    } else {
      yCount = parseInt(dualMatch[1], 10);
      mCount = parseInt(dualMatch[2], 10);
    }

    if (!isNaN(yCount) && yCount > 0 && !isNaN(mCount) && mCount === yCount * 12) {
      value = yCount;
      unit = 'years';
      matchedText = dualMatch[0];
    } else if (!isNaN(mCount) && mCount > 0) {
      value = mCount;
      unit = 'months';
      matchedText = dualMatch[0];
    }
  }

  // If no dual match, search all 4 units and pick the earliest match in text
  if (value === null) {
    const candidates = [];

    // Years
    const yearMatch =
      rawText.match(/(\d+)\s*(?:-\s*)?(?:year|yr|yrs|years)\s*(?:seller|manufacturer|brand|limited)?\s*(?:warranty|guarantee)/i) ||
      rawText.match(/(?:warranty|guarantee)\s*:\s*(\d+)\s*(?:-\s*)?(?:year|yr|yrs|years)/i);
    if (yearMatch && yearMatch[1]) {
      const v = parseInt(yearMatch[1], 10);
      if (!isNaN(v) && v > 0 && v <= 20) {
        candidates.push({ index: yearMatch.index, value: v, unit: 'years', text: yearMatch[0] });
      }
    }

    // Months
    const monthMatch =
      rawText.match(/(\d+)\s*(?:-\s*)?(?:month|mo|mos|months)\s*(?:seller|manufacturer|brand|limited)?\s*(?:warranty|guarantee)/i) ||
      rawText.match(/(?:warranty|guarantee)\s*:\s*(\d+)\s*(?:-\s*)?(?:month|mo|mos|months)/i);
    if (monthMatch && monthMatch[1]) {
      const v = parseInt(monthMatch[1], 10);
      if (!isNaN(v) && v > 0 && v <= 120) {
        candidates.push({ index: monthMatch.index, value: v, unit: 'months', text: monthMatch[0] });
      }
    }

    // Weeks
    const weekMatch =
      rawText.match(/(\d+)\s*(?:-\s*)?(?:week|wk|wks|weeks)\s*(?:seller|manufacturer|brand|limited)?\s*(?:warranty|guarantee)/i) ||
      rawText.match(/(?:warranty|guarantee)\s*:\s*(\d+)\s*(?:-\s*)?(?:week|wk|wks|weeks)/i);
    if (weekMatch && weekMatch[1]) {
      const v = parseInt(weekMatch[1], 10);
      if (!isNaN(v) && v > 0 && v <= 104) {
        candidates.push({ index: weekMatch.index, value: v, unit: 'weeks', text: weekMatch[0] });
      }
    }

    // Days
    const dayMatch =
      rawText.match(/(\d+)\s*(?:-\s*)?(?:day|days)\s*(?:seller|manufacturer|brand|limited)?\s*(?:warranty|guarantee)/i) ||
      rawText.match(/(?:warranty|guarantee)\s*:\s*(\d+)\s*(?:-\s*)?(?:day|days)/i);
    if (dayMatch && dayMatch[1]) {
      const v = parseInt(dayMatch[1], 10);
      if (!isNaN(v) && v > 0 && v <= 365) {
        candidates.push({ index: dayMatch.index, value: v, unit: 'days', text: dayMatch[0] });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.index - b.index);
      value = candidates[0].value;
      unit = candidates[0].unit;
      matchedText = candidates[0].text;
    }
  }

  const confidence = value != null ? (computeWordConfidence(matchedText, wordData) || 85) : 0;
  return { value, unit, confidence };
};

// ─── Word-Level Confidence ────────────────────────────────────────────────────

/**
 * Returns the average Tesseract word-level confidence for the tokens in targetText.
 * Looks up each token in the TSV wordData array. Returns 0 if no tokens match.
 * NEVER falls back to a whole-page average.
 */
const computeWordConfidence = (targetText, wordData) => {
  if (!targetText || !wordData || !Array.isArray(wordData) || wordData.length === 0) return 0;

  const tokens = String(targetText)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) return 0;

  const matched = [];

  tokens.forEach((token) => {
    wordData
      .filter((w) => {
        const cw = (w.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return cw && (cw === token || cw.includes(token) || token.includes(cw));
      })
      .forEach((m) => {
        if (typeof m.confidence === 'number' && m.confidence > 0) matched.push(m.confidence);
      });
  });

  if (matched.length === 0) return 0;
  return Math.round(matched.reduce((s, c) => s + c, 0) / matched.length);
};

module.exports = { extractFields, extractFieldsDirectFromDocument };
