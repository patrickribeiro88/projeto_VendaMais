require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Porta fornecida pelo Render ou 3000 localmente
const PORT = process.env.PORT || 3000;

// ======================================
// 🌐 CORS (Vercel + Local)
// ======================================
const allowedOrigins = [
  "http://projetovendamais-production.up.railway.app",
  "http://localhost:5173", // caso use Vite local
  "https://projeto-venda-mais.vercel.app", // 🔥 SUBSTITUA PELO SEU DOMÍNIO DO VERCEL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Acesso bloqueado por CORS"));
      }
    },
    methods: "GET,POST,PUT,PATCH,DELETE",
    credentials: true,
  })
);

// ======================================
// Middlewares
// ======================================
app.use(express.json());

// ======================================
// Rotas
// ======================================
const vendedorRoutes = require("./src/routes/vendedorRoutes");
const clienteRoutes = require("./src/routes/clienteRoutes");
const produtoRoutes = require("./src/routes/produtoRoutes");
const vendaRoutes = require("./src/routes/vendaRoutes");
const consultaRoutes = require("./src/routes/consultaRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

app.use("/api/vendedor", vendedorRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/vendas", vendaRoutes);
app.use("/api/consultas", consultaRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ======================================
// Rota inicial
// ======================================
app.get("/", (req, res) => {
  res.send("🔥 Servidor do Venda+ está rodando com sucesso!");
});

// ======================================
// Iniciar servidor
// ======================================
app.listen(PORT, () => {
  console.log("=================================================");
  console.log("🚀 SERVIDOR VENDA+ INICIADO");
  console.log(`🌍 Porta: ${PORT}`);
  console.log(
    "📡 Ambiente:",
    process.env.RENDER === "true" ? "Render" : "Local"
  );
  console.log("=================================================");
});
