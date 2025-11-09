// ==========================================================
// =============== ROTAS: CLIENTE ============================
// ==========================================================
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");

// ----------------------------------------------------------
// ROTAS DISPONÍVEIS
// ----------------------------------------------------------

// Criar novo cliente
router.post("/", clienteController.criarCliente);

// 🔍 Listar todos os clientes ou buscar por ID/CPF/Nome (mesma função)
router.get("/", clienteController.listarClientes);

// Buscar cliente por ID específico (para edição futura)
router.get("/:id", clienteController.buscarClientePorId);

// Atualizar cliente existente
router.put("/:id", clienteController.atualizarCliente);

module.exports = router;
