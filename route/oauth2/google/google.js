const express = require('express');

const router = express.Router();

const googleMid = require('./google.middleware.js')

router.get('/', googleMid.redirectToGoogleSignIn);
router.get('/callback', googleMid.callback);

module.exports = router;