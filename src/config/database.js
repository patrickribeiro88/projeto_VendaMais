// ==========================================================
// =============== CONFIGURAÇÃO DO BANCO DE DADOS ============
// ==========================================================
const mysql = require("mysql2/promise");
require("dotenv").config();

// ==========================================================
// =============== CRIAÇÃO DO POOL DE CONEXÕES ===============
// ==========================================================
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT), // 🔥 Porta sempre número!
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // 🔥 Railway exige SSL desabilitado para autorização
  },
});

// ==========================================================
// =============== TESTE AUTOMÁTICO DE CONEXÃO ===============
// ==========================================================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexão com o banco Railway MySQL estabelecida com sucesso!");
    conn.release();
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco Railway:");
    console.error(error.message);
  }
})();

// ==========================================================
// =============== EXPORTAÇÃO DO POOL ========================
// ==========================================================
module.exports = pool;
