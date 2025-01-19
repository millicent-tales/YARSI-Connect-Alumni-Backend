// controllers/notificationController.js
const client = require("../utils/twilioClient");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Fungsi untuk mengirim notifikasi
const sendNotification = async () => {
  try {
    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error(
        "TWILIO_WHATSAPP_NUMBER belum dikonfigurasi di file .env"
      );
    }

    // Mengambil semua data sensitif mahasiswa
    const allStudentData = await prisma.sensitiveStudentData.findMany({
      select: {
        mobile_number: true,
        profile: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!allStudentData || allStudentData.length === 0) {
      throw new Error("Tidak ada data mahasiswa yang ditemukan");
    }

    // Array untuk menyimpan hasil pengiriman
    const results = [];

    // Mengirim pesan ke setiap mahasiswa
    for (const student of allStudentData) {
      try {
        if (!student.mobile_number) {
          console.log(
            `Nomor WhatsApp tidak ditemukan untuk ${
              student.profile?.full_name || "Unknown"
            }`
          );
          continue;
        }

        // Format untuk WhatsApp
        let formattedPhone = student.mobile_number;
        formattedPhone = formattedPhone.replace(/\D/g, "");
        formattedPhone = formattedPhone.replace(/^0+/, "");
        formattedPhone = `whatsapp:+62${formattedPhone}`;

        console.log("Mengirim dari:", process.env.TWILIO_WHATSAPP_NUMBER);
        console.log("Mengirim ke:", formattedPhone);

        const message = await client.messages.create({
          body: `
        Halo ${student.profile?.full_name || "Mahasiswa"} 👋,
        
        Kami dari Universitas Yarsi ingin mengundang Anda untuk berpartisipasi dalam *Tracer Study* tahun ini. Partisipasi Anda sangat penting untuk membantu kami meningkatkan kualitas pendidikan dan layanan kampus.
        
        Berikut adalah langkah-langkah untuk mengisi tracer study:
        
        1️⃣ Klik tautan berikut: [TAUTAN_TRACER_STUDY]
        2️⃣ Login menggunakan akun Anda.
        3️⃣ Lengkapi seluruh pertanyaan tracer study.
        
        Mohon untuk mengisi tracer study sebelum *tanggal [DEADLINE]*.
        
        Terima kasih atas partisipasi Anda, dan semoga sukses selalu dalam perjalanan karier Anda! 😊
        
        Salam hangat,
        *Pusat Perkembangan Karier dan Alumni Universitas Yarsi*
        `,
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: formattedPhone,
        });

        console.log(
          `Notifikasi terkirim ke ${
            student.profile?.full_name || "Unknown"
          } dengan SID: ${message.sid}`
        );
        results.push({
          success: true,
          name: student.profile?.full_name,
          sid: message.sid,
        });
      } catch (error) {
        console.error(
          `Error mengirim ke ${student.profile?.full_name || "Unknown"}:`,
          error
        );
        results.push({
          success: false,
          name: student.profile?.full_name,
          error: error.message,
        });
      }
    }

    // Ringkasan hasil pengiriman
    const summary = {
      total: results.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };

    console.log("Ringkasan pengiriman:", summary);
    return summary;
  } catch (error) {
    console.error("Error dalam proses pengiriman:", error);
    throw error;
  }
};

// Controller untuk testing notifikasi via API
const testNotification = async (req, res) => {
  try {
    const summary = await sendNotification();
    res.json({
      success: true,
      message: "Proses pengiriman notifikasi selesai",
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Export kedua fungsi dalam satu object
module.exports = {
  sendNotification,
  testNotification,
};
