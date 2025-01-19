const express = require("express");
const {
  addProduct,
  detailProduct,
  readProduct,
} = require("../controllers/productController");
const { validateProduct } = require("../validations/productValidation");
const { uploadOption } = require("../utils/fileUpload");

const router = express.Router();

// TAMBAH PRODUCT
router.post("/", uploadOption.single("image"), validateProduct, addProduct);

// MELIHAT SEMUA DATA
router.get("/", readProduct);

// MELIHAT DETAIL DATA
router.get("/:id", detailProduct);

module.exports = router;
