const { PrismaClient, NewsStatus } = require("@prisma/client");
const prisma = new PrismaClient();
const logger = require("../utils/logger");
const twilioClient = require("../utils/twilioClient");

exports.addNews = async (req, res) => {
  try {
    // Gunakan data yang sudah tervalidasi dari middleware
    const { title, content } = req.validatedData;

    // Cek apakah berita dengan judul yang sama sudah ada
    const existingNews = await prisma.news.findFirst({
      where: { title: title },
    });

    if (existingNews) {
      logger.info({
        message: `News with title "${title}" already exists.`,
        userId: req.user.id, // Gunakan req.user.id yang sudah ada
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(400).json({
        status: "fail",
        message:
          "Berita dengan judul yang sama sudah ada, silahkan masukkan judul lain.",
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
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
    });

    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "User tidak ditemukan.",
        data: null,
      });
    }

    let NewsStatus = "Diverifikasi_Oleh_Universitas";
    let adminUniversitasId = null;
    let isActive = false;

    // Cek role user
    if (currentUser.role.name === "admin_universitas") {
      // Jika admin universitas, langsung NewsStatus
      NewsStatus = "Diverifikasi_Oleh_Universitas";
      isActive = true;
      adminUniversitasId = currentUser.id;
    } else if (currentUser.role.name === "admin_prodi") {
      // Jika admin prodi, belum NewsStatus dan adminUniversitasId tetap null
      NewsStatus = "Menunggu_Persetujuan";
      isActive = false;
    } else {
      // Jika bukan admin, tidak diijinkan
      return res.status(403).json({
        status: "fail",
        message: "Hanya admin yang diijinkan menambahkan berita.",
      });
    }

    // Simpan berita baru ke database
    const newNews = await prisma.news.create({
      data: {
        title,
        image: `${req.protocol}://${req.get("host")}/uploads/public/news/${
          req.file.filename
        }`,
        content,
        author: {
          connect: { id: currentUser.id },
        },
        adminUniversitas: adminUniversitasId
          ? { connect: { id: adminUniversitasId } }
          : undefined, // Hanya konek jika ada adminUniversitasId
        NewsStatus,
        isActive: isActive || false, // Default to false if not provided
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Berita berhasil ditambahkan.",
      data: newNews,
    });
  } catch (error) {
    logger.error("Error while adding news: ", error);
    logger.error({
      message: `Error while adding news: ${error}`,
      userId: req.user.id, // Gunakan req.user.id yang sudah ada
      username: req.user.username, // Gunakan req.user.username yang sudah ada
      method: req.method,
      url: req.originalUrl,
    });
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.readNews = async (req, res) => {
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

exports.detailNews = async (req, res) => {
  try {
    const id = req.params.id;

    const news = await prisma.news.findUnique({
      where: { id: id, isActive: true }, // Pastikan hanya berita dengan isActive = true yang bisa diakses
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!news) {
      return res.status(404).json({
        status: "fail",
        message: "Berita dengan ID tersebut tidak ditemukan atau tidak aktif.",
      });
    }

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedNews = {
      id: news.id,
      title: news.title,
      content: news.content,
      image: news.image,
      authorName: news.author.username,
      createdAt:
        new Date(news.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }) +
        " " +
        new Date(news.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };

    return res.status(200).json({
      status: "success",
      message: "Data berita berhasil diambil.",
      data: formattedNews,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.readVerifyNews = async (req, res) => {
  try {
    // Ambil data user yang sedang login
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "User tidak ditemukan",
      });
    }

    // Filter berdasarkan role
    let filter = {};
    const isUniversityAdmin = currentUser.role.name === "admin_universitas";

    if (isUniversityAdmin) {
      filter = { NewsStatus: "Menunggu_Persetujuan" }; // Data belum diverifikasi
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk melihat data ini",
      });
    }

    // Query data Alumni Program sesuai filter
    const Newss = await prisma.News.findMany({
      where: filter,
      include: {
        author: {
          select: {
            username: true,
          },
        },
        adminUniversitas: {
          select: {
            username: true,
          },
        },
      },
    });

    // Jika tidak ada data
    if (!Newss.length) {
      return res.status(404).json({
        status: "fail",
        message: "Tidak ada news yang sesuai filter",
      });
    }

    return res.status(200).json({
      status: "success",
      data: Newss,
    });
  } catch (error) {
    console.error("Error fetching filtered News:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.readVerifiedNews = async (req, res) => {
  try {
    // Ambil data user yang sedang login
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "User tidak ditemukan",
      });
    }

    // Filter berdasarkan role
    let filter = {};
    const isUniversityAdmin = currentUser.role.name === "admin_universitas";

    if (isUniversityAdmin) {
      filter = { NewsStatus: "Diverifikasi_Oleh_Universitas" }; // Data sudah diverifikasi oleh admin Universitas
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk melihat data ini",
      });
    }

    // Query data News sesuai filter
    const Newss = await prisma.News.findMany({
      where: filter,
      include: {
        author: {
          select: {
            username: true,
          },
        },
        adminUniversitas: {
          select: {
            username: true,
          },
        },
      },
    });

    // Jika tidak ada data
    if (!Newss.length) {
      return res.status(404).json({
        status: "fail",
        message: "Tidak ada Berita yang sesuai filter",
      });
    }

    return res.status(200).json({
      status: "success",
      data: Newss,
    });
  } catch (error) {
    console.error("Error fetching filtered News:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.verifyNews = async (req, res) => {
  try {
    const { id } = req.params;
    // const { action, rejectionReason } = req.body;
    const { action } = req.body;
    rejectionReason = "Request data anda belum memenuhi syarat";

    // Fetch the current user and their role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "User tidak ditemukan",
      });
    }

    // Fetch the current submission
    const submission = await prisma.News.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({
        status: "fail",
        message: "Berita tidak ditemukan",
      });
    }

    // Define allowed transitions based on role and current status;
    const isUniversityAdmin = currentUser.role.name === "admin_universitas";

    // Validation for Prodi Admin
    if (isUniversityAdmin) {
      if (submission.NewsStatus !== "Menunggu_Persetujuan") {
        return res.status(400).json({
          status: "fail",
          message: "Berita ini sudah diverifikasi atau ditolak",
        });
      }

      if (action === "verify") {
        await prisma.News.update({
          where: { id },
          data: {
            NewsStatus: "Diverifikasi_Oleh_Universitas",
            isActive: true,
            adminUniversitas: {
              connect: { id: currentUser.id },
            },
          },
        });
      } else if (action === "reject") {
        if (!rejectionReason) {
          return res.status(400).json({
            status: "fail",
            message: "Alasan penolakan harus disertakan",
          });
        }

        await prisma.News.update({
          where: { id },
          data: {
            NewsStatus: "Ditolak",
            rejectionReason,
            adminUniversitas: {
              connect: { id: currentUser.id },
            },
          },
        });
      }
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk melakukan verifikasi",
      });
    }

    // Fetch updated submission with verifier details
    const updatedSubmission = await prisma.News.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        adminUniversitas: {
          select: {
            username: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Status berita berhasil diperbarui",
      data: updatedSubmission,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.toggleIsActiveNews = async (req, res) => {
  try {
    const { id } = req.params; // Ambil ID dari parameter route
    const { isActive } = req.body; // Ambil status baru dari body

    // Validasi nilai isActive
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        status: "fail",
        message: "Nilai isActive harus berupa boolean (true/false)",
      });
    }

    // Cari program alumni berdasarkan ID
    const News = await prisma.News.findUnique({
      where: { id },
    });

    if (!News) {
      return res.status(404).json({
        status: "fail",
        message: "Berita tidak ditemukan",
      });
    }

    // Cek status verifikasi program
    if (News.NewsStatus !== "Diverifikasi_Oleh_Universitas") {
      return res.status(400).json({
        status: "fail",
        message:
          "Hanya program yang sudah diverifikasi oleh universitas yang dapat diubah status aktifnya",
        currentStatus: News.NewsStatus,
      });
    }

    // Perbarui status isActive
    const updatedNews = await prisma.News.update({
      where: { id },
      data: { isActive },
    });

    return res.status(200).json({
      status: "success",
      message: `Status isActive berhasil diubah menjadi ${
        isActive ? "aktif" : "nonaktif"
      }`,
      data: updatedNews,
    });
  } catch (error) {
    console.error("Error updating isActive:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.readNewsUpdate = async (req, res) => {
  try {
    const NewsList = await prisma.News.findMany({
      where: { authorId: req.user.id },
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedNewsList = NewsList.map((News) => {
      // Pastikan `News.date` valid
      const formattedDate = new Date(News.date);
      const dateStr = !isNaN(formattedDate) // Cek apakah tanggal valid
        ? formattedDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Tanggal tidak valid"; // Jika tidak valid, beri pesan fallback

      const formattedCreatedAt = new Date(News.createdAt).toLocaleDateString(
        "id-ID",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

      return {
        id: News.id,
        title: News.title,
        content: News.content,
        image: News.image,
        authorName: News.author.username,
        createdAt: formattedCreatedAt,
      };
    });

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

exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = req.validatedData; // Data yang sudah divalidasi dari middleware

    // 1. Validasi keberadaan news dan kepemilikan
    const existingNews = await prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!existingNews) {
      logger.warn({
        message: `News with id ${id} not found.`,
        userId: req.user.id,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(404).json({
        status: "fail",
        message: "Berita tidak ditemukan",
      });
    }

    // 2. Validasi kepemilikan dan hak akses
    if (
      existingNews.author.id !== req.user.id &&
      existingNews.author.role.name !== "admin_universitas"
    ) {
      logger.warn({
        message: `User with id ${req.user.id} tried to update news with id ${id} but lacks permission.`,
        userId: req.user.id,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk mengubah berita ini",
      });
    }

    // 3. Persiapkan data update
    const updateData = {};

    // Update field-field yang ada dalam validatedData
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.content) updateData.content = validatedData.content;

    // 4. Handle image update jika ada file baru
    if (req.file) {
      // Generate image URL baru
      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/public/news/${req.file.filename}`;
      updateData.image = newImageUrl;

      // Hapus file gambar lama jika ada
      try {
        const oldImagePath = existingNews.image.split("/uploads/")[1];
        if (oldImagePath) {
          const fullPath = path.join(
            __dirname,
            "../uploads/public/news",
            oldImagePath
          );
          await fs.unlink(fullPath).catch((err) => {
            logger.warn({
              message: `Old image file for news id ${id} not found or could not be deleted.`,
              userId: req.user.id,
              method: req.method,
              url: req.originalUrl,
              error: err.message,
            });
          });
        }
      } catch (error) {
        logger.error({
          message: `Error handling old image while updating news with id ${id}.`,
          userId: req.user.id,
          method: req.method,
          url: req.originalUrl,
          error: error.message,
        });
      }
    }

    // 6. Lakukan update ke database
    const updatedNews = await prisma.news.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            username: true,
          },
        },
        adminUniversitas: {
          select: {
            username: true,
          },
        },
      },
    });

    // 7. Format tanggal untuk response
    const formattedNews = {
      ...updatedNews,
      createdAt: new Date(updatedNews.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      updatedAt: new Date(updatedNews.updatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };

    logger.info({
      message: `News with id ${id} successfully updated.`,
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      updatedData: formattedNews,
    });

    return res.status(200).json({
      status: "success",
      message: "Berita berhasil diperbarui",
      data: formattedNews,
    });
  } catch (error) {
    logger.error({
      message: `Error while updating news with id ${req.params.id}: ${error.message}`,
      userId: req.user.id,
      username: req.user.username,
      method: req.method,
      url: req.originalUrl,
      error: error.message,
    });
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

exports.sendNewsWhatsapp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "id harus diisi",
      });
    }

    // Get the news data first
    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!news) {
      return res.status(404).json({
        status: "fail",
        message: "Berita tidak ditemukan",
      });
    }

    // Get all sensitive student data with valid mobile numbers
    const sensitiveData = await prisma.sensitiveStudentData.findMany({
      where: {
        mobile_number: {
          not: null,
          not: "",
        },
      },
      select: {
        mobile_number: true,
        profile: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!sensitiveData || sensitiveData.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Tidak ada data mahasiswa dengan nomor telepon yang valid",
      });
    }

    const shortContent =
      news.content.length > 500
        ? `${news.content.slice(0, 500)}...`
        : news.content;

    // Array to store all message sending promises
    const messagePromises = sensitiveData.map(async (student) => {
      // Format nomor telepon
      const formattedPhoneNumber = formatPhoneNumber(student.mobile_number);
      if (!formattedPhoneNumber) {
        logger.warn({
          message: `Invalid phone number for student: ${student.profile.full_name}`,
          phoneNumber: student.mobile_number,
        });
        return null;
      }

      const message = `
Hai *${student.profile.full_name}*! 👋

Kami punya kabar menarik untukmu!

📰 *Berita Terbaru dari Kami*

📌 *Judul:* ${news.title}  
✍️ *Ditulis oleh:* ${news.author.username}  

"${shortContent}"  

Mau tahu lebih banyak? Yuk, cek detailnya di website kami!

Salam hangat,  
Pusat Perkembangan Karier dan Alumni Yarsi 
`.trim();

      try {
        const response = await twilioClient.messages.create({
          from: `whatsapp:+14155238886`,
          to: `whatsapp:${formattedPhoneNumber}`,
          body: message,
        });
        console.log(
          `Pesan dikirim ke ${student.profile.full_name} (${formattedPhoneNumber})`
        );

        logger.info({
          message: `WhatsApp message sent for news ID: ${id} to ${student.profile.full_name}`,
          phoneNumber: formattedPhoneNumber,
          messageId: response.sid,
        });

        return {
          messageSid: response.sid,
          status: response.status,
          recipientName: student.profile.full_name,
          phoneNumber: formattedPhoneNumber,
        };
      } catch (error) {
        logger.error({
          message: `Failed to send WhatsApp message to ${student.profile.full_name}`,
          error: error.message,
          phoneNumber: formattedPhoneNumber,
        });
        return null;
      }
    });

    // Wait for all messages to be sent
    const results = await Promise.all(messagePromises);
    const successfulMessages = results.filter((result) => result !== null);

    return res.status(200).json({
      status: "success",
      message: `Pesan WhatsApp berhasil dikirim ke ${successfulMessages.length} penerima`,
      data: successfulMessages,
    });
  } catch (error) {
    logger.error({
      message: `Error sending WhatsApp messages: ${error.message}`,
      error,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat mengirim pesan WhatsApp",
      error: error.message,
    });
  }
};

function formatPhoneNumber(phoneNumber) {
  // Jika nomor dimulai dengan "08", ubah ke "+62"
  if (phoneNumber.startsWith("08")) {
    return `+62${phoneNumber.slice(1)}`;
  }
  // Jika nomor sudah dalam format internasional, kembalikan apa adanya
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }
  // Jika format tidak dikenal, kembalikan null (atau tangani sesuai kebutuhan)
  return null;
}
