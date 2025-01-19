const { z } = require("zod");
const express = require("express");
const {
  validateLogin,
  validateUser,
  validateChangePassword,
} = require("../middlewares/authenticateMiddleware");
const {
  createUser,
  loginUser,
  logoutUser,
  getMyUser,
  changePassword,
} = require("../controllers/AuthController");
const { authMiddleware } = require("../middlewares/userMiddleware");

const router = express.Router();

router.post("/register", validateUser, createUser);
router.post("/login", validateLogin, loginUser);
router.post("/logout", authMiddleware, logoutUser);
router.get("/me", authMiddleware, getMyUser);
router.patch("/changePassword", validateChangePassword, changePassword);

module.exports = router;
