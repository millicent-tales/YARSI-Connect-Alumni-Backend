const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

async function main() {
  // Cari role terlebih dahulu
  const role = await prisma.role.findUnique({
    where: { name: "admin_universitas" }, // Menggunakan `name` yang benar sesuai struktur prisma
  });

  if (!role) {
    throw new Error("Role not found"); // Menangani error jika role tidak ditemukan
  }

  // Mendefinisikan pengguna dengan roleId yang valid
  const users = [
    {
      username: "admin_rektorat",
      password: await bcrypt.hash("123456", 10),
      roleId: role.id, // Menyimpan role.id sebagai roleId
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: user,
    });
  }
  console.log("Admin seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
