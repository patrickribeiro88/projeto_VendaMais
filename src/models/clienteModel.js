// ==========================================================
// =============== MODEL: CLIENTE ============================
// ==========================================================
const db = require("../config/database");

// ----------------------------------------------------------
// Cadastrar novo cliente
// ----------------------------------------------------------
async function criarCliente(dados) {
  const {
    nome, cpf, dataNascimento, genero, cep, endereco,
    numero, bairro, cidade, estado, telefone1, telefone2,
    email, observacao
  } = dados;

  const [result] = await db.query(
    `INSERT INTO cliente 
      (nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao]
  );

  return result.insertId;
}

// ----------------------------------------------------------
// Listar todos os clientes
// ----------------------------------------------------------
async function listarClientes() {
  const [rows] = await db.query(`
    SELECT idCliente, nome, cpf, telefone1, email, cidade, estado
    FROM cliente
    ORDER BY nome ASC
  `);
  return rows;
}

// ----------------------------------------------------------
// Buscar clientes dinamicamente (ID, CPF ou Nome)
// ----------------------------------------------------------
async function buscarClientes({ id, cpf, nome }) {
  let query = `
    SELECT idCliente, nome, cpf, telefone1, email, cidade, estado
    FROM cliente
    WHERE 1=1
  `;
  const params = [];

  if (id) {
    query += " AND idCliente = ?";
    params.push(id);
  }

  if (cpf) {
    query += " AND cpf LIKE ?";
    params.push(`%${cpf}%`);
  }

  if (nome) {
    query += " AND nome LIKE ?";
    params.push(`%${nome}%`);
  }

  const [rows] = await db.query(query, params);
  return rows;
}

// ----------------------------------------------------------
// Buscar cliente por ID (edição/detalhe)
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const [rows] = await db.query(
    `SELECT * FROM cliente WHERE idCliente = ?`,
    [idCliente]
  );
  return rows[0] || null;
}

// ----------------------------------------------------------
// Atualizar cliente existente
// ----------------------------------------------------------
async function atualizarCliente(idCliente, dados) {
  const {
    nome, cpf, dataNascimento, genero, cep, endereco,
    numero, bairro, cidade, estado, telefone1, telefone2,
    email, observacao
  } = dados;

  const [result] = await db.query(
    `UPDATE cliente
     SET nome=?, cpf=?, dataNascimento=?, genero=?, cep=?, endereco=?, numero=?, bairro=?, cidade=?, estado=?, telefone1=?, telefone2=?, email=?, observacao=?
     WHERE idCliente = ?`,
    [nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao, idCliente]
  );

  return result.affectedRows > 0;
}

module.exports = {
  criarCliente,
  listarClientes,
  buscarClientes,
  buscarClientePorId,
  atualizarCliente,
};
