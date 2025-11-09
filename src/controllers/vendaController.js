// ==========================================================
// =============== CONTROLLER: VENDAS ========================
// ==========================================================
const vendaModel = require("../models/vendaModel");

// ==========================================================
// 💾 REGISTRAR VENDA (agora com suporte total a DESCONTO)
// ==========================================================
async function registrarVenda(req, res) {
  try {
    const { idCliente, valorTotal, desconto = 0, itens } = req.body;

    // 🔹 Validação dos dados básicos
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ message: "Nenhum item informado para a venda." });
    }

    // 🔹 Criação da venda via model
    const { idVenda, valorTotal: totalFinal, desconto: descAplicado } = await vendaModel.criarVenda({
      idCliente,
      valorTotal,
      desconto,
      itens,
    });

    // 🔹 Resposta com todos os dados da venda
    return res.status(201).json({
      message: "✅ Venda registrada com sucesso!",
      idVenda,
      idCliente,
      desconto: descAplicado,
      valorTotal: totalFinal,
      dataVenda: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
  } catch (err) {
    console.error("❌ Erro ao registrar venda:", err);
    return res.status(500).json({
      message: "Erro ao registrar venda.",
      erro: err.message,
    });
  }
}

// ==========================================================
// 📋 LISTAR TODAS AS VENDAS
// ==========================================================
async function listarVendas(req, res) {
  try {
    const vendas = await vendaModel.listarVendas();
    return res.status(200).json(vendas);
  } catch (err) {
    console.error("❌ Erro ao listar vendas:", err);
    return res.status(500).json({
      message: "Erro ao listar vendas.",
      erro: err.message,
    });
  }
}

// ==========================================================
// 🔍 BUSCAR VENDA POR ID (para modal de detalhes)
// ==========================================================
async function buscarVendaPorId(req, res) {
  try {
    const { id } = req.params;
    const venda = await vendaModel.buscarPorId(id);

    if (!venda) {
      return res.status(404).json({ message: "Venda não encontrada." });
    }

    // ✅ Retorna a venda com desconto incluso
    return res.status(200).json({
      ...venda,
      desconto: venda.desconto || 0,
      valorTotal: venda.valorTotal || 0,
    });
  } catch (err) {
    console.error("❌ Erro ao buscar venda:", err);
    return res.status(500).json({
      message: "Erro ao buscar venda.",
      erro: err.message,
    });
  }
}

// ==========================================================
// 🔄 ATUALIZAR VENDA (status ou cliente)
// ==========================================================
async function atualizarVenda(req, res) {
  try {
    const { id } = req.params;
    const { idCliente, status } = req.body;

    const atualizado = await vendaModel.atualizarVenda(id, { idCliente, status });
    if (!atualizado) {
      return res.status(404).json({ message: "Venda não encontrada." });
    }

    return res.status(200).json({ message: "Venda atualizada com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao atualizar venda:", err);
    return res.status(500).json({
      message: "Erro ao atualizar venda.",
      erro: err.message,
    });
  }
}

// ==========================================================
// 🗑️ EXCLUIR VENDA
// ==========================================================
async function excluirVenda(req, res) {
  try {
    const { id } = req.params;
    const excluida = await vendaModel.excluirVenda(id);

    if (!excluida) {
      return res.status(404).json({ message: "Venda não encontrada." });
    }

    return res.status(200).json({ message: "🗑️ Venda excluída com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao excluir venda:", err);
    return res.status(500).json({
      message: "Erro ao excluir venda.",
      erro: err.message,
    });
  }
}

module.exports = {
  registrarVenda,
  listarVendas,
  buscarVendaPorId,
  atualizarVenda,
  excluirVenda,
};
