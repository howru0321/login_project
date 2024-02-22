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
        subject: '[howserver] 회원가입 인증 메일입니다.',
        html: `<form action= method="POST">
        <h2 style="margin: 20px 0">[company] ${authCode}</h2>
        <button style=" background-color: #ff2e00; color:#fff; width: 80px; height:40px; border-radius: 20px; border: none;">가입확인</button>
      </form>`,
    });
}


async function recovery (req, res) {
    const email = req.body.email;

    const authCode = generateRandomString(6);

    await redisClient_EmailCode.set(email, authCode);
    await redisClient_EmailCode.expire(email, 300);

    req.session.email=email;
    
    sendEmail(email, authCode);

    return res.status(200).send();
}

async function verification (req, res) {
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
}

async function reset (req, res) {
    const password = req.body.password;

    const email = req.session.email;
  
    req.session.destroy(()=>{
        req.session
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    updatePassword("email",email,hashedPassword);

    return res.status(200).send();
}


module.exports = {
    recovery,
    verification,
    reset
}