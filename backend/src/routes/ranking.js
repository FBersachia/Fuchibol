const express = require('express');
const { getRanking } = require('../controllers/rankingController');
const { authenticate } = require('../middleware/auth');
const { requireGroup } = require('../middleware/groupContext');

const router = express.Router();

router.use(authenticate);

router.get('/ranking', requireGroup, getRanking);

module.exports = router;
