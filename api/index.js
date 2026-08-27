const app = require('../server/server');
const connectDB = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error('Serverless Database Connection Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please check MONGODB_URI in Vercel environment variables.',
    });
  }
};
