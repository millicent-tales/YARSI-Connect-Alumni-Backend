const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const twilioClient = require("../utils/twilioClient");
const prisma = new PrismaClient();
const util = require("util");

// Convert fs.readdir and fs.stat to promise-based functions
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// Fungsi untuk generate username dari nama lengkap
function generateUsername(fullName) {
  const nameParts = fullName.trim().split(" ");
  if (nameParts.length === 1) {
    return nameParts[0].toLowerCase();
  } else {
    return `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}`;
  }
}

// Fungsi untuk generate password acak
function generateRandomPassword(length = 10) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// Fungsi untuk konversi serial date dari Excel
function convertExcelDate(serial) {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const daysSinceExcelEpoch = serial - 25569;
  const millisecondsInDay = 86400 * 1000;
  return new Date(
    excelEpoch.getTime() + daysSinceExcelEpoch * millisecondsInDay
  );
}

// Fungsi untuk parsing tanggal format Indonesia
function parseIndonesianDate(dateString) {
  const months = {
    Januari: 0,
    Februari: 1,
    Maret: 2,
    April: 3,
    Mei: 4,
    Juni: 5,
    Juli: 6,
    Agustus: 7,
    September: 8,
    Oktober: 9,
    November: 10,
    Desember: 11,
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const parts = dateString.split(" ");
  if (parts.length !== 3) {
    throw new Error("Invalid date format");
  }

  const day = parseInt(parts[0], 10);
  const month = months[parts[1]];
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || month === undefined || isNaN(year)) {
    throw new Error("Invalid date components");
  }

  return new Date(year, month, day);
}

// Fungsi untuk mengonversi nomor telepon lokal menjadi format internasional
function convertToInternationalFormat(localNumber) {
  if (localNumber.startsWith("08")) {
    return `+62${localNumber.slice(1)}`;
  }
  return localNumber;
}

// Fungsi untuk validasi satu baris data
async function validateRow(row, tx) {
  const errors = [];

  // Extract required fields
  const baris = row["NO"];
  const fullName = row["NAMA MAHASISWA"];
  const studentId = row["NPM"];
  const nationalIdentityNumber = row["NIK"];
  const studyProgram = row["PROGRAM STUDI"];
  const level = row["JENJANG"];
  const isLeader = row["KETUA ALUMNI"];

  // Validate required fields
  if (!fullName || !studentId || !studyProgram || !level) {
    errors.push(
      `Data tidak lengkap untuk mahasiswa dengan NPM ${studentId || "unknown"}`
    );
    return errors;
  }

  // Validate is_alumni_leader format if provided
  if (isLeader !== undefined && isLeader !== null) {
    const isLeaderValue = String(isLeader).toLowerCase();
    if (
      !["true", "false", "1", "0", "yes", "no", "ya", "tidak"].includes(
        isLeaderValue
      )
    ) {
      errors.push(
        `Format KETUA ALUMNI tidak valid untuk mahasiswa ${fullName} (${studentId}). Gunakan: true/false, 1/0, yes/no, atau ya/tidak`
      );
    }
  }

  // Previous date validations remain unchanged...
  const datesToValidate = [
    { value: row["TANGGAL YUDISIUM"], field: "TANGGAL YUDISIUM" },
    { value: row["TANGGAL LAHIR"], field: "TANGGAL LAHIR" },
    { value: row["TANGGAL WISUDA"], field: "TANGGAL WISUDA" },
  ];

  for (const date of datesToValidate) {
    if (date.value) {
      try {
        if (isNaN(date.value)) {
          parseIndonesianDate(date.value);
        } else {
          convertExcelDate(date.value);
        }
      } catch (dateError) {
        errors.push(
          `Error pada format tanggal ${date.field} untuk mahasiswa ${fullName} (${studentId})`
        );
      }
    }
  }

  // Previous validations remain unchanged...
  const studyProgramRecord = await tx.studyProgram.findFirst({
    where: {
      name: studyProgram,
      level: level,
    },
  });

  if (!studyProgramRecord) {
    errors.push(
      `Program studi ${studyProgram} dengan level ${level} tidak ditemukan`
    );
  }

  const existingProfile = await tx.profile.findFirst({
    where: {
      full_name: fullName,
      student_identification_number: studentId,
    },
  });

  if (existingProfile) {
    errors.push(`Data untuk ${fullName} dengan NPM ${studentId} sudah ada`);
  }

  return errors;
}

