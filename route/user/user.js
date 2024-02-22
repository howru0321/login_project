const express = require('express');

const router = express.Router();

const userMid = require('./user.middleware.js');

router.post('/signup', userMid.signup);
router.post('/signin', userMid.signin);
router.get('/withdraw', userMid.withdraw);
router.get('/logout', userMid.logout);

module.exports = router;