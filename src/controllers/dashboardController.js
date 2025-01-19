const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Mapping untuk status pekerjaan (f8)
const employmentStatusMap = {
  1: "Bekerja (full time / part time)",
  2: "Belum memungkinkan bekerja",
  3: "Wiraswasta",
  4: "Melanjutkan Pendidikan",
  5: "Tidak kerja tetapi sedang mencari kerja",
};

// Mapping untuk jenis perusahaan (f1101)
const companyTypeMap = {
  1: "Intansi pemerintah",
  2: "Organisasi non-profit/Lembaga Swadaya Masyarakat",
  3: "Perusahaan swasta",
  4: "Wiraswasta/perusahaan sendiri",
  5: "Lainnya",
  6: "BUMN/BUMD",
  7: "Institusi/Organisasi Multilateral",
};

// Mapping untuk tingkat perusahaan (f5d)
const companyLevelMap = {
  1: "Lokal/Wilayah/Wiraswasta tidak berbadan hukum",
  2: "Nasional/Wiraswasta berbadan hukum",
  3: "Multinasional/internasional",
};

// Menambahkan mapping untuk range waktu mendapat kerja
const timeToJobRanges = [
  { start: 0, end: 3, label: "≤ 3 bulan" },
  { start: 4, end: 6, label: "4-6 bulan" },
  { start: 7, end: 12, label: "7-12 bulan" },
  { start: 13, end: null, label: "> 1 tahun" },
];

// Helper function untuk mendapatkan range waktu mendapat kerja
const getTimeToJobRange = (months) => {
  const month = parseInt(months);
  const range = timeToJobRanges.find(
    (range) =>
      month >= range.start && (range.end === null || month <= range.end)
  );
  return range ? range.label : "> 1 tahun";
};

// Helper function untuk menginisialisasi data timeToJob default
const initializeTimeToJobData = () => {
  return timeToJobRanges.map((range) => ({
    label: range.label,
    value: 0,
    range: {
      start: range.start,
      end: range.end,
    },
  }));
};

// Helper function untuk memproses data timeToJob
const processTimeToJobData = (rawData) => {
  const defaultData = initializeTimeToJobData();

  rawData.forEach(({ f502 }) => {
    const range = getTimeToJobRange(f502);
    const existingEntry = defaultData.find((entry) => entry.label === range);
    if (existingEntry) {
      existingEntry.value += 1;
    }
  });

  return defaultData;
};

// Helper function untuk mengkonversi mapping ke array of objects
const convertMapToArray = (map) => {
  return Object.entries(map).map(([key, label]) => ({
    label,
    value: 0,
    key,
  }));
};

// Helper function untuk menggabungkan data aktual dengan semua opsi yang tersedia
const mergeWithDefaultOptions = (actualData, defaultOptions) => {
  const resultMap = new Map(
    defaultOptions.map((item) => [item.label, { ...item }])
  );

  actualData.forEach((item) => {
    if (resultMap.has(item.label)) {
      resultMap.get(item.label).value = item.value;
    }
  });

  return Array.from(resultMap.values());
};

