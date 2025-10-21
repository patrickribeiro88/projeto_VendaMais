// ==========================================================
// =============== ROTAS: CLIENTE ============================
// ==========================================================
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// ----------------------------------------------------------
// ROTAS DISPONÍVEIS
// ----------------------------------------------------------

// Rota para cadastrar um novo cliente
router.post('/', clienteController.criarCliente);

// Rota para listar todos os clientes
router.get('/', clienteController.listarClientes);

// Rota para buscar cliente por ID (edição futura)
router.get('/:id', clienteController.buscarClientePorId);

// Rota para atualizar cliente existente
router.put('/:id', clienteController.atualizarCliente);

// Exporta o router para uso no server.js
module.exports = router;
