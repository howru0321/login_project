const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';

var {
    fetchUserColumns,
    createUser,
    removeUser
} = require('../user_db.js');

var {
    generateAToken,
    generateRToken,
} = require('./function.js')

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    const type = "general";
    const username = null;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await createUser(email, username, hashedPassword, type);
    } catch (error) {
        console.error('Error creating user:', error);
    }
    return res.status(200).send();
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    var user_Password;
    try {
        user_Password = await fetchUserColumns(['password'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    const matchPassword = await bcrypt.compare(password, user_Password.password);
    if (!matchPassword) {
        res.status(401).send();
        return;
    }

    const newAToken = generateAToken(email);
    const newRToken = generateRToken(email);

    res.cookie(RTOKEN_COOKIE_KEY, newRToken);
    res.cookie(ATOKEN_COOKIE_KEY, newAToken);
    return res.status(200).send();
});


router.get('/withdraw', async (req, res) => {
    if(req.email){
        try {
            user = await removeUser('email', req.email);
        } catch (error) {
            console.error('Error removing user:', error);
        }
        res.clearCookie(ATOKEN_COOKIE_KEY);
        res.redirect('/');
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie(ATOKEN_COOKIE_KEY);
    res.clearCookie(RTOKEN_COOKIE_KEY);
    res.redirect('/');
});

module.exports = router;