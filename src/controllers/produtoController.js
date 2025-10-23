// ==========================================================
// =============== CONTROLLER: PRODUTO =======================
// ==========================================================

const Produto = require('../models/produtoModel');

// Criar produto
exports.criarProduto = (req, res) => {
  const { nome, categoria, precoVenda } = req.body;

  if (!nome || !precoVenda) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
  }

  Produto.criarProduto({ nome, categoria, precoVenda }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao cadastrar produto.' });
    res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
  });
};

// Listar produtos
exports.listarProdutos = (req, res) => {
  Produto.listarProdutos((err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar produtos.' });
    res.status(200).json(results);
  });
};

// Buscar produto por ID
exports.buscarPorId = (req, res) => {
  const { id } = req.params;
  Produto.buscarPorId(id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Erro ao buscar produto.' });
    if (results.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.status(200).json(results[0]);
  });
};

// Atualizar produto
exports.atualizarProduto = (req, res) => {
  const { id } = req.params;
  const { nome, categoria, precoVenda } = req.body;

  if (!nome || !precoVenda) {
    return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });
  }

  Produto.atualizarProduto(id, { nome, categoria, precoVenda }, (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao atualizar produto.' });
    res.status(200).json({ message: 'Produto atualizado com sucesso!' });
  });
};

// Excluir produto
exports.excluirProduto = (req, res) => {
  const { id } = req.params;
  Produto.excluirProduto(id, (err, result) => {
    if (err) return res.status(500).json({ message: 'Erro ao excluir produto.' });
    res.status(200).json({ message: 'Produto excluído com sucesso!' });
  });
};
