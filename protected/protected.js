const jwt = require('jsonwebtoken');
const util = require('util');
const { conn } = require('../controller/controller');


const query = util.promisify(conn.query).bind(conn);

async function verificatedRoute(req, res, next) {
    const token = req.cookies.token;
    console.log(req.cookies);
    if (!token) {
        return res.json({ error: 'Unauthorized' });
    }
    const userToken = await query(`SELECT access_token FROM admin WHERE access_token = ?`, [token]);
    if (userToken.length == 0) {
        return res.json({ error: "Tidak dikenal, Silahkan Login kembali" })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, decodedToken) => {
        if (err) {
            return res.json({ error: 'Invalid token' });
        }
        req.user = decodedToken.user;
        next();
    });
}

module.exports = { verificatedRoute }