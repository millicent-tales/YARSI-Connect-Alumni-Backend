const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Skema validasi untuk login
const LoginSchema = z.object({
  username: z.string().nonempty("Username tidak boleh kosong"),
  password: z.string().nonempty("Password tidak boleh kosong"),
});

// Skema validasi untuk pengguna
const UserSchema = z.object({
  username: z
    .string()
    .nonempty("Inputan data username tidak boleh kosong")
    .max(50, "Username must not exceed 50 characters"),
  password: z
    .string()
    .nonempty("Inputan data password tidak boleh kosong")
    .min(6, "Password harus memiliki minimal 6 karakter"),
  role: z.string().nonempty("Role tidak boleh kosong"), // Menambahkan role sebagai string
});

// Skema validasi untuk ganti password
const ChangePasswordSchema = z
  .object({
    username: z.string().nonempty("Username tidak boleh kosong"),
    oldPassword: z.string().nonempty("Password tidak boleh kosong"),
    newPassword: z
      .string()
      .nonempty("Password tidak boleh kosong")
      .min(6, "Password minimal 6 karakter"),
    newConfirmPassword: z.string().nonempty("Password tidak boleh kosong"),
  })
  .refine((data) => data.newPassword === data.newConfirmPassword, {
    message: "Password baru dan konfirmasi password harus sama",
    path: ["newConfirmPassword"], // Menunjukkan error pada field konfirmasi password
  });

exports.validateLogin = async (req, res, next) => {
  try {
    // Validasi input dari req.body menggunakan Zod
    const validatedData = LoginSchema.parse(req.body);
    req.validatedData = { ...validatedData };
    next(); // Lanjutkan ke kontroler berikutnya
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

// Middleware untuk validasi pengguna
exports.validateUser = async (req, res, next) => {
  try {
    // Validasi data yang diterima
    const validatedData = UserSchema.parse(req.body);

    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username sudah ada, silahkan masukkan username lain",
      });
    }

    // Cek apakah role yang diminta ada di database
    const role = await prisma.role.findUnique({
      where: { name: validatedData.role },
    });

    if (!role) {
      return res.status(400).json({
        status: "error",
        message: "Role tidak valid",
      });
    }

    req.validatedData = { ...validatedData, roleId: role.id }; // Simpan roleId yang valid
    next(); // Lanjutkan ke kontroler berikutnya
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(400).json({
      message: "validasi Error",
      error,
    });
  }
};

// Middleware untuk validasi ganti password
exports.validateChangePassword = async (req, res, next) => {
  try {
    // Validasi input dari req.body menggunakan Zod
    const validatedData = ChangePasswordSchema.parse(req.body);
    req.validatedData = { ...validatedData };
    console.log(req.validatedData);
    next(); // Lanjutkan ke kontroler berikutnya
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
