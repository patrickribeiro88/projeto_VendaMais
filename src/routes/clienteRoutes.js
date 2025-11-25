// ==========================================================
// =============== ROTAS: CLIENTE ============================
// ==========================================================
const express = require("express");
const router = express.Router();
const clienteController = require("../controllers/clienteController");

// Criar novo cliente
router.post("/", clienteController.criarCliente);

// Listar clientes (com filtros opcionais)
router.get("/", clienteController.listarClientes);

// Buscar cliente por ID
router.get("/:id", clienteController.buscarClientePorId);

// Atualizar cliente
router.put("/:id", clienteController.atualizarCliente);

// ATUALIZAR STATUS MANUAL (ATIVO ⇆ INATIVO)

router.patch("/:id/status", clienteController.atualizarStatus);

module.exports = router;
