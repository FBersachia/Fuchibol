const express = require('express');
const {
  listMatches,
  getMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  generateTeamsForMatch,
  previewTeamsForMatch,
} = require('../controllers/matchController');
const { getMatchesSummary } = require('../controllers/matchSummaryController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listMatches);
router.get('/summary', getMatchesSummary);
router.post('/preview-teams', requireRole('admin'), previewTeamsForMatch);
router.get('/:id', getMatch);
router.post('/', requireRole('admin'), createMatch);
router.patch('/:id', requireRole('admin'), updateMatch);
router.delete('/:id', requireRole('admin'), deleteMatch);
router.post('/:id/generate-teams', requireRole('admin'), generateTeamsForMatch);

module.exports = router;
