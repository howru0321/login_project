const bcrypt = require('bcrypt');
const axios = require('axios');

var {
    fetchUserColumns,
    createUser,
    removeUser
} = require('../../db/mysql/mysql.js');

var {
    generateAToken,
    generateRToken,
    getToken,
    findgoogleaccesstoken
} = require('../function.js')

const ATOKEN_COOKIE_KEY = 'ATOKEN';
const RTOKEN_COOKIE_KEY = 'RTOKEN';
const JWT_SECRET_ATOKEN = process.env.JWT_SECRET_ATOKEN;
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

async function signup (req, res) {
    const { email, password } = req.body;

    const type = "general";
    const googleaccesstoken = null;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await createUser(email, googleaccesstoken, hashedPassword, type);
        const responseJSON = {
            success: true,
            message: "User created successfully."
        }
        return res.status(200).send(responseJSON);
    } catch (error) {
        console.error('Error creating user:', error);
        const responseJSON = {
            success: false,
            message: "Failed to create user."
        }
        return res.status(500).send(responseJSON);
    }
}

async function signin (req, res) {
    const { email, password } = req.body;

    var user_Password;
    try {
        user_Password = await fetchUserColumns(['password'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    const matchPassword = await bcrypt.compare(password, user_Password.password);
    if (!matchPassword) {
        const responseJSON = {
            success: false,
            message: "Incorrect Password"
        }
        return res.status(200).send(responseJSON);
    }

    const newAToken = generateAToken(email);
    const newRToken = generateRToken(email);

    res.cookie(RTOKEN_COOKIE_KEY, newRToken);
    res.cookie(ATOKEN_COOKIE_KEY, newAToken);

    const responseJSON = {
        success: true,
        message: "Authorized"
    }
    return res.status(200).send(responseJSON);
}

async function withdraw (req, res) {
    const AToken = getToken(req, ATOKEN_COOKIE_KEY, JWT_SECRET_ATOKEN);
    if(AToken){
        const email = AToken.email;

        const user_googleaccesstoken = await findgoogleaccesstoken(email);

        if(user_googleaccesstoken.googleaccesstoken){
            const googleaccesstoken = "token=" + user_googleaccesstoken.googleaccesstoken;
            const revokeRequestHeaders = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(googleaccesstoken)
                  }
            };
            const res = await axios.post(GOOGLE_REVOKE_URL, googleaccesstoken, { headers: revokeRequestHeaders } )
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
        }


        try {
            user = await removeUser('email', email);
        } catch (error) {
            console.error('Error removing user:', error);
        }
        res.clearCookie(ATOKEN_COOKIE_KEY);
        res.clearCookie(RTOKEN_COOKIE_KEY);

        

        res.redirect('/howserver');
    }
}

async function logout (req, res) {
    res.clearCookie(ATOKEN_COOKIE_KEY);
    res.clearCookie(RTOKEN_COOKIE_KEY);
    res.redirect('/howserver');
}

module.exports = {
    signup,
    signin,
    withdraw,
    logout
}