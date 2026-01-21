const express = require('express');
const { getSocialPairs } = require('../controllers/socialController');
const { authenticate } = require('../middleware/auth');
const { requireGroup } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/social-pairs', requireGroup, getSocialPairs);

module.exports = router;
