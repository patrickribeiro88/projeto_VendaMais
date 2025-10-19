const express = require('express');
const cors = require('cors');
const db = require('./database.js'); // Importa nossa conexão com o banco
const bcrypt = require('bcryptjs'); // Biblioteca para criptografar senhas

const app = express();
const PORT = 3000;

// Middlewares: "ferramentas" que preparam nosso servidor
app.use(cors()); // Habilita o CORS para permitir a comunicação com o front-end
app.use(express.json()); // Permite que o servidor entenda requisições com corpo em JSON

// Rota de teste inicial
app.get('/', (req, res) => {
  res.send('Servidor do Venda+ está rodando!');
});

// ==========================================================
// ============== ROTA PARA CADASTRAR VENDEDOR ==============
// ==========================================================z
app.post('/api/cadastrar', async (req, res) => {
    // 1. Recebe os dados do front-end
    const { nome, email, senha } = req.body;

    // 2. Validação simples dos dados
    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        // 3. Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // 4. Cria o comando SQL para inserir o novo vendedor
        const sql = 'INSERT INTO vendedor (nome, email, senha) VALUES (?, ?, ?)';
        const values = [nome, email, senhaCriptografada];

        // 5. Executa o comando no banco de dados
        await db.query(sql, values);

        // 6. Envia uma resposta de sucesso para o front-end
        res.status(201).json({ message: 'Vendedor cadastrado com sucesso!' });

    } catch (error) {
        // Tratamento de erros (ex: email duplicado)
        console.error('Erro ao cadastrar vendedor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao tentar cadastrar.' });
    }
});
// ==========================================================
// =================== ROTA DE LOGIN ===================
// ==========================================================
app.post('/api/login', async (req, res) => {
    // 1. Recebe os dados do front-end
    const { email, senha } = req.body;

    // 2. Validação simples
    if (!email || !senha) {
        return res.status(400).json({ message: 'Email and senha são obrigatórios.' });
    }

    try {
        // 3. Busca o vendedor pelo email no banco de dados
        const sql = 'SELECT * FROM vendedor WHERE email = ?';
        const [rows] = await db.query(sql, [email]);

        // 4. Se não encontrar nenhum vendedor com aquele email
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
        }

        const vendedor = rows[0];

        // 5. Compara a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, vendedor.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); // Mesma mensagem genérica
        }
        
        // 6. Se tudo estiver certo, envia a resposta de sucesso
        // Em um projeto real, aqui nós geraríamos um token (JWT)
        res.status(200).json({ message: 'Login realizado com sucesso!' });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor durante o login.' });
    }
});
// ==========================================================
// ============== ROTAS PARA CLIENTES =================
// ==========================================================

// ROTA PARA CADASTRAR UM NOVO CLIENTE (POST)
app.post('/api/clientes', async (req, res) => {
    // Pega todos os dados do corpo da requisição (enviados pelo front-end)
    const { nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao } = req.body;

    // Validação simples para o nome
    if (!nome) {
        return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    }

    const sql = `INSERT INTO cliente (nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [nome, cpf, dataNascimento, genero, cep, endereco, numero, bairro, cidade, estado, telefone1, telefone2, email, observacao];

    try {
        await db.query(sql, values);
        res.status(201).json({ message: 'Cliente cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        res.status(500).json({ message: 'Erro no servidor ao cadastrar cliente.' });
    }
});

// ROTA PARA LISTAR TODOS OS CLIENTES (GET)
app.get('/api/clientes', async (req, res) => {
    const sql = "SELECT idCliente, nome, DATE_FORMAT(dataNascimento, '%d/%m/%Y') as dataNascimento, telefone1, email FROM cliente WHERE status = 'Ativo'";

    try {
        const [clientes] = await db.query(sql);
        res.status(200).json(clientes);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar clientes.' });
    }
});
// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado. Escutando na porta http://localhost:${PORT}`);
});