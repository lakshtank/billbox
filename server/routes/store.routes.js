const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { getStores, getStoreDetail } = require('../controllers/store.controller');

// All store routes are protected
router.use(auth);

// GET /api/stores
router.get('/', getStores);

// GET /api/stores/:storeName
router.get('/:storeName', getStoreDetail);

module.exports = router;
