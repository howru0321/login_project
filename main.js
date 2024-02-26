const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const memoryStore = require('memorystore')(expressSession);
require('dotenv').config();

const mainMid = require('./main.middleware.js');

var userRouter = require('./route/user/user.js');
var emailRouter = require('./route/email/email.js');
var passwordRouter = require('./route/password/password.js');
var oauth2_googleRouter = require('./route/oauth2/google/google.js');

const app = express();

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
app.use('/howserver', mainMid.authToken);
app.get('/howserver', mainMid.controlLoginPage);

app.use('/password', passwordRouter);
app.use('/oauth2/google', oauth2_googleRouter);
app.use('/email', emailRouter);
app.use('/user', userRouter);

app.listen(3000, () => {
    console.log('server is running at 3000');
});