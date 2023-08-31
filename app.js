const express = require('express');
const {router} = require('./route/route.js')
const cors = require('cors');
const dotenv = require("dotenv");
const cookie = require('cookie-parser');

dotenv.config()

const app = express()
app.use(cookie())
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    credentials: true // Allow cookies and other credentials
}));
app.use(express.json())
app.use(router)
app.listen(5000, () => console.log("server running port 5000"))
