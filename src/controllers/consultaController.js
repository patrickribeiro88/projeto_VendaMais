// ==========================================================
// 🔍 CONTROLLER: CONSULTA COMPLETA
// ==========================================================
const consultaModel = require("../models/consultaModel");

// ----------------------------------------------------------
// 🔎 Buscar clientes (com ID, nome, CPF e STATUS)
// ----------------------------------------------------------
async function buscarClientes(req, res) {
  try {
    const { id, nome, cpf, status } = req.query;

    const clientes = await consultaModel.buscarClientes({
      id,
      nome,
      cpf,
      status
    });

    return res.status(200).json(clientes);
  } catch (err) {
    console.error("❌ Erro ao consultar clientes:", err);
    return res.status(500).json({ message: "Erro ao consultar clientes." });
  }
}

// ----------------------------------------------------------
// 🔍 Buscar detalhes de um cliente específico
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
    console.error("❌ Erro ao consultar cliente:", err);
    return res.status(500).json({ message: "Erro ao consultar cliente." });
  }
}

// ----------------------------------------------------------
// 🔍 Buscar vendas de um cliente específico
// ----------------------------------------------------------
async function buscarVendasPorCliente(req, res) {
  try {
    const { idCliente } = req.params;

    const vendas = await consultaModel.buscarVendasPorCliente(idCliente);

    return res.status(200).json(vendas);
  } catch (err) {
    console.error("❌ Erro ao consultar vendas:", err);
    return res.status(500).json({ message: "Erro ao consultar vendas do cliente." });
  }
}

// ----------------------------------------------------------
// 🔍 Buscar detalhes de uma venda (modal)
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
    console.error("❌ Erro ao consultar venda:", err);
    return res.status(500).json({ message: "Erro ao consultar venda." });
  }
}

// ==========================================================
// 🔴 INATIVOS / NÃO RECORRENTES
// ==========================================================

// ----------------------------------------------------------
// 🔎 Lista geral de inativos (>= 5 dias)
// GET /api/consultas/inativos?filtro=... 
// ----------------------------------------------------------
async function buscarInativos(req, res) {
  try {
    const { filtro = "" } = req.query;

    const lista = await consultaModel.buscarInativos(filtro);

    return res.status(200).json(lista);
  } catch (err) {
    console.error("❌ Erro ao consultar inativos:", err);
    return res.status(500).json({ message: "Erro ao consultar inativos." });
  }
}

// ----------------------------------------------------------
// 🔎 Lista por período (>= X dias de inatividade)
// GET /api/consultas/inativos/:dias
// ----------------------------------------------------------
async function buscarInativosPorPeriodo(req, res) {
  try {
    const { dias } = req.params;

    const lista = await consultaModel.buscarInativosPorPeriodo(dias);

    return res.status(200).json(lista);
  } catch (err) {
    console.error("❌ Erro ao consultar inativos por período:", err);
    return res.status(500).json({ message: "Erro ao consultar inativos por período." });
  }
}

// ----------------------------------------------------------
// 🔎 Última venda do cliente inativo (modal)
// ----------------------------------------------------------
async function buscarUltimaVendaInativo(req, res) {
  try {
    const { idCliente } = req.params;

    const venda = await consultaModel.buscarUltimaVendaInativo(idCliente);

    if (!venda) {
      return res.status(404).json({ message: "Nenhuma venda encontrada para este cliente." });
    }

    return res.status(200).json(venda);
  } catch (err) {
    console.error("❌ Erro ao consultar última venda do inativo:", err);
    return res.status(500).json({ message: "Erro ao consultar última venda do inativo." });
  }
}

module.exports = {
  buscarClientes,
  buscarClientePorId,
  buscarVendasPorCliente,
  buscarVendaPorId,
  buscarInativos,
  buscarInativosPorPeriodo,
  buscarUltimaVendaInativo
};
