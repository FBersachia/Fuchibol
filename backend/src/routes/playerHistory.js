const express = require('express');
const { getPlayerEloHistory } = require('../controllers/playerHistoryController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:id/elo-history', getPlayerEloHistory);

module.exports = router;
