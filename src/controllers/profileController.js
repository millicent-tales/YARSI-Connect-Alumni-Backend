const { PrismaClient } = require("@prisma/client");
const fs = require("fs").promises; // Gunakan versi promises dari fs
const path = require("path");

const prisma = new PrismaClient();

const { uploadOption } = require("../utils/fileUpload");
exports.profileImageUpload = uploadOption;

exports.addProfile = async (req, res) => {
  try {
    const { validatedData } = req;

    // Create new profile
    const result = await prisma.profile.create({
      data: validatedData,
    });

    res.status(201).json({
      status: "success",
      message: "Profil berhasil dibuat",
      data: result,
    });
  } catch (error) {
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message:
          "Data duplikat terdeteksi. Silakan periksa kembali input Anda.",
      });
    }

    // Handle other unexpected errors
    console.error("Add Profile Error:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat membuat profil",
      details: error.message,
    });
  }
};

exports.detailProfile = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Menarik data profil berdasarkan user_id
    const profile = await prisma.profile.findUnique({
      where: {
        user_id: user_id,
      },
      select: {
        id: true,
        full_name: true,
        image: true,
        student_identification_number: true,
        study_program_id: true,
        year_graduated: true,
        work: true,
        skills: true,
        entrepreneur: true,
        competencies: true,
        career: true,
        company: true,
        linkedin: true,
        is_alumni_leader: true,
        studyProgram: {
          select: {
            name: true,
            code: true,
            level: true,
          },
        },
        sensitive_student_data: {
          select: {
            phone_number: true,
            full_address: true,
            email: true,
            mobile_number: true,
            graduation_date: true, // Menambahkan graduation_date
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            roleId: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profil tidak ditemukan.",
      });
    }

    // Mengambil tahun dari graduation_date
    const graduationYear = profile.sensitive_student_data?.graduation_date
      ? new Date(profile.sensitive_student_data.graduation_date).getFullYear()
      : null;

    // Format hasil agar lebih user-friendly
    const formattedProfile = {
      id: profile.id,
      image: profile.image,
      is_alumni_leader: profile.is_alumni_leader,
      fullName: profile.full_name,
      studentIdentificationNumber: profile.student_identification_number,
      studyProgram: {
        name: profile.studyProgram.name,
      },
      yearGraduated: graduationYear, // Menggunakan tahun dari graduation_date
      // Data sensitif
      sensitiveData: {
        mobileNumber: profile.sensitive_student_data?.mobile_number,
        fullAddress: profile.sensitive_student_data?.full_address,
      },
      work: profile.work,
      company: profile.company,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      linkedin: profile.linkedin,
      entrepreneur: profile.entrepreneur,
      competencies: profile.competencies
        ? JSON.parse(profile.competencies)
        : [],
      career: profile.career,
      user: {
        id: profile.user.id,
        username: profile.user.username,
        role: profile.user.role.name,
      },
    };

    return res.status(200).json({
      status: "success",
      message: "Data Profil berhasil diambil.",
      data: formattedProfile,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { validatedData } = req;

    // 1. Validasi keberadaan profil
    const existingProfile = await prisma.profile.findUnique({
      where: { user_id: req.user.id },
      include: { sensitive_student_data: true },
    });

    if (!existingProfile) {
      return res.status(404).json({
        status: "fail",
        message: "Profil tidak ditemukan",
      });
    }

    // 2. Persiapkan data update untuk `Profile`
    const updateProfileData = {};
    const updateSensitiveData = {};

    // Memisahkan data untuk Profile dan SensitiveStudentData
    Object.entries(validatedData).forEach(([key, value]) => {
      if (key === "mobile_number" || key === "full_address") {
        updateSensitiveData[key] = value;
      } else {
        updateProfileData[key] = value;
      }
    });

    // Handle image update jika ada file baru
    if (req.file) {
      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/private/profiles/${req.file.filename}`;
      updateProfileData.image = newImageUrl;

      const oldImagePath = existingProfile.image?.split("/profiles/")[1];
      if (oldImagePath) {
        const fullPath = path.join(
          __dirname,
          "../uploads/private/profiles",
          oldImagePath
        );
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          console.log(
            "Warning: Old image file not found or could not be deleted:",
            err.message
          );
        }
      }
    }

    // 4. Update `Profile` dan `SensitiveStudentData` secara terpisah
    const transaction = [];

    // Update `Profile` jika ada data yang perlu diupdate
    if (Object.keys(updateProfileData).length > 0) {
      transaction.push(
        prisma.profile.update({
          where: { user_id: req.user.id },
          data: updateProfileData,
        })
      );
    }

    // Update atau buat `SensitiveStudentData` jika ada data sensitif yang perlu diupdate
    if (Object.keys(updateSensitiveData).length > 0) {
      if (existingProfile.sensitive_student_data) {
        transaction.push(
          prisma.sensitiveStudentData.update({
            where: { profile_id: existingProfile.id },
            data: updateSensitiveData,
          })
        );
      } else {
        transaction.push(
          prisma.sensitiveStudentData.create({
            data: {
              profile_id: existingProfile.id,
              ...updateSensitiveData,
            },
          })
        );
      }
    }

    // Jalankan transaksi
    await prisma.$transaction(transaction);

    // 5. Kembalikan respons
    return res.status(200).json({
      status: "success",
      message: "Profil berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        status: "fail",
        message:
          "Data duplikat terdeteksi. Silakan periksa kembali input Anda.",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};
