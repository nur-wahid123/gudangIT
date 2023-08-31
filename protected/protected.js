const jwt = require('jsonwebtoken');
const util = require('util');
const { conn } = require('../controller/controller');


const query = util.promisify(conn.query).bind(conn);

async function verificatedRoute(req,res,next){
    const token = req.headers.authorization;
    let stoken = token.split(" ")
    stoken = stoken[1]
    const userToken = await query(`SELECT access_token FROM admin WHERE access_token = ?`, [stoken]);
    if (stoken== undefined) {
        return res.json({ error: 'Unauthorized' });
    }
    console.log(userToken);
    if(userToken.length==0){
        return res.json({error:"Tidak dikenal, Silahkan Login kembali"})
    }

    jwt.verify(stoken, process.env.ACCESS_TOKEN_KEY, (err, decodedToken) => {
        if (err) {
            return res.json({ error: 'Invalid token' });
        }
        req.user = decodedToken.user;
        next();
    });
}

module.exports = {verificatedRoute}