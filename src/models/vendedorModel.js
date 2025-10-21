// ==========================================================
// =============== MODEL: VENDEDOR ===========================
// ==========================================================
const db = require('../config/database');

const bcrypt = require('bcryptjs');

// ----------------------------------------------------------
// Criar novo vendedor (com senha criptografada)
// ----------------------------------------------------------
async function criarVendedor(vendedor) {
  try {
    // Criptografa a senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(vendedor.senha, salt);

    const sql = `
      INSERT INTO vendedor (nome, email, senha)
      VALUES (?, ?, ?)
    `;
    const values = [vendedor.nome, vendedor.email, senhaCriptografada];

    const [result] = await db.query(sql, values);
    return result.insertId;

  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    throw error;
  }
}

// ----------------------------------------------------------
// Buscar vendedor pelo email (para login)
// ----------------------------------------------------------
async function buscarPorEmail(email) {
  try {
    const sql = `SELECT * FROM vendedor WHERE email = ?`;
    const [rows] = await db.query(sql, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar vendedor por email:', error);
    throw error;
  }
}

// ----------------------------------------------------------
// Exportação das funções
// ----------------------------------------------------------
module.exports = {
  criarVendedor,
  buscarPorEmail
};
