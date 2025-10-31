// ==========================================================
// =============== MODEL: PRODUTO ===========================
// ==========================================================
const pool = require("../config/database");

// ==========================================================
// LISTAR PRODUTOS (com filtros opcionais)
// ==========================================================
async function listarProdutos(filtros = {}) {
  try {
    let sql = "SELECT * FROM produto";
    const params = [];

    if (filtros.id) {
      sql += " WHERE idProduto = ?";
      params.push(filtros.id);
    } else if (filtros.nome) {
      sql += " WHERE nome LIKE ?";
      params.push(`%${filtros.nome}%`);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error("❌ Erro ao listar produtos (model):", error);
    throw error;
  }
}

// ==========================================================
// BUSCAR POR ID
// ==========================================================
async function buscarPorId(idProduto) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM produto WHERE idProduto = ?",
      [idProduto]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Erro ao buscar produto por ID (model):", error);
    throw error;
  }
}

// ==========================================================
// CRIAR PRODUTO
// ==========================================================
async function criarProduto({ nome, categoria, precoVenda }) {
  try {
    await pool.query(
      "INSERT INTO produto (nome, categoria, precoVenda) VALUES (?, ?, ?)",
      [nome, categoria || null, precoVenda]
    );
    return { message: "✅ Produto cadastrado com sucesso!" };
  } catch (error) {
    console.error("❌ Erro ao criar produto (model):", error);
    throw error;
  }
}

// ==========================================================
// ATUALIZAR PRODUTO
// ==========================================================
async function atualizarProduto(idProduto, { nome, categoria, precoVenda }) {
  try {
    const [result] = await pool.query(
      "UPDATE produto SET nome = ?, categoria = ?, precoVenda = ? WHERE idProduto = ?",
      [nome, categoria || null, precoVenda, idProduto]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ Erro ao atualizar produto (model):", error);
    throw error;
  }
}

// ==========================================================
// EXCLUIR PRODUTO
// ==========================================================
async function excluirProduto(idProduto) {
  try {
    const [result] = await pool.query(
      "DELETE FROM produto WHERE idProduto = ?",
      [idProduto]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ Erro ao excluir produto (model):", error);
    throw error;
  }
}

module.exports = {
  listarProdutos,
  buscarPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
};
