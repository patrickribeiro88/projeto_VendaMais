// ==========================================================
// =============== CONTROLLER: VENDAS =======================
// ==========================================================
const vendaModel = require("../models/vendaModel");

// ==========================================================
// LISTAR TODAS AS VENDAS
// ==========================================================
exports.listarVendas = async (req, res) => {
  try {
    const vendas = await vendaModel.listarVendas();
    res.status(200).json(vendas);
  } catch (error) {
    console.error("Erro ao listar vendas (controller):", error);
    res.status(500).json({ message: "Erro ao listar vendas." });
  }
};

// ==========================================================
// BUSCAR VENDA POR ID
// ==========================================================
exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const venda = await vendaModel.buscarPorId(id);

    if (!venda) return res.status(404).json({ message: "Venda não encontrada." });
    res.status(200).json(venda);
  } catch (error) {
    console.error("Erro ao buscar venda (controller):", error);
    res.status(500).json({ message: "Erro ao buscar venda." });
  }
};

// ==========================================================
// CRIAR NOVA VENDA
// ==========================================================
exports.criarVenda = async (req, res) => {
  try {
    const { idCliente, itens } = req.body;

    if (!itens || itens.length === 0)
      return res.status(400).json({ message: "A venda precisa ter ao menos um item." });

    const novaVenda = await vendaModel.criarVenda({ idCliente, itens });
    res.status(201).json({
      message: "✅ Venda registrada com sucesso!",
      ...novaVenda,
    });
  } catch (error) {
    console.error("Erro ao criar venda (controller):", error);
    res.status(500).json({ message: "Erro ao registrar venda." });
  }
};

// ==========================================================
// ATUALIZAR VENDA
// ==========================================================
exports.atualizarVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const atualizado = await vendaModel.atualizarVenda(id, req.body);

    if (!atualizado)
      return res.status(404).json({ message: "Venda não encontrada para atualização." });

    res.status(200).json({ message: "✅ Venda atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar venda (controller):", error);
    res.status(500).json({ message: "Erro ao atualizar venda." });
  }
};

// ==========================================================
// EXCLUIR VENDA
// ==========================================================
exports.excluirVenda = async (req, res) => {
  try {
    const { id } = req.params;
    const excluida = await vendaModel.excluirVenda(id);

    if (!excluida)
      return res.status(404).json({ message: "Venda não encontrada para exclusão." });

    res.status(200).json({ message: "🗑️ Venda excluída com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir venda (controller):", error);
    res.status(500).json({ message: "Erro ao excluir venda." });
  }
};
