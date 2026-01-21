const express = require('express');
const { getAppConfig, updateAppConfig, getConfigHistory } = require('../controllers/configController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/config', requireGroup, getAppConfig);
router.put('/config', requireGroup, requireGroupRole('admin'), updateAppConfig);
router.get('/config/history', requireGroup, requireGroupRole('admin'), getConfigHistory);

module.exports = router;
