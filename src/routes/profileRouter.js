const express = require("express");
const {
  addProfile,
  detailProfile,
  updateProfile,
} = require("../controllers/profileController");
const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");
const {
  validateProfileCreate,
  validateProfileUpdate,
} = require("../validations/profileValidation");
const { uploadOption } = require("../utils/fileUpload");
const router = express.Router();

router.get("/", authMiddleware, detailProfile);

router.post(
  "/",
  authMiddleware,
  permissionUser("alumni"),
  uploadOption.single("image"),
  validateProfileCreate,
  addProfile
);

router.patch(
  "",
  authMiddleware,
  permissionUser("alumni"),
  uploadOption.single("image"),
  validateProfileUpdate,
  updateProfile
);

module.exports = router;
