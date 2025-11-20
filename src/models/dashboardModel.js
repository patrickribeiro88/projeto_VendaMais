const db = require("../config/database");

// =============================================
// 🔍 Função para calcular período (mês/semestre/ano)
// =============================================
function gerarFiltroData(filtro) {
  switch (filtro) {
    case "semestre":
      return "v.dataVenda >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
    case "ano":
      return "v.dataVenda >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
    default:
      return "v.dataVenda >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
  }
}

// =============================================
// 📊 Consulta principal do Dashboard
// =============================================
async function buscarDadosDashboard(filtro) {
  const condicaoPeriodo = gerarFiltroData(filtro);

  // 1️⃣ Total de Vendas + Ticket Médio + Clientes atendidos
  const [info] = await db.query(
    `
      SELECT 
          COALESCE(SUM(v.valorTotal), 0) AS totalVendas,
          COALESCE(SUM(i.quantidade), 0) AS produtosVendidos,
          COUNT(DISTINCT v.idCliente) AS clientesAtendidos
      FROM vendas v
      LEFT JOIN itens_venda i ON i.idVenda = v.idVenda
      WHERE ${condicaoPeriodo}
    `
  );

  const totalVendas = parseFloat(info[0].totalVendas) || 0;
  const qtdProdutos = parseInt(info[0].produtosVendidos) || 0;
  const clientesAtendidos = parseInt(info[0].clientesAtendidos) || 0;

  // Ticket médio
  const ticketMedio = clientesAtendidos > 0 ? (totalVendas / clientesAtendidos) : 0;

  // 2️⃣ Ranking TOP 5 clientes
  const [ranking] = await db.query(
    `
      SELECT 
          c.idCliente,
          c.nome,
          c.cpf,
          SUM(v.valorTotal) AS totalGasto
      FROM vendas v
      INNER JOIN cliente c ON c.idCliente = v.idCliente
      WHERE ${condicaoPeriodo}
      GROUP BY c.idCliente
      ORDER BY totalGasto DESC
      LIMIT 5
    `
  );

  return {
    totalVendas,
    produtosVendidos: qtdProdutos,
    ticketMedio,
    clientesAtendidos,
    rankingClientes: ranking
  };
}

module.exports = {
  buscarDadosDashboard
};
