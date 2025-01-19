const winston = require("winston");

const { createLogger, format, transports } = winston;

const logger = createLogger({
  format: format.combine(
    format.timestamp(), // Add timestamp
    format.printf(({ timestamp, level, message, ...meta }) => {
      // Format log as JSON
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        method: meta.method || "N/A", // Add method if available
        url: meta.url || "N/A",       // Add url if available
        ...meta,
      });
    })
  ),
  transports: [
    new transports.Console(), // Log to console
  ],
});

module.exports = logger;
