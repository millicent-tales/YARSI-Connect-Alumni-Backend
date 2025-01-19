const express = require("express");
const router = express.Router();
const {
  testNotification,
} = require("../controllers/notificationTracerStudyController");

// Tidak perlu mengimport sendNotification karena hanya digunakan di controller
router.get("/", testNotification);

module.exports = router;
