const express = require('express');
const router = express.Router()
const util = require('util');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { conn } = require('./../controller/controller');
const { verificatedRoute } = require('../protected/protected');

const query = util.promisify(conn.query).bind(conn);

router.post("/register", verificatedRoute, async function (req, res) {
    const { name, username, email, password, passConf, description } = req.body;
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
        await query(`INSERT INTO admin (name, username, email, password, deskripsi) VALUES (?, ?, ?, ?,?)`, [name, username, email, hashedPassword, description]);
        return res.json({ message: "Selamat akun anda terdaftar" });
    } catch (error) {
        console.error(error);
        return res.json({ error: "Terjadi kesalahan saat mendaftar" });
    }
});

router.post("/login", async (req, res) => {
    let { username, password } = req.body
    const user = await query(`select * from admin where username = ?`, [username])
    if (user.length == 0) return res.json({ error: "Username tidak ditemukan" })
    if (!await bcrypt.compare(password, user[0].password)) return res.json({ error: "Maaf Password anda salah" })
    const crd = {id:user[0].id,name:user[0].name,email:user[0].email}
    const crd1 = {id:user[0].id,name:user[0].name,email:user[0].email,deskripsi:user[0].deskripsi}
    const token = jwt.sign({ user: crd }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' })
    res.cookie('token', token, { httpOnly: true, maxAge: 3600000, secure: true })
    await query(`UPDATE admin SET access_token = '${token}' WHERE username = '${username}'`);
    return res.json({ message: "Selamat Datang", token: token, user:crd1 })
})

router.post("/data/kategori/tambah", verificatedRoute, async (req, res) => {
    const { nama, deskripsi } = req.body
    const idAdmin = req.user.id
    const categoryExists = await query(`SELECT nama FROM kategori WHERE nama = ? LIMIT 1`, [nama]);
    if (categoryExists.length > 0) {
        return res.json({ error: `Maaf Kategori ${nama} sudah terdaftar` });
    }
    try {
        await query("insert into kategori (nama,description) values (?,?)", [nama, deskripsi])
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Tambah Kategori", 0, `Membuat Kategori ${nama}`]
        );
        return res.json({ message: "Kategori berhasil ditambahkan" })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }

})
router.post("/data/kategori/edit", verificatedRoute, async (req, res) => {
    const { id, nama, deskripsi } = req.body
    const idAdmin = req.user.id
    try {
        const kategori = await query("select nama from kategori where id =?", [id])
        await query("update kategori set nama = ?, description = ? where id = ?", [nama, deskripsi, id])
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Edit Kategori", 0, `Mengedit Kategori ${kategori[0].nama} menjadi ${nama}`]
        );
        return res.json({ message: "Kategori berhasil diperbarui" })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }

})
router.post("/data/kategori/hapus/:id", verificatedRoute, async (req, res) => {
    const id = req.params.id
    const idAdmin = req.user.id
    try {
        const kategori = await query("select nama from kategori where id =?", [id])
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Hapus Kategori", 0, `Menghapus Kategori ${kategori[0].nama}`]
        );
        await query("delete from kategori where id = ?", [id])
        return res.json({ message: `Kategori berhasil dihapus` })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }

})

