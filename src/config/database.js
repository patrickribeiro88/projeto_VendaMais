// ==========================================================
// =============== CONFIGURAÇÃO DO BANCO DE DADOS ============
// ==========================================================
const mysql = require('mysql2/promise'); // Versão com Promises
require('dotenv').config(); // Carrega as variáveis do .env

// ==========================================================
// =============== CRIAÇÃO DO POOL DE CONEXÕES ===============
// ==========================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // número máximo de conexões simultâneas
  queueLimit: 0,
});

// ==========================================================
// =============== TESTE AUTOMÁTICO DE CONEXÃO ===============
// ==========================================================
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Conexão com o banco de dados MySQL estabelecida com sucesso!');
    conn.release(); // devolve a conexão ao pool
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(error.message);
  }
})();

// ==========================================================
// =============== EXPORTAÇÃO DO POOL ========================
// ==========================================================
module.exports = pool;
