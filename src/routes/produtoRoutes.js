// ==========================================================
// =============== ROTAS: PRODUTO ===========================
// ==========================================================

const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Rotas principais do CRUD
router.post('/api/produtos', produtoController.criarProduto);
router.get('/api/produtos', produtoController.listarProdutos);
router.get('/api/produtos/:id', produtoController.buscarPorId);
router.put('/api/produtos/:id', produtoController.atualizarProduto);
router.delete('/api/produtos/:id', produtoController.excluirProduto);

module.exports = router;
