const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const memoryStore = require('memorystore')(expressSession);
require('dotenv').config();

var {db,
    fetchUser,
    fetchUserColumns,
    createUser,
    removeUser,
    updatePassword
} = require('./db/mysql/mysql.js');

var {
    redisClient_EmailCode,
    redisClient_EmailRToken
 } = require('./db/redis/redis.js');

var {
    generateAToken,
    generateRToken,
    verifyToken,
    generateRandomString
} = require('./route/function.js')

var userRouter = require('./route/user/user.js');
var emailRouter = require('./route/email/email.js');
var passwordRouter = require('./route/password/password.js');
var oauth2_googleRouter = require('./route/oauth2/google/google.js');

const app = express();

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;
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

function getToken(req, TOKEN_COOKIE_KEY, JWT_SECRET_TOKEN){
    var Token = null;
    const incodeToken = req.cookies[TOKEN_COOKIE_KEY];
    if(incodeToken){
        Token = verifyToken(incodeToken, JWT_SECRET_TOKEN);
    }
    return Token;
}

async function findUser (email){
    var user = null;
    try {
        user = await fetchUser('email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    return user;
}

app.use(async (req, res, next) => {
    const AToken = getToken(req, ATOKEN_COOKIE_KEY, JWT_SECRET_ATOKEN)
    if (AToken) {
        req.email = AToken.email;
    }
    else{
        const RToken = getToken(req, RTOKEN_COOKIE_KEY, JWT_SECRET_RTOKEN)
        if(RToken){
            const email = RToken.email;
            const rid = await redisClient_EmailRToken.get(email);
            if(rid === RToken.rid){
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
        const user = findUser(req.email);

        if (user) {
            return res.redirect(`/main/main.html`);
        }
    }

    return res.redirect(`/login/login.html`);
});

app.use('/password', passwordRouter);
app.use('/oauth2/google', oauth2_googleRouter);
app.use('/email', emailRouter);
app.use('/user', userRouter);

app.listen(3000, () => {
    console.log('server is running at 3000');
});