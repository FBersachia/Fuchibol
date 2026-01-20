const express = require('express');
const { getSocialPairs } = require('../controllers/socialController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/social-pairs', getSocialPairs);

module.exports = router;
