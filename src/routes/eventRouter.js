const express = require("express");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  validateEvent,
  validateEventUpdate,
} = require("../validations/eventValidation");
const {
  addEvent,
  readEvent,
  detailEvent,
  readVerifyEvent,
  readVerifiedEvent,
  verifyEvent,
  toggleIsActiveEvent,
  readEventUpdate,
  updateEvent,
  detailEventUpdate,
  sendEventWhatsapp,
} = require("../controllers/eventController");
const { uploadOption } = require("../utils/fileUpload");

const router = express.Router();

// API UNTUK MENAMPILKAN DATA EVENT YANG AKAN DIVERIFIKASI
router.get(
  "/to-be-verified",
  authMiddleware,
  permissionUser("admin_universitas"),
  readVerifyEvent
);

// API UNTUK MENAMPILKAN DATA EVENT YANG SUDAH DIVERIFIKASI
router.get(
  "/verified",
  authMiddleware,
  permissionUser("admin_universitas"),
  readVerifiedEvent
);

// API UNTUK MEMBUAT DATA EVENT
router.post(
  "/",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  uploadOption.single("image"),
  validateEvent,
  addEvent
);

// API UNTUK MENGUPDATE DATA EVENT
router.patch(
  "/:id",
  authMiddleware,
  permissionUser("admin_universitas"),
  uploadOption.single("image"),
  validateEventUpdate,
  updateEvent
);

// API UNTUK MELIHAT EVENT YANG SUDAH DIBUAT OLEH USER SENDIRI
router.get(
  "/my-events",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  readEventUpdate
);

// API UNTUK DETAIL MY EVENT
router.get(
  "/my-events/:id",
  authMiddleware,
  permissionUser("admin_universitas", "admin_prodi"),
  detailEventUpdate
);

router.get("/", readEvent);

router.get("/:id", detailEvent);

// API UNTUK MELAKUKAN VERIFIKASI DATA EVENT
router.patch(
  "/:id/verify",
  authMiddleware,
  permissionUser("admin_universitas"),
  verifyEvent
);

router.patch(
  "/:id/toggle-active",
  authMiddleware,
  permissionUser("admin_universitas"),
  toggleIsActiveEvent
);

router.post(
  "/:id/send-event",
  authMiddleware,
  permissionUser("admin_universitas"),
  sendEventWhatsapp
);

module.exports = router;
