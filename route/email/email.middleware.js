var {
    fetchUserColumns
} = require('../../db/mysql/mysql.js');

var {
    findUser_type
} = require('../function.js')

async function verification (req, res) {
    const email = req.body.email;

    const user = await findUser_type(email);

    if (user) {
        const responseJSON = {
            duplicate: true,
            type: user.type
        }
        return res.status(200).send(responseJSON);
    }
    else{
        const responseJSON = {
            duplicate: false
        }
        return res.status(200).send(responseJSON);
    }
}

module.exports = {
    verification
}