// ==========================================================
// =============== CONTROLLER: PRODUTOS =====================
// ==========================================================
const produtoModel = require("../models/produtoModel");

// ==========================================================
// LISTAR PRODUTOS (com filtros opcionais)
// ==========================================================
exports.listarProdutos = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.id) filtros.id = req.query.id;
    if (req.query.nome) filtros.nome = req.query.nome;

    const produtos = await produtoModel.listarProdutos(filtros);

    if (produtos.length === 0) {
      return res.status(404).json({ message: "Nenhum produto encontrado." });
    }

    res.status(200).json(produtos);
  } catch (error) {
    console.error("❌ Erro ao listar produtos (controller):", error);
    res.status(500).json({
      message: "Erro interno ao listar produtos.",
      error: error.message,
    });
  }
};

// ==========================================================
// BUSCAR PRODUTO POR ID
// ==========================================================
exports.buscarPorId = async (req, res) => {
  try {
    const idProduto = req.params.id;
    const produto = await produtoModel.buscarPorId(idProduto);

    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    res.status(200).json(produto);
  } catch (error) {
    console.error("❌ Erro ao buscar produto por ID (controller):", error);
    res.status(500).json({
      message: "Erro interno ao buscar produto.",
      error: error.message,
    });
  }
};

// ==========================================================
// CRIAR NOVO PRODUTO
// ==========================================================
exports.criarProduto = async (req, res) => {
  try {
    const { nome, categoria, precoVenda } = req.body;

    if (!nome || !precoVenda) {
      return res.status(400).json({
        message: "Campos obrigatórios: nome e precoVenda.",
      });
    }

    await produtoModel.criarProduto({ nome, categoria, precoVenda });
    res.status(201).json({ message: "✅ Produto cadastrado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao criar produto (controller):", error);
    res.status(500).json({
      message: "Erro interno ao criar produto.",
      error: error.message,
    });
  }
};

// ==========================================================
// ATUALIZAR PRODUTO
// ==========================================================
exports.atualizarProduto = async (req, res) => {
  try {
    const idProduto = req.params.id;
    const { nome, categoria, precoVenda } = req.body;

    const atualizado = await produtoModel.atualizarProduto(idProduto, {
      nome,
      categoria,
      precoVenda,
    });

    if (!atualizado) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    res.status(200).json({ message: "✅ Produto atualizado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao atualizar produto (controller):", error);
    res.status(500).json({
      message: "Erro interno ao atualizar produto.",
      error: error.message,
    });
  }
};

// ==========================================================
// EXCLUIR PRODUTO
// ==========================================================
exports.excluirProduto = async (req, res) => {
  try {
    const idProduto = req.params.id;
    const excluido = await produtoModel.excluirProduto(idProduto);

    if (!excluido) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    res.status(200).json({ message: "🗑️ Produto excluído com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao excluir produto (controller):", error);
    res.status(500).json({
      message: "Erro interno ao excluir produto.",
      error: error.message,
    });
  }
};
