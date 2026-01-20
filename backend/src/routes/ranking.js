const express = require('express');
const { getRanking } = require('../controllers/rankingController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/ranking', getRanking);

module.exports = router;
