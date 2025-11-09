const express = require("express");
const router = express.Router();
const vendaController = require("../controllers/vendaController");

router.post("/", vendaController.registrarVenda);
router.get("/", vendaController.listarVendas);
router.get("/:id", vendaController.buscarVendaPorId);
router.put("/:id", vendaController.atualizarVenda);
router.delete("/:id", vendaController.excluirVenda);

module.exports = router;
                                              