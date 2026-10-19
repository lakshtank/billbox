const { GoogleGenAI } = require('@google/genai');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');
const User = require('../models/User.model');

/**
 * Executes a Gemini request with automatic fallback across fast Flash models
 */
const callGeminiWithFallback = async (ai, prompt, systemInstruction = '') => {
  const customModel = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : [];
  const candidateModels = Array.from(
    new Set([
      ...customModel,
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-flash-latest',
    ])
  );

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: 0.2, // Lower temperature for high factual precision
          maxOutputTokens: 2500,
        },
      });

      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err) {
      console.warn(`[AskBillBox] Model '${model}' attempt failed:`, err.message);
    }
  }
  throw new Error('All Gemini AI model attempts failed. Please verify your GEMINI_API_KEY.');
};

/**
 * Service to process natural language queries against user's personal vault data
 * Grounded with pre-computed facts, complete warranty rosters, and comprehensive app knowledge.
 */
const askBillBoxService = async (userId, userMessage, conversationHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });

  // 1. Fetch user profile, receipts, and products
  const [user, receipts, products] = await Promise.all([
    User.findById(userId).select('name defaultCurrency timezone email').lean(),
    Receipt.find({ userId })
      .select('_id storeName purchaseDate totalAmount currency category invoiceNumber status warrantyStatus warrantyExpiryDate items createdAt')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .limit(200)
      .lean(),
    Product.find({ userId })
      .select('_id productName brand category unitPrice quantity lineTotal purchaseDate warrantyPeriodValue warrantyPeriodUnit warrantyExpiryDate warrantyStatus receiptId createdAt')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .limit(300)
      .lean(),
  ]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nowMs = today.getTime();

  // Create store lookup map for receipt details
  const receiptMap = new Map();
  receipts.forEach((r) => {
    receiptMap.set(r._id.toString(), r);
  });

  // 2. Pre-process and categorize ALL warranties
  const allWarranties = [];
  const productsWithoutWarranty = [];

  products.forEach((p) => {
    const parentReceipt = p.receiptId ? receiptMap.get(p.receiptId.toString()) : null;
    const store = parentReceipt?.storeName || 'Unknown Merchant';
    const recCurrency = parentReceipt?.currency || 'INR';

    if (p.warrantyExpiryDate) {
      const expDate = new Date(p.warrantyExpiryDate);
      const daysRemaining = Math.ceil((expDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));
      let computedStatus = 'active';
      if (daysRemaining < 0) {
        computedStatus = 'expired';
      } else if (daysRemaining <= 30) {
        computedStatus = 'expiring_soon';
      }

      allWarranties.push({
        id: p._id.toString(),
        name: p.productName,
        brand: p.brand || 'Unspecified',
        category: p.category || 'General',
        price: p.lineTotal ?? p.unitPrice,
        currency: recCurrency,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : 'N/A',
        warrantyExpiry: expDate.toISOString().split('T')[0],
        warrantyPeriod: p.warrantyPeriodValue ? `${p.warrantyPeriodValue} ${p.warrantyPeriodUnit || 'months'}` : 'N/A',
        daysRemaining,
        status: computedStatus,
        receiptId: p.receiptId ? p.receiptId.toString() : null,
        storeName: store,
      });
    } else {
      productsWithoutWarranty.push({
        id: p._id.toString(),
        name: p.productName,
        brand: p.brand || 'Unspecified',
        category: p.category || 'General',
        price: p.lineTotal ?? p.unitPrice,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : 'N/A',
        receiptId: p.receiptId ? p.receiptId.toString() : null,
        storeName: store,
      });
    }
  });

  // Sort warranties so that expiring soonest come FIRST
  allWarranties.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const expiringSoonWarranties = allWarranties.filter((w) => w.status === 'expiring_soon');
  const activeWarranties = allWarranties.filter((w) => w.status === 'active' || w.status === 'expiring_soon');
  const expiredWarranties = allWarranties.filter((w) => w.status === 'expired');

  // 3. Pre-process Receipts: sort by totalAmount descending for expensive queries
  const validReceipts = receipts.filter((r) => r.totalAmount != null && !isNaN(Number(r.totalAmount)));
  const expensiveReceipts = [...validReceipts]
    .sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount))
    .slice(0, 10)
    .map((r, i) => ({
      rank: i + 1,
      id: r._id.toString(),
      storeName: r.storeName || 'Unknown Store',
      totalAmount: r.totalAmount,
      currency: r.currency || user?.defaultCurrency || 'INR',
      purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : 'N/A',
      category: r.category || 'General',
      itemCount: r.items ? r.items.length : 0,
      invoiceNumber: r.invoiceNumber || 'N/A',
    }));

  // Aggregated totals
  const currencyTotals = {};
  const storeCounts = {};
  const categoryTotals = {};

  receipts.forEach((r) => {
    const amt = Number(r.totalAmount) || 0;
    const cur = r.currency || user?.defaultCurrency || 'INR';
    currencyTotals[cur] = Math.round(((currencyTotals[cur] || 0) + amt) * 100) / 100;

    const store = r.storeName || 'Unknown Store';
    storeCounts[store] = (storeCounts[store] || 0) + 1;

    const cat = r.category || 'General';
    categoryTotals[cat] = Math.round(((categoryTotals[cat] || 0) + amt) * 100) / 100;
  });

  const topStores = Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, c]) => `${s} (${c} receipts)`);

  // 4. System Instruction with Ground Truth & Web App Knowledge Base
  const systemInstruction = `You are "Ask BillBox", the official AI copilot and financial vault intelligence advisor for the BillBox web application.

ABOUT THE BILLBOX WEB APPLICATION:
BillBox is an all-in-one digital invoice and warranty management platform designed to help users track expenses, manage product warranties, and never miss an expiration or claim deadline.
Core features and pages:
1. Dashboard / Overview ("/"): High-level view of spending metrics (Total Spend, Receipts logged, Active Warranties, Expiring in 30d) and spending trend charts.
2. Receipts Vault ("/receipts"): Searchable, filterable list of all uploaded receipts by merchant, date, category, status, and amount.
3. New Receipt / Scanner ("/receipts/new"): Smart AI OCR scanner. Users can upload images (JPG, PNG, WEBP) or PDF invoices. The system automatically extracts merchant name, date, invoice number, tax, totals, and itemized products.
4. Batch Processing ("/receipts/batch"): Allows users to drag-and-drop multiple receipts at once for bulk scanning and review.
5. Products Directory ("/products"): Inventory of all products extracted from invoices or added manually.
6. Warranty Tracker ("/warranties"): Dedicated warranty timeline tracking Active, Expiring Soon (within 30 days), and Expired warranties with countdown badges.
7. Stores & Merchants ("/stores"): Directory of all purchase locations with total spend and visit analytics.
8. Reminders Center ("/reminders"): Automated notification center sending alerts 30 days, 15 days, and 7 days before warranties expire.
9. Settings & Profile ("/settings", "/profile"): User preferences (Default currency like INR, USD, EUR; date formats; dark/light theme).
10. Global Shortcuts: ⌘K / Ctrl+K for command palette, ⌘J / Ctrl+J for Ask BillBox, / for search, N for new receipt.

CURRENT USER CONTEXT & PRE-COMPUTED FACTS (GROUND TRUTH):
- Current Date Today: ${todayStr}
- User Name: ${user?.name || 'User'}
- Default Currency: ${user?.defaultCurrency || 'INR'}
- Total Receipts in Vault: ${receipts.length}
- Total Products in Vault: ${products.length}
- Total Warranties Tracked: ${allWarranties.length}
- Active Warranties Count: ${activeWarranties.length}
- Warranties Expiring Within 30 Days Count: ${expiringSoonWarranties.length}
- Expired Warranties Count: ${expiredWarranties.length}
- Top Stores: ${topStores.join(', ') || 'None'}
- Spending By Currency: ${JSON.stringify(currencyTotals)}
- Spending By Category: ${JSON.stringify(categoryTotals)}

PRE-COMPUTED GROUND TRUTH: WARRANTIES EXPIRING WITHIN 30 DAYS:
${expiringSoonWarranties.length > 0 ? JSON.stringify(expiringSoonWarranties, null, 2) : 'NONE (0 items expiring in 30 days)'}

PRE-COMPUTED GROUND TRUTH: TOP MOST EXPENSIVE RECEIPTS:
${JSON.stringify(expensiveReceipts, null, 2)}

PRE-COMPUTED GROUND TRUTH: ALL ACTIVE WARRANTIES (SOONEST EXPIRING FIRST):
${JSON.stringify(allWarranties.slice(0, 25), null, 2)}

CRITICAL RESPONSE RULES:
1. CITATIONS (MANDATORY FORMAT):
   Whenever you mention any receipt from the vault, you MUST format it as:
   [Store Name - Amount](receipt:RECEIPT_ID)
   Whenever you mention any product, you MUST format it as:
   [Product Name](product:PRODUCT_ID)
   Example: "1. [Reliance Digital - ₹18,40,389.10](receipt:6ace09231756978e8a61416e) on 2026-02-25"
   Example: "Your [OnePlus 12 256GB Silky Black](product:6ace07321756978e8a6140fb) bought at [Ram Mobiles - ₹10,76,644.73](receipt:6ace07321756978e8a6140f9) expires in 13 days (2026-11-01)."
2. EXPENSIVE RECEIPTS QUESTIONS:
   When asked for "5 very expensive receipts" or "top purchases", ALWAYS list ALL 5 receipts from the PRE-COMPUTED TOP MOST EXPENSIVE RECEIPTS list completely, numbered 1 to 5:
   Format each item cleanly as:
   1. **[Store Name - Amount](receipt:RECEIPT_ID)** — Purchase Date: YYYY-MM-DD | Category: ... | Invoice: ...
   Always output all 5 receipts completely with their clickable citations.
3. EXPIRING WARRANTIES QUESTIONS:
   When asked which warranties expire in 30 days (or soon), check the PRE-COMPUTED GROUND TRUTH:
   - If items exist (such as OnePlus 12 with 13 days left), provide the product name, days remaining, expiration date, merchant, and citation links.
   - If none exist, clearly say so and state which warranty is the closest to expiring.
4. WEB APP & GUIDANCE QUESTIONS:
   If the user asks about BillBox features, how to do something in the app, or app navigation, answer with authority, friendliness, and exact steps referencing the proper pages and shortcuts.
5. DYNAMIC FOLLOW-UP SUGGESTIONS:
   Always end your response with 2 or 3 relevant next questions formatted strictly as:
   <<<SUGGESTIONS: ["Question 1?", "Question 2?", "Question 3?"]>>>`;

  // Format previous conversation turns
  const formattedHistory = (conversationHistory || []).slice(-6).map((turn) => {
    return `${turn.role === 'user' ? 'User' : 'BillBox'}: ${turn.content}`;
  }).join('\n\n');

  const prompt = `${formattedHistory ? `CONVERSATION HISTORY:\n${formattedHistory}\n\n` : ''}USER QUERY:
"${userMessage}"

Provide a direct, accurate, and structured answer using the pre-computed facts and data above.`;

  const { text } = await callGeminiWithFallback(ai, prompt, systemInstruction);

  // Extract suggestions tag
  let suggestions = [];
  let cleanedReply = text;

  const suggestionsMatch = text.match(/<<<SUGGESTIONS:\s*(\[.*?\])\s*>>>/s);
  if (suggestionsMatch) {
    try {
      suggestions = JSON.parse(suggestionsMatch[1]);
      cleanedReply = text.replace(/<<<SUGGESTIONS:\s*\[.*?\]\s*>>>/s, '').trim();
    } catch (e) {
      cleanedReply = text.replace(/<<<SUGGESTIONS:.*?>>>/gs, '').trim();
    }
  }

  // Fallback suggestions
  if (!suggestions || suggestions.length === 0) {
    if (expiringSoonWarranties.length > 0) {
      suggestions.push('Which warranties expire in 30 days?');
    }
    suggestions.push('What are my top 5 most expensive receipts?');
    suggestions.push('Break down my spending by category');
  }

  // Extract referenced entities for interactive cards
  const receiptIdMatches = Array.from(cleanedReply.matchAll(/\(receipt:([a-f0-9]{24})\)/g)).map((m) => m[1]);
  const productIdMatches = Array.from(cleanedReply.matchAll(/\(product:([a-f0-9]{24})\)/g)).map((m) => m[1]);

  const referencedReceipts = receipts
    .filter((r) => receiptIdMatches.includes(r._id.toString()))
    .map((r) => ({
      id: r._id,
      storeName: r.storeName,
      totalAmount: r.totalAmount,
      currency: r.currency || 'INR',
      purchaseDate: r.purchaseDate,
      category: r.category,
    }));

  const referencedProducts = allWarranties
    .filter((p) => productIdMatches.includes(p.id))
    .map((p) => ({
      id: p.id,
      productName: p.name,
      brand: p.brand,
      price: p.price,
      daysRemaining: p.daysRemaining,
      status: p.status,
    }));

  // Also check products without warranty if cited
  productsWithoutWarranty
    .filter((p) => productIdMatches.includes(p.id) && !referencedProducts.some((rp) => rp.id === p.id))
    .forEach((p) => {
      referencedProducts.push({
        id: p.id,
        productName: p.name,
        brand: p.brand,
        price: p.price,
        daysRemaining: null,
        status: 'none',
      });
    });

  return {
    reply: cleanedReply,
    suggestions,
    references: {
      receipts: referencedReceipts,
      products: referencedProducts,
    },
  };
};

/**
 * Generates initial starter questions based on the user's authentic vault data
 */
const getInitialSuggestions = async (userId) => {
  const now = new Date();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [receiptCount, productCount, expiringCount] = await Promise.all([
    Receipt.countDocuments({ userId }),
    Product.countDocuments({ userId }),
    Product.countDocuments({
      userId,
      warrantyExpiryDate: {
        $gte: now,
        $lte: in30Days,
      },
    }),
  ]);

  const suggestions = [];

  if (expiringCount > 0) {
    suggestions.push('Which warranties expire in 30 days?');
  } else {
    suggestions.push('Which of my items are under active warranty?');
  }

  if (receiptCount > 0) {
    suggestions.push('Show my 5 most expensive receipts');
    suggestions.push('Break down my spending by category');
    suggestions.push('Which store do I spend the most money at?');
  } else {
    suggestions.push('What can I do in BillBox?');
    suggestions.push('How does BillBox track warranties?');
    suggestions.push('What receipt formats can I upload?');
  }

  return suggestions.slice(0, 4);
};

module.exports = {
  askBillBoxService,
  getInitialSuggestions,
};

