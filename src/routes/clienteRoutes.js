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

// 🔍 Listar clientes
// Aceita filtros:
// ?id=10
// ?nome=ana
// ?cpf=123
// ?statusCliente=ATIVO | INATIVO
router.get("/", clienteController.listarClientes);

// Buscar cliente por ID específico (detalhe / edição)
router.get("/:id", clienteController.buscarClientePorId);

// Atualizar cliente existente
router.put("/:id", clienteController.atualizarCliente);

module.exports = router;
