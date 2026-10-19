const { askBillBoxService, getInitialSuggestions } = require('../services/chat.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * POST /api/chat/ask
 * Process natural language user queries with Gemini AI against their vault
 */
const ask = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 400, 'Message cannot be empty.');
    }

    if (!process.env.GEMINI_API_KEY) {
      return sendError(
        res,
        503,
        'Ask BillBox AI is not configured. Please set GEMINI_API_KEY in your server environment.'
      );
    }

    const result = await askBillBoxService(req.userId, message.trim(), history || []);
    return sendSuccess(res, 200, 'Answer generated successfully', result);
  } catch (error) {
    console.error('[AskBillBox Controller Error]:', error);
    return sendError(
      res,
      500,
      error.message || 'Unable to process your request at this time. Please try again.'
    );
  }
};

/**
 * GET /api/chat/suggestions
 * Fetch dynamic starter questions based on the user's authentic data
 */
const getSuggestions = async (req, res) => {
  try {
    const suggestions = await getInitialSuggestions(req.userId);
    return sendSuccess(res, 200, 'Suggestions retrieved', { suggestions });
  } catch (error) {
    console.error('[AskBillBox Suggestions Error]:', error);
    return sendSuccess(res, 200, 'Fallback suggestions retrieved', {
      suggestions: [
        'Which warranties are expiring soon?',
        'What is my biggest expense?',
        'Show my spending by category',
      ],
    });
  }
};

module.exports = {
  ask,
  getSuggestions,
};
