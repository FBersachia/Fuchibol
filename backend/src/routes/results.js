const express = require('express');
const { createResult, updateResult, getMatchResult } = require('../controllers/resultController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.post('/:id/result', requireGroup, requireGroupRole('admin'), createResult);
router.patch('/:id/result', requireGroup, requireGroupRole('admin'), updateResult);
router.get('/:id/result', requireGroup, getMatchResult);

module.exports = router;
