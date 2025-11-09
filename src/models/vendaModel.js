// ==========================================================
// =============== MODEL: VENDAS ============================
// ==========================================================
const db = require("../config/database");

// ----------------------------------------------------------
// LISTAR TODAS AS VENDAS
// ----------------------------------------------------------
async function listarVendas() {
  try {
    const [rows] = await db.query(`
      SELECT 
        v.idVenda, 
        c.nome AS cliente,
        v.valorTotal,
        v.desconto,
        DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
        v.status
      FROM vendas v
      LEFT JOIN cliente c ON v.idCliente = c.idCliente
      ORDER BY v.dataVenda DESC
    `);
    return rows;
  } catch (error) {
    console.error("❌ Erro ao listar vendas (model):", error);
    throw error;
  }
}

// ----------------------------------------------------------
// BUSCAR VENDA POR ID (detalhes e itens)
// ----------------------------------------------------------
async function buscarPorId(idVenda) {
  try {
    const [vendaRows] = await db.query(
      `
      SELECT 
        v.idVenda,
        v.idCliente,
        c.nome AS cliente,
        v.valorTotal,
        v.desconto,
        v.status,
        DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda
      FROM vendas v
      LEFT JOIN cliente c ON v.idCliente = c.idCliente
      WHERE v.idVenda = ?
      `,
      [idVenda]
    );

    if (vendaRows.length === 0) return null;

    const [itensRows] = await db.query(
      `
      SELECT 
        i.idItem,
        i.idProduto,
        p.nome AS produto,
        i.quantidade,
        i.precoUnitario,
        (i.quantidade * i.precoUnitario) AS subtotal
      FROM itens_venda i
      INNER JOIN produto p ON i.idProduto = p.idProduto
      WHERE i.idVenda = ?
      `,
      [idVenda]
    );

    return { ...vendaRows[0], itens: itensRows };
  } catch (error) {
    console.error("❌ Erro ao buscar venda por ID (model):", error);
    throw error;
  }
}

// ----------------------------------------------------------
// CRIAR NOVA VENDA (agora com suporte a DESCONTO)
// ----------------------------------------------------------
async function criarVenda({ idCliente, valorTotal, desconto = 0, itens }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    console.log("📦 Itens recebidos no model:", itens);

    // 🔹 Insere a venda principal com desconto
    const [vendaResult] = await connection.query(
      `INSERT INTO vendas (idCliente, valorTotal, desconto, dataVenda)
       VALUES (?, 0, ?, NOW())`,
      [idCliente || null, desconto]
    );

    const idVenda = vendaResult.insertId;
    let totalCalculado = 0;

    // 🔹 Insere os itens da venda
    for (const item of itens) {
      const subtotal = parseFloat(item.quantidade) * parseFloat(item.precoUnitario);
      totalCalculado += subtotal;

      await connection.query(
        `INSERT INTO itens_venda (idVenda, idProduto, quantidade, precoUnitario)
         VALUES (?, ?, ?, ?)`,
        [idVenda, item.idProduto, item.quantidade, item.precoUnitario]
      );
    }

    // 🔹 Aplica o desconto e atualiza o valor total final
    const totalComDesconto = Math.max(totalCalculado - parseFloat(desconto || 0), 0);

    await connection.query(
      `UPDATE vendas SET valorTotal = ?, desconto = ? WHERE idVenda = ?`,
      [totalComDesconto, desconto, idVenda]
    );

    await connection.commit();

    console.log(`✅ Venda criada com ID ${idVenda} | Total: R$ ${totalComDesconto}`);
    return { idVenda, valorTotal: totalComDesconto, desconto };
  } catch (error) {
    await connection.rollback();
    console.error("❌ Erro ao criar venda (model):", error);
    throw error;
  } finally {
    connection.release();
  }
}

// ----------------------------------------------------------
// ATUALIZAR VENDA (status ou cliente)
// ----------------------------------------------------------
async function atualizarVenda(idVenda, { idCliente, status }) {
  try {
    const [result] = await db.query(
      `UPDATE vendas SET idCliente = ?, status = ? WHERE idVenda = ?`,
      [idCliente || null, status || "ATIVA", idVenda]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ Erro ao atualizar venda (model):", error);
    throw error;
  }
}

// ----------------------------------------------------------
// EXCLUIR VENDA E ITENS ASSOCIADOS
// ----------------------------------------------------------
async function excluirVenda(idVenda) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`DELETE FROM itens_venda WHERE idVenda = ?`, [idVenda]);
    const [result] = await connection.query(`DELETE FROM vendas WHERE idVenda = ?`, [idVenda]);

    await connection.commit();
    console.log(`🗑️ Venda ${idVenda} excluída com sucesso!`);
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error("❌ Erro ao excluir venda (model):", error);
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
