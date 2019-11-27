require('dotenv').config();
const mysql = require('mysql');
const util = require('util');

const pool_promisify = mysql.createPool({
    connectionLimit: 100,
    host: process.env.DBHOSTNAME,
    user: process.env.DATABASEUSER,
    password: process.env.DATABASEPASSWORD,
    database: process.env.DATABASENAME,
    port: process.env.DATABASEPORT,
    multipleStatements: true,
    dateStrings: true
});

pool_promisify.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) {
        connection.release();
    }
});
pool_promisify.query = util.promisify(pool_promisify.query);
module.exports = pool_promisify;
