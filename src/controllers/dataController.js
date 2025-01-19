const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const facultyMapping = {
  Psikologi: "Psikologi", // AMAN
  Manajemen: "Ekonomi Dan Bisnis", // AMAN
  Akuntansi: "Ekonomi Dan Bisnis", // AMAN
  "Ilmu Hukum": "Hukum", // AMAN
  "Teknik Informatika": "Teknologi Informasi", // AMAN
  "Perpustakaan dan Sains Informasi": "Teknologi Informasi", // AMAN
  Kedokteran: "Kedokteran", // AMAN
  "Profesi Dokter": "Kedokteran", // AMAN
  "Kedokteran Gigi": "Kedokteran Gigi", // AMAN
  "Profesi Dokter Gigi": "Kedokteran Gigi", // AMAN
  Kenotariatan: "Sekolah Pascasarjana", // AMAN
  "Sains Biomedis": "Sekolah Pascasarjana", // AMAN
  "Administrasi Rumah Sakit": "Sekolah Pascasarjana", // AMAN
  "Kedokteran Keluarga Layanan Primer": "Kedokteran", // AMAN
};

const getFacultyByProgram = (programName, level) => {
  if (programName === "Manajemen") {
    // Jika level S2 atau S3, masuk Sekolah Pascasarjana
    if (level === "S2" || level === "S3") {
      return "Sekolah Pascasarjana";
    }
    // Jika S1, masuk Ekonomi Dan Bisnis
    return "Ekonomi Dan Bisnis";
  }

  return facultyMapping[programName] || "Other";
};

const createWhereClause = (baseClause, filters) => {
  const { search, studyProgram, graduationYear, faculty } = filters;

  let whereClause = { ...baseClause };

  if (search) {
    whereClause.full_name = {
      contains: search,
    };
  }

  if (studyProgram) {
    whereClause.studyProgram = {
      name: studyProgram,
    };
  }

  if (faculty) {
    if (faculty === "Sekolah Pascasarjana") {
      whereClause.studyProgram = {
        ...whereClause.studyProgram,
        OR: [
          {
            name: "Manajemen",
            level: {
              in: ["S2", "S3"],
            },
          },
          {
            name: {
              in: [
                "Kenotariatan",
                "Sains Biomedis",
                "Administrasi Rumah Sakit",
              ],
            },
          },
        ],
      };
    } else if (faculty === "Ekonomi Dan Bisnis") {
      whereClause.studyProgram = {
        ...whereClause.studyProgram,
        OR: [
          {
            name: "Manajemen",
            level: "S1",
          },
          {
            name: "Akuntansi",
          },
        ],
      };
    } else {
      whereClause.studyProgram = {
        ...whereClause.studyProgram,
        name: {
          in: Object.entries(facultyMapping).reduce((acc, [program, fac]) => {
            if (fac === faculty) {
              acc.push(program);
            }
            return acc;
          }, []),
        },
      };
    }
  }

  if (graduationYear) {
    const startDate = new Date(`${graduationYear}-01-01`);
    const endDate = new Date(`${graduationYear}-12-31`);

    whereClause.year_graduated = {
      gte: startDate,
      lte: endDate,
    };
  }

  return whereClause;
};

