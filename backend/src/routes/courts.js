const express = require('express');
const {
  listCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { authenticate } = require('../middleware/auth');
const { requireGroup, requireGroupRole } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/', requireGroup, listCourts);
router.post('/', requireGroup, requireGroupRole('admin'), createCourt);
router.patch('/:id', requireGroup, requireGroupRole('admin'), updateCourt);
router.delete('/:id', requireGroup, requireGroupRole('admin'), deleteCourt);

module.exports = router;
