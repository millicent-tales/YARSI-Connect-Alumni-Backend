const express = require("express");
const router = express.Router();
const upload = require("../utils/exelUpload");
const {
  generateAlumniUsers,
  generateAdminProdiUsers,
  downloadGeneratedExcel,
  listGeneratedExcelFiles,
} = require("../controllers/generateUserController");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  validateExcelFile,
  validateAdminProdiData,
} = require("../validations/generateUserValidation");

router.post(
  "/generate-alumni",
  authMiddleware,
  permissionUser("admin_universitas"),
  upload.single("file"),
  validateExcelFile,
  generateAlumniUsers
);

router.get(
  "/files/list",
  authMiddleware,
  permissionUser("admin_universitas"),
  listGeneratedExcelFiles
);

router.get(
  "/:filename",
  authMiddleware,
  permissionUser("admin_universitas"),
  downloadGeneratedExcel
);

router.post(
  "/generate-admin-prodi",
  authMiddleware,
  permissionUser("admin_universitas"),
  validateAdminProdiData,
  generateAdminProdiUsers
);

module.exports = router;
