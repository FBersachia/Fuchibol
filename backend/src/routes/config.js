const express = require('express');
const { getAppConfig, updateAppConfig, getConfigHistory } = require('../controllers/configController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/config', getAppConfig);
router.put('/config', requireRole('admin'), updateAppConfig);
router.get('/config/history', requireRole('admin'), getConfigHistory);

module.exports = router;
