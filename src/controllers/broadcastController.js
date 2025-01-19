const twilioClient = require("../utils/twilioClient");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");
require("dotenv").config();
const prisma = new PrismaClient();

function formatPhoneNumber(phoneNumber) {
  if (phoneNumber.startsWith("08")) {
    return `+62${phoneNumber.slice(1)}`;
  }
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }
  return null;
}

// Template pesan berdasarkan tipe konten
function getMessageTemplate(type, content, recipientName) {
  const templates = {
    event: `
Hai *${recipientName}*! 👋

Kami ingin mengundangmu untuk bergabung dalam acara kami! 🎉

📅 *Event: ${content.title}*

📆 *Tanggal:* ${new Date(content.date).toLocaleDateString("id-ID")}
📌 *Deskripsi:*  
"${content.description}"

Diselenggarakan oleh: ${content.author.username}

Jangan sampai terlewatkan! Untuk detail lebih lanjut, kunjungi website kami.

Salam hangat,  
Pusat Perkembangan Karier dan Alumni Yarsi
`,

    news: `
Hai *${recipientName}*! 👋

Kami punya kabar menarik untukmu!

📰 *Berita Terbaru dari Kami*

📌 *Judul:* ${content.title}  
✍️ *Ditulis oleh:* ${content.author.username}  

"${content.content}"  

Mau tahu lebih banyak? Yuk, cek detailnya di website kami!

Salam hangat,  
Pusat Perkembangan Karier dan Alumni Yarsi 
`,

    alumni_program: `
Hai *${recipientName}*! 👋

Kami punya informasi menarik untukmu! 🌟

🎓 *Program Alumni: ${content.title}*

📅 *Deskripsi:*  
"${content.description}"

📍 *Diselenggarakan oleh:* ${content.author.username}

Jangan lewatkan kesempatan ini! Untuk detail lebih lanjut, silakan kunjungi website kami.

Salam hangat,  
Pusat Perkembangan Karier dan Alumni Yarsi
`,
  };

  return templates[type]?.trim() || "";
}

async function sendBroadcast(type, id, res) {
  try {
    if (!id) {
      return res.status(400).json({
        status: "fail",
        message: "ID is required",
      });
    }

    // Get content based on type
    let content;
    const includeAuthor = {
      include: {
        author: { select: { username: true } },
      },
    };

    switch (type) {
      case "event":
        content = await prisma.event.findUnique({
          where: { id },
          ...includeAuthor,
        });
        break;
      case "news":
        content = await prisma.news.findUnique({
          where: { id },
          ...includeAuthor,
        });
        break;
      case "alumni_program":
        content = await prisma.alumniProgram.findUnique({
          where: { id },
          ...includeAuthor,
        });
        break;
    }

    if (!content) {
      return res.status(404).json({
        status: "fail",
        message: `${type} not found`,
      });
    }

    // Get all users with valid phone numbers
    const users = await prisma.sensitiveStudentData.findMany({
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

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No users found with valid phone numbers",
      });
    }

    // Prepare content for message
    if (content.description && content.description.length > 500) {
      content.description = `${content.description.slice(0, 500)}...`;
    }
    if (content.content && content.content.length > 500) {
      content.content = `${content.content.slice(0, 500)}...`;
    }

    // Send messages to all users
    const messagePromises = users.map(async (user) => {
      const formattedNumber = formatPhoneNumber(user.mobile_number);
      if (!formattedNumber) {
        logger.warn({
          message: `Invalid phone number for user: ${user.profile.full_name}`,
          phoneNumber: user.mobile_number,
        });
        return null;
      }

      const messageContent = getMessageTemplate(
        type,
        content,
        user.profile.full_name
      );

      try {
        const response = await twilioClient.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: `whatsapp:${formattedNumber}`,
          body: messageContent,
        });

        logger.info({
          message: `WhatsApp message sent for ${type} ID: ${id} to ${user.profile.full_name}`,
          phoneNumber: formattedNumber,
          messageId: response.sid,
        });

        return {
          messageSid: response.sid,
          status: response.status,
          recipientName: user.profile.full_name,
          phoneNumber: formattedNumber,
        };
      } catch (error) {
        logger.error({
          message: `Failed to send WhatsApp message to ${user.profile.full_name}`,
          error: error.message,
          phoneNumber: formattedNumber,
        });
        return null;
      }
    });

    const results = await Promise.all(messagePromises);
    const successfulMessages = results.filter((result) => result !== null);

    return res.status(200).json({
      status: "success",
      message: `Successfully sent WhatsApp messages to ${successfulMessages.length} recipients`,
      data: successfulMessages,
    });
  } catch (error) {
    logger.error({
      message: `Error in broadcast: ${error.message}`,
      error,
    });

    return res.status(500).json({
      status: "error",
      message: "Failed to send broadcast messages",
      error: error.message,
    });
  }
}

// Endpoint untuk broadcast event
exports.broadcastEvent = async (req, res) => {
  const { id } = req.params;
  return sendBroadcast("event", id, res);
};

// Endpoint untuk broadcast news
exports.broadcastNews = async (req, res) => {
  const { id } = req.params;
  return sendBroadcast("news", id, res);
};

// Endpoint untuk broadcast program alumni
exports.broadcastAlumniProgram = async (req, res) => {
  const { id } = req.params;
  return sendBroadcast("alumni_program", id, res);
};
