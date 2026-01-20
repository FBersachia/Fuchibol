const express = require('express');
const {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');
const { getPlayerStats } = require('../controllers/playerStatsController');
const { getPlayerMatches } = require('../controllers/playerMatchesController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listPlayers);
router.get('/:id/stats', getPlayerStats);
router.get('/:id/matches', getPlayerMatches);
router.post('/', requireRole('admin'), createPlayer);
router.patch('/:id', requireRole('admin'), updatePlayer);
router.delete('/:id', requireRole('admin'), deletePlayer);

module.exports = router;
