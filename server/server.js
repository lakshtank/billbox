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

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err?.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const receiptRoutes = require('./routes/receipt.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const { sendError } = require('./utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5000;

// Strict CORS configuration for development and authorized domains
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured client origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow localhost ports dynamically during non-production development
      if (
        process.env.NODE_ENV !== 'production' &&
        (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }

      // Allow trusted preview deployments
      if (
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.netlify.app')
      ) {
        return callback(null, true);
      }

      // Disallow all other unauthorized origins
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint responds instantly without waiting for database handshake
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    message: 'BillBox API is running',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : (mongoose.connection.readyState === 2 ? 'connecting' : 'disconnected'),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    isServerless: Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION),
  });
});

// Ensure DB connection for all data requests (serverless & standalone)
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
const chatRoutes = require('./routes/chat.routes');

const fs = require('fs');

// Secure file streaming endpoint with authentication and ownership validation
app.get(['/uploads/:filename', '/api/uploads/:filename'], async (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);
    const localFilePath = path.join(__dirname, 'uploads', safeFilename);

    // Resolve caller identity from Bearer header, query token, or cookie
    let authUserId = null;
    let authError = null;
    const authHeader = req.headers.authorization;
    let cookieToken = null;
    if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)billbox_token=([^;]+)/);
      if (match) {
        try {
          cookieToken = decodeURIComponent(match[1]);
        } catch {
          cookieToken = match[1];
        }
      }
    }

    const rawToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split(' ')[1]
      : (req.query.token || cookieToken);

    if (rawToken) {
      try {
        const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
        authUserId = decoded.userId;
      } catch (e) {
        authError = 'Invalid or expired authentication token.';
      }
    }

    const publicToken = req.query.publicToken;

    const Receipt = require('./models/Receipt.model');
    const receipt = await Receipt.findOne({
      $or: [
        { fileUrl: { $regex: safeFilename, $options: 'i' } },
        { fileUrl: `/uploads/${safeFilename}` }
      ]
    }).select('+fileData').populate('products');

    // If an associated receipt exists, enforce ownership or public share token
    if (receipt) {
      const isOwner = authUserId && receipt.userId && receipt.userId.toString() === authUserId.toString();
      const hasValidPublicToken = publicToken && receipt.publicToken && publicToken === receipt.publicToken;

      if (!isOwner && !hasValidPublicToken) {
        if (authError) {
          return res.status(401).json({ success: false, message: authError });
        }
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this receipt file.'
        });
      }

      if (receipt.fileData) {
        const buffer = Buffer.from(receipt.fileData, 'base64');
        const isPdf = receipt.mimeType === 'application/pdf' || receipt.fileType === 'pdf' || safeFilename.toLowerCase().endsWith('.pdf');
        const contentType = receipt.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }

      if (fs.existsSync(localFilePath)) {
        return res.sendFile(localFilePath);
      }

      if (receipt.publicToken) {
        const { getPublicReceiptFile } = require('./controllers/publicReceipt.controller');
        req.params.publicToken = receipt.publicToken;
        return getPublicReceiptFile(req, res);
      }
    }

    // If file belongs to a BatchUpload in progress, enforce batch ownership
    const BatchUpload = require('./models/BatchUpload.model');
    const batchDoc = await BatchUpload.findOne({
      'files.fileUrl': { $regex: safeFilename, $options: 'i' }
    });

    if (batchDoc) {
      const isBatchOwner = authUserId && batchDoc.userId && batchDoc.userId.toString() === authUserId.toString();
      if (!isBatchOwner) {
        if (authError) {
          return res.status(401).json({ success: false, message: authError });
        }
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not have permission to access this batch file.'
        });
      }

      if (fs.existsSync(localFilePath)) {
        return res.sendFile(localFilePath);
      }

      const matchingFile = (batchDoc.files || []).find(
        (f) => f.fileUrl && f.fileUrl.toLowerCase().includes(safeFilename.toLowerCase())
      );
      if (matchingFile && matchingFile.fileData) {
        const buffer = Buffer.from(matchingFile.fileData, 'base64');
        const isPdf = matchingFile.mimeType === 'application/pdf' || matchingFile.fileType === 'pdf' || safeFilename.toLowerCase().endsWith('.pdf');
        const contentType = matchingFile.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);
      }
    }

    // Freshly uploaded file pending receipt creation requires authentication
    if (fs.existsSync(localFilePath)) {
      if (!authUserId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access uploaded files.'
        });
      }
      return res.sendFile(localFilePath);
    }

    return res.status(404).json({ success: false, message: 'File not found' });
  } catch (err) {
    console.error('Upload stream error:', err);
    return res.status(500).json({ success: false, message: 'Error streaming file' });
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
app.use('/api/chat', chatRoutes);

// Client runtime error logger
app.post('/api/client-error', express.json(), (req, res) => {
  console.error('\n==================== CLIENT CRASH LOGGED ====================');
  console.error(JSON.stringify(req.body, null, 2));
  console.error('=============================================================\n');
  try {
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'last-client-error.json'), JSON.stringify(req.body, null, 2));
  } catch (e) {
    console.error('Failed to write last-client-error.json:', e);
  }
  res.json({ ok: true });
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
