const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const receiptRoutes = require('./routes/receipt.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const { sendError } = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5000;

// Flexible CORS for development and production deployments
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow preview deployments on vercel.app or render.com
      if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.endsWith('.netlify.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

const categoryRoutes = require('./routes/category.routes');
const publicReceiptRoutes = require('./routes/publicReceipt.routes');
const productRoutes = require('./routes/product.routes');
const storeRoutes = require('./routes/store.routes');
const reminderRoutes = require('./routes/reminder.routes');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure DB connection for all requests (serverless & standalone)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/public/receipts', publicReceiptRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BillBox API is running' });
});

// 404 handler
app.use((req, res) => {
  sendError(res, 404, `Route ${req.originalUrl} not found.`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  sendError(res, 500, 'An unexpected error occurred.');
});

const cron = require('node-cron');
const { runWarrantyReminderCheck } = require('./services/reminder.service');

// Start standalone server when executed directly (local dev or traditional hosting)
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`BillBox server running on port ${PORT}`);

      // Schedule daily warranty reminder check at 00:01 server time
      cron.schedule('1 0 * * *', () => {
        console.log('[Cron] Triggering daily warranty reminder check...');
        runWarrantyReminderCheck();
      });
      console.log('[Cron] Warranty reminder daily cron job scheduled (00:01 server time).');
    });
  });
}

module.exports = app;
