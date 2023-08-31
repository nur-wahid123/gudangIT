const express = require('express');
const router = express.Router()
const util = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { conn } = require('./../controller/controller');
const { verificatedRoute } = require('../protected/protected');


const query = util.promisify(conn.query).bind(conn);

router.post("/api/register", async function (req, res) {
    const { name, username, email, password, passConf } = req.body;

    if (password !== passConf) {
        return res.json({ error: "Maaf konfirmasi password salah" });
    }

    try {
        const emailExists = await query(`SELECT email FROM admin WHERE email = ? LIMIT 1`, [email]);
        if (emailExists.length > 0) {
            return res.json({ error: "Maaf email sudah terdaftar" });
        }

        const usernameExists = await query(`SELECT username FROM admin WHERE username = ? LIMIT 1`, [username]);
        if (usernameExists.length > 0) {
            return res.json({ error: "Maaf username sudah digunakan" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await query(`INSERT INTO admin (name, username, email, password) VALUES (?, ?, ?, ?)`, [name, username, email, hashedPassword]);

        return res.json({ message: "Selamat akun anda terdaftar" });
    } catch (error) {
        console.error(error);
        return res.json({ error: "Terjadi kesalahan saat mendaftar" });
    }
});

router.post("/api/login", async (req, res) => {
    let { username, password } = req.body
    const user = await query(`select * from admin where username = ?`, [username])
    if (user.length == 0) return res.json({ error: "Username tidak ditemukan" })
    if (!await bcrypt.compare(password, user[0].password)) return res.json({ error: "Maaf Password anda salah" })
    const crd = user[0]
    console.log(process.env);
    const token = jwt.sign({user:crd},process.env.ACCESS_TOKEN_KEY,{expiresIn:'1h'})
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000,secure:true })
    await query(`UPDATE admin SET access_token = '${token}' WHERE username = '${username}'`);
    return res.json({ message: "Selamat Datang",token:token })
})

router.post("/api/data/:data",verificatedRoute, async (req, res) => {
    const table = req.params.data;
    const allowedTables = ["barang", "admin"];

    if (!allowedTables.includes(table)) {
        return res.status(200).json({ error: "Tabel tidak diizinkan" });
    }

    try {
        const data = await query(`SELECT * FROM ${table}`);
        return res.json(data);
    } catch (error) {
        return res.status(500).json({ error: "An error occurred" });
    }
});

router.post("/api/logout",async (req,res)=>{
    const token = req.headers.authorization;
    console.log(req.headers);
    let stoken = token.split(" ")
    stoken = stoken[1]
    await query("update admin set access_token = null where access_token = ?",[stoken])
    res.clearCookie('token'); 
    res.json({ message: 'Logout Berhasil' });
})

router.get("/api/",(req,res)=>{
    return res.json("Gaboleh ya")
})


module.exports = { router,query }