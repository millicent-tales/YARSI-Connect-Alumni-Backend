const { z } = require("zod");

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Definisikan enum ProgramType
const ProgramType = z.enum([
  "Lowongan_Kerja",
  "Reuni",
  "Penggalangan_Dana",
  "Sesi_Berbagi_Pengalaman",
]);
// Skema validasi untuk program alumni (untuk create)
const AlumniProgramPostSchema = z.object({
  title: z
    .string()
    .min(1, "Nama kategori tidak boleh kosong")
    .max(50, "Nama kategori tidak boleh lebih dari 50 karakter"),
  description: z.string().nullable().optional(),
  category: ProgramType,
});

// Middleware untuk validasi produk saat create dan update
exports.validateAlumniProgram = (req, res, next) => {
  try {
    console.log(req.file);
    // Pastikan req.file ada sebelum validasi
    if (!req.file) {
      return res.status(400).json({ error: "File gambar harus diunggah" });
    }

    // Validasi produk
    const validatedData = AlumniProgramPostSchema.parse({
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
