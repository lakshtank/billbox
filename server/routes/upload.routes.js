const express = require('express');
const auth = require('../middleware/auth.middleware');
const { uploadSingleFile, uploadMultipleFiles } = require('../middleware/upload.middleware');
const {
  uploadSingle,
  uploadBatch,
  getBatchStatus,
  saveBatchFile,
} = require('../controllers/upload.controller');

const router = express.Router();

// Protected routes — single & batch uploads
router.post('/single', auth, uploadSingleFile, uploadSingle);
router.post('/batch', auth, uploadMultipleFiles, uploadBatch);
router.get('/batch/:batchId', auth, getBatchStatus);
router.post('/batch/:batchId/files/:fileIndex/save', auth, saveBatchFile);

module.exports = router;
