// ==========================================================
// 🧠 MODEL: CONSULTA COMPLETO
// ==========================================================
const db = require("../config/database");

// ----------------------------------------------------------
// Clientes — Com filtros
// ----------------------------------------------------------
async function buscarClientes({ id, nome, cpf, status }) {
  let sql = `
    SELECT idCliente, nome, cpf, telefone1, email, endereco, cidade, status, observacao, dataNascimento
    FROM cliente
    WHERE 1=1
  `;
  const params = [];

  if (id) { sql += " AND idCliente = ?"; params.push(id); }
  if (nome) { sql += " AND nome LIKE ?"; params.push(`%${nome}%`); }
  if (cpf) { sql += " AND cpf LIKE ?"; params.push(`%${cpf}%`); }
  if (status && status !== "todos") { sql += " AND status = ?"; params.push(status); }

  sql += " ORDER BY nome ASC";
  const [rows] = await db.query(sql, params);
  return rows;
}

// ----------------------------------------------------------
// Cliente específico
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const [rows] = await db.query(
    `SELECT idCliente, nome, cpf, telefone1, email, endereco, cidade, status, observacao, dataNascimento
     FROM cliente
     WHERE idCliente = ?`,
    [idCliente]
  );
  return rows[0] || null;
}

// ----------------------------------------------------------
// Vendas do cliente
// ----------------------------------------------------------
async function buscarVendasPorCliente(idCliente) {
  const [rows] = await db.query(
    `SELECT 
      v.idVenda,
      v.idCliente,
      DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
      v.valorTotal,
      v.desconto
     FROM vendas v
     WHERE v.idCliente = ?
     ORDER BY v.dataVenda DESC`,
    [idCliente]
  );
  return rows;
}

// ----------------------------------------------------------
// Venda detalhada
// ----------------------------------------------------------
async function buscarVendaPorId(idVenda) {
  const [vendaRows] = await db.query(
    `SELECT 
      v.idVenda,
      v.idCliente,
      DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
      v.valorTotal,
      v.desconto
     FROM vendas v
     WHERE v.idVenda = ?`,
    [idVenda]
  );

  if (vendaRows.length === 0) return null;

  const [itensRows] = await db.query(
    `SELECT 
      p.nome AS produto,
      i.quantidade,
      i.precoUnitario,
      (i.quantidade * i.precoUnitario) AS subtotal
     FROM itens_venda i
     INNER JOIN produto p ON p.idProduto = i.idProduto
     WHERE i.idVenda = ?`,
    [idVenda]
  );

  return { ...vendaRows[0], itens: itensRows };
}

// ==========================================================
// 🔴 INATIVOS / NÃO RECORRENTES
// ==========================================================

// ----------------------------------------------------------
// Lista geral de inativos (>= 5 dias sem comprar)
// + filtro por nome/CPF/telefone
// ----------------------------------------------------------
async function buscarInativos(filtro = "") {
  const like = `%${filtro}%`;

  const sql = `
    SELECT 
      c.idCliente,
      c.nome,
      c.cpf,
      c.telefone1,
      DATE_FORMAT(MAX(v.dataVenda), '%d/%m/%Y') AS ultimaCompra,
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo
    FROM cliente c
    LEFT JOIN vendas v ON v.idCliente = c.idCliente
    WHERE 1 = 1
      AND (
        c.nome LIKE ? 
        OR c.cpf LIKE ?
        OR c.telefone1 LIKE ?
      )
    GROUP BY c.idCliente
    HAVING diasInativo >= 5
    ORDER BY diasInativo DESC
  `;

  const [rows] = await db.query(sql, [like, like, like]);
  return rows;
}

// ----------------------------------------------------------
// Inativos filtrados por período (X dias ou mais)
// ----------------------------------------------------------
async function buscarInativosPorPeriodo(dias) {
  const sql = `
    SELECT 
      c.idCliente,
      c.nome,
      c.cpf,
      c.telefone1,
      DATE_FORMAT(MAX(v.dataVenda), '%d/%m/%Y') AS ultimaCompra,
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo
    FROM cliente c
    LEFT JOIN vendas v ON v.idCliente = c.idCliente
    GROUP BY c.idCliente
    HAVING diasInativo >= ?
    ORDER BY diasInativo DESC
  `;

  const [rows] = await db.query(sql, [dias]);
  return rows;
}

// ----------------------------------------------------------
// Última venda de um cliente inativo (para modal)
// ----------------------------------------------------------
async function buscarUltimaVendaInativo(idCliente) {
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
     WHERE v.idCliente = ?
     ORDER BY v.dataVenda DESC
     LIMIT 1`,
    [idCliente]
  );

  if (vendaRows.length === 0) return null;

  const idVenda = vendaRows[0].idVenda;

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
  // consulta clientes / vendas
  buscarClientes,
  buscarClientePorId,
  buscarVendasPorCliente,
  buscarVendaPorId,

  // inativos
  buscarInativos,
  buscarInativosPorPeriodo,
  buscarUltimaVendaInativo,
};
