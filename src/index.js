// ===============================================
// DEPENDENCIES AND CONFIGURATIONS
// ===============================================

// Core Express and Environment Setup
const express = require("express"); // IMPORT MODULE EXPRESS
const dotenv = require("dotenv"); // IMPORT MODULE .ENV
const { PrismaClient } = require("@prisma/client"); // IMPROT MODULE ORM PRISMA
const cookieParser = require("cookie-parser");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Custom Middleware and Utilities
const loggerMiddleware = require("./middlewares/loggerMiddleware");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { initializeScheduler } = require("./utils/scheduler");

// ===============================================
// ROUTE IMPORTS
// ===============================================

// Authentication and User Management
const AuthRouter = require("./routes/AuthRouter");
const GenerateUserRouter = require("./routes/generateUserRouter");
const ProfileRouter = require("./routes/profileRouter");

// Content Management
const CategoriesRouter = require("./routes/categories");
const NewsRouter = require("./routes/newsRouter");
const EventRouter = require("./routes/eventRouter");
const HomepageRouter = require("./routes/homepageRouter");
const ProductRouter = require("./routes/productsRouter");

// Alumni Specific Routes
const AlumniProgram = require("./routes/alumniProgramRouter");
const DataAlumniRouter = require("./routes/dataRouter");
const tracerStudyRouter = require("./routes/tracerStudyRouter");
const BroadcastRouter = require("./routes/broadcastRouter");

// Analytics and Notifications
const DashboardRouter = require("./routes/dashboardRouter");
const notificationRouter = require("./routes/notificationTracerStudyRouter"); // Sesuaikan dengan nama file

// ===============================================
// EXPRESS APP INITIALIZATION
// ===============================================

const prisma = new PrismaClient();
const app = express();

// Load environment variables
dotenv.config();
const PORT = process.env.PORT;

// ===============================================
// MIDDLEWARE SETUP
// ===============================================

// Basic middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

// ===============================================
// STATIC FILE SERVING
// ===============================================

// Public files (accessible without authentication)
app.use(
  "/uploads/public/news",
  express.static(path.join(__dirname, "/uploads/public/news"))
);

app.use(
  "/uploads/public/events",
  express.static(path.join(__dirname, "/uploads/public/events"))
);

app.use(
  "/uploads/public/alumni-programs",
  express.static(path.join(__dirname, "/uploads/public/alumni-programs"))
);

app.use(
  "/uploads/private/profiles",
  express.static(path.join(__dirname, "/uploads/private/profiles"))
);

// ===============================================
// LOGGING AND ERROR HANDLING
// ===============================================

// Request logging
app.use(loggerMiddleware);

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`);
  res.status(500).json({ error: "Internal Server Error" });
});

// ===============================================
// SCHEDULER INITIALIZATION
// ===============================================

// Inisialisasi scheduler
initializeScheduler();

// ===============================================
// API ROUTES
// ===============================================

// Authentication and User Management Routes
app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/generate-user", GenerateUserRouter);
app.use("/api/v1/profile", ProfileRouter);

// Content Management Routes
app.use("/api/v1/categories", CategoriesRouter);
app.use("/api/v1/news", NewsRouter);
app.use("/api/v1/event", EventRouter);
app.use("/api/v1/homepage", HomepageRouter);
app.use("/api/v1/product", ProductRouter);

// Alumni Management Routes
app.use("/api/v1/alumni-program", AlumniProgram);
app.use("/api/v1/data-alumni", DataAlumniRouter);
app.use("/api/v1/tracer-study", tracerStudyRouter);
app.use("/api/v1/broadcast", BroadcastRouter);

// Analytics and Notification Routes
app.use("/api/v1/dashboard", DashboardRouter);
app.use("/api/v1/notification", notificationRouter); // Sesuaikan dengan format API v1

// ===============================================
// ERROR HANDLING MIDDLEWARE
// ===============================================
app.use(notFound);
// app.use(errorHandler);

// ===============================================
// SERVER INITIALIZATION
// ===============================================
app.listen(PORT, () =>
  console.log(`Express API sudah jalan pada port: ${PORT}`)
);

// //SERVER HTTPS
// const sslOptions = {
//   key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
//   cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
// };

// https
//   .createServer(sslOptions, app)
//   .listen(PORT, () =>
//     console.log(`Express API berjalan dengan HTTPS pada port: ${PORT}`)
//   );
