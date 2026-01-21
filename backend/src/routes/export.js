const express = require('express');
const { exportData } = require('../controllers/exportController');
const { authenticate } = require('../middleware/auth');
const { requireGroup } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/export', requireGroup, exportData);

module.exports = router;
