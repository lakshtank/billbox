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
          temperature: 0.3, // Lower temperature for high factual accuracy
          maxOutputTokens: 1200,
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
      .select('_id storeName purchaseDate totalAmount currency category invoiceNumber status warrantyStatus warrantyExpiryDate createdAt')
      .sort({ purchaseDate: -1 })
      .limit(100)
      .lean(),
    Product.find({ userId })
      .select('_id productName brand category unitPrice quantity lineTotal purchaseDate warrantyPeriodValue warrantyPeriodUnit warrantyExpiryDate warrantyStatus receiptId createdAt')
      .sort({ purchaseDate: -1 })
      .limit(150)
      .lean(),
  ]);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 2. Precompute aggregated metrics to ground the LLM
  let totalSpentBase = 0;
  const storeCounts = {};
  const categoryTotals = {};
  const currencyTotals = {};

  receipts.forEach((r) => {
    const amt = Number(r.totalAmount) || 0;
    const cur = r.currency || user?.defaultCurrency || 'INR';
    currencyTotals[cur] = (currencyTotals[cur] || 0) + amt;

    const store = r.storeName || 'Unknown Store';
    storeCounts[store] = (storeCounts[store] || 0) + 1;

    const cat = r.category || 'General';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
  });

  // Calculate warranty metrics
  const nowMs = today.getTime();
  const productsWithWarranty = products.map((p) => {
    let daysRemaining = null;
    let computedStatus = p.warrantyStatus || 'none';

    if (p.warrantyExpiryDate) {
      const expDate = new Date(p.warrantyExpiryDate);
      daysRemaining = Math.ceil((expDate.getTime() - nowMs) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        computedStatus = 'expired';
      } else if (daysRemaining <= 30) {
        computedStatus = 'expiring_soon';
      } else {
        computedStatus = 'active';
      }
    }

    return {
      id: p._id.toString(),
      name: p.productName,
      brand: p.brand || 'Unspecified',
      category: p.category,
      price: p.lineTotal ?? p.unitPrice,
      purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : 'Unknown',
      warrantyExpiry: p.warrantyExpiryDate ? new Date(p.warrantyExpiryDate).toISOString().split('T')[0] : 'None',
      warrantyPeriod: p.warrantyPeriodValue ? `${p.warrantyPeriodValue} ${p.warrantyPeriodUnit || 'months'}` : 'None',
      daysRemaining,
      status: computedStatus,
      receiptId: p.receiptId ? p.receiptId.toString() : null,
    };
  });

  const expiringSoonList = productsWithWarranty.filter((p) => p.status === 'expiring_soon');
  const activeWarrantiesCount = productsWithWarranty.filter((p) => p.status === 'active' || p.status === 'expiring_soon').length;

  const topStores = Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([store, count]) => `${store} (${count} bills)`);

  // 3. Compact structured representation for prompt
  const compactReceipts = receipts.slice(0, 50).map((r) => ({
    id: r._id.toString(),
    store: r.storeName,
    date: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : 'N/A',
    amount: r.totalAmount,
    currency: r.currency || 'INR',
    category: r.category,
    invoice: r.invoiceNumber || 'N/A',
  }));

  const systemInstruction = `You are "Ask BillBox", a world-class financial intelligence and warranty advisor inside the BillBox invoice management system.
You have real-time, read-only access to the user's authentic personal bill vault.

CORE OBJECTIVE:
Answer the user's questions with 100% mathematical accuracy, crystal-clear structure, and warm professional tone.

USER CONTEXT & CURRENT DATE:
- Today's Date: ${todayStr}
- User Name: ${user?.name || 'Account User'}
- User Default Currency: ${user?.defaultCurrency || 'INR'}
- Total Receipts Logged: ${receipts.length}
- Total Items Tracked: ${products.length}
- Active Warranties: ${activeWarrantiesCount}
- Warranties Expiring Within 30 Days: ${expiringSoonList.length}
- Top Stores: ${topStores.join(', ') || 'None yet'}
- Spending by Currency: ${JSON.stringify(currencyTotals)}
- Spending by Category: ${JSON.stringify(categoryTotals)}

STRICT CITATION & FORMATTING RULES:
1. CITATIONS:
   - When referencing a specific receipt, format as: [Store Name - Amount](receipt:RECEIPT_ID)
   - When referencing a specific product, format as: [Product Name](product:PRODUCT_ID)
   Example: "Your [Sony WH-1000XM5](product:6ad10a) bought at [Croma - ₹24,990](receipt:6ad09f) has 42 days left on warranty."
2. ACCURACY:
   - Calculate all totals and counts directly from the user's dataset provided below.
   - Do NOT fabricate or hallucinate stores, receipts, or prices. If a receipt is not found, state clearly that no such record exists in their BillBox vault and suggest uploading it.
3. STRUCTURE & READABILITY:
   - Use clean Markdown: bold values, bullet points, and neat markdown tables where comparative or itemized data helps.
   - Keep answers concise and direct. Avoid unnecessary fluff.
4. DYNAMIC FOLLOW-UP SUGGESTIONS:
   - At the very end of your response, output 2 or 3 brief, highly contextual follow-up questions the user might want to ask next in this EXACT syntax:
     <<<SUGGESTIONS: ["First question?", "Second question?", "Third question?"]>>>`;

  // Format previous conversation turns
  const formattedHistory = (conversationHistory || []).slice(-6).map((turn) => {
    return `${turn.role === 'user' ? 'User' : 'BillBox'}: ${turn.content}`;
  }).join('\n\n');

  const prompt = `DATASET OF USER'S RECEIPTS (JSON):
${JSON.stringify(compactReceipts, null, 2)}

DATASET OF USER'S PRODUCTS & WARRANTIES (JSON):
${JSON.stringify(productsWithWarranty.slice(0, 60), null, 2)}

${formattedHistory ? `CONVERSATION HISTORY:\n${formattedHistory}\n\n` : ''}
USER QUERY:
"${userMessage}"

Please provide a helpful, structured, and accurate answer adhering to all citation and formatting rules.`;

  const { text } = await callGeminiWithFallback(ai, prompt, systemInstruction);

  // 4. Extract suggestions from tag <<<SUGGESTIONS: [...]>>>
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

  // Fallback smart suggestions if none extracted
  if (!suggestions || suggestions.length === 0) {
    if (expiringSoonList.length > 0) {
      suggestions.push('Which warranties expire in 30 days?');
    }
    suggestions.push('What is my biggest expense so far?');
    suggestions.push('Break down my spending by category');
  }

  // 5. Find referenced receipt and product IDs for frontend card previews
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

  const referencedProducts = productsWithWarranty
    .filter((p) => productIdMatches.includes(p.id))
    .map((p) => ({
      id: p.id,
      productName: p.name,
      brand: p.brand,
      price: p.price,
      daysRemaining: p.daysRemaining,
      status: p.status,
    }));

  return {
    reply: cleanedReply,
    suggestions: suggestions.slice(0, 3),
    references: {
      receipts: referencedReceipts,
      products: referencedProducts,
    },
  };
};

/**
 * Generates initial starter questions based on the user's real data
 */
const getInitialSuggestions = async (userId) => {
  const [receiptCount, productCount, expiringCount] = await Promise.all([
    Receipt.countDocuments({ userId }),
    Product.countDocuments({ userId }),
    Product.countDocuments({
      userId,
      warrantyExpiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const suggestions = [];

  if (expiringCount > 0) {
    suggestions.push(`Check my ${expiringCount} expiring ${expiringCount === 1 ? 'warranty' : 'warranties'}`);
  } else {
    suggestions.push('Which of my items are under active warranty?');
  }

  if (receiptCount > 0) {
    suggestions.push('What is my total spending this month?');
    suggestions.push('Which store do I spend the most money at?');
    suggestions.push('Show my 5 most expensive purchases');
  } else {
    suggestions.push('How does BillBox track warranties?');
    suggestions.push('What receipt formats can I upload?');
  }

  return suggestions.slice(0, 4);
};

module.exports = {
  askBillBoxService,
  getInitialSuggestions,
};
