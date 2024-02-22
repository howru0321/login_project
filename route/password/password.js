const express = require('express');

const router = express.Router();

const passwordMid = require('./password.middleware.js');

router.post('/recovery', passwordMid.recovery);
router.post('/verification', passwordMid.verification);
router.post('/reset', passwordMid.reset);

module.exports = router;