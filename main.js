const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const expressSession = require('express-session');
const memoryStore = require('memorystore')(expressSession);
require('dotenv').config();

var {db,
    fetchUser,
    fetchUserColumns,
    createUser,
    removeUser,
    updatePassword
} = require('./user_db.js');

var {
    redisClient_EmailCode,
    redisClient_EmailRToken
 } = require('./route/redis.js');

var {
    generateAToken,
    generateRToken,
    verifyToken,
    generateRandomString
} = require('./route/function.js')

var userRouter = require('./route/user.js');

const app = express();

const ATOKEN_COOKIE_KEY = 'ATOKEN';//
const RTOKEN_COOKIE_KEY = 'RTOKEN';//
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;//
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;//
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const VERIFY_EMAIL = process.env.VERIFY_EMAIL;
const VERIFY_EMAIL_PASSWORD = process.env.VERIFY_EMAIL_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
let maxAge = 20;
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

app.post('/password/recovery', async (req, res) => {
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
app.post('/password/verification', async (req, res) => {
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
app.post('/password/reset', async (req, res) => {
    const password = req.body.password;

    const email = req.session.email;
  
    req.session.destroy(()=>{
        req.session
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    updatePassword("email",email,hashedPassword);

    return res.status(200).send();
});

app.get('/auth/google', (req, res) => {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'
    res.redirect(url);
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

app.post('/email/verification', async (req, res) => {
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

app.use('/user', userRouter);

app.listen(3000, () => {
    console.log('server is running at 3000');
});