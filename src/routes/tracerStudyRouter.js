const express = require("express");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  addTracerStudy,
  dataUserTracerStudy,
  addOrUpdateTracerStudy,
  readTracerStudies,
} = require("../controllers/tracerStudyController");
const { validateTracerStudy } = require("../validations/tracerStudyValidation");
const router = express.Router();

router.get(
  "/",
  authMiddleware,
  permissionUser("admin_universitas"),
  readTracerStudies
);

router.get(
  "/user",
  authMiddleware,
  permissionUser("alumni"),
  dataUserTracerStudy
);

router.post(
  "/",
  authMiddleware,
  permissionUser("alumni"),
  validateTracerStudy,
  addOrUpdateTracerStudy
);

module.exports = router;
