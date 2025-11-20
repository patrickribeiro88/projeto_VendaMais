const dashboardModel = require("../models/dashboardModel");

async function getDashboardData(req, res) {
  try {
    const filtro = req.query.filtro || "mes"; // mes, semestre, ano

    const dados = await dashboardModel.buscarDadosDashboard(filtro);

    res.status(200).json(dados);

  } catch (err) {
    console.error("❌ Erro no Dashboard:", err);
    res.status(500).json({ message: "Erro ao gerar dados do dashboard." });
  }
}

module.exports = {
  getDashboardData
};
