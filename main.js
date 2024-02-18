const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const redis = require('redis');
const expressSession = require('express-session');
const memoryStore = require('memorystore')(expressSession);
const uuid = require('uuid');
require('dotenv').config();

var {db,
    fetchUser,
    fetchUserColumns,
    createUser,
    removeUser,
    updatePassword} = require('./user_db.js');

const app = express();

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const VERIFY_EMAIL = process.env.VERIFY_EMAIL;
const VERIFY_EMAIL_PASSWORD = process.env.VERIFY_EMAIL_PASSWORD;
const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const SESSION_SECRET = process.env.SESSION_SECRET;

const redisCli_cloud = redis.createClient({
    url:`redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0`,
    legacyMode: true,
})
redisCli_cloud.on('connect', () => {
    console.info('Redis connected!');
 });
 redisCli_cloud.on('error', (err) => {
    console.error('Redis Client Error', err);
 });
 redisCli_cloud.connect().then();
 const redisClient_EmailCode = redisCli_cloud.v4;



const redisCli_local = redis.createClient({ legacyMode: true });
redisCli_local.on('connect', () => {
    console.info('Redis_local connected!');
 });
 redisCli_local.on('error', (err) => {
    console.error('Redis_local Client Error', err);
 });
 redisCli_local.connect().then();
 const redisClient_EmailRToken = redisCli_local.v4;

function generateAToken(email) {
    const token = jwt.sign(
        {
            email
        },
        JWT_SECRET_ATOKEN,
        {
            expiresIn: '1h'
        });

    return token;
}
function generateRToken(email) {
    const rid = generateUniqueId();
    const token = jwt.sign(
        {
            email, 
            rid
        },
        JWT_SECRET_RTOKEN,
        {
            expiresIn: '10h'
        });

    redisClient_EmailRToken.set(email, rid);
    return token;
}

function verifyToken(token, JWT_SECRET) {
    if(!token){
        return null;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

function generateUniqueId() {
  return uuid.v4();
}


app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
let maxAge = 5* 60 * 1000;
app.use(
    expressSession({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: new memoryStore({checkPeriod: maxAge}),
        cookie: {
            mexAge: maxAge
        }
    })
)
app.use(async (req, res, next) => {
    var AToken = null;
    const incodeAToken = req.cookies[ATOKEN_COOKIE_KEY];
    if(incodeAToken){
        AToken = verifyToken(incodeAToken, JWT_SECRET_ATOKEN);
    }
    if (AToken) {
        req.email = AToken.email;
    }
    else{
        var RToken = null;
        const incodeRToken = req.cookies[RTOKEN_COOKIE_KEY];
        if(incodeRToken){
            RToken = verifyToken(incodeRToken, JWT_SECRET_RTOKEN);
        }
        if(RToken){
            const email = RToken.email;
            const rid = await redisClient_EmailRToken.get(email);
            if(rid === RToken.rid){
                console.log("rtoken is going down");
                const newAToken = generateAToken(email);
                const newRToken = generateRToken(email);

                res.cookie(RTOKEN_COOKIE_KEY, newRToken);
                res.cookie(ATOKEN_COOKIE_KEY, newAToken);
                req.email = email;
            }
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

app.post('/verify_email', async (req, res) => {
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
app.post('/send_code', async (req, res) => {
    const email = req.body.email;

    const authCode = generateRandomString(6);

    await redisClient_EmailCode.set(email, authCode);
    await redisClient_EmailCode.expire(email, 300);

    req.session.email=email;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: VERIFY_EMAIL,
          pass: VERIFY_EMAIL_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `"howserver" <${email}>`,
        to: email,
        subject: '[howserver] 회원가입 인증 메일입니다.',
        html: `<form action= method="POST">
        <h2 style="margin: 20px 0">[company] ${authCode}</h2>
        <button style=" background-color: #ff2e00; color:#fff; width: 80px; height:40px; border-radius: 20px; border: none;">가입확인</button>
      </form>`,
    });

    return res.status(200).send();
});
app.post('/verify_code', async (req, res) => {
    const email = req.body.email;
    const code = req.body.code;

    const redisCode = await redisClient_EmailCode.get(email);
    await redisClient_EmailCode.del('email');
    if(redisCode === code){
        return res.status(200).send({});
    }
    else{
        return res.status(401).send({});
    }
});
app.post('/reset_password', async (req, res) => {
    const password = req.body.password;

    const email = req.session.email;
  
    req.session.destroy(()=>{
        req.session
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    updatePassword("email",email,hashedPassword);

    return res.status(200).send();
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

    const newAToken = generateAToken(email);
    const newRToken = generateRToken(email);

    res.cookie(RTOKEN_COOKIE_KEY, newRToken);
    res.cookie(ATOKEN_COOKIE_KEY, newAToken);
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
        const newAToken = generateAToken(email);
        const newRToken = generateRToken(email);

        res.cookie(RTOKEN_COOKIE_KEY, newRToken);
        res.cookie(ATOKEN_COOKIE_KEY, newAToken);
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
        res.clearCookie(ATOKEN_COOKIE_KEY);
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie(ATOKEN_COOKIE_KEY);
    res.clearCookie(RTOKEN_COOKIE_KEY);
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('server is running at 3000');
});