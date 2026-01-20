const express = require('express');
const { login, logout, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
