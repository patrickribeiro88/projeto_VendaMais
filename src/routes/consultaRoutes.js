// ==========================================================
// 🚏 ROUTES: CONSULTA DE CLIENTES
// ==========================================================
const express = require("express");
const router = express.Router();
const consultaController = require("../controllers/consultaController");

// 🔍 Consultar clientes com filtros
router.get("/clientes", consultaController.buscarClientes);

// 📋 Buscar cliente específico
router.get("/clientes/:idCliente", consultaController.buscarClientePorId);

// 🧾 Buscar vendas do cliente
router.get("/vendas/:idCliente", consultaController.buscarVendasPorCliente);

// 👁 Buscar detalhes de uma venda
router.get("/venda/:idVenda", consultaController.buscarVendaPorId);

module.exports = router;
