const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");

exports.addProduct = async (req, res) => {
  try {
    // Gunakan data yang sudah tervalidasi dari middleware
    const { name, description, categoryId, price, image, stock } =
      req.validatedData;

    // Cek apakah product dengan nama yang sama sudah ada
    const existingProduct = await prisma.product.findUnique({
      where: { name: name },
    });

    if (existingProduct) {
      return res.status(400).json({
        status: "fail",
        message: "Nama produk sudah ada, silahkan masukkan produk lain.",
      });
    }

    // Cek apakah categoryId sudah terdaftar
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return res.status(400).json({
        status: "fail",
        message:
          "Kategori tidak ditemukan, silahkan masukkan kategori yang valid.",
      });
    }

    // Dapatkan nama file yang diupload
    const fileName = req.file.filename;

    // Bangun URL untuk gambar yang diupload
    const pathFile = `${req.protocol}://${req.get(
      "host"
    )}/public/uploads/${fileName}`;

    // Simpan produk baru ke database
    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        categoryId,
        price,
        image: pathFile,
        stock,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Produk berhasil ditambahkan.",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.readProduct = async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    return res.status(200).json({
      status: "success",
      message: "Data produk berhasil diambil.",
      data: products,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.detailProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await prisma.product.findUnique({
      where: { id: id },
    });

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "Produk dengan ID tersebut tidak ditemukan.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Data produk berhasil diambil.",
      data: product,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.updateProduct = async (req, res) => {
  // request params & body
  const idParams = req.params.id;
  let { name, price, description, stock, categoryId } = req.body;

  // get data by id
  const product = await prisma.product.findUnique({
    where: { id: idParams },
  });

  if (!product) {
    return res.status(404).json({
      status: "fail",
      message: "Produk dengan ID tersebut tidak ditemukan.",
    });
  }

  // req file
  const file = req.file;
  // kondisi jika file gambar diupdate
  if (file) {
    // ambil file gambar lama
    const nameImage = product.image.replace(
      `${req.protocol}://${req.get("host")}/public/uploads/`
    );
    // tempat file gambar lama
    const filePath = `./public/upload/${nameImage}`;

    // fungsi hapus
    fs.unlink(filePath, (err) => {
      if (err) {
        res.status(400);
        throw new Error("File tidak ditemukan");
      }
    });

    // Dapatkan nama file yang diupload
    const fileName = req.file.filename;

    // Bangun URL untuk gambar yang diupload
    const pathFile = `${req.protocol}://${req.get(
      "host"
    )}/public/uploads/${fileName}`;

    product.image = pathFile;
  }
};
