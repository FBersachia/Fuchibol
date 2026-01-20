const express = require('express');
const {
  listCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', listCourts);
router.post('/', requireRole('admin'), createCourt);
router.patch('/:id', requireRole('admin'), updateCourt);
router.delete('/:id', requireRole('admin'), deleteCourt);

module.exports = router;
