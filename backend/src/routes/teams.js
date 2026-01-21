const express = require('express');
const {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/', requireGroup, listTeams);
router.post('/', requireGroup, requireGroupRole('admin'), createTeam);
router.patch('/:id', requireGroup, requireGroupRole('admin'), updateTeam);
router.delete('/:id', requireGroup, requireGroupRole('admin'), deleteTeam);

module.exports = router;
