const express = require('express');
const router = express.Router();
const { getCategories } = require('../controllers/category.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth, getCategories);

module.exports = router;
