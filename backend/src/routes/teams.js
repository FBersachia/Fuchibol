const express = require('express');
const {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listTeams);
router.post('/', requireRole('admin'), createTeam);
router.patch('/:id', requireRole('admin'), updateTeam);
router.delete('/:id', requireRole('admin'), deleteTeam);

module.exports = router;
