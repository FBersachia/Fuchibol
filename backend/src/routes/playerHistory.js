const express = require('express');
const { getPlayerEloHistory } = require('../controllers/playerHistoryController');
const { authenticate } = require('../middleware/auth');
const { requireGroup } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/:id/elo-history', requireGroup, getPlayerEloHistory);

module.exports = router;
