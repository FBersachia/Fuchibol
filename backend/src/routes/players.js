const express = require('express');
const {
  listPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require('../controllers/playerController');
const { getPlayerStats } = require('../controllers/playerStatsController');
const { getPlayerMatches } = require('../controllers/playerMatchesController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/', requireGroup, listPlayers);
router.get('/:id/stats', requireGroup, getPlayerStats);
router.get('/:id/matches', requireGroup, getPlayerMatches);
router.post('/', requireGroup, requireGroupRole('admin'), createPlayer);
router.patch('/:id', requireGroup, requireGroupRole('admin'), updatePlayer);
router.delete('/:id', requireGroup, requireGroupRole('admin'), deletePlayer);

module.exports = router;
