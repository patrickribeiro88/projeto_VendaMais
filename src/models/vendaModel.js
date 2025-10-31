// ==========================================================
// =============== MODEL: VENDAS ============================
// ==========================================================
const pool = require("../config/database");

// ==========================================================
// LISTAR TODAS AS VENDAS
// ==========================================================
async function listarVendas() {
  try {
    const [rows] = await pool.query(`
      SELECT v.idVenda, c.nome AS cliente, v.valorTotal, 
             DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda, v.status
      FROM vendas v
      LEFT JOIN cliente c ON v.idCliente = c.idCliente
      ORDER BY v.dataVenda DESC
    `);
    return rows;
  } catch (error) {
    console.error("Erro ao listar vendas (model):", error);
    throw error;
  }
}

// ==========================================================
// BUSCAR VENDA POR ID
// ==========================================================
async function buscarPorId(idVenda) {
  try {
    const [vendaRows] = await pool.query(
      `SELECT * FROM vendas WHERE idVenda = ?`,
      [idVenda]
    );

    if (vendaRows.length === 0) return null;

    const [itensRows] = await pool.query(
      `SELECT i.*, p.nome AS produto 
       FROM itens_venda i
       INNER JOIN produto p ON i.idProduto = p.idProduto
       WHERE i.idVenda = ?`,
      [idVenda]
    );

    return { ...vendaRows[0], itens: itensRows };
  } catch (error) {
    console.error("Erro ao buscar venda por ID (model):", error);
    throw error;
  }
}

// ==========================================================
// CRIAR NOVA VENDA
// ==========================================================
async function criarVenda({ idCliente, itens }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cria a venda inicial
    const [resultVenda] = await connection.query(
      "INSERT INTO vendas (idCliente, valorTotal) VALUES (?, 0.00)",
      [idCliente || null]
    );

    const idVenda = resultVenda.insertId;
    let valorTotal = 0;

    // Insere itens da venda
    for (const item of itens) {
      const subtotal = item.quantidade * item.precoUnitario;
      valorTotal += subtotal;

      await connection.query(
        "INSERT INTO itens_venda (idVenda, idProduto, quantidade, precoUnitario) VALUES (?, ?, ?, ?)",
        [idVenda, item.idProduto, item.quantidade, item.precoUnitario]
      );
    }

    // Atualiza o valor total na tabela vendas
    await connection.query("UPDATE vendas SET valorTotal = ? WHERE idVenda = ?", [
      valorTotal,
      idVenda,
    ]);

    await connection.commit();
    return { idVenda, valorTotal };
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao criar venda (model):", error);
    throw error;
  } finally {
    connection.release();
  }
}

// ==========================================================
// ATUALIZAR VENDA (somente status ou cliente)
// ==========================================================
async function atualizarVenda(idVenda, { idCliente, status }) {
  try {
    const [result] = await pool.query(
      "UPDATE vendas SET idCliente = ?, status = ? WHERE idVenda = ?",
      [idCliente || null, status || "ATIVA", idVenda]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Erro ao atualizar venda (model):", error);
    throw error;
  }
}

// ==========================================================
// EXCLUIR VENDA E ITENS ASSOCIADOS
// ==========================================================
async function excluirVenda(idVenda) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM itens_venda WHERE idVenda = ?", [idVenda]);
    const [result] = await connection.query("DELETE FROM vendas WHERE idVenda = ?", [idVenda]);

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao excluir venda (model):", error);
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listarVendas,
  buscarPorId,
  criarVenda,
  atualizarVenda,
  excluirVenda,
};
