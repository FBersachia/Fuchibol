const express = require('express');
const {
  createGeneralInvite,
  createSpecificInvite,
  getInviteInfo,
  joinByInvite,
} = require('../controllers/inviteController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.get('/invites/:slug/:token', getInviteInfo);
router.post('/invites/:slug/:token/join', joinByInvite);

router.use(authenticate);
router.post('/invites/general', requireGroup, requireGroupRole('admin'), createGeneralInvite);
router.post('/invites/specific', requireGroup, requireGroupRole('admin'), createSpecificInvite);

module.exports = router;
