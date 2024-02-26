const axios = require('axios');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';

var {
    fetchUserColumns,
    createUser
} = require('../../../db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken
} = require('../../function.js')


function redirectToGoogleSignIn (req, res) {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GOOGLE_CLIENT_ID}`
    url += `&redirect_uri=${GOOGLE_REDIRECT_URI}`
    url += '&response_type=code'
    url += '&scope=email profile'
    res.redirect(url);
}

async function getGoogleEmail(code){
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
    return resp2.data.email;
}

async function findUser(email){
    var user = null;
    try {
        user = await fetchUserColumns(['username', 'type'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    return user;
}

async function callback (req, res) {
    const { code } = req.query;

    if(code === undefined){
        return res.redirect(`/login/login.html`);
    }

    const email = await getGoogleEmail(code);

    const user = await findUser(email);

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
        } catch (error) {
            console.error('Error creating user:', error);
        }

        return res.redirect(`/welcome/welcome.html`);
    }
}

module.exports = {
    redirectToGoogleSignIn,
    callback
}