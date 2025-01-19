const winston = require("winston");
require("winston-daily-rotate-file");

const { createLogger, format, transports } = winston;

const logger = createLogger({
  format: format.combine(
    format.timestamp(), // Menambahkan timestamp
    format.printf(({ timestamp, level, message, ...meta }) => {
      // Format log ke dalam bentuk JSON
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        method: meta.method || "N/A", // Tambahkan method jika tersedia
        url: meta.url || "N/A",       // Tambahkan url jika tersedia
        ...meta,
      });
    })
  ),
  transports: [
    new transports.DailyRotateFile({
      filename: "src/logs/error/system_error_%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "5m",
    }),
    new transports.DailyRotateFile({
      filename: "src/logs/info/system_info_%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      maxSize: "5m",
    }),
  ],
});

module.exports = logger;
