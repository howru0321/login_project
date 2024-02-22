const bcrypt = require('bcrypt');

var {
    fetchUserColumns,
    createUser,
    removeUser
} = require('../../db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken,
} = require('../function.js')

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';

async function signup (req, res) {
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
}

async function signin (req, res) {
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
}

async function withdraw (req, res) {
    if(req.email){
        try {
            user = await removeUser('email', req.email);
        } catch (error) {
            console.error('Error removing user:', error);
        }
        res.clearCookie(ATOKEN_COOKIE_KEY);
        res.clearCookie(RTOKEN_COOKIE_KEY);
        res.redirect('/');
    }
}

async function logout (req, res) {
    res.clearCookie(ATOKEN_COOKIE_KEY);
    res.clearCookie(RTOKEN_COOKIE_KEY);
    res.redirect('/');
}

module.exports = {
    signup,
    signin,
    withdraw,
    logout
}