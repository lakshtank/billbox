const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendError } = require('../utils/apiResponse');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.userId || 'guest';
    const timestamp = Date.now();
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${userId}-${timestamp}-${cleanOriginalName}`);
  },
});

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

// Max file size in bytes
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024;

// Multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error(
        `Invalid file type '${file.mimetype}'. Only JPG, PNG, WEBP, and PDF files are allowed.`
      );
      err.code = 'INVALID_FILE_TYPE';
      return cb(err, false);
    }
    cb(null, true);
  },
});

// Single file upload middleware with express error handling wrapper
const uploadSingleFile = (req, res, next) => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            400,
            `File size exceeds the maximum limit of ${MAX_SIZE_MB}MB.`
          );
        }
        return sendError(res, 400, `Upload error: ${err.message}`);
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return sendError(res, 400, err.message);
      }
      return sendError(res, 400, err.message || 'File upload failed.');
    }

    if (!req.file) {
      return sendError(res, 400, 'No file uploaded. Please attach a receipt file.');
    }

    next();
  });
};

// Multiple files upload middleware (max 5 files per batch)
const uploadMultipleFiles = (req, res, next) => {
  const arrayUpload = upload.array('files', 5);

  arrayUpload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            400,
            `One or more files exceed the maximum limit of ${MAX_SIZE_MB}MB.`
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
          return sendError(
            res,
            400,
            'Maximum of 5 receipt files allowed per batch upload.'
          );
        }
        return sendError(res, 400, `Batch upload error: ${err.message}`);
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return sendError(res, 400, err.message);
      }
      return sendError(res, 400, err.message || 'Batch file upload failed.');
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No receipt files attached for batch upload.');
    }

    if (req.files.length > 5) {
      return sendError(res, 400, 'Maximum of 5 receipt files allowed per batch upload.');
    }

    next();
  });
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
};

