const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.addOrUpdateTracerStudy = async (req, res) => {
  try {
    const inputData = req.validatedData;
    const userId = req.user.id;

    const profileExists = await prisma.profile.findUnique({
      where: { user_id: userId },
    });

    if (!profileExists) {
      throw new Error("Profile tidak ditemukan");
    }

    // Get all field names from the TracerStudy model schema except id, profile_id, createdAt, and updatedAt
    const tracerStudyFields = [
      "nimhsmsmh",
      "tahun_lulus",
      "nmmhsmsmh",
      "emailmsmh",
      "kdptimsmh",
      "kdpstmsmh",
      "telpomsmh",
      "nik",
      "npwp",
      "f8",
      "f502",
      "f505",
      "f5a1",
      "f5a2",
      "f1101",
      "f1102",
      "f5b",
      "f5c",
      "f5d",
      "f18a",
      "f18b",
      "f18c",
      "f18d",
      "f1201",
      "f1202",
      "f14",
      "f15",
      "f1761",
      "f1762",
      "f1763",
      "f1764",
      "f1765",
      "f1766",
      "f1767",
      "f1768",
      "f1769",
      "f1770",
      "f1771",
      "f1772",
      "f1773",
      "f1774",
      "f21",
      "f22",
      "f23",
      "f24",
      "f25",
      "f26",
      "f27",
      "f301",
      "f302",
      "f303",
      "f401",
      "f402",
      "f403",
      "f404",
      "f405",
      "f406",
      "f407",
      "f408",
      "f409",
      "f410",
      "f411",
      "f412",
      "f413",
      "f414",
      "f415",
      "f416",
      "f6",
      "f7",
      "f7a",
      "f1001",
      "f1002",
      "f1601",
      "f1602",
      "f1603",
      "f1604",
      "f1605",
      "f1606",
      "f1607",
      "f1608",
      "f1609",
      "f1610",
      "f1611",
      "f1612",
      "f1613",
      "f1614",
    ];

    // Create an object with all fields set to null
    const nullifiedData = tracerStudyFields.reduce((acc, field) => {
      acc[field] = null;
      return acc;
    }, {});

    // Merge the nullified data with input data
    // This ensures all unspecified fields become null while keeping the input values
    const finalData = {
      ...nullifiedData,
      ...inputData,
    };

    const existingTracerStudy = await prisma.tracerStudy.findUnique({
      where: { profile_id: profileExists.id },
    });

    const result = await prisma.$transaction(async (tx) => {
      if (existingTracerStudy) {
        return await tx.tracerStudy.update({
          where: { profile_id: profileExists.id },
          data: finalData,
        });
      } else {
        return await tx.tracerStudy.create({
          data: {
            ...finalData,
            profile_id: profileExists.id,
          },
        });
      }
    });

    const message = existingTracerStudy
      ? "Data tracer study berhasil diperbarui"
      : "Data tracer study berhasil ditambahkan";

    return res.status(200).json({
      status: "success",
      message: message,
      data: result,
    });
  } catch (error) {
    console.error("Error in addOrUpdateTracerStudy:", error);

    if (error.message === "Profile tidak ditemukan") {
      return res.status(400).json({
        status: "error",
        message: error.message,
      });
    }

    if (error.code === "P2002") {
      return res.status(400).json({
        status: "error",
        message: "Terjadi konflik dengan data yang sudah ada",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.dataUserTracerStudy = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User is not authenticated",
      });
    }

    const userProfile = await prisma.profile.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        studyProgram: true,
        sensitive_student_data: true,
        user: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile tidak ditemukan",
      });
    }

    const graduationYear = userProfile.year_graduated
      ? new Date(userProfile.year_graduated).getFullYear().toString()
      : null;

    const tracerStudyData = {
      success: true,
      data: {
        nimhsmsmh: userProfile.student_identification_number,
        tahun_lulus: graduationYear,
        nmmhsmsmh: userProfile.full_name,
        kdptimsmh: userProfile.sensitive_student_data?.pt_code || "031026",
        kdpstmsmh: userProfile.studyProgram?.code,
        telpomsmh: userProfile.sensitive_student_data?.mobile_number,
        emailmsmh: userProfile.sensitive_student_data?.email,
        nik: userProfile.sensitive_student_data?.national_identity_number,
      },
    };

    return res.status(200).json(tracerStudyData);
  } catch (error) {
    console.error("Error in dataUserTracerStudy:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.readTracerStudies = async (req, res) => {
  try {
    const tracerStudies = await prisma.tracerStudy.findMany({
      include: {
        profile: {
          include: {
            studyProgram: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!tracerStudies.length) {
      return res.status(200).json({
        status: "success",
        message: "Belum ada data tracer study",
        data: [],
      });
    }

    const formattedData = tracerStudies.map((study) => {
      const { profile, ...studyData } = study;
      return {
        ...studyData,
        student_name: profile.full_name,
        student_id: profile.student_identification_number,
        study_program: profile.studyProgram.name,
        username: profile.user.username,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Data tracer study berhasil diambil",
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in getAllTracerStudies:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
