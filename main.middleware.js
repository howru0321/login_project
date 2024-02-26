const axios = require('axios');

var {db,
    fetchUser,
} = require('./db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken,
    verifyToken,
    getToken
} = require('./route/function.js');

var {
    redisClient_EmailRToken
 } = require('./db/redis/redis.js');

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;

async function findUser (email){
    var user = null;
    try {
        user = await fetchUser('email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    return user;
}

async function access_token (req) {
    const AToken = getToken(req, ATOKEN_COOKIE_KEY, JWT_SECRET_ATOKEN);
    if(AToken){
        const responseJSON = {
            success: true,
            message: "Access token is valid."
          };
        return responseJSON;
    }
    else{
        const responseJSON = {
            success: false,
            message: "Access token is invalid."
          };
        return responseJSON;
    }
}

async function refresh_token(req) {
    const RToken = getToken(req, RTOKEN_COOKIE_KEY, JWT_SECRET_RTOKEN);

    if(RToken){
        const email = RToken.email;
        const rid = await redisClient_EmailRToken.get(email);
        if(rid === RToken.rid){
            const newAToken = generateAToken(email);
            const newRToken = generateRToken(email);

            const responseJSON = {
                success: true,
                access_token: newAToken,
                refresh_token: newRToken,
                token_type: "Bearer",
                message: "Refresh token is valid."
            }
            return responseJSON;
        }
        else{
            const responseJSON = {
                success: false,
                message: "Refresh token is not in DB."
            }
            return responseJSON;//409
        }
    }
    else{
        const responseJSON = {
            success: false,
            message: "Refresh token is invalid."
        }
        return responseJSON;//401
    }
}

async function authToken (req, res, next) {
    const res_atoken = await access_token(req);
    if(!res_atoken.success){
        const res_rtoken = await refresh_token(req);
        if(!res_rtoken.success){
            return res.redirect(`/login/login.html`);
        }
        else{
            const newAToken = res_rtoken.access_token;
            const newRToken = res_rtoken.refresh_token;
            res.cookie(ATOKEN_COOKIE_KEY, newAToken);
            res.cookie(RTOKEN_COOKIE_KEY, newRToken);
            return redirect(req.url);
        }
    }
    next();
}

async function controlLoginPage(req, res, next){
    const AToken = getToken(req, ATOKEN_COOKIE_KEY, JWT_SECRET_ATOKEN);
    const email = AToken.email;
    const user = findUser(email);
    if (user) {
        return res.redirect(`/main/main.html`);
    }
    return res.redirect(`/login/login.html`);
}

module.exports = {
    authToken,
    controlLoginPage
}