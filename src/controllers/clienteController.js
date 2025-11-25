// ==========================================================
// =============== CONTROLLER: CLIENTE =======================
// ==========================================================
const clienteModel = require("../models/clienteModel");

// ----------------------------------------------------------
// Cadastrar novo cliente
// ----------------------------------------------------------
async function criarCliente(req, res) {
  try {
    const {
      nome, cpf, dataNascimento, genero, cep, endereco,
      numero, bairro, cidade, estado, telefone1, telefone2,
      email, observacao
    } = req.body;

    if (!nome) {
      return res.status(400).json({ message: "O nome do cliente é obrigatório." });
    }

    const id = await clienteModel.criarCliente({
      nome, cpf, dataNascimento, genero, cep, endereco,
      numero, bairro, cidade, estado, telefone1, telefone2,
      email, observacao
    });

    return res.status(201).json({
      message: "Cliente cadastrado com sucesso!",
      idCliente: id
    });

  } catch (error) {
    console.error("❌ Erro ao cadastrar cliente:", error);
    return res.status(500).json({ message: "Erro no servidor ao cadastrar cliente." });
  }
}

// ----------------------------------------------------------
// Listar clientes (todos ou filtrados)
// ----------------------------------------------------------
async function listarClientes(req, res) {
  try {
    const { id, cpf, nome, statusCliente } = req.query;

    if (id || cpf || nome || statusCliente) {
      const clientes = await clienteModel.buscarClientes({
        id,
        cpf,
        nome,
        statusCliente
      });

      return res.status(200).json(
        Array.isArray(clientes)
          ? clientes
          : [clientes].filter(Boolean)
      );
    }

    const todos = await clienteModel.listarClientes();
    return res.status(200).json(todos);

  } catch (error) {
    console.error("❌ Erro ao listar clientes:", error);
    return res.status(500).json({ message: "Erro no servidor ao buscar clientes." });
  }
}

// ----------------------------------------------------------
// Buscar cliente por ID
// ----------------------------------------------------------
async function buscarClientePorId(req, res) {
  try {
    const { id } = req.params;

    const cliente = await clienteModel.buscarClientePorId(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    return res.status(200).json(cliente);

  } catch (error) {
    console.error("❌ Erro ao buscar cliente por ID:", error);
    return res.status(500).json({ message: "Erro no servidor ao buscar cliente." });
  }
}

// ----------------------------------------------------------
// Atualizar cliente
// ----------------------------------------------------------
async function atualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    const atualizado = await clienteModel.atualizarCliente(id, dados);

    if (!atualizado) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    return res.status(200).json({ message: "Cliente atualizado com sucesso!" });

  } catch (error) {
    console.error("❌ Erro ao atualizar cliente:", error);
    return res.status(500).json({ message: "Erro no servidor ao atualizar cliente." });
  }
}

// ----------------------------------------------------------
// 🔥 Atualizar status manual ATIVO ↔ INATIVO
// ----------------------------------------------------------
async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ATIVO", "INATIVO"].includes(status)) {
      return res.status(400).json({
        message: "Status inválido. Use: ATIVO ou INATIVO."
      });
    }

    const alterado = await clienteModel.atualizarStatusManual(id, status);

    if (!alterado) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    return res.status(200).json({
      message: `Status atualizado para ${status}!`,
      novoStatus: status
    });

  } catch (error) {
    console.error("❌ Erro ao atualizar status manual:", error);
    return res.status(500).json({
      message: "Erro no servidor ao atualizar status do cliente."
    });
  }
}
module.exports = {
  criarCliente,
  listarClientes,
  buscarClientePorId,
  atualizarCliente,
  atualizarStatus
};
