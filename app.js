const express = require('express');
const {router} = require('./route/route.js')
const cors = require('cors');
const dotenv = require("dotenv");
const cookie = require('cookie-parser');

dotenv.config()
const corsOptions = {
    origin: 'https://www.gudangit.indranurwahid.my.id',
    credentials: true, // Enable credentials (cookies, etc.)
  };
//halooo
const app = express()
app.use(cookie())
app.use(cors(corsOptions));
app.use(express.json())
app.use(router)
app.listen(5000, () => console.log("server running port 5000"))
