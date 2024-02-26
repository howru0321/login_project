const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const JWT_SECRET_RTOKEN = process.env.JWT_SECRET_RTOKEN;

var {
    redisClient_EmailRToken
 } = require('../db/redis/redis');


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

function getToken(req, TOKEN_COOKIE_KEY, JWT_SECRET_TOKEN){
    var Token = null;
    const incodeToken = req.cookies[TOKEN_COOKIE_KEY];
    if(incodeToken){
        Token = verifyToken(incodeToken, JWT_SECRET_TOKEN);
    }
    return Token;
}

module.exports = {
    generateAToken,
    generateRToken,
    verifyToken,
    generateRandomString,
    getToken
}