const formatToIndonesianDate = (date) => {
  if (!date) return null;

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

exports.allProfilesForAlumni = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const studyProgram = req.query.studyProgram;
    const graduationYear = req.query.graduationYear;
    const faculty = req.query.faculty;

    const baseWhereClause = {
      user: {
        role: {
          name: "alumni",
        },
      },
    };

    const whereClause = createWhereClause(baseWhereClause, {
      search,
      studyProgram,
      graduationYear,
      faculty,
    });

    const totalProfiles = await prisma.profile.count({
      where: whereClause,
    });

    const profiles = await prisma.profile.findMany({
      skip,
      take: limit,
      where: whereClause,
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
      },
      orderBy: {
        full_name: "asc",
      },
    });

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      image: profile.image,
      studentIdentificationNumber: profile.student_identification_number,
      yearGraduated: profile.year_graduated
        ? profile.year_graduated.getFullYear().toString()
        : null,
      studyProgram: {
        id: profile.study_program_id,
        name: profile.studyProgram.name,
        code: profile.studyProgram.code,
        level: profile.studyProgram.level,
        faculty: getFacultyByProgram(
          profile.studyProgram.name,
          profile.studyProgram.level
        ),
      },
      work: profile.work,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      entrepreneur: profile.entrepreneur,
      competencies: profile.competencies
        ? JSON.parse(profile.competencies)
        : [],
      career: profile.career,
      company: profile.company,
      linkedin: profile.linkedin,
      isAlumniLeader: profile.is_alumni_leader,
    }));

    const totalPages = Math.ceil(totalProfiles / limit);

    return res.status(200).json({
      status: "success",
      message: "Data Profile Alumni berhasil diambil",
      data: formattedProfiles,
      meta: {
        page,
        limit,
        totalProfiles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        search: search || null,
        filters: {
          studyProgram: studyProgram || null,
          graduationYear: graduationYear || null,
          faculty: faculty || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getAllProfiles:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.allProfilesForProdi = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const studyProgram = req.query.studyProgram;
    const graduationYear = req.query.graduationYear;
    const faculty = req.query.faculty;

    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "User tidak terautentikasi",
      });
    }

    const userProfile = await prisma.profile.findUnique({
      where: {
        user_id: req.user.id,
      },
    });

    if (!userProfile || !userProfile.study_program_id) {
      return res.status(400).json({
        status: "error",
        message: "Data profil program studi tidak ditemukan",
      });
    }

    const baseWhereClause = {
      study_program_id: userProfile.study_program_id,
      user: {
        role: {
          name: "alumni",
        },
      },
    };

    const whereClause = createWhereClause(baseWhereClause, {
      search,
      studyProgram,
      graduationYear,
      faculty,
    });

    const [totalProfiles, profiles] = await Promise.all([
      prisma.profile.count({
        where: whereClause,
      }),
      prisma.profile.findMany({
        skip,
        take: limit,
        where: whereClause,
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
              place_of_birth: true,
              date_of_birth: true,
              national_identity_number: true,
              full_address: true,
              email: true,
              phone_number: true,
              mobile_number: true,
              total_credits: true,
              graduation_date: true,
              yudisium_date: true,
              gpa: true,
              gender: true,
            },
          },
        },
        orderBy: {
          full_name: "asc",
        },
      }),
    ]);

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      image: profile.image,
      studentIdentificationNumber: profile.student_identification_number,
      yearGraduated: profile.year_graduated
        ? profile.year_graduated.getFullYear().toString()
        : null,
      studyProgram: {
        id: profile.study_program_id,
        name: profile.studyProgram.name,
        code: profile.studyProgram.code,
        level: profile.studyProgram.level,
        faculty: getFacultyByProgram(
          profile.studyProgram.name,
          profile.studyProgram.level
        ),
      },
      work: profile.work,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      entrepreneur: profile.entrepreneur,
      competencies: profile.competencies
        ? JSON.parse(profile.competencies)
        : [],
      career: profile.career,
      company: profile.company,
      linkedin: profile.linkedin,
      isAlumniLeader: profile.is_alumni_leader,
      sensitiveData: profile.sensitive_student_data
        ? {
            placeOfBirth: profile.sensitive_student_data.place_of_birth,
            dateOfBirth: formatToIndonesianDate(
              profile.sensitive_student_data.date_of_birth
            ),
            nationalIdentityNumber:
              profile.sensitive_student_data.national_identity_number,
            fullAddress: profile.sensitive_student_data.full_address,
            email: profile.sensitive_student_data.email,
            phoneNumber: profile.sensitive_student_data.phone_number,
            mobileNumber: profile.sensitive_student_data.mobile_number,
            totalCredits: profile.sensitive_student_data.total_credits,
            graduationDate: formatToIndonesianDate(
              profile.sensitive_student_data.graduation_date
            ),
            yudisiumDate: formatToIndonesianDate(
              profile.sensitive_student_data.yudisium_date
            ),
            gpa: profile.sensitive_student_data.gpa,
            gender: profile.sensitive_student_data.gender,
          }
        : null,
    }));

    const totalPages = Math.ceil(totalProfiles / limit);

    return res.status(200).json({
      status: "success",
      message: "Data Profile Alumni berhasil diambil",
      data: formattedProfiles,
      meta: {
        page,
        limit,
        totalProfiles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        search: search || null,
        filters: {
          studyProgram: studyProgram || null,
          graduationYear: graduationYear || null,
          faculty: faculty || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getProdiProfiles:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.allProfilesForUniv = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const studyProgram = req.query.studyProgram;
    const graduationYear = req.query.graduationYear;
    const faculty = req.query.faculty;

    const baseWhereClause = {
      user: {
        role: {
          name: "alumni",
        },
      },
    };

    const whereClause = createWhereClause(baseWhereClause, {
      search,
      studyProgram,
      graduationYear,
      faculty,
    });

    const [totalProfiles, profiles] = await Promise.all([
      prisma.profile.count({
        where: whereClause,
      }),
      prisma.profile.findMany({
        skip,
        take: limit,
        where: whereClause,
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
              place_of_birth: true,
              date_of_birth: true,
              national_identity_number: true,
              full_address: true,
              email: true,
              phone_number: true,
              mobile_number: true,
              total_credits: true,
              graduation_date: true,
              yudisium_date: true,
              gpa: true,
              gender: true,
            },
          },
        },
        orderBy: {
          full_name: "asc",
        },
      }),
    ]);

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      image: profile.image,
      studentIdentificationNumber: profile.student_identification_number,
      yearGraduated: profile.year_graduated
        ? profile.year_graduated.getFullYear().toString()
        : null,
      studyProgram: {
        id: profile.study_program_id,
        name: profile.studyProgram.name,
        code: profile.studyProgram.code,
        level: profile.studyProgram.level,
        faculty: getFacultyByProgram(
          profile.studyProgram.name,
          profile.studyProgram.level
        ),
      },
      work: profile.work,
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      entrepreneur: profile.entrepreneur,
      competencies: profile.competencies
        ? JSON.parse(profile.competencies)
        : [],
      career: profile.career,
      company: profile.company,
      linkedin: profile.linkedin,
      isAlumniLeader: profile.is_alumni_leader,
      sensitiveData: profile.sensitive_student_data
        ? {
            placeOfBirth: profile.sensitive_student_data.place_of_birth,
            dateOfBirth: formatToIndonesianDate(
              profile.sensitive_student_data.date_of_birth
            ),
            nationalIdentityNumber:
              profile.sensitive_student_data.national_identity_number,
            fullAddress: profile.sensitive_student_data.full_address,
            email: profile.sensitive_student_data.email,
            phoneNumber: profile.sensitive_student_data.phone_number,
            mobileNumber: profile.sensitive_student_data.mobile_number,
            totalCredits: profile.sensitive_student_data.total_credits,
            graduationDate: formatToIndonesianDate(
              profile.sensitive_student_data.graduation_date
            ),
            yudisiumDate: formatToIndonesianDate(
              profile.sensitive_student_data.yudisium_date
            ),
            gpa: profile.sensitive_student_data.gpa,
            gender: profile.sensitive_student_data.gender,
          }
        : null,
    }));

    const totalPages = Math.ceil(totalProfiles / limit);

    return res.status(200).json({
      status: "success",
      message: "Data Profile Alumni berhasil diambil",
      data: formattedProfiles,
      meta: {
        page,
        limit,
        totalProfiles,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        search: search || null,
        filters: {
          studyProgram: studyProgram || null,
          graduationYear: graduationYear || null,
          faculty: faculty || null,
        },
      },
    });
  } catch (error) {
    console.error("Error in getUnivProfiles:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.getAvailableStudyPrograms = async (req, res) => {
  try {
    const programs = await prisma.studyProgram.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        level: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Group programs by faculty
    const programsByFaculty = {
      Psikologi: programs.filter((p) => p.name === "Psikologi"),
      "Ekonomi Dan Bisnis": programs.filter(
        (p) =>
          p.name === "Akuntansi" || (p.name === "Manajemen" && p.level === "S1")
      ),
      Hukum: programs.filter((p) => p.name === "Ilmu Hukum"),
      "Teknologi Informasi": programs.filter((p) =>
        ["Teknik Informatika", "Perpustakaan dan Sains Informasi"].includes(
          p.name
        )
      ),
      Kedokteran: programs.filter((p) =>
        [
          "Kedokteran",
          "Profesi Dokter",
          "Kedokteran Keluarga Layanan Primer",
        ].includes(p.name)
      ),
      "Kedokteran Gigi": programs.filter((p) =>
        ["Kedokteran Gigi", "Profesi Dokter Gigi"].includes(p.name)
      ),
      "Sekolah Pascasarjana": programs.filter(
        (p) =>
          (p.name === "Manajemen" && ["S2", "S3"].includes(p.level)) ||
          [
            "Kenotariatan",
            "Sains Biomedis",
            "Administrasi Rumah Sakit",
          ].includes(p.name)
      ),
    };

    // Format response
    const formattedPrograms = Object.entries(programsByFaculty).map(
      ([faculty, programs]) => ({
        faculty,
        programs: programs.map((program) => ({
          id: program.id,
          name: program.name,
          code: program.code,
          level: program.level,
        })),
      })
    );

    return res.status(200).json({
      status: "success",
      message: "Data Program Studi berhasil diambil",
      data: formattedPrograms,
    });
  } catch (error) {
    console.error("Error in getAvailableStudyPrograms:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.getAvailableGraduationYears = async (req, res) => {
  try {
    const profiles = await prisma.profile.findMany({
      select: {
        year_graduated: true,
      },
      where: {
        year_graduated: {
          not: null,
        },
      },
      distinct: ["year_graduated"],
      orderBy: {
        year_graduated: "desc",
      },
    });

    const years = profiles
      .map((profile) => profile.year_graduated?.getFullYear())
      .filter((year) => year !== undefined)
      .filter((year, index, self) => self.indexOf(year) === index);

    return res.status(200).json({
      status: "success",
      message: "Data Tahun Lulus berhasil diambil",
      data: years,
    });
  } catch (error) {
    console.error("Error in getAvailableGraduationYears:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.getAvailableFaculties = async (req, res) => {
  try {
    const faculties = [...new Set(Object.values(facultyMapping))].sort();

    return res.status(200).json({
      status: "success",
      message: "Data Fakultas berhasil diambil",
      data: faculties,
    });
  } catch (error) {
    console.error("Error in getAvailableFaculties:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};