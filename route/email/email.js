const express = require('express');

const router = express.Router();

const emailMid = require('./email.middleware.js')

router.post('/verification', emailMid.verification);

module.exports = router;