exports.universityDashboardStatistics = async (req, res) => {
  try {
    // Hitung total alumni
    const totalAlumni = await prisma.profile.count({
      where: {
        user: {
          role: {
            name: "alumni",
          },
        },
      },
    });

    // Hitung total program studi
    const totalStudyPrograms = await prisma.studyProgram.count();

    // Ambil dan proses data status pekerjaan (f8)
    const employmentStatus = await prisma.tracerStudy.groupBy({
      by: ["f8"],
      _count: {
        f8: true,
      },
      where: {
        profile: {
          user: {
            role: {
              name: "alumni",
            },
          },
        },
      },
    });

    // Ambil dan proses data bidang pekerjaan (f1101)
    const employmentField = await prisma.tracerStudy.groupBy({
      by: ["f1101"],
      _count: {
        f1101: true,
      },
      where: {
        f1101: {
          not: null,
        },
        profile: {
          user: {
            role: {
              name: "alumni",
            },
          },
        },
      },
    });

    // Ambil data lama mendapat pekerjaan (f502)
    const timeToJob = await prisma.tracerStudy.findMany({
      where: {
        f502: {
          not: null,
        },
        profile: {
          user: {
            role: {
              name: "alumni",
            },
          },
        },
      },
      select: {
        f502: true,
      },
    });

    // Ambil dan proses data kategori perusahaan (f5d)
    const companyCategories = await prisma.tracerStudy.groupBy({
      by: ["f5d"],
      _count: {
        f5d: true,
      },
      where: {
        f5d: {
          not: null,
        },
        profile: {
          user: {
            role: {
              name: "alumni",
            },
          },
        },
      },
    });

    // Prepare default options arrays
    const defaultEmploymentStatus = convertMapToArray(employmentStatusMap);
    const defaultEmploymentField = convertMapToArray(companyTypeMap);
    const defaultCompanyCategories = convertMapToArray(companyLevelMap);

    // Format data untuk chart
    const chartData = {
      employmentStatus: mergeWithDefaultOptions(
        employmentStatus.map((status) => ({
          label: employmentStatusMap[status.f8] || `Status ${status.f8}`,
          value: status._count.f8,
        })),
        defaultEmploymentStatus
      ),
      employmentField: mergeWithDefaultOptions(
        employmentField.map((field) => ({
          label: companyTypeMap[field.f1101] || `Tipe ${field.f1101}`,
          value: field._count.f1101,
        })),
        defaultEmploymentField
      ),
      timeToJob: processTimeToJobData(timeToJob),
      companyCategories: mergeWithDefaultOptions(
        companyCategories.map((category) => ({
          label: companyLevelMap[category.f5d] || `Kategori ${category.f5d}`,
          value: category._count.f5d,
        })),
        defaultCompanyCategories
      ),
    };

    return res.status(200).json({
      status: "success",
      data: {
        totalAlumni,
        totalStudyPrograms,
        ...chartData,
      },
    });
  } catch (error) {
    console.error("Error in getUniversityDashboardMetrics:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.studyProgramDashboardStatistics = async (req, res) => {
  try {
    if (!req.user || !req.user.profileId) {
      return res.status(403).json({
        status: "error",
        message: "User tidak memiliki profil",
      });
    }

    // Get user's profile and study program data
    const userProfile = await prisma.profile.findUnique({
      where: {
        id: req.user.profileId,
      },
      select: {
        study_program_id: true,
        studyProgram: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!userProfile || !userProfile.study_program_id) {
      return res.status(403).json({
        status: "error",
        message: "Profil tidak ditemukan atau tidak memiliki program studi",
      });
    }

    const studyProgramId = userProfile.study_program_id;

    // Hitung total alumni prodi
    const totalAlumni = await prisma.profile.count({
      where: {
        study_program_id: studyProgramId,
        user: {
          role: {
            name: "alumni",
          },
        },
      },
    });

    // Ambil dan proses data status pekerjaan (f8)
    const employmentStatus = await prisma.tracerStudy.groupBy({
      by: ["f8"],
      _count: {
        f8: true,
      },
      where: {
        profile: {
          study_program_id: studyProgramId,
          user: {
            role: {
              name: "alumni",
            },
          },
        },
      },
    });

    // Ambil dan proses data bidang pekerjaan (f1101)
    const employmentField = await prisma.tracerStudy.groupBy({
      by: ["f1101"],
      _count: {
        f1101: true,
      },
      where: {
        profile: {
          study_program_id: studyProgramId,
          user: {
            role: {
              name: "alumni",
            },
          },
        },
        f1101: {
          not: null,
        },
      },
    });

    // Ambil data lama mendapat pekerjaan (f502)
    const timeToJob = await prisma.tracerStudy.findMany({
      where: {
        profile: {
          study_program_id: studyProgramId,
          user: {
            role: {
              name: "alumni",
            },
          },
        },
        f502: {
          not: null,
        },
      },
      select: {
        f502: true,
      },
    });

    // Ambil dan proses data kategori perusahaan (f5d)
    const companyCategories = await prisma.tracerStudy.groupBy({
      by: ["f5d"],
      _count: {
        f5d: true,
      },
      where: {
        profile: {
          study_program_id: studyProgramId,
          user: {
            role: {
              name: "alumni",
            },
          },
        },
        f5d: {
          not: null,
        },
      },
    });

    // Prepare default options arrays
    const defaultEmploymentStatus = convertMapToArray(employmentStatusMap);
    const defaultEmploymentField = convertMapToArray(companyTypeMap);
    const defaultCompanyCategories = convertMapToArray(companyLevelMap);

    // Format data untuk chart
    const chartData = {
      studyProgram: {
        name: userProfile.studyProgram.name,
        code: userProfile.studyProgram.code,
      },
      employmentStatus: mergeWithDefaultOptions(
        employmentStatus.map((status) => ({
          label: employmentStatusMap[status.f8] || `Status ${status.f8}`,
          value: status._count.f8,
        })),
        defaultEmploymentStatus
      ),
      employmentField: mergeWithDefaultOptions(
        employmentField.map((field) => ({
          label: companyTypeMap[field.f1101] || `Tipe ${field.f1101}`,
          value: field._count.f1101,
        })),
        defaultEmploymentField
      ),
      timeToJob: processTimeToJobData(timeToJob),
      companyCategories: mergeWithDefaultOptions(
        companyCategories.map((category) => ({
          label: companyLevelMap[category.f5d] || `Kategori ${category.f5d}`,
          value: category._count.f5d,
        })),
        defaultCompanyCategories
      ),
    };

    return res.status(200).json({
      status: "success",
      data: {
        totalAlumni,
        ...chartData,
      },
    });
  } catch (error) {
    console.error("Error in getStudyProgramDashboardMetrics:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};