require('dotenv').config();
const mysql = require('mysql2/promise'); // Quay lại dùng mysql2

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1Qa1Qa!!', 
  database: process.env.DB_NAME || 'lostword',
  connectionLimit: 10
});

// Xuất trực tiếp pool ra (không dùng Object bọc ngoài nữa)
module.exports = pool;