const { PrismaClient } = require("@prisma/client");
const { ApiError } = require("../middlewares/errorMiddleware");
const prisma = new PrismaClient();

// Fungsi untuk mendapatkan semua kategori
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany();

    res.status(200).json({
      status: "success",
      message: "Kategori berhasil diambil",
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Method untuk mendapatkan kategori tertentu
exports.detailCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category) {
      throw new ApiError(404, "Kategori tidak ditemukan");
    }

    res.status(200).json({
      status: "success",
      message: "Kategori berhasil diambil",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Method untuk menyimpan kategori baru
exports.storingCategory = async (req, res, next) => {
  try {
    const { name, description } = req.validatedData;

    const existingCategory = await prisma.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      throw new ApiError(400, "Nama kategori sudah ada. Gunakan nama lain");
    }

    const category = await prisma.category.create({
      data: { name, description },
    });

    res.status(201).json({
      status: "success",
      message: "Kategori berhasil dibuat",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Method untuk update kategori
exports.updateCategory = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, description } = req.validatedData;

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name, description },
    });

    res.status(200).json({
      status: "success",
      message: "Kategori berhasil diperbarui",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Method untuk menghapus kategori
exports.deleteCategory = async (req, res, next) => {
  try {
    const id = req.params.id;

    await prisma.category.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({
      status: "success",
      message: `Kategori berhasil dihapus`,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
