require('dotenv').config();
const mysql = require('mysql');

const poolSys = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DBHOSTNAME,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASENAMESYS,
    port: process.env.DATABASEPORT,
    multipleStatements: true,
    dateStrings: true
});

module.exports = poolSys;
