const { z } = require("zod");

// Schema dasar untuk news
const BaseNewsSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, "Judul berita tidak boleh kosong")
    .max(500, "Judul tidak boleh lebih dari 500 karakter"),
  content: z
    .string()
    .min(1, "Konten berita tidak boleh kosong")
    .max(5000, "Konten tidak boleh lebih dari 5000 karakter"),
});

// Schema untuk create (semua field wajib kecuali id)
const NewsPostSchema = BaseNewsSchema;

// Schema untuk update (semua field optional)
const NewsUpdateSchema = BaseNewsSchema.partial();

// Middleware untuk validasi saat create news baru
exports.validateNews = (req, res, next) => {
  try {
    // Pastikan req.file ada sebelum validasi
    if (!req.file) {
      return res.status(400).json({ error: "File gambar harus diunggah" });
    }

    // Validasi berita
    const validatedData = NewsPostSchema.parse({
      ...req.body,
      image: req.file.path, // Menyimpan path gambar yang diunggah
    });

    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// Middleware untuk validasi saat update news
exports.validateNewsUpdate = (req, res, next) => {
  try {
    const updateData = {};

    // Handle fields yang ada dalam request body
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.content) updateData.content = req.body.content;

    // Handle image jika ada file baru
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Validasi data yang akan diupdate
    const validatedData = NewsUpdateSchema.parse(updateData);

    // Pastikan ada minimal satu field yang diupdate
    if (Object.keys(validatedData).length === 0 && !req.file) {
      return res.status(400).json({
        error: "Minimal satu field harus diubah untuk melakukan update",
      });
    }

    req.validatedData = validatedData;
    if (req.file) {
      req.validatedData.image = req.file.path;
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};
