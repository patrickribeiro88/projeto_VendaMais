// ==========================================================
// =============== ROTAS: CLIENTE ============================
// ==========================================================
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// ----------------------------------------------------------
// Cadastrar novo cliente
// ----------------------------------------------------------
router.post('/', clienteController.criarCliente);

// ----------------------------------------------------------
// Buscar clientes (precisa ou geral)
// ----------------------------------------------------------
router.get('/', async (req, res) => {
  const { id, cpf, nome } = req.query;

  // Se houver filtros → busca precisa
  if (id || cpf || nome) {
    return clienteController.buscarClientesFiltrado(req, res);
  }

  // Caso contrário → lista todos
  return clienteController.listarClientes(req, res);
});

// ----------------------------------------------------------
// Buscar cliente por ID (edição)
// ----------------------------------------------------------
router.get('/:id', clienteController.buscarClientePorId);

// ----------------------------------------------------------
// Atualizar cliente
// ----------------------------------------------------------
router.put('/:id', clienteController.atualizarCliente);

module.exports = router;
