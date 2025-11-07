// ==========================================================
// =============== MODEL: CLIENTE ============================
// ==========================================================
const db = require('../config/database');

// ----------------------------------------------------------
// Criar novo cliente
// ----------------------------------------------------------
async function criarCliente(cliente) {
  const sql = `
    INSERT INTO cliente 
      (nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')
  `;
  const values = [
    cliente.nome,
    cliente.cpf,
    cliente.dataNascimento,
    cliente.genero,
    cliente.cep,
    cliente.endereco,
    cliente.numero,
    cliente.bairro,
    cliente.cidade,
    cliente.estado,
    cliente.telefone1,
    cliente.telefone2,
    cliente.email,
    cliente.observacao
  ];

  const [result] = await db.query(sql, values);
  return result.insertId;
}

// ----------------------------------------------------------
// Listar todos os clientes ativos
// ----------------------------------------------------------
async function listarClientes() {
  const sql = `
    SELECT 
      idCliente, 
      nome, 
      DATE_FORMAT(dataNascimento, '%d/%m/%Y') AS dataNascimento, 
      telefone1, 
      email 
    FROM cliente
    WHERE status = 'Ativo'
    ORDER BY nome ASC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

// ----------------------------------------------------------
// 🔍 Buscar clientes com filtros (ID e CPF exatos, nome parcial)
// ----------------------------------------------------------
async function buscarClientesFiltrado(filtros = {}) {
  let sql = `
    SELECT 
      idCliente, nome, cpf, telefone1, email
    FROM cliente
    WHERE status = 'Ativo'
  `;
  const params = [];

  if (filtros.idCliente) {
    sql += " AND idCliente = ?";
    params.push(filtros.idCliente);
  } else if (filtros.cpf) {
    sql += " AND cpf = ?";
    params.push(filtros.cpf);
  } else if (filtros.nome) {
    sql += " AND nome LIKE ?";
    params.push(`%${filtros.nome}%`); // 🔸 Busca parcial pelo nome
  }

  sql += " ORDER BY nome ASC";
  const [rows] = await db.query(sql, params);
  return rows;
}

// ----------------------------------------------------------
// Buscar cliente por ID (para edição)
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const sql = `SELECT * FROM cliente WHERE idCliente = ?`;
  const [rows] = await db.query(sql, [idCliente]);
  return rows[0];
}

// ----------------------------------------------------------
// Atualizar cliente existente
// ----------------------------------------------------------
async function atualizarCliente(idCliente, dados) {
  const sql = `
    UPDATE cliente
    SET nome = ?, cpf = ?, dataNascimento = ?, genero = ?, cep = ?, endereco = ?,
        numero = ?, bairro = ?, cidade = ?, estado = ?, telefone1 = ?, telefone2 = ?,
        email = ?, observacao = ?
    WHERE idCliente = ?;
  `;
  
  const values = [
    dados.nome, dados.cpf, dados.dataNascimento, dados.genero, dados.cep, dados.endereco,
    dados.numero, dados.bairro, dados.cidade, dados.estado, dados.telefone1, dados.telefone2,
    dados.email, dados.observacao, idCliente
  ];

  const [result] = await db.query(sql, values);
  return result.affectedRows > 0;
}

module.exports = {
  criarCliente,
  listarClientes,
  buscarClientesFiltrado,
  buscarClientePorId,
  atualizarCliente 
};
