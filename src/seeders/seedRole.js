const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: "admin_universitas" },
    { name: "admin_prodi" },
    { name: "alumni" },
  ];

  // Menambahkan roles hanya jika belum ada
  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: role,
      });
    } else {
      console.log(`Role "${role.name}" sudah ada, tidak perlu ditambahkan.`);
    }
  }

  console.log("Roles seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
