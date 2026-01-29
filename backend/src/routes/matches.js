const express = require('express');
const {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  generateTeamsForMatch,
  previewTeamsForMatch,
  createPlayedMatch,
} = require('../controllers/matchController');
const { getMatchesSummary } = require('../controllers/matchSummaryController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/', requireGroup, listMatches);
router.get('/summary', requireGroup, getMatchesSummary);
router.post('/preview-teams', requireGroup, requireGroupRole('admin'), previewTeamsForMatch);
router.post('/played', requireGroup, requireGroupRole('admin'), createPlayedMatch);
router.get('/:id', requireGroup, getMatch);
router.post('/', requireGroup, requireGroupRole('admin'), createMatch);
router.patch('/:id', requireGroup, requireGroupRole('admin'), updateMatch);
router.delete('/:id', requireGroup, requireGroupRole('admin'), deleteMatch);
router.post('/:id/generate-teams', requireGroup, requireGroupRole('admin'), generateTeamsForMatch);

module.exports = router;
