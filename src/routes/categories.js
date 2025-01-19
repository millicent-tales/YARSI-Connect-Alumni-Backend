const express = require("express");
const router = express.Router();

const {
  getAllCategories,
  storingCategory,
  detailCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const {
  validateCategory,
  validateUpdateCategory,
} = require("../validations/categoryValidation");

const {
  authMiddleware,
  permissionUser,
} = require("../middlewares/userMiddleware");

// READ DATA FINDMANY
router.get("/", getAllCategories);

// DETAIL DATA ini udah benar
router.get(
  "/:id",
  authMiddleware,
  permissionUser("admin_universitas"),
  detailCategory
);

// CREATE DATA
router.post(
  "/",
  validateCategory,
  permissionUser("admin_universitas"),
  storingCategory
);

// UPDATE DATA
router.put(
  "/:id",
  authMiddleware,
  permissionUser("admin_universitas"),
  validateUpdateCategory,
  updateCategory
);

// DELET DATA
router.delete("/:id", permissionUser("admin_universitas"), deleteCategory);

module.exports = router;