router.post("/isAuth", verificatedRoute, async (req, res) => {
    console.log("isAuth");
    return res.json(true)
})
router.post("/user", verificatedRoute, async (req, res) => {
    const id = req.user.id
    const user = await query("select name,username,email,deskripsi from admin where id =?", [id])
    console.log("user");
    return res.json(user[0])
})
router.post("/user/edit", verificatedRoute, async (req, res) => {
    const {nama,password,passConf,deskripsi} = req.body
    const id = req.user.id
    console.log(req);
    if(password!==""){
        if (password !== passConf) {
            return res.json({ error: "Maaf konfirmasi password salah" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            await query("update admin set name = ?, password = ?,deskripsi = ? where id = ?",[nama,hashedPassword,deskripsi,id])
            return res.json({message:"Edit data user berhasil"})
        } catch (error) {
            console.log(error);
            return res.json({message:"Terjadi Kesalahan"})
        }
        
    }else{
        try {
            await query("update admin set name = ?,deskripsi = ? where id = ?",[nama,deskripsi,id])
            return res.json({message:"Edit data user berhasil"})
        } catch (error) {
            console.log(error);
            return res.json({message:"Terjadi Kesalahan"})
        }

    }
})
router.post("/data/barang/tambah", verificatedRoute, async (req, res) => {
    const { nama, jumlah, kategori, deskripsi } = req.body
    const idAdmin = req.user.id
    const barangExists = await query(`SELECT nama FROM barang WHERE nama = ? LIMIT 1`, [nama]);
    if (barangExists.length > 0) {
        return res.json({ error: `Maaf ${nama} sudah terdaftar dalam data barang` });
    }
    try {
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Tambah Barang Baru", 0, `Menambah Barang Baru ${nama}`]
        );
        await query("insert into barang (nama,jumlah,kategori,deskripsi) values (?,?,?,?)", [nama, jumlah, kategori, deskripsi])
        return res.json({ message: "Barang berhasil ditambahkan" })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }
})
router.post("/data/barang/edit", verificatedRoute, async (req, res) => {
    const { id, nama, kategori, deskripsi } = req.body
    const idAdmin = req.user.id
    try {
        const barang = await query(`SELECT nama FROM barang WHERE id = ?`, [id]);
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Edit Barang", 0, `Mengedit Barang ${barang[0].nama} menjadi ${nama}`]
        );
        await query("update barang set nama = ?, kategori = ?, deskripsi = ? where id = ? ", [nama, kategori, deskripsi, id])
        return res.json({ message: `Informasi ${nama} berhasil di perbarui` })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }
})
router.post("/data/barang/hapus/:id", verificatedRoute, async (req, res) => {
    const id = req.params.id
    const idAdmin = req.user.id
    try {
        const barang = await query(`SELECT nama FROM barang WHERE id = ?`, [id]);
        await query(
            "INSERT INTO transaksi (admin_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, CURRENT_DATE(), ?, ?)",
            [idAdmin, "Hapus Barang", 0, `Menghapus Barang ${barang[0].nama}`]
        );
        await query("delete from barang where id = ? ", [id])
        return res.json({ message: `Barang berhasil di hapus` })
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }
})
router.post("/data/barang/transaksi", verificatedRoute, async (req, res) => {
    const { idBarang, jenis, jumlah, catatan } = req.body
    const idAdmin = req.user.id
    const jumlahAbs = jenis == "kurang" ? (-1 * jumlah) : jumlah
    try {
        const jml_awal_barang = await query("select jumlah from barang where id =?", [idBarang])
        const hasilAkhir = jml_awal_barang[0].jumlah + jumlahAbs
        if (hasilAkhir < 0) {
            return res.json({ error: "Barang Kurang" })
        } else {
            await query("update barang set jumlah = ? where id = ? ", [hasilAkhir, idBarang])
            await query(
                "INSERT INTO transaksi (admin_id, barang_id, jenis_transaksi, tanggal_transaksi, jumlah_berubah, catatan) VALUES (?, ?, ?, CURRENT_DATE(), ?, ?)",
                [idAdmin, idBarang, jenis, jumlahAbs, catatan]
            );
            return res.json({ message: `Transaksi Berhasil` })
        }
    } catch (error) {
        console.log(error);
        return res.json({ error: "Terjadi Kesalahan" })
    }
})

router.post("/data", verificatedRoute, async (req, res) => {
    const table = req.body.query;

    try {
        const data = await query(`${table}`);
        return res.json(data);
    } catch (error) {
        return res.status(200).json({ error: "An error occurred" });
    }
});

router.post("/logout", verificatedRoute, async (req, res) => {
    const token = req.user;
    await query("update admin set access_token = null where id = ?", [token.id])
    res.clearCookie('token');
    res.json({ message: 'Logout Berhasil' });

})

router.get("/", (req, res) => {
    return res.json("Gaboleh itu ya")
})


module.exports = { router, query }