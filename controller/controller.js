const mysql = require('mysql');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'indranur_admin',
    password: 'adminbro123',
    database: 'indranur_halo'
});
module.exports = {conn}


