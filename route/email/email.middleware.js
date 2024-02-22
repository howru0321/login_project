var {
    fetchUserColumns
} = require('../../db/mysql/mysql.js');

async function verification (req, res) {
    const email = req.body.email;
    
    var user;
    try {
        user = await fetchUserColumns(['type'], 'email', email);
    } catch (error) {
        console.error('Error fetching user:', error);
    }

    if (user) {
        return res.status(207).send({duplicate: true, type: user.type});
    }
    else{
        return res.status(207).send({duplicate: false});
    }
}

module.exports = {
    verification
}