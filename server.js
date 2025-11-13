require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas
const vendedorRoutes = require('./src/routes/vendedorRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const produtoRoutes = require('./src/routes/produtoRoutes');
const vendaRoutes = require("./src/routes/vendaRoutes");
const consultaRoutes = require("./src/routes/consultaRoutes");

app.use('/api/vendedor', vendedorRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use("/api/vendas", vendaRoutes);
app.use("/api/consultas", consultaRoutes);

// Página inicial (teste rápido)
app.get('/', (req, res) => {
  res.send('Servidor do Venda+ está rodando com estrutura MVC!');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado em http://localhost:${PORT}`);
});
