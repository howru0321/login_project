const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

var {db,
    fetchUser,
    createUser,
    removeUser,
    updateUser} = require('./user_db.js');

const app = express();

const USER_COOKIE_KEY = 'USER';
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';


function generateToken(email) {
    const token = jwt.sign({
        email,
        exp: Date.now() + 1000 * 60,
    }, JWT_SECRET);

    return token;
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.exp < Date.now()) {
            return null;
        }

        return decoded.email;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const token = req.cookies[USER_COOKIE_KEY];
  if (token) {
      const email = verifyToken(token);
      if (email !== null) {
          req.email = email;
      }
  }
  next();
});

app.get('/', async (req, res) => {
    if (req.email) {
        var user;
        try {
            user = await fetchUser('email', req.email);
        } catch (error) {
            console.error('Error fetching user:', error);
        }

        if (user) {
            res.status(200).send(`
                <a href="/logout">Log Out</a>
                <a href="/withdraw">Withdraw</a>
                <h1>id: ${user.email}, password: ${user.password}</h1>
            `);
            return;
        }
    }

    return res.redirect(`/welcome_login.html`);
});

app.get('/google', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'
    res.redirect(url);
});

app.post('/signup', async (req, res) => {
    const { email, password, confirm_password } = req.body;
    
    var user;
    try {
        user = await fetchUser('email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if (user) {
        var errorMessage;
        if(user.type === "general"){
            errorMessage="duplicateEmail";
        }
        else if(user.type === "google"){
            errorMessage="registeredWithGoogle";
        }
        return res.redirect(`/signup.html?error=${errorMessage}`);
    }

    if(password!==confirm_password){
        return res.redirect(`/signup.html?error=mismatchPassword`);
    }

    const type = "general";
    const username = null;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        user = await createUser(email, username, hashedPassword, type);
    } catch (error) {
        console.error('Error creating user:', error);
    }

    return res.redirect(`/username.html?email=${email}`);
});

app.post('/username', async (req, res) => {
    const { email, username } = req.body;

    try {
        user = await updateUser('email', email, username);
    } catch (error) {
        if(error.code === 'ER_DUP_ENTRY'){
            const errorMessage = "duplicateUsername"
            return res.redirect(`/username.html?error=${errorMessage}&email=${email}&duplicateUsername=${username}`);
        }
    }

    const token = generateToken(email);
    res.cookie(USER_COOKIE_KEY, token);
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    var user;
    try {
        user = await fetchUser('email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if (!user) {
        res.status(400).send(`not registered email: ${email}`);
        return;
    }
    if(user.type === "google"){
        res.status(400).send('Already registered as a member with Google account');
        return;
    }
    if(user.username === null){
        return res.redirect(`/username.html?email=${email}`);
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
        res.status(400).send('incorrect password');
        return;
    }

    const token = generateToken(user.email);
    res.cookie(USER_COOKIE_KEY, token);
    res.redirect('/');
});

app.get('/google/redirect', async (req, res) => {
    const { code } = req.query;

    //사용자 권한 거부
    if(code === undefined){
        return res.redirect(`/login.html`);
    }

    const resp = await axios.post(GOOGLE_TOKEN_URL, {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
    });

    const resp2 = await axios.get(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${resp.data.access_token}`,
        },
    });

    const email=resp2.data.email;

    var user;
    try {
        user = await fetchUser('email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if(user){
        if(user.username === null){
            return res.redirect(`/username.html?email=${email}`);
        }
        const token = generateToken(user.email);
        res.cookie(USER_COOKIE_KEY, token);
        res.redirect('/');
    }
    else{
        const password="OAuth2.0";
        const type = "google";
        const username = null;
 
        try {
            user = await createUser(email, username, password, type);
        } catch (error) {
            console.error('Error creating user:', error);
        }

        return res.redirect(`/username.html?email=${email}`);
    }
});

app.get('/withdraw', async (req, res) => {
    if(req.email){
        try {
            user = await removeUser('email', req.email);
        } catch (error) {
            console.error('Error removing user:', error);
        }
        res.clearCookie(USER_COOKIE_KEY);
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie(USER_COOKIE_KEY);
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('server is running at 3000');
});