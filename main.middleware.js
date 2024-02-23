var {db,
    fetchUser,
} = require('./db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken,
    verifyToken,
} = require('./route/function.js')

var {
    redisClient_EmailRToken
 } = require('./db/redis/redis.js');

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;
const SESSION_SECRET = process.env.SESSION_SECRET;

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

async function authToken (req, res, next) {
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
}

async function controlLoginPage(req, res){
    if (req.email) {
        const user = findUser(req.email);

        if (user) {
            return res.redirect(`/main/main.html`);
        }
    }

    return res.redirect(`/login/login.html`);
}

module.exports = {
    authToken,
    controlLoginPage
}