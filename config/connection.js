require('dotenv').config();
const mysql = require('mysql');

const conn = mysql.createConnection({
    host: process.env.DBHOSTNAME,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASENAME,
    port: process.env.DATABASEPORT
});

module.exports = conn;