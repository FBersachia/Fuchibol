const express = require('express');
const { exportData } = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/export', exportData);

module.exports = router;
