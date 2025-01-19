const { z } = require("zod");

// Base Profile Schema
const BaseProfileSchema = z.object({
  user_id: z.string().uuid().optional(),
  image: z.string().optional(),
  full_name: z
    .string()
    .min(1, "Nama lengkap harus diisi")
    .max(255, "Nama lengkap tidak boleh lebih dari 255 karakter"),
  student_identification_number: z
    .string()
    .min(1, "Nomor Induk Mahasiswa harus diisi")
    .max(50, "Nomor Induk Mahasiswa tidak boleh lebih dari 50 karakter"),
  study_program: z
    .string()
    .min(1, "Program studi harus diisi")
    .max(255, "Program studi tidak boleh lebih dari 255 karakter"),
  year_graduated: z
    .number()
    .int()
    .min(1900, "Tahun kelulusan tidak valid")
    .max(new Date().getFullYear(), "Tahun kelulusan tidak valid"),
  work: z
    .string()
    .max(255, "Pekerjaan tidak boleh lebih dari 255 karakter")
    .optional(),
  skills: z.string().optional(),
  entrepreneur: z.string().optional(),
  competencies: z.string().optional(),
  career: z.string().optional(),
  company: z
    .string()
    .max(255, "Nama perusahaan tidak boleh lebih dari 255 karakter")
    .optional(),
  linkedin: z
    .string()
    .max(255, "URL LinkedIn tidak boleh lebih dari 255 karakter")
    .optional(),
  // Sensitive data fields
  mobile_number: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon maksimal 15 digit")
    .regex(/^[0-9]+$/, "Nomor telepon hanya boleh berisi angka")
    .optional(),
  full_address: z
    .string()
    .min(1, "Alamat lengkap harus diisi")
    .max(500, "Alamat lengkap tidak boleh lebih dari 500 karakter")
    .optional(),
});

// Schema for creating profile
const ProfileCreateSchema = BaseProfileSchema;

// Schema for updating profile
const ProfileUpdateSchema = BaseProfileSchema.partial();

exports.validateProfileCreate = (req, res, next) => {
  try {
    // Handle image upload
    if (!req.file) {
      return res.status(400).json({ error: "File gambar harus diunggah" });
    }

    // Prepare data for validation
    const profileData = {
      ...req.body,
      user_id: req.user.id,
      image: `${req.protocol}://${req.get(
        "host"
      )}/src/uploads/private/profiles/${req.file.filename}`,
      year_graduated: parseInt(req.body.year_graduated, 10),
      skills: req.body.skills
        ? JSON.stringify(
            req.body.skills.split(",").map((skill) => skill.trim())
          )
        : undefined,
      competencies: req.body.competencies
        ? JSON.stringify(
            req.body.competencies.split(",").map((comp) => comp.trim())
          )
        : undefined,
    };

    // Validate the profile data
    const validatedData = ProfileCreateSchema.parse(profileData);

    // Attach validated data to request
    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        errors: error.errors,
      });
    }
    console.error("Profile Create Validation Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.validateProfileUpdate = (req, res, next) => {
  try {
    const updateData = {};

    // Handle fields from request body
    if (req.body.full_name) updateData.full_name = req.body.full_name;
    if (req.body.student_identification_number)
      updateData.student_identification_number =
        req.body.student_identification_number;
    if (req.body.study_program)
      updateData.study_program = req.body.study_program;
    if (req.body.year_graduated)
      updateData.year_graduated = parseInt(req.body.year_graduated, 10);
    if (req.body.work) updateData.work = req.body.work;
    if (req.body.company) updateData.company = req.body.company;
    if (req.body.linkedin) updateData.linkedin = req.body.linkedin;
    if (req.body.mobile_number)
      updateData.mobile_number = req.body.mobile_number;
    if (req.body.full_address) updateData.full_address = req.body.full_address;

    if (req.body.skills) {
      updateData.skills = JSON.stringify(
        req.body.skills.split(",").map((skill) => skill.trim())
      );
    }

    if (req.body.entrepreneur) updateData.entrepreneur = req.body.entrepreneur;

    if (req.body.competencies) {
      updateData.competencies = JSON.stringify(
        req.body.competencies.split(",").map((comp) => comp.trim())
      );
    }

    if (req.body.career) updateData.career = req.body.career;

    // Handle image jika ada file baru
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Validate update data
    const validatedData = ProfileUpdateSchema.parse(updateData);

    // Ensure at least one field is being updated
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Minimal satu field harus diubah untuk melakukan update",
      });
    }

    // Attach validated data to request
    req.validatedData = validatedData;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        errors: error.errors,
      });
    }
    console.error("Profile Update Validation Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};
