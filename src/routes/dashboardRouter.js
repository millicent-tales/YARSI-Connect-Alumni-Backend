const express = require("express");
const router = express.Router();
const {
  universityDashboardStatistics,
  studyProgramDashboardStatistics,
} = require("../controllers/dashboardController");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");

// Route untuk dashboard universitas
router.get(
  "/university",
  authMiddleware,
  permissionUser("admin_universitas"),
  universityDashboardStatistics
);

// Route untuk dashboard prodi
router.get(
  "/study-program",
  authMiddleware,
  permissionUser("admin_prodi"),
  studyProgramDashboardStatistics
);

module.exports = router;