// Fungsi untuk memproses satu baris data
async function processRow(row, tx) {
  const baris = row["NO"];
  const fullName = row["NAMA MAHASISWA"];
  const studentId = row["NPM"];
  const nationalIdentityNumber = row["NIK"];
  const studyProgram = row["PROGRAM STUDI"];
  const level = row["JENJANG"];
  const rawYearGraduated = row["TANGGAL YUDISIUM"];
  const placeOfBirth = row["TEMPAT LAHIR"];
  const rawDateOfBirth = row["TANGGAL LAHIR"];
  const fullAddress = row["ALAMAT RUMAH"];
  const email = row["EMAIL"];
  const phoneNumber = row["NOMOR TELEPON"];
  const mobileNumber = row["NOMOR HANDPHONE"];
  const totalCredits = parseInt(row["TOTAL SKS"] || "0", 10);
  const rawGraduationDate = row["TANGGAL WISUDA"];
  const rawYudisiumDate = row["TANGGAL YUDISIUM"];
  const gpa = parseFloat(row["IPK"] || "0.0");
  const gender = row["JENIS KELAMIN"];

  // Convert is_alumni_leader to boolean
  const isLeaderRaw = row["KETUA ALUMNI"];
  const isLeader = isLeaderRaw
    ? ["true", "1", "yes", "ya"].includes(String(isLeaderRaw).toLowerCase())
    : false;

  // Previous date parsing remains unchanged...
  const yearGraduated = rawYearGraduated
    ? isNaN(rawYearGraduated)
      ? parseIndonesianDate(rawYearGraduated)
      : convertExcelDate(rawYearGraduated)
    : null;
  const dateOfBirth = rawDateOfBirth
    ? isNaN(rawDateOfBirth)
      ? parseIndonesianDate(rawDateOfBirth)
      : convertExcelDate(rawDateOfBirth)
    : null;
  const graduationDate = rawGraduationDate
    ? isNaN(rawGraduationDate)
      ? parseIndonesianDate(rawGraduationDate)
      : convertExcelDate(rawGraduationDate)
    : null;
  const yudisiumDate = rawYudisiumDate
    ? isNaN(rawYudisiumDate)
      ? parseIndonesianDate(rawYudisiumDate)
      : convertExcelDate(rawYudisiumDate)
    : null;

  const studyProgramRecord = await tx.studyProgram.findFirst({
    where: {
      name: studyProgram,
      level: level,
    },
  });

  // Find the alumni role
  const alumniRole = await tx.role.findFirst({
    where: {
      name: "alumni", // assuming 'alumni' is the role name in your database
    },
  });

  if (!alumniRole) {
    throw new Error('Role "alumni" not found in the database');
  }

  const username = generateUsername(fullName);
  const password = generateRandomPassword(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  let uniqueUsername = username;
  let counter = 1;
  while (await tx.user.findUnique({ where: { username: uniqueUsername } })) {
    uniqueUsername = `${username}${counter}`;
    counter++;
  }

  // Create user
  const user = await tx.user.create({
    data: {
      username: uniqueUsername,
      password: hashedPassword,
      roleId: alumniRole.id,
    },
  });

  // Create profile with is_alumni_leader field
  const profile = await tx.profile.create({
    data: {
      full_name: fullName,
      student_identification_number: studentId,
      studyProgram: { connect: { id: studyProgramRecord.id } },
      year_graduated: yearGraduated,
      image: `http://localhost:2000/uploads/private/profiles/default-profile.png`,
      user: { connect: { id: user.id } },
      is_alumni_leader: isLeader, // Add the is_alumni_leader field
    },
  });

  // Rest of the function remains unchanged...
  await tx.user.update({
    where: { id: user.id },
    data: { profileId: profile.id },
  });

  await tx.sensitiveStudentData.create({
    data: {
      place_of_birth: placeOfBirth,
      date_of_birth: dateOfBirth,
      national_identity_number: nationalIdentityNumber,
      full_address: fullAddress,
      email: email,
      phone_number: phoneNumber,
      mobile_number: mobileNumber,
      total_credits: totalCredits,
      graduation_date: graduationDate,
      yudisium_date: yudisiumDate,
      gpa: gpa,
      gender: gender,
      profile: { connect: { id: profile.id } },
    },
  });

  // WhatsApp message sending remains unchanged...
  try {
    if (mobileNumber) {
      const internationalMobileNumber =
        convertToInternationalFormat(mobileNumber);
      await twilioClient.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:${internationalMobileNumber}`,
        body: `
        Halo ${fullName} 👋,

        Selamat! Akun alumni Anda di Universitas Yarsi telah berhasil dibuat. Berikut adalah informasi akun Anda:

        ✨ *Username*: ${uniqueUsername}
        🔑 *Password*: ${password}
        
        Untuk keamanan akun Anda, kami menyarankan Anda untuk segera mengganti password Anda setelah login pertama kali.

        Salam hangat,
        Pusat Perkembangan Karier dan Alumni Yarsi
        `,
      });
    }
  } catch (twilioError) {
    console.error(
      `WhatsApp message sending failed for ${fullName}: ${twilioError.message}`
    );
  }

  return {
    FullName: fullName,
    NPM: studentId,
    Username: uniqueUsername,
    Password: password,
  };
}

exports.generateAlumniUsers = async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false });

    const usersData = [];
    const validationErrors = [];

    // Validate and process data in transaction
    try {
      await prisma.$transaction(async (tx) => {
        // First phase: Validate all rows
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowErrors = await validateRow(row, tx);

          if (rowErrors.length > 0) {
            validationErrors.push({
              rowNumber: row["NO"],
              npm: row["NPM"] || "unknown",
              name: row["NAMA MAHASISWA"] || "unknown",
              errors: rowErrors,
            });
          }
        }

        // If there are any validation errors, abort the transaction
        if (validationErrors.length > 0) {
          throw new Error("Validation failed");
        }

        // Second phase: Process all rows if validation passed
        for (const row of data) {
          const userData = await processRow(row, tx);
          usersData.push(userData);
        }
      });

      // Generate output Excel file if processing succeeded
      if (usersData.length > 0) {
        const timestamp = Date.now();
        const fileName = `${
          req.file.originalname.split(".")[0]
        }_${timestamp}_GENERATED_AKUN.xlsx`;
        const outputFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          "private",
          "generated-account",
          "generated-excel",
          fileName
        );

        if (!fs.existsSync(path.dirname(outputFilePath))) {
          fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
        }

        // Create workbook and worksheet
        const newWorkbook = xlsx.utils.book_new();
        const newWorksheet = xlsx.utils.json_to_sheet(usersData);

        // Get the range of the worksheet (e.g., A1:E10)
        const range = xlsx.utils.decode_range(newWorksheet["!ref"]);

        // Apply borders to all cells
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
            if (!newWorksheet[cellRef]) {
              newWorksheet[cellRef] = { t: "s", v: "" };
            }
            newWorksheet[cellRef].s = {
              border: {
                top: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
                right: { style: "thin" },
              },
            };
          }
        }

        // Auto-size columns
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxColLength = 0;

          // Check header length
          const headerCell = xlsx.utils.encode_cell({ r: 0, c: C });
          const headerValue = newWorksheet[headerCell]?.v?.toString() || "";
          maxColLength = Math.max(maxColLength, headerValue.length);

          // Check data length in each column
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
            const cellValue = newWorksheet[cellRef]?.v?.toString() || "";
            maxColLength = Math.max(maxColLength, cellValue.length);
          }

          // Add some padding and set the width
          colWidths[C] = maxColLength + 2;
        }

        // Apply the column widths
        newWorksheet["!cols"] = colWidths.map((width) => ({ width }));

        // Add the worksheet to the workbook and write to file
        xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, "Akun Alumni");

        // Write with style options
        const writeOpts = {
          bookType: "xlsx",
          bookSST: false,
          type: "binary",
          cellStyles: true,
        };

        xlsx.writeFile(newWorkbook, outputFilePath, writeOpts);

        return res.status(200).json({
          message: "Proses import selesai",
          successCount: usersData.length,
          file: outputFilePath,
          filename: fileName,
          downloadUrl: `/api/v1/generate-user/${fileName}`,
        });
      }
    } catch (transactionError) {
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message:
            "Ditemukan kesalahan dalam data. Silakan perbaiki error berikut:",
          errorCount: validationErrors.length,
          errors: validationErrors.map((error) => ({
            baris: error.rowNumber,
            npm: error.npm,
            name: error.name,
            errors: error.errors,
          })),
        });
      }
      throw transactionError;
    }

    // If no data was processed successfully
    return res.status(400).json({
      message: "Tidak ada data yang berhasil diproses",
      errorCount: validationErrors.length,
      errors: validationErrors,
    });
  } catch (error) {
    console.error("Error in generateAlumniUsers:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat memproses file Excel",
      error: error.message,
    });
  }
};

exports.downloadGeneratedExcel = async (req, res) => {
  try {
    const { filename } = req.params;

    // Path ke direktori file excel yang di-generate
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "private",
      "generated-account",
      "generated-excel",
      filename
    );

    // Cek apakah file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File tidak ditemukan",
      });
    }

    // Set MIME type untuk file Excel (.xlsx)
    const mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Set headers untuk file Excel
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Description", "File Transfer");
    res.setHeader("Content-Transfer-Encoding", "binary");
    res.setHeader("Cache-Control", "must-revalidate");
    res.setHeader("Pragma", "public");

    // Stream file ke response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengunduh file",
      error: error.message,
    });
  }
};

exports.listGeneratedExcelFiles = async (req, res) => {
  try {
    const directoryPath = path.join(
      __dirname,
      "..",
      "uploads",
      "private",
      "generated-account",
      "generated-excel"
    );

    // Read the directory
    const files = await readdir(directoryPath);

    // Get detailed information for each file
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(directoryPath, filename);
        const stats = await stat(filePath);

        return {
          filename,
          createdAt: stats.birthtime,
          size: stats.size,
          downloadUrl: `/api/v1/generate-user/${filename}`,
        };
      })
    );

    // Sort files by creation date (newest first)
    const sortedFiles = fileDetails.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return res.status(200).json({
      status: "success",
      message: "Daftar file Excel berhasil diambil",
      data: {
        files: sortedFiles.map((file) => ({
          ...file,
          // Convert size to MB with 2 decimal places
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          createdAt: file.createdAt,
        })),
        totalFiles: sortedFiles.length,
      },
    });
  } catch (error) {
    console.error("Error listing Excel files:", error);

    // If directory doesn't exist, return empty list
    if (error.code === "ENOENT") {
      return res.status(200).json({
        status: "success",
        message: "Direktori kosong",
        data: {
          files: [],
          totalFiles: 0,
        },
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengambil daftar file",
      error: error.message,
    });
  }
};

exports.generateAdminProdiUsers = async (req, res) => {
  try {
    // Karena sudah divalidasi oleh middleware, kita bisa langsung menggunakan req.validatedData
    const { username, password, level, studyProgram } = req.validatedData;

    // Cek apakah username sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Username sudah digunakan",
      });
    }

    // Cek apakah program studi ada
    const studyProgramRecord = await prisma.studyProgram.findFirst({
      where: {
        name: studyProgram,
        level: level,
      },
    });

    if (!studyProgramRecord) {
      return res.status(404).json({
        status: "error",
        message: `Program studi ${studyProgram} dengan level ${level} tidak ditemukan`,
      });
    }

    const adminRole = await prisma.role.findFirst({
      where: {
        name: "admin_prodi", // atau nama role yang sesuai di database Anda
      },
    });

    if (!adminRole) {
      return res.status(404).json({
        status: "error",
        message: "Role admin prodi tidak ditemukan",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru dengan role admin prodi (tanpa profileId terlebih dahulu)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId: adminRole.id, // Role untuk admin prodi
      },
    });

    // Buat profil untuk admin prodi
    const profile = await prisma.profile.create({
      data: {
        full_name: username,
        student_identification_number: "-",
        studyProgram: { connect: { id: studyProgramRecord.id } },
        year_graduated: null,
        image: `http://localhost:2000/uploads/private/profiles/default-profile.png`, // Path lokal
        user: { connect: { id: user.id } }, // Hubungkan profil dengan user
      },
    });

    // Update user dengan profileId setelah profil dibuat
    await prisma.user.update({
      where: { id: user.id },
      data: { profileId: profile.id },
    });

    res.status(201).json({
      status: "success",
      message: "Akun admin prodi berhasil dibuat",
      data: {
        username: user.username,
        studyProgram: studyProgramRecord.name,
        level: studyProgramRecord.level,
      },
    });
  } catch (error) {
    console.error("Error generating admin prodi user:", error);
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat membuat akun admin prodi",
      error: error.message,
    });
  }
};