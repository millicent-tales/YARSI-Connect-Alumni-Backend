const express = require("express");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  allProfilesForAlumni,
  allProfilesForProdi,
  allProfilesForUniv,
  getAvailableStudyPrograms,
  getAvailableGraduationYears,
  getAvailableFaculties,
} = require("../controllers/dataController");

const router = express.Router();

router.get(
  "/alumni",
  authMiddleware,
  permissionUser("alumni"),
  allProfilesForAlumni
);

router.get(
  "/prodi",
  authMiddleware,
  permissionUser("admin_prodi"),
  allProfilesForProdi
);

router.get(
  "/universitas",
  authMiddleware,
  permissionUser("admin_universitas"),
  allProfilesForUniv
);

router.get("/study-programs", authMiddleware, getAvailableStudyPrograms);

router.get("/graduation-years", authMiddleware, getAvailableGraduationYears);

router.get("/faculties", authMiddleware, getAvailableFaculties);

module.exports = router;