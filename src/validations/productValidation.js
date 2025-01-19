const { z } = require("zod");

const ProductPostSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .min(1, "Nama produk tidak boleh kosong")
    .max(50, "Nama tidak boleh lebih dari 50 karakter")
    .regex(
      /^[a-zA-Z0-9\s]*$/,
      "Nama produk hanya boleh mengandung huruf dan angka"
    ),
  description: z.string().nullable().optional(),
  price: z
    .union([z.string(), z.array(z.string())]) // Menerima string atau array of strings
    .transform((val) => {
      // Jika val adalah array, ambil elemen pertama
      const value = Array.isArray(val) ? val[0] : val;
      const numberValue = Number(value); // Mengonversi string ke number
      if (isNaN(numberValue) || numberValue <= 0) {
        throw new z.ZodError([
          {
            message: "Harga harus berupa angka positif yang valid",
            path: ["price"],
          },
        ]);
      }
      return numberValue; // Mengembalikan nilai yang sudah dikonversi
    }),
  categoryId: z.union([z.number(), z.string()]).transform((val) => {
    const numberValue = typeof val === "string" ? Number(val) : val;
    if (isNaN(numberValue) || numberValue <= 0) {
      throw new z.ZodError([
        {
          message: "ID Kategori harus berupa angka positif yang valid",
          path: ["categoryId"],
        },
      ]);
    }
    return numberValue;
  }),
  image: z.string().min(1, "File gambar harus diunggah"),
  stock: z
    .union([z.number(), z.string()]) // Mengizinkan stock sebagai string atau number
    .transform((val) => {
      const numberValue = typeof val === "string" ? Number(val) : val; // Mengonversi ke number
      if (isNaN(numberValue) || numberValue < 0) {
        // Memastikan nilai tidak negatif
        throw new z.ZodError([
          {
            message: "Stok harus berupa angka non-negatif yang valid",
            path: ["stock"],
          },
        ]);
      }
      return numberValue; // Mengembalikan nilai yang sudah dikonversi
    }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Middleware untuk validasi produk saat create dan update
exports.validateProduct = (req, res, next) => {
  try {
    // Pastikan req.file ada sebelum validasi
    if (!req.file) {
      return res.status(400).json({ error: "File gambar harus diunggah" });
    }

    // Validasi produk
    const validatedData = ProductPostSchema.parse({
      ...req.body,
      image: req.file.path, // Menyimpan path gambar yang diunggah
    });

    req.validatedData = validatedData; // Simpan data yang sudah tervalidasi
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
