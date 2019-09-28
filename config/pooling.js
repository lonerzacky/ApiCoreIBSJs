require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DBHOSTNAME,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASENAME,
    port: process.env.DATABASEPORT,
    multipleStatements: true,
    dateStrings: true
});

module.exports = pool;
