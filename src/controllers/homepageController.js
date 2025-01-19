// homepageController.js
const { PrismaClient, NewsStatus, EventStatus } = require("@prisma/client");
const prisma = new PrismaClient();

exports.latestNews = async (req, res) => {
  try {
    const NewsList = await prisma.News.findMany({
      where: { isActive: true, NewsStatus: "Diverifikasi_Oleh_Universitas" }, // Filter jika `category` ada, jika tidak kosongkan
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        createdAt: true,
        author: {
          select: {
            username: true, // Mengambil nama dari author
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedNewsList = NewsList.map((News) => ({
      id: News.id,
      title: News.title,
      content: News.content,
      image: News.image,
      authorName: News.author.username,
      createdAt:
        new Date(News.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }) +
        " " +
        new Date(News.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    return res.status(200).json({
      status: "success",
      message: "Data News alumni berhasil diambil.",
      data: formattedNewsList,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.latestEvent = async (req, res) => {
  try {
    const EventList = await prisma.Event.findMany({
      where: { isActive: true, EventStatus: "Diverifikasi_Oleh_Universitas" }, // Filter jika `category` ada, jika tidak kosongkan
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        date: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedEventList = EventList.map((Event) => {
      // Pastikan `Event.date` valid
      const formattedDate = new Date(Event.date);
      const dateStr = !isNaN(formattedDate) // Cek apakah tanggal valid
        ? formattedDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Tanggal tidak valid"; // Jika tidak valid, beri pesan fallback

      const formattedCreatedAt = new Date(Event.createdAt).toLocaleDateString(
        "id-ID",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

      return {
        id: Event.id,
        title: Event.title,
        date: dateStr, // Gunakan hasil format tanggal
        description: Event.description,
        image: Event.image,
        authorName: Event.author.username,
        createdAt: formattedCreatedAt,
      };
    });

    return res.status(200).json({
      status: "success",
      message: "Data Event alumni berhasil diambil.",
      data: formattedEventList,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.latestAlumniProgram = async (req, res) => {
  try {
    const AlumniPrograms = await prisma.AlumniProgram.findMany({
      where: {
        isActive: true,
        AlumniProgramStatus: "Diverifikasi_Oleh_Universitas",
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        image: true,
        createdAt: true,
        author: {
          select: {
            username: true, // Mengambil nama dari author
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedAlumniPrograms = AlumniPrograms.map((program) => ({
      id: program.id,
      title: program.title,
      description: program.description,
      image: program.image,
      category: program.category,
      authorName: program.author.username,
      createdAt:
        new Date(program.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }) +
        " " +
        new Date(program.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    return res.status(200).json({
      status: "success",
      message: "Data program alumni berhasil diambil.",
      data: formattedAlumniPrograms,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};
