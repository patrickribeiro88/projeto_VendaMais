// ======== MODEL DO PRODUTO ========

const db = require('../config/database');

// Criar produto
exports.criarProduto = (produto, callback) => {
  const sql = `
    INSERT INTO produto (nome, categoria, precoVenda)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [produto.nome, produto.categoria, produto.precoVenda], callback);
};

// Listar produtos
exports.listarProdutos = (callback) => {
  const sql = `
    SELECT idProduto, nome, categoria, precoVenda
    FROM produto
    ORDER BY idProduto DESC
  `;
  db.query(sql, callback);
};

// Buscar produto por ID
exports.buscarPorId = (id, callback) => {
  const sql = `
    SELECT idProduto, nome, categoria, precoVenda
    FROM produto
    WHERE idProduto = ?
  `;
  db.query(sql, [id], callback);
};

// Atualizar produto
exports.atualizarProduto = (id, produto, callback) => {
  const sql = `
    UPDATE produto
    SET nome = ?, categoria = ?, precoVenda = ?
    WHERE idProduto = ?
  `;
  db.query(sql, [produto.nome, produto.categoria, produto.precoVenda, id], callback);
};

// Excluir produto
exports.excluirProduto = (id, callback) => {
  const sql = `DELETE FROM produto WHERE idProduto = ?`;
  db.query(sql, [id], callback);
};
