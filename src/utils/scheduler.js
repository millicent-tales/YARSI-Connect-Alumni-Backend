const cron = require("node-cron");
const {
  sendNotification,
} = require("../controllers/notificationTracerStudyController");
const logger = require("./logger"); // Jika Anda menggunakan logger

// const initializeScheduler = () => {
//   // // Contoh: Setiap bulan
//   // cron.schedule("0 0 1 * *", () => {
//   //   sendNotification();
//   // });

//   // Contoh: setiap menit (untuk testing)
//   cron.schedule("* * * * *", () => {
//     console.log("Testing notification");
//     sendNotification();
//   });

//   // // Contoh: setiap 5 menit
//   // cron.schedule("*/5 * * * *", () => {
//   //   sendNotification();
//   // });

//   // // Contoh: setiap jam
//   // cron.schedule("0 * * * *", () => {
//   //   sendNotification();
//   // });

//   // Atau setiap minggu
//   // cron.schedule('0 0 * * 1', () => {
//   //   sendNotification();
//   // });
// };

const initializeScheduler = () => {
  try {
    // Memastikan cron pattern valid
    if (!cron.validate("* * * * *")) {
      throw new Error("Invalid cron pattern");
    }

    // Testing setiap menit
    cron.schedule("* * * * *", async () => {
      try {
        console.log(
          "Starting scheduled notification:",
          new Date().toISOString()
        );
        await sendNotification();
        console.log("Notification sent successfully");
      } catch (error) {
        console.error("Failed to send notification:", error.message);
        // Jika menggunakan logger
        // logger.error(`Failed to send notification: ${error.message}`);
      }
    });

    console.log("Scheduler initialized successfully");
  } catch (error) {
    console.error("Failed to initialize scheduler:", error.message);
    // Jika menggunakan logger
    // logger.error(`Failed to initialize scheduler: ${error.message}`);
  }
};

module.exports = {
  initializeScheduler,
};
