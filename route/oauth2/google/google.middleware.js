const axios = require('axios');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';

var {
    createUser
} = require('../../../db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken,
    findUser_type
} = require('../../function.js')


function redirectToGoogleSignIn (req, res) {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'
    res.redirect(url);
}

async function getGoogleAccessToken(code){
    const authorizationCodeRequest = {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
    };
    const res = await axios.post(GOOGLE_TOKEN_URL, authorizationCodeRequest)
        .catch(function (error){
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
            console.log(error.config);
        });
    
    console.log(res.data);

    return res.data.access_token;
}

async function getGoogleUserInfo(access_token){
    const userInfoRequest = {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    };
    const res = await axios.get(GOOGLE_USERINFO_URL, userInfoRequest)
        .catch(function (error){
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
            console.log(error.config);
        });


    return res.data;
}

async function callback (req, res) {
    const { code } = req.query;

    console.log(req.url);

    if(code === undefined){
        return res.redirect(`/login/login.html`);
    }

    const googleAToken = await getGoogleAccessToken(code);

    const userInfo = await getGoogleUserInfo(googleAToken);

    const email = userInfo.email;

    const user = await findUser_type(email);

    if(user){
        if(user.type !== "google"){
            return res.redirect(`/gotosignin/gotosignin.html`);
        }
        const newAToken = generateAToken(email);
        const newRToken = generateRToken(email);

        res.cookie(RTOKEN_COOKIE_KEY, newRToken);
        res.cookie(ATOKEN_COOKIE_KEY, newAToken);
        res.redirect('/howserver');
    }
    else{
        const password=null;
        const type = "google";
        const username = null;
 
        try {
            await createUser(email, username, password, type);
            return res.redirect(`/welcome/welcome.html`);
        } catch (error) {
            if(error.response){
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            }else if(error.request){
                console.log(error.request);
            }else{
                console.log('Error', error.message);
            }
            console.log(error.config);
        }
    }
}

module.exports = {
    redirectToGoogleSignIn,
    callback
}