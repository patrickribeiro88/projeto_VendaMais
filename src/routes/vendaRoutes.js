// ==========================================================
// =============== ROUTES: VENDAS ===========================
// ==========================================================
const express = require("express");
const router = express.Router();
const vendaController = require("../controllers/vendaController");

// ➤ Listar todas as vendas
router.get("/", vendaController.listarVendas);

// ➤ Buscar venda por ID
router.get("/:id", vendaController.buscarPorId);

// ➤ Criar nova venda
router.post("/", vendaController.criarVenda);

// ➤ Atualizar venda (status, cliente, etc.)
router.put("/:id", vendaController.atualizarVenda);

// ➤ Excluir venda e itens associados
router.delete("/:id", vendaController.excluirVenda);

module.exports = router;
