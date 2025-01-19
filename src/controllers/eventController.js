const { PrismaClient, EventStatus } = require("@prisma/client");
const { date } = require("zod");
const prisma = new PrismaClient();
const fs = require("fs");
const twilioClient = require("../utils/twilioClient");
const logger = require("../utils/logger");

exports.addEvent = async (req, res) => {
  try {
    // Gunakan data yang sudah tervalidasi dari middleware
    const { title, date, description } = req.validatedData;

    // Cek apakah berita dengan judul yang sama sudah ada
    const existingEvent = await prisma.Event.findFirst({
      where: { title: title },
    });

    if (existingEvent) {
      return res.status(400).json({
        status: "fail",
        message:
          "Acara dengan judul yang sama sudah ada, silahkan masukkan judul lain.",
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

    let EventStatus = "Diverifikasi_Oleh_Universitas";
    let adminUniversitasId = null;
    let isActive = false;

    // Cek role user
    if (currentUser.role.name === "admin_universitas") {
      // Jika admin universitas, langsung EventStatus
      EventStatus = "Diverifikasi_Oleh_Universitas";
      isActive = true;
      adminUniversitasId = currentUser.id;
    } else if (currentUser.role.name === "admin_prodi") {
      // Jika admin prodi, belum EventStatus dan adminUniversitasId tetap null
      EventStatus = "Menunggu_Persetujuan";
      isActive = false;
    } else {
      // Jika bukan admin, tidak diijinkan
      return res.status(403).json({
        status: "fail",
        message: "Hanya admin yang diijinkan menambahkan berita.",
      });
    }

    // Simpan berita baru ke database
    const newEvent = await prisma.Event.create({
      data: {
        title,
        image: `${req.protocol}://${req.get("host")}/uploads/public/events/${
          req.file.filename
        }`,
        date,
        description,
        author: {
          connect: { id: currentUser.id },
        },
        adminUniversitas: adminUniversitasId
          ? { connect: { id: adminUniversitasId } }
          : undefined, // Hanya konek jika ada adminUniversitasId
        EventStatus,
        isActive: isActive || false, // Default to false if not provided
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Berita berhasil ditambahkan.",
      data: newEvent,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.readEvent = async (req, res) => {
  try {
    const EventList = await prisma.Event.findMany({
      where: { isActive: true, EventStatus: "Diverifikasi_Oleh_Universitas" },
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

exports.detailEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const Event = await prisma.Event.findUnique({
      where: { id: id, isActive: true }, // Pastikan hanya event yang isActive = true yang bisa diakses
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!Event) {
      return res.status(404).json({
        status: "fail",
        message: "Event dengan ID tersebut tidak ditemukan atau tidak aktif.",
      });
    }

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
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

    // Return the formatted event data
    return res.status(200).json({
      status: "success",
      message: "Data event berhasil diambil.",
      data: {
        id: Event.id,
        title: Event.title,
        date: dateStr, // Gunakan hasil format tanggal
        description: Event.description,
        image: Event.image,
        authorName: Event.author.username,
        createdAt: formattedCreatedAt,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.readVerifyEvent = async (req, res) => {
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
      filter = { EventStatus: "Menunggu_Persetujuan" }; // Data belum diverifikasi
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk melihat data ini",
      });
    }

    // Query data Alumni Program sesuai filter
    const events = await prisma.Event.findMany({
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
    if (!events.length) {
      return res.status(404).json({
        status: "fail",
        message: "Tidak ada program alumni yang sesuai filter",
      });
    }

    return res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching filtered alumni events:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.readVerifiedEvent = async (req, res) => {
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
      filter = { EventStatus: "Diverifikasi_Oleh_Universitas" }; // Data sudah diverifikasi oleh admin Universitas
    } else {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk melihat data ini",
      });
    }

    // Query data Alumni Program sesuai filter
    const events = await prisma.Event.findMany({
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
    if (!events.length) {
      return res.status(404).json({
        status: "fail",
        message: "Tidak ada program alumni yang sesuai filter",
      });
    }

    return res.status(200).json({
      status: "success",
      data: events,
    });
  } catch (error) {
    console.error("Error fetching filtered alumni events:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.verifyEvent = async (req, res) => {
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
    const submission = await prisma.Event.findUnique({
      where: { id },
    });

    if (!submission) {
      return res.status(404).json({
        status: "fail",
        message: "Program alumni tidak ditemukan",
      });
    }

    // Define allowed transitions based on role and current status;
    const isUniversityAdmin = currentUser.role.name === "admin_universitas";

    // Validation for Prodi Admin
    if (isUniversityAdmin) {
      if (submission.EventStatus !== "Menunggu_Persetujuan") {
        return res.status(400).json({
          status: "fail",
          message: "Program ini sudah diverifikasi atau ditolak",
        });
      }

      if (action === "verify") {
        await prisma.Event.update({
          where: { id },
          data: {
            EventStatus: "Diverifikasi_Oleh_Universitas",
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

        await prisma.Event.update({
          where: { id },
          data: {
            EventStatus: "Ditolak",
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
    const updatedSubmission = await prisma.Event.findUnique({
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
      message: "Status program alumni berhasil diperbarui",
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

exports.toggleIsActiveEvent = async (req, res) => {
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
    const Event = await prisma.Event.findUnique({
      where: { id },
    });

    if (!Event) {
      return res.status(404).json({
        status: "fail",
        message: "Program alumni tidak ditemukan",
      });
    }

    // Cek status verifikasi program
    if (Event.EventStatus !== "Diverifikasi_Oleh_Universitas") {
      return res.status(400).json({
        status: "fail",
        message:
          "Hanya program yang sudah diverifikasi oleh universitas yang dapat diubah status aktifnya",
        currentStatus: Event.EventStatus,
      });
    }

    // Perbarui status isActive
    const updatedEvent = await prisma.Event.update({
      where: { id },
      data: { isActive },
    });

    return res.status(200).json({
      status: "success",
      message: `Status isActive berhasil diubah menjadi ${
        isActive ? "aktif" : "nonaktif"
      }`,
      data: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating isActive:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
    });
  }
};

exports.readEventUpdate = async (req, res) => {
  try {
    const EventList = await prisma.Event.findMany({
      where: { authorId: req.user.id },
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
    });

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedEventList = EventList.map((Event) => {
      // Pastikan `Event.date` valid
      const formattedDate = new Date(Event.date);
      const dateStr = !isNaN(formattedDate) // Cek apakah tanggal valid
        ? `${String(formattedDate.getMonth() + 1).padStart(2, "0")}-${String(
            formattedDate.getDate()
          ).padStart(2, "0")}-${formattedDate.getFullYear()}`
        : "Tanggal tidak valid"; // Jika tidak valid, beri pesan fallback

      const formattedCreatedAt = new Date(Event.createdAt);
      const createdAtStr = `${String(
        formattedCreatedAt.getMonth() + 1
      ).padStart(2, "0")}-${String(formattedCreatedAt.getDate()).padStart(
        2,
        "0"
      )}-${formattedCreatedAt.getFullYear()}`;

      return {
        id: Event.id,
        title: Event.title,
        date: dateStr, // Gunakan hasil format tanggal MM-DD-YYYY
        description: Event.description,
        image: Event.image,
        authorName: Event.author.username,
        createdAt: createdAtStr,
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

exports.detailEventUpdate = async (req, res) => {
  try {
    const id = req.params.id;

    const Event = await prisma.Event.findUnique({
      where: { id: id, isActive: true }, // Pastikan hanya event yang isActive = true yang bisa diakses
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!Event) {
      return res.status(404).json({
        status: "fail",
        message: "Event dengan ID tersebut tidak ditemukan atau tidak aktif.",
      });
    }

    // Format hasil agar `author` menjadi `authorName` dan format `createdAt`
    const formattedDate = new Date(Event.date);
    const dateStr = !isNaN(formattedDate) // Cek apakah tanggal valid
      ? `${String(formattedDate.getMonth() + 1).padStart(2, "0")}-${String(
          formattedDate.getDate()
        ).padStart(2, "0")}-${formattedDate.getFullYear()}`
      : "Tanggal tidak valid"; // Jika tidak valid, beri pesan fallback

    const formattedCreatedAt = new Date(Event.createdAt);
    const createdAtStr = `${String(formattedCreatedAt.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(formattedCreatedAt.getDate()).padStart(
      2,
      "0"
    )}-${formattedCreatedAt.getFullYear()}`;

    // Return the formatted event data
    return res.status(200).json({
      status: "success",
      message: "Data event berhasil diambil.",
      data: {
        id: Event.id,
        title: Event.title,
        date: dateStr, // Gunakan hasil format tanggal MM-DD-YYYY
        description: Event.description,
        image: Event.image,
        authorName: Event.author.username,
        createdAt: createdAtStr, // Gunakan hasil format tanggal MM-DD-YYYY untuk createdAt
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = req.validatedData; // Data yang sudah divalidasi dari middleware

    // 1. Validasi keberadaan event dan kepemilikan
    const existingEvent = await prisma.event.findUnique({
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

    if (!existingEvent) {
      return res.status(404).json({
        status: "fail",
        message: "Event tidak ditemukan",
      });
    }

    // 2. Validasi kepemilikan dan hak akses
    if (
      existingEvent.author.id !== req.user.id &&
      existingEvent.author.role.name !== "admin_universitas"
    ) {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki akses untuk mengubah event ini",
      });
    }

    // 3. Persiapkan data update
    const updateData = {};

    // Update field-field yang ada dalam validatedData
    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description)
      updateData.description = validatedData.description;
    if (validatedData.date) updateData.date = validatedData.date;

    // 4. Handle image update jika ada file baru
    if (req.file) {
      // Generate image URL baru
      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/public/events/${req.file.filename}`;
      updateData.image = newImageUrl;

      // Hapus file gambar lama jika ada
      try {
        // Ekstrak nama file dari URL gambar lama
        const oldImagePath = existingEvent.image.split("/events/")[1];
        if (oldImagePath) {
          const fullPath = path.join(
            __dirname,
            "../uploads/public/events",
            oldImagePath
          );
          await fs.unlink(fullPath).catch((err) => {
            console.log(
              "Warning: Old image file not found or could not be deleted:",
              err.message
            );
          });
        }
      } catch (error) {
        console.log("Error handling old image:", error);
        // Lanjutkan proses update meskipun ada error dalam penghapusan file lama
      }
    }

    // 6. Lakukan update ke database
    const updatedEvent = await prisma.event.update({
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
    const formattedEvent = {
      ...updatedEvent,
      date: new Date(updatedEvent.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      createdAt: new Date(updatedEvent.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      updatedAt: new Date(updatedEvent.updatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };

    return res.status(200).json({
      status: "success",
      message: "Event berhasil diperbarui",
      data: formattedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

exports.sendEventWhatsapp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "ID Event harus diisi",
      });
    }

    // Ambil data event berdasarkan ID
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({
        status: "fail",
        message: "Event tidak ditemukan",
      });
    }

    // Ambil data alumni dengan nomor telepon yang valid
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
        message: "Tidak ada data alumni dengan nomor telepon yang valid",
      });
    }

    const shortDescription =
      event.description && event.description.length > 500
        ? `${event.description.slice(0, 500)}...`
        : event.description || "Deskripsi tidak tersedia";

    // Array untuk menyimpan promise pengiriman pesan
    const messagePromises = sensitiveData.map(async (student) => {
      // Format nomor telepon
      const formattedPhoneNumber = formatPhoneNumber(student.mobile_number);
      if (!formattedPhoneNumber) {
        logger.warn({
          message: `Invalid phone number for alumni: ${student.profile.full_name}`,
          phoneNumber: student.mobile_number,
        });
        return null;
      }

      const message = `
Hai *${student.profile.full_name}*! 👋

Kami ingin mengundangmu untuk bergabung dalam acara kami! 🎉

📅 *Event: ${event.title}*

📆 *Tanggal:* ${new Date(event.date).toLocaleDateString("id-ID")}
📌 *Deskripsi:*  
"${shortDescription}"

Diselenggarakan oleh: ${event.author.username}

Jangan sampai terlewatkan! Untuk detail lebih lanjut, kunjungi website kami.

Salam hangat,  
Pusat Perkembangan Karier dan Alumni Yarsi
`.trim();

      try {
        const response = await twilioClient.messages.create({
          from: `whatsapp:+14155238886`,
          to: `whatsapp:${formattedPhoneNumber}`,
          body: message,
        });

        logger.info({
          message: `WhatsApp message sent for Event ID: ${id} to ${student.profile.full_name}`,
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

    // Tunggu semua pesan dikirim
    const results = await Promise.all(messagePromises);
    const successfulMessages = results.filter((result) => result !== null);

    return res.status(200).json({
      status: "success",
      message: `Pesan WhatsApp berhasil dikirim ke ${successfulMessages.length} alumni`,
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
// exports.updateEvent = async (req, res) => {
//   try {
//     const { id } = req.params; // Ambil ID dari parameter
//     let { title, date, description, image } = req.body; // Data baru dari body

//     // Validasi apakah event dengan ID tersebut ada
//     const existingEvent = await prisma.event.findUnique({
//       where: { id },
//     });

//     // req file
//     const file = req.file;

//     // JIKA FILE GAMBAR DIGANTI
//     if (file) {
//       // ambil file gambar lama
//       const nameImage = existingEvent.image.replace(
//         `${req.protocol}://${req.get("host")}/uploads/public/events/}`,
//         ""
//       );
//       // tempat file gambar lama
//       const filePath = `./uploads/public/events/${nameImage}`;
//       // fungsi hapus file
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           res.status(400);
//           throw new Error("File tidak ditemukan");
//         }
//       });
//     }

//     if (!existingEvent) {
//       return res.status(404).json({
//         status: "fail",
//         message: "Event dengan ID tersebut tidak ditemukan.",
//       });
//     }

//     // Perbarui data event
//     const updatedEvent = await prisma.event.update({
//       where: { id },
//       data: {
//         ...(title && { title }), // Update title jika ada
//         ...(date && { date }), // Update date jika ada
//         ...(description && { description }), // Update description jika ada
//         ...(image && { image }), // update image jika ada
//       },
//     });

//     return res.status(200).json({
//       status: "success",
//       message: "Event berhasil diperbarui.",
//       data: updatedEvent,
//     });
//   } catch (error) {
//     console.error("Error updating event:", error);
//     return res.status(500).json({
//       status: "error",
//       message: "Terjadi kesalahan pada server.",
//     });
//   }
// };
