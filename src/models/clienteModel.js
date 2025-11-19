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
// Listar todos os clientes (com status ATIVO / INATIVO)
// ----------------------------------------------------------
async function listarClientes() {
  const [rows] = await db.query(`
    SELECT 
      c.idCliente,
      c.nome,
      c.cpf,
      c.telefone1,
      c.email,
      c.cidade,
      c.estado,

      CASE 
        WHEN DATEDIFF(
              CURDATE(),
              COALESCE(
                (SELECT MAX(v.dataVenda) FROM vendas v WHERE v.idCliente = c.idCliente),
                CURDATE()
              )
            ) >= 5 
        THEN 'INATIVO'
        ELSE 'ATIVO'
      END AS statusCliente

    FROM cliente c
    ORDER BY c.nome ASC
  `);

  return rows;
}

// ----------------------------------------------------------
// Buscar clientes dinamicamente (ID, CPF, Nome, Status)
// ----------------------------------------------------------
async function buscarClientes({ id, cpf, nome, statusCliente }) {
  let query = `
    SELECT 
      c.idCliente,
      c.nome,
      c.cpf,
      c.telefone1,
      c.email,
      c.cidade,
      c.estado,

      CASE 
        WHEN DATEDIFF(
              CURDATE(),
              COALESCE(
                (SELECT MAX(v.dataVenda) FROM vendas v WHERE v.idCliente = c.idCliente),
                CURDATE()
              )
            ) >= 5 
        THEN 'INATIVO'
        ELSE 'ATIVO'
      END AS statusCliente

    FROM cliente c
    WHERE 1 = 1
  `;

  const params = [];

  if (id) {
    query += " AND c.idCliente = ?";
    params.push(id);
  }

  if (cpf) {
    query += " AND c.cpf LIKE ?";
    params.push(`%${cpf}%`);
  }

  if (nome) {
    query += " AND c.nome LIKE ?";
    params.push(`%${nome}%`);
  }

  // 🔥 Aqui estava o problema → corrigido:
  if (statusCliente && statusCliente !== "todos") {
    query += `
      AND (
        CASE 
          WHEN DATEDIFF(
                CURDATE(),
                COALESCE(
                  (SELECT MAX(v.dataVenda) FROM vendas v WHERE v.idCliente = c.idCliente),
                  CURDATE()
                )
              ) >= 5
          THEN 'INATIVO'
          ELSE 'ATIVO'
        END
      ) = ?
    `;
    params.push(statusCliente);
  }

  query += " ORDER BY c.nome ASC";

  const [rows] = await db.query(query, params);
  return rows;
}

// ----------------------------------------------------------
// Buscar cliente por ID (detalhes)
// ----------------------------------------------------------
async function buscarClientePorId(idCliente) {
  const [rows] = await db.query(
    `
    SELECT 
      c.*,

      CASE 
        WHEN DATEDIFF(
              CURDATE(),
              COALESCE(
                (SELECT MAX(v.dataVenda) FROM vendas v WHERE v.idCliente = c.idCliente),
                CURDATE()
              )
            ) >= 5 
        THEN 'INATIVO'
        ELSE 'ATIVO'
      END AS statusCliente

    FROM cliente c
    WHERE c.idCliente = ?
  `,
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
