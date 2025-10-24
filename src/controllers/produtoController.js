// ==========================================================
// =============== CONTROLLER: PRODUTO =======================
// ==========================================================

const db = require('../config/database');

// LISTAR
exports.listarProdutos = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM produto');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ message: 'Erro ao listar produtos.' });
  }
};

// BUSCAR POR ID
exports.buscarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM produto WHERE idProduto = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro ao buscar produto.' });
  }
};

// CRIAR
exports.criarProduto = async (req, res) => {
  try {
    const { nome, categoria, precoVenda } = req.body;
    if (!nome || !precoVenda)
      return res.status(400).json({ message: 'Nome e preço são obrigatórios.' });

    await db.query(
      'INSERT INTO produto (nome, categoria, precoVenda) VALUES (?, ?, ?)',
      [nome, categoria, precoVenda]
    );

    res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar produto:', error);
    res.status(500).json({ message: 'Erro ao cadastrar produto.' });
  }
};

// ATUALIZAR
exports.atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, categoria, precoVenda } = req.body;

    await db.query(
      'UPDATE produto SET nome = ?, categoria = ?, precoVenda = ? WHERE idProduto = ?',
      [nome, categoria, precoVenda, id]
    );

    res.json({ message: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto.' });
  }
};

// EXCLUIR
exports.excluirProduto = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM produto WHERE idProduto = ?', [id]);
    res.json({ message: 'Produto excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro ao excluir produto.' });
  }
};
