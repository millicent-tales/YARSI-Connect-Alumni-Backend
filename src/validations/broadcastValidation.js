const { z } = require("zod");

// Define Zod schema untuk validasi
const broadcastSchema = z.object({
  message: z.string().min(1, "Message (URL) is required"),
});

exports.validateBroadcast = (req, res, next) => {
  try {
    // Validasi request body dengan Zod
    broadcastSchema.parse(req.body);
    next();
  } catch (error) {
    // Jika validasi gagal, kirimkan error
    res.status(400).json({
      error: error.errors.map((err) => err.message),
    });
  }
};
