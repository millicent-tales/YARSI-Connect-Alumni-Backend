const multer = require("multer");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(
  __dirname,
  "../uploads/private/generated-account/uploaded-excel"
);

// Pastikan direktori `uploads` ada
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // Buat direktori jika belum ada
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      // Ambil nama file asli tanpa ekstensi
      const originalName = path.basename(
        file.originalname,
        path.extname(file.originalname)
      );
      const timestamp = Date.now();
      const extension = path.extname(file.originalname); // Menyimpan ekstensi
      const newFilename = `${originalName}_${timestamp}${extension}`;
      cb(null, newFilename);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Hanya file Excel yang diperbolehkan"));
    }
  },
});

module.exports = upload;
