const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

var {
    generateRandomString
} = require('../function.js');

var {
    redisClient_EmailCode
 } = require('../../db/redis/redis.js');

var {
    updatePassword
} = require('../../db/mysql/mysql.js')

const VERIFY_EMAIL = process.env.VERIFY_EMAIL;
const VERIFY_EMAIL_PASSWORD = process.env.VERIFY_EMAIL_PASSWORD;

async function sendEmail(email, authCode) {
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
        subject: '[howserver] 비밀번호 재설정 인증 메일입니다.',
        html: `<h2 style="margin: 20px 0">[howserver] ${authCode}</h2>`,
    });
}


async function recovery (req, res) {
    const email = req.body.email;

    const authCode = generateRandomString(6);

    await redisClient_EmailCode.set(email, authCode);
    await redisClient_EmailCode.expire(email, 300);

    req.session.email=email;
    
    sendEmail(email, authCode);

    const responseJSON = {
        success: true,
        message: ""
    }
    return res.status(200).send(responseJSON);
}

async function verification (req, res) {
    const email = req.body.email;
    const code = req.body.code;

    const redisCode = await redisClient_EmailCode.get(email);
    await redisClient_EmailCode.del('email');
    if(redisCode === code){
        const responseJSON = {
            success: true,
            message: "Code Match"
        }
        return res.status(200).send(responseJSON);
    }
    else{
        const responseJSON = {
            success: false,
            message: "Incorrect Code"
        }
        return res.status(200).send(responseJSON);
    }
}

async function reset (req, res) {
    const password = req.body.password;

    const email = req.session.email;
  
    req.session.destroy(()=>{
        req.session
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    updatePassword("email",email,hashedPassword);

    const responseJSON = {
        success: true,
        message: ""
    }
    return res.status(200).send(responseJSON);
}


module.exports = {
    recovery,
    verification,
    reset
}