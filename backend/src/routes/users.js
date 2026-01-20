const express = require('express');
const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);

module.exports = router;
