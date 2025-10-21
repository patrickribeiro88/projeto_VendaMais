// ==========================================================
// =============== CONTROLLER: CLIENTE =======================
// ==========================================================
const clienteModel = require('../models/clienteModel');

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

    // Validação simples
    if (!nome) {
      return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    }

    // Cria o cliente
    const id = await clienteModel.criarCliente({
      nome, cpf, dataNascimento, genero, cep, endereco,
      numero, bairro, cidade, estado, telefone1, telefone2,
      email, observacao
    });

    res.status(201).json({ message: 'Cliente cadastrado com sucesso!', idCliente: id });
  } catch (error) {
    console.error('Erro ao cadastrar cliente:', error);
    res.status(500).json({ message: 'Erro no servidor ao cadastrar cliente.' });
  }
}

// ----------------------------------------------------------
// Listar todos os clientes ativos
// ----------------------------------------------------------
async function listarClientes(req, res) {
  try {
    const clientes = await clienteModel.listarClientes();
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar clientes.' });
  }
}

// ----------------------------------------------------------
// Buscar cliente por ID (para edição futura)
// ----------------------------------------------------------
async function buscarClientePorId(req, res) {
  try {
    const { id } = req.params;
    const cliente = await clienteModel.buscarClientePorId(id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar cliente.' });
  }
}
// ----------------------------------------------------------
// Atualizar cliente existente
// ----------------------------------------------------------
async function atualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;

    const atualizado = await clienteModel.atualizarCliente(id, dados);

    if (!atualizado) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    res.status(200).json({ message: 'Cliente atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar cliente.' });
  }
}

module.exports = {
  criarCliente,
  listarClientes,
  buscarClientePorId,
  atualizarCliente 
};
