const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const studyPrograms = [
    { name: "Profesi Dokter", code: "11901", level: "Profesi" },
    { name: "Profesi Dokter Gigi", code: "12901", level: "Profesi" },
    { name: "Akuntansi", code: "62201", level: "S1" },
    { name: "Ilmu Hukum", code: "74201", level: "S1" },
    { name: "Kedokteran", code: "11201", level: "S1" },
    { name: "Kedokteran Gigi", code: "12201", level: "S1" },
    { name: "Manajemen", code: "61201", level: "S1" },
    { name: "Perpustakaan dan Sains Informasi", code: "71201", level: "S1" },
    { name: "Psikologi", code: "73201", level: "S1" },
    { name: "Teknik Informatika", code: "55201", level: "S1" },
    { name: "Administrasi Rumah Sakit", code: "13161", level: "S2" },
    { name: "Kenotariatan", code: "74102", level: "S2" },
    { name: "Manajemen", code: "61101", level: "S2" },
    { name: "Sains Biomedis", code: "11106", level: "S2" },
    { name: "Sains Biomedis", code: "11006", level: "S3" },
    {
      name: "Kedokteran Keluarga Layanan Primer",
      code: "11730",
      level: "Sp-1",
    },
  ];

  // Menambahkan studyPrograms hanya jika belum ada berdasarkan kode yang unik
  for (const studyProgram of studyPrograms) {
    const existingStudyProgram = await prisma.studyProgram.findUnique({
      where: { code: studyProgram.code }, // Mencari berdasarkan kode unik
    });

    if (!existingStudyProgram) {
      await prisma.studyProgram.create({
        data: studyProgram,
      });
      console.log(
        `studyProgram "${studyProgram.name}" dengan kode "${studyProgram.code}" ditambahkan.`
      );
    } else {
      console.log(
        `studyProgram "${studyProgram.name}" dengan kode "${studyProgram.code}" sudah ada, tidak perlu ditambahkan.`
      );
    }
  }

  console.log("studyPrograms seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
