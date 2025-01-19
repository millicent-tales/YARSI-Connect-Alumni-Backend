const { z } = require("zod");

// Konfigurasi tipe file Excel yang diperbolehkan
const ACCEPTED_FILE_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Skema validasi untuk file Excel
const ExcelFileSchema = z.object({
  originalname: z.string().min(1, "Nama file tidak boleh kosong"),
  mimetype: z
    .string()
    .refine(
      (type) => ACCEPTED_FILE_TYPES.includes(type),
      "Hanya file Excel yang diperbolehkan"
    ),
  path: z.string().min(1, "Path file tidak valid"),
});

// Skema validasi untuk data admin prodi
const AdminProdiSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username hanya boleh berisi huruf, angka, titik, underscore, dan strip"
    ),
  password: z.string().min(8, "Password minimal 8 karakter"),
  level: z.enum(["S1", "S2", "S3", "Sp-1", "Profesi"], {
    errorMap: () => ({
      message: "Level harus salah satu dari: S1, S2, S3, Sp-1, Profesi",
    }),
  }),
  studyProgram: z
    .string()
    .min(1, "Program studi tidak boleh kosong")
    .max(100, "Program studi terlalu panjang"),
});

// Middleware untuk validasi file Excel
exports.validateExcelFile = (req, res, next) => {
  try {
    console.log(req.file);

    // Pastikan req.file ada sebelum validasi
    if (!req.file) {
      return res.status(400).json({ error: "File Excel harus diunggah" });
    }

    // Validasi file menggunakan Zod
    const validatedFile = ExcelFileSchema.parse(req.file);

    // Simpan data yang sudah tervalidasi untuk digunakan di controller
    req.validatedFile = validatedFile;

    next(); // Lanjutkan ke handler berikutnya
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

// Middleware untuk validasi data admin prodi
exports.validateAdminProdiData = (req, res, next) => {
  try {
    // Validasi body request menggunakan Zod
    const validatedData = AdminProdiSchema.parse(req.body);

    // Simpan data yang sudah tervalidasi
    req.validatedData = validatedData;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format pesan error agar lebih mudah dibaca
      const errorMessages = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        status: "error",
        message: "Validasi gagal",
        errors: errorMessages,
      });
    }

    // Menangani kesalahan server
    console.error("Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};
