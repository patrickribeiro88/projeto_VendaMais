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
// GET /api/consultas/vendas/123
router.get("/vendas/:idCliente", consultaController.buscarVendasPorCliente);

// Detalhe de uma venda
// GET /api/consultas/venda/10
router.get("/venda/:idVenda", consultaController.buscarVendaPorId);

// ======================== INATIVOS ========================

// ⚠️ ORDEM IMPORTANTE: primeira rota mais específica
// Última venda de cliente inativo
// GET /api/consultas/inativos/ultima-venda/123
router.get(
  "/inativos/ultima-venda/:idCliente",
  consultaController.buscarUltimaVendaInativo
);

// Inativos por período (X dias ou mais)
// GET /api/consultas/inativos/30
router.get(
  "/inativos/:dias",
  consultaController.buscarInativosPorPeriodo
);

// Lista geral de inativos (>= 5 dias) com filtro
// GET /api/consultas/inativos?filtro=ana
router.get(
  "/inativos",
  consultaController.buscarInativos
);

module.exports = router;
