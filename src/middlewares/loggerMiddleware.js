const logger2 = require("../utils/logger");

const loggerMiddleware = (req, res, next) => {
  const { method, url, headers } = req;
  const startTime = new Date();

  res.on("finish", () => {
    const duration = new Date() - startTime;
    logger2.http({
      message: `${method} ${url} ${res.statusCode} - ${duration}ms`,
      userAgent: headers["user-agent"],
    });
  });

  next();
};

module.exports = loggerMiddleware;
