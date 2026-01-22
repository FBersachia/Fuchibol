const express = require('express');
const { login, logout, me, updateMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
