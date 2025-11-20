const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

// GET /api/dashboard?filtro=mes|semestre|ano
router.get("/", dashboardController.getDashboardData);

module.exports = router;
