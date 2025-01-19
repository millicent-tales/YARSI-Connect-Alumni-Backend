const { z } = require("zod");

// Skema validasi untuk kategori (untuk update)
const CategorySchema = z.object({
  name: z
    .string()
    .max(50, "Nama kategori tidak boleh lebih dari 50 karakter")
    .optional() // Field name opsional
    .refine((val) => val !== "", {
      message: "Inputan nama kategori tidak boleh kosong",
    }),
  description: z.string().nullable().optional(), // Field description opsional
});

// Skema validasi untuk kategori (untuk create)
const CategoryPostSchema = z.object({
  name: z
    .string()
    .min(1, "Nama kategori tidak boleh kosong")
    .max(50, "Nama kategori tidak boleh lebih dari 50 karakter"),
  description: z.string().nullable(),
});

// Middleware untuk validasi kategori saat update
exports.validateUpdateCategory = (req, res, next) => {
  try {
    const validatedData = CategorySchema.parse(req.body); // Validasi berdasarkan skema
    req.validatedData = validatedData; // Simpan data yang tervalidasi
    next(); // Lanjutkan ke kontroler berikutnya
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Mengirimkan kesalahan validasi
      return res.status(400).json({ errors: error.errors });
    }
    // Menangani kesalahan server
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

// Middleware untuk validasi kategori saat create
exports.validateCategory = (req, res, next) => {
  try {
    const validatedData = CategoryPostSchema.parse(req.body); // Validasi berdasarkan skema
    req.validatedData = validatedData; // Simpan data yang tervalidasi
    next(); // Lanjutkan ke kontroler berikutnya
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Mengirimkan kesalahan validasi
      return res.status(400).json({ errors: error.errors });
    }
    // Menangani kesalahan server
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};
