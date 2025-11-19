// ==========================================================
// 🧠 MODEL: CONSULTA COMPLETO (COM STATUS AUTOMÁTICO)
// ==========================================================
const db = require("../config/database");

// ==========================================================
// 📌 Status Automático
// Cliente é INATIVO se está há >= 5 dias sem comprar
// ==========================================================

// ----------------------------------------------------------
// Clientes — Com filtros (ID, Nome, CPF e Status)
// ----------------------------------------------------------
async function buscarClientes({ id, nome, cpf, status }) {
  let sql = `
    SELECT 
      c.idCliente, 
      c.nome, 
      c.cpf, 
      c.telefone1, 
      c.email, 
      c.endereco, 
      c.cidade, 
      c.observacao, 
      c.dataNascimento,
      DATE_FORMAT(MAX(v.dataVenda), '%d/%m/%Y') AS ultimaCompra,
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo,
      CASE 
          WHEN DATEDIFF(CURDATE(), MAX(v.dataVenda)) >= 5 THEN 'INATIVO'
          ELSE 'ATIVO'
      END AS statusCliente
    FROM cliente c
    LEFT JOIN vendas v ON v.idCliente = c.idCliente
    WHERE 1 = 1
  `;

  const params = [];

  // ----- FILTROS -----
  if (id) {
    sql += " AND c.idCliente = ?";
    params.push(id);
  }

  if (nome) {
    sql += " AND c.nome LIKE ?";
    params.push(`%${nome}%`);
  }

  if (cpf) {
    sql += " AND c.cpf LIKE ?";
    params.push(`%${cpf}%`);
  }

  // GROUP BY antes do HAVING (correto!)
  sql += `
    GROUP BY c.idCliente
  `;

  // ----- FILTRO POR STATUS -----
  if (status && status !== "todos") {
    sql += ` HAVING statusCliente = ?`;
    params.push(status);
  }

  sql += `
    ORDER BY c.nome ASC
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

// ----------------------------------------------------------
// Buscar cliente por ID com status automático
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const [rows] = await db.query(
    `
    SELECT 
      c.idCliente, 
      c.nome, 
      c.cpf, 
      c.telefone1, 
      c.email, 
      c.endereco, 
      c.cidade, 
      c.observacao, 
      c.dataNascimento,
      DATE_FORMAT(MAX(v.dataVenda), '%d/%m/%Y') AS ultimaCompra,
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo,
      CASE 
          WHEN DATEDIFF(CURDATE(), MAX(v.dataVenda)) >= 5 THEN 'INATIVO'
          ELSE 'ATIVO'
      END AS statusCliente
    FROM cliente c
    LEFT JOIN vendas v ON v.idCliente = c.idCliente
    WHERE c.idCliente = ?
    GROUP BY c.idCliente
    `,
    [idCliente]
  );

  return rows[0] || null;
}

// ----------------------------------------------------------
// Vendas do cliente
// ----------------------------------------------------------
async function buscarVendasPorCliente(idCliente) {
  const [rows] = await db.query(
    `
    SELECT 
      v.idVenda,
      v.idCliente,
      DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
      v.valorTotal,
      v.desconto
    FROM vendas v
    WHERE v.idCliente = ?
    ORDER BY v.dataVenda DESC
    `,
    [idCliente]
  );

  return rows;
}

// ----------------------------------------------------------
// Venda detalhada + itens
// ----------------------------------------------------------
async function buscarVendaPorId(idVenda) {
  const [vendaRows] = await db.query(
    `
    SELECT 
      v.idVenda,
      v.idCliente,
      DATE_FORMAT(v.dataVenda, '%d/%m/%Y %H:%i') AS dataVenda,
      v.valorTotal,
      v.desconto
    FROM vendas v
    WHERE v.idVenda = ?
    `,
    [idVenda]
  );

  if (vendaRows.length === 0) return null;

  const [itensRows] = await db.query(
    `
    SELECT 
      p.nome AS produto,
      i.quantidade,
      i.precoUnitario,
      (i.quantidade * i.precoUnitario) AS subtotal
    FROM itens_venda i
    INNER JOIN produto p ON p.idProduto = i.idProduto
    WHERE i.idVenda = ?
    `,
    [idVenda]
  );

  return { ...vendaRows[0], itens: itensRows };
}

// ==========================================================
// 🔴 INATIVOS / NÃO RECORRENTES
// ==========================================================

// ----------------------------------------------------------
// Lista geral de inativos (>= 5 dias)
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
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo,
      CASE 
        WHEN DATEDIFF(CURDATE(), MAX(v.dataVenda)) >= 5 THEN 'INATIVO'
        ELSE 'ATIVO'
      END AS statusCliente
    FROM cliente c
    LEFT JOIN vendas v ON v.idCliente = c.idCliente
    WHERE 
        c.nome LIKE ?
        OR c.cpf LIKE ?
        OR c.telefone1 LIKE ?
    GROUP BY c.idCliente
    HAVING diasInativo >= 5
    ORDER BY diasInativo DESC
  `;

  const [rows] = await db.query(sql, [like, like, like]);
  return rows;
}

// ----------------------------------------------------------
// Inativos por período
// ----------------------------------------------------------
async function buscarInativosPorPeriodo(dias) {
  const sql = `
    SELECT 
      c.idCliente,
      c.nome,
      c.cpf,
      c.telefone1,
      DATE_FORMAT(MAX(v.dataVenda), '%d/%m/%Y') AS ultimaCompra,
      DATEDIFF(CURDATE(), MAX(v.dataVenda)) AS diasInativo,
      CASE 
        WHEN DATEDIFF(CURDATE(), MAX(v.dataVenda)) >= 5 THEN 'INATIVO'
        ELSE 'ATIVO'
      END AS statusCliente
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
// Última venda do cliente inativo
// ----------------------------------------------------------
async function buscarUltimaVendaInativo(idCliente) {
  const [vendaRows] = await db.query(
    `
    SELECT 
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
    LIMIT 1
    `,
    [idCliente]
  );

  if (vendaRows.length === 0) return null;

  const idVenda = vendaRows[0].idVenda;

  const [itensRows] = await db.query(
    `
    SELECT 
      i.idItem,
      p.nome AS produto,
      i.quantidade,
      i.precoUnitario,
      (i.quantidade * i.precoUnitario) AS subtotal
    FROM itens_venda i
    INNER JOIN produto p ON p.idProduto = i.idProduto
    WHERE i.idVenda = ?
    `,
    [idVenda]
  );

  return { ...vendaRows[0], itens: itensRows };
}

module.exports = {
  buscarClientes,
  buscarClientePorId,
  buscarVendasPorCliente,
  buscarVendaPorId,
  buscarInativos,
  buscarInativosPorPeriodo,
  buscarUltimaVendaInativo,
};
