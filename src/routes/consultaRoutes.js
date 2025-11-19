// ==========================================================
// 🛣️ ROUTES: CONSULTA (Clientes, Vendas, Inativos)
// ==========================================================
const express = require("express");
const router = express.Router();

const consultaController = require("../controllers/consultaController");

// ======================= CLIENTES =========================

// GET /api/consultas/clientes?nome=...&cpf=...&status=...
router.get("/clientes", consultaController.buscarClientes);

// GET /api/consultas/clientes/123
router.get("/clientes/:idCliente", consultaController.buscarClientePorId);

// ======================== VENDAS ==========================

// Histórico de vendas de um cliente
router.get("/vendas/:idCliente", consultaController.buscarVendasPorCliente);

// Detalhe de uma venda
router.get("/venda/:idVenda", consultaController.buscarVendaPorId);

// ======================== INATIVOS ========================

// ⚠️ ORDEM IMPORTANTE: primeira rota mais específica
router.get(
  "/inativos/ultima-venda/:idCliente",
  consultaController.buscarUltimaVendaInativo
);

// Inativos por período (X dias ou mais)
// 🔒 AGORA SOMENTE NÚMEROS
router.get(
  "/inativos/:dias(\\d+)",
  consultaController.buscarInativosPorPeriodo
);

// Lista geral de inativos (>= 5 dias) com filtro
router.get(
  "/inativos",
  consultaController.buscarInativos
);

module.exports = router;
