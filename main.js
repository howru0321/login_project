const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

var {db,
    fetchUser,
    fetchUserColumns,
    createUser,
    removeUser,
    updateUsername} = require('./user_db.js');

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
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

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
            return res.redirect(`/main.html`);
        }
    }

    return res.redirect(`/login.html`);
});

app.get('/google', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'
    res.redirect(url);
});

app.post('/vertify_email', async (req, res) => {
    const email = req.body.email;
    
    var user;
    try {
        user = await fetchUserColumns(['type'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if (user) {
        return res.status(207).send({duplicate: true, type: user.type});
    }
    else{
        return res.status(207).send({duplicate: false});
    }
});

app.post('/signup', async (req, res) => {
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

app.post('/signin', async (req, res) => {
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

    const token = generateToken(email);
    res.cookie(USER_COOKIE_KEY, token);
    return res.status(200).send();
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
        user = await fetchUserColumns(['username', 'type'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if(user){
        if(user.type !== "google"){
            res.status(400).send('Already registered as a member');
            return;
        }
        const token = generateToken(email);
        res.cookie(USER_COOKIE_KEY, token);
        res.redirect('/');
    }
    else{
        const password="OAuth2.0";
        const type = "google";
        const username = null;
 
        try {
            await createUser(email, username, password, type);
        } catch (error) {
            console.error('Error creating user:', error);
        }

        return res.redirect(`/welcome.html`);
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