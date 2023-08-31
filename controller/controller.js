const mysql = require('mysql');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gudang_it'
});
module.exports = {conn}


