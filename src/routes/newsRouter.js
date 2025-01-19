const express = require("express");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  validateNews,
  validateNewsUpdate,
} = require("../validations/newsValidation");
const {
  addNews,
  readNews,
  detailNews,
  readVerifyNews,
  readVerifiedNews,
  verifyNews,
  toggleIsActiveNews,
  updateNews,
  readNewsUpdate,
  sendNewsWhatsapp,
} = require("../controllers/newsController");
const { uploadOption } = require("../utils/fileUpload");

const router = express.Router();

// API UNTUK MENAMPILKAN DATA ACARA YANG AKAN DIVERIFIKASI
router.get(
  "/to-be-verified",
  authMiddleware,
  permissionUser("admin_universitas"),
  readVerifyNews
);

// API UNTUK MENAMPILKAN DATA ACARA YANG SUDAH DIVERIFIKASI
router.get(
  "/verified",
  authMiddleware,
  permissionUser("admin_universitas"),
  readVerifiedNews
);

// API UNTUK MELIHAT NEWS YANG SUDAH DIBUAT OLEH USER SENDIRI
router.get(
  "/my-news",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  readNewsUpdate
);

// API UNTUK MEMBUAT DATA NEWS
router.post(
  "/",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  uploadOption.single("image"),
  validateNews,
  addNews
);

// API UNTUK MENGUPDATE DATA NEWS
router.patch(
  "/:id",
  authMiddleware,
  permissionUser("admin_universitas"),
  uploadOption.single("image"),
  validateNewsUpdate,
  updateNews
);

router.get("/", readNews);

router.get("/:id", detailNews);

// API UNTUK MELAKUKAN VERIFIKASI DATA NEWS
router.patch(
  "/:id/verify",
  authMiddleware,
  permissionUser("admin_universitas"),
  verifyNews
);

router.patch(
  "/:id/toggle-active",
  authMiddleware,
  permissionUser("admin_universitas"),
  toggleIsActiveNews
);

router.post(
  "/:id/send-news",
  authMiddleware,
  permissionUser("admin_universitas"),
  sendNewsWhatsapp
);

module.exports = router;
