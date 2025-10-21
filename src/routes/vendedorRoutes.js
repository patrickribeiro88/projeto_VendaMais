// ==========================================================
// =============== ROTAS: VENDEDOR ===========================
// ==========================================================
const express = require('express');
const router = express.Router();
const vendedorController = require('../controllers/vendedorController');

// ----------------------------------------------------------
// Rota para cadastrar novo vendedor
// POST → /api/vendedor/cadastrar
// ----------------------------------------------------------
router.post('/cadastrar', vendedorController.cadastrarVendedor);

// ----------------------------------------------------------
// Rota para login do vendedor
// POST → /api/vendedor/login
// ----------------------------------------------------------
router.post('/login', vendedorController.loginVendedor);

// ----------------------------------------------------------
// Exporta as rotas
// ----------------------------------------------------------
module.exports = router;
