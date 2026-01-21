const express = require('express');
const {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  listMembers,
  leaveGroup,
  transferAdmin,
} = require('../controllers/groupController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/groups', listGroups);
router.post('/groups', createGroup);
router.patch('/groups/:id', requireGroup, requireGroupRole('admin'), updateGroup);
router.delete('/groups/:id', requireGroup, requireGroupRole('admin'), deleteGroup);

router.get('/groups/members', requireGroup, listMembers);
router.post('/groups/leave', requireGroup, leaveGroup);
router.post('/groups/transfer-admin', requireGroup, requireGroupRole('admin'), transferAdmin);

module.exports = router;
