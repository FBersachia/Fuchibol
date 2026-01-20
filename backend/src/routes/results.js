const express = require('express');
const { createResult, updateResult, getMatchResult } = require('../controllers/resultController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.post('/:id/result', createResult);
router.patch('/:id/result', updateResult);
router.get('/:id/result', getMatchResult);

module.exports = router;
