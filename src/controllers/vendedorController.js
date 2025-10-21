// ==========================================================
// =============== CONTROLLER: VENDEDOR ======================
// ==========================================================
const vendedorModel = require('../models/vendedorModel');
const bcrypt = require('bcryptjs');

// ----------------------------------------------------------
// Cadastrar novo vendedor
// ----------------------------------------------------------
async function cadastrarVendedor(req, res) {
  try {
    const { nome, email, senha } = req.body;

    // Validação simples
    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    // Verifica se já existe vendedor com o mesmo e-mail
    const vendedorExistente = await vendedorModel.buscarPorEmail(email);
    if (vendedorExistente) {
      return res.status(409).json({ message: 'Este e-mail já está em uso.' });
    }

    // Cria o novo vendedor
    await vendedorModel.criarVendedor({ nome, email, senha });

    res.status(201).json({ message: 'Vendedor cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar vendedor:', error);
    res.status(500).json({ message: 'Erro no servidor ao tentar cadastrar.' });
  }
}

// ----------------------------------------------------------
// Login do vendedor
// ----------------------------------------------------------
async function loginVendedor(req, res) {
  try {
    const { email, senha } = req.body;

    // Validação simples
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    // Busca vendedor pelo e-mail
    const vendedor = await vendedorModel.buscarPorEmail(email);

    if (!vendedor) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Compara senha digitada com a senha criptografada
    const senhaValida = await bcrypt.compare(senha, vendedor.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    // Login bem-sucedido
    res.status(200).json({ message: 'Login realizado com sucesso!' });
  } catch (error) {
    console.error('Erro no login do vendedor:', error);
    res.status(500).json({ message: 'Erro no servidor durante o login.' });
  }
}

// ----------------------------------------------------------
// Exporta as funções para uso nas rotas
// ----------------------------------------------------------
module.exports = {
  cadastrarVendedor,
  loginVendedor
};
