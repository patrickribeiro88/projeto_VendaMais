// ==========================================================
// 🧠 MODEL: CONSULTA DE CLIENTES (Atualizado)
// ==========================================================
const db = require("../config/database");

// ----------------------------------------------------------
// Buscar clientes com filtros (ID, nome, CPF, status)
// ----------------------------------------------------------
async function buscarClientes({ id, nome, cpf, status }) {
  let sql = `
    SELECT idCliente, nome, cpf, telefone1, email, endereco, cidade, status, observacao
    FROM cliente
    WHERE 1=1
  `;
  const params = [];

  if (id) {
    sql += " AND idCliente = ?";
    params.push(id);
  }
  if (nome) {
    sql += " AND nome LIKE ?";
    params.push(`%${nome}%`);
  }
  if (cpf) {
    sql += " AND cpf LIKE ?";
    params.push(`%${cpf}%`);
  }
  if (status && status !== "todos") {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY nome ASC";

  const [rows] = await db.query(sql, params);
  return rows;
}

// ----------------------------------------------------------
// Buscar cliente específico com observação
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const [rows] = await db.query(
    `SELECT idCliente, nome, cpf, telefone1, email, endereco, cidade, status, observacao
     FROM cliente
     WHERE idCliente = ?`,
    [idCliente]
  );
  return rows[0] || null;
}

// ----------------------------------------------------------
// Buscar vendas relacionadas a um cliente (com desconto)
// ----------------------------------------------------------
async function buscarVendasPorCliente(idCliente) {
  const [rows] = await db.query(
    `SELECT 
       v.idVenda,
       v.idCliente,
       c.nome AS cliente,
       DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
       v.valorTotal,
       v.desconto
     FROM vendas v
     LEFT JOIN cliente c ON v.idCliente = c.idCliente
     WHERE v.idCliente = ?
     ORDER BY v.dataVenda DESC`,
    [idCliente]
  );
  return rows;
}

// ----------------------------------------------------------
// Buscar detalhes de uma venda (com itens e desconto)
// ----------------------------------------------------------
async function buscarVendaPorId(idVenda) {
  const [vendaRows] = await db.query(
    `SELECT 
       v.idVenda,
       v.idCliente,
       c.nome AS cliente,
       DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
       v.valorTotal,
       v.desconto
     FROM vendas v
     LEFT JOIN cliente c ON v.idCliente = c.idCliente
     WHERE v.idVenda = ?`,
    [idVenda]
  );

  if (vendaRows.length === 0) return null;

  const [itensRows] = await db.query(
    `SELECT 
       i.idItem,
       p.nome AS produto,
       i.quantidade,
       i.precoUnitario,
       (i.quantidade * i.precoUnitario) AS subtotal
     FROM itens_venda i
     INNER JOIN produto p ON i.idProduto = p.idProduto
     WHERE i.idVenda = ?`,
    [idVenda]
  );

  return { ...vendaRows[0], itens: itensRows };
}

module.exports = {
  buscarClientes,
  buscarClientePorId,
  buscarVendasPorCliente,
  buscarVendaPorId,
};
