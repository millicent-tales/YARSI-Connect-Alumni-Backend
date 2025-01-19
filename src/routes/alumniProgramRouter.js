const { z } = require("zod");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  validateAlumniProgram,
} = require("../validations/alumniProgramValidation");
const {
  addAlumniProgram,
  readAlumniProgram,
  detailAlumniProgram,
  verifyAlumniProgram,
  readVerifyAlumniProgram,
  readVerifiedAlumniProgram,
  toggleIsActiveAlumniProgram,
  sendAlumniProgramWhatsapp,
} = require("../controllers/alumniProgramController");
const { uploadOption } = require("../utils/fileUpload");
const express = require("express");

const router = express.Router();

// API UNTUK MENAMPILKAN DATA ALUMNI PROGRAM YANG AKAN DIVERIFIKASI
router.get(
  "/to-be-verified",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  readVerifyAlumniProgram
);

// API UNTUK MENAMPILKAN DATA ALUMNI PROGRAM YANG SUDAH DIVERIFIKASI
router.get(
  "/verified",
  authMiddleware,
  permissionUser("admin_universitas"),
  readVerifiedAlumniProgram
);

router.get("/", readAlumniProgram);

router.get("/:id", detailAlumniProgram);

router.post(
  "/",
  authMiddleware,
  permissionUser("alumni"),
  uploadOption.single("image"),
  validateAlumniProgram,
  addAlumniProgram
);

// API UNTUK MELAKUKAN VERIFIKASI DATA ALUMNI PROGRAM
router.patch(
  "/:id/verify",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  verifyAlumniProgram
);

router.patch(
  "/:id/toggle-active",
  authMiddleware,
  permissionUser("admin_universitas"),
  toggleIsActiveAlumniProgram
);

router.post(
  "/:id/send-alumni-program",
  authMiddleware,
  permissionUser("admin_universitas"),
  sendAlumniProgramWhatsapp
);

module.exports = router;
