require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 20096, // Bắt buộc phải có port của Aiven (20096)
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false // Bắt buộc đối với Aiven MySQL
    },
    connectionLimit: 10
});

module.exports = pool;