// Polyfill DOM globals for Node.js serverless environments (required by pdf-parse v2)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
    multiply() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
    inverse() {
      return this;
    }
    transformPoint(p) {
      return p;
    }
  };
}
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = globalThis.DOMMatrix;
}

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

const categoryRoutes = require('./routes/category.routes');
const publicReceiptRoutes = require('./routes/publicReceipt.routes');
const productRoutes = require('./routes/product.routes');
const storeRoutes = require('./routes/store.routes');
const reminderRoutes = require('./routes/reminder.routes');

const fs = require('fs');

// Serve uploaded files statically or from MongoDB Atlas Base64 on cloud serverless
app.get(['/uploads/:filename', '/api/uploads/:filename'], async (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const localFilePath = path.join(__dirname, 'uploads', safeFilename);

    if (fs.existsSync(localFilePath)) {
      return res.sendFile(localFilePath);
    }

    const Receipt = require('./models/Receipt.model');
    const receipt = await Receipt.findOne({
      $or: [
        { fileUrl: { $regex: safeFilename, $options: 'i' } },
        { fileUrl: `/uploads/${safeFilename}` }
      ]
    }).populate('products');

    if (receipt) {
      if (receipt.fileData) {
        const buffer = Buffer.from(receipt.fileData, 'base64');
        const isPdf = receipt.mimeType === 'application/pdf' || receipt.fileType === 'pdf' || safeFilename.toLowerCase().endsWith('.pdf');
        const contentType = receipt.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }

      if (receipt.publicToken) {
        const { getPublicReceiptFile } = require('./controllers/publicReceipt.controller');
        req.params.publicToken = receipt.publicToken;
        return getPublicReceiptFile(req, res);
      }
    }

    return res.status(404).json({ success: false, message: 'File not found' });
  } catch (err) {
    console.error('Upload stream error:', err);
    return res.status(500).json({ success: false, message: 'Error streaming file' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  console.error('Unhandled error:', err.message || err);
  if (err.type === 'entity.too.large' || err.status === 413) {
    return sendError(res, 413, 'File payload is too large. Please upload a smaller file.');
  }
  sendError(res, err.status || 500, err.message || 'An unexpected error occurred.');
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
