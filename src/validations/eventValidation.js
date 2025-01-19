const { z } = require("zod");

// Schema dasar untuk event
const BaseEventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z
    .string()
    .min(1, "Judul berita tidak boleh kosong")
    .max(100, "Judul tidak boleh lebih dari 100 karakter"),
  date: z
    .date()
    .refine((date) => date > new Date(), "Tanggal acara harus di masa depan"),
  description: z
    .string()
    .min(1, "Deskripsi berita tidak boleh kosong")
    .max(5000, "Deskripsi tidak boleh lebih dari 5000 karakter"),
});

// Schema untuk create (semua field wajib kecuali id)
const EventPostSchema = BaseEventSchema;

// Schema untuk update (semua field optional)
const EventUpdateSchema = BaseEventSchema.partial();

// Middleware untuk validasi saat create event baru
exports.validateEvent = (req, res, next) => {
  try {
    // Pastikan req.file ada sebelum validasi
    if (!req.file) {
      return res.status(400).json({ error: "File gambar harus diunggah" });
    }

    // Parsing manual untuk date
    const { date, ...rest } = req.body;
    const parsedDate = new Date(date);

    // Validasi data
    const validatedData = EventPostSchema.parse({
      ...rest,
      date: parsedDate,
      image: req.file.path,
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

// Middleware untuk validasi saat update event
exports.validateEventUpdate = (req, res, next) => {
  try {
    const updateData = {};

    // Handle date jika ada
    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }

    // Handle fields lainnya
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;

    // Handle image jika ada file baru
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Validasi data yang akan diupdate
    const validatedData = EventUpdateSchema.parse(updateData);

    // Pastikan ada minimal satu field yang diupdate
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        error: "Minimal satu field harus diubah untuk melakukan update",
      });
    }

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
