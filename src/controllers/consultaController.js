// ==========================================================
// 🔍 CONTROLLER: CONSULTA DE CLIENTES (Atualizado)
// ==========================================================
const consultaModel = require("../models/consultaModel");

// ----------------------------------------------------------
// Buscar clientes com filtros
// ----------------------------------------------------------
async function buscarClientes(req, res) {
  try {
    const { id, nome, cpf, status } = req.query;
    const clientes = await consultaModel.buscarClientes({ id, nome, cpf, status });
    return res.status(200).json(clientes);
  } catch (err) {
    console.error("❌ Erro ao consultar clientes:", err);
    res.status(500).json({ message: "Erro ao consultar clientes." });
  }
}

// ----------------------------------------------------------
// Buscar detalhes de um cliente específico
// ----------------------------------------------------------
async function buscarClientePorId(req, res) {
  try {
    const { idCliente } = req.params;
    const cliente = await consultaModel.buscarClientePorId(idCliente);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }
    return res.status(200).json(cliente);
  } catch (err) {
    console.error("❌ Erro ao buscar cliente:", err);
    res.status(500).json({ message: "Erro ao buscar cliente." });
  }
}

// ----------------------------------------------------------
// Buscar vendas de um cliente específico
// ----------------------------------------------------------
async function buscarVendasPorCliente(req, res) {
  try {
    const { idCliente } = req.params;
    const vendas = await consultaModel.buscarVendasPorCliente(idCliente);
    return res.status(200).json(vendas);
  } catch (err) {
    console.error("❌ Erro ao buscar vendas do cliente:", err);
    res.status(500).json({ message: "Erro ao buscar vendas do cliente." });
  }
}

// ----------------------------------------------------------
// Buscar detalhes de uma venda (com produtos e desconto)
// ----------------------------------------------------------
async function buscarVendaPorId(req, res) {
  try {
    const { idVenda } = req.params;
    const venda = await consultaModel.buscarVendaPorId(idVenda);
    if (!venda) {
      return res.status(404).json({ message: "Venda não encontrada." });
    }
    return res.status(200).json(venda);
  } catch (err) {
    console.error("❌ Erro ao buscar detalhes da venda:", err);
    res.status(500).json({ message: "Erro ao buscar detalhes da venda." });
  }
}

module.exports = {
  buscarClientes,
  buscarClientePorId,
  buscarVendasPorCliente,
  buscarVendaPorId,
};
