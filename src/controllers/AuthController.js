const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user.id);

  const cookieOption = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 14 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOption);

  user.password = undefined; // Hapus password sebelum mengirim respons

  res.status(statusCode).json({
    status: "success",
    message: "Token berhasil dibuat.",
    data: {
      user,
    },
  });

  // Log token creation event
  logger.info({
    message: "Token created successfully",
    userId: user.id,
    method: req.method,
    url: req.originalUrl,
  });
};

// Method untuk membuat user
exports.createUser = async (req, res) => {
  try {
    const { username, password, roleId } = req.validatedData;

    // Hash password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna ke database
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        roleId,
      },
    });

    logger.info({
      message: "User created successfully",
      userId: user.id,
      username: user.username,
      method: req.method,
      url: req.originalUrl,
    });

    createSendToken(user, 201, req, res);
  } catch (error) {
    logger.error({
      message: "Error creating user",
      error: error.message,
      method: req.method,
      url: req.originalUrl,
    });
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      data: null,
    });
  }
};

// Method untuk login user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.validatedData;

    // Cari pengguna berdasarkan username dan include data role
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn({
        message: "Login failed, user not found",
        username,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(404).json({
        status: "fail",
        message: "Username tidak ditemukan.",
        data: null,
      });
    }

    // Bandingkan password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      logger.warn({
        message: "Login failed, incorrect password",
        username,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(401).json({
        status: "fail",
        message: "Password salah.",
        data: null,
      });
    }

    // Log login yang berhasil
    logger.info({
      message: "Login successful",
      userId: `${user.id}`,
      method: req.method,
      url: req.originalUrl,
    });

    // Kirim token setelah login berhasil
    createSendToken(user, 200, req, res);
  } catch (error) {
    logger.error({
      message: "Error during login process",
      error: error.message,
      method: req.method,
      url: req.originalUrl,
    });

    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      data: null,
    });
  }
};

// Method untuk logout user
exports.logoutUser = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  // Log logout activity
  logger.info({
    message: "User logged out",
    userId: req.user.id,
    method: req.method,
    url: req.originalUrl,
  });

  return res.status(200).json({
    status: "success",
    message: "Logout berhasil.",
  });
};

// Method untuk melihat data user yang sedang login
exports.getMyUser = async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        roleId: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({
        status: "fail",
        message: "User tidak ditemukan.",
        data: null,
      });
    }

    // Log success in fetching user data
    logger.info({
      message: "User data fetched successfully",
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
    });

    return res.status(200).json({
      status: "success",
      message: "Data user berhasil diambil.",
      data: currentUser,
    });
  } catch (error) {
    logger.error({
      message: "Error fetching user data",
      error: error.message,
      method: req.method,
      url: req.originalUrl,
    });

    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      data: null,
    });
  }
};

// Method untuk mengubah password user
exports.changePassword = async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.validatedData;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      logger.warn({
        message: "Password change failed, user not found",
        username,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(404).json({
        status: "fail",
        message: "Username tidak ditemukan.",
        data: null,
      });
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isOldPasswordCorrect) {
      logger.warn({
        message: "Password change failed, incorrect old password",
        username,
        method: req.method,
        url: req.originalUrl,
      });
      return res.status(401).json({
        status: "fail",
        message: "Password lama salah.",
        data: null,
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { username },
      data: { password: hashedNewPassword },
    });

    logger.info({
      message: "Password changed successfully",
      userId: user.id,
      method: req.method,
      url: req.originalUrl,
    });

    res.status(200).json({
      status: "success",
      message: "Password berhasil diubah.",
      data: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({
        message: "Password change failed due to validation error",
        errors: error.errors,
        method: req.method,
        url: req.originalUrl,
      });

      return res.status(400).json({
        status: "fail",
        message: "Kesalahan validasi.",
        errors: error.errors,
        data: null,
      });
    }
    logger.error({
      message: "Error changing password",
      error: error.message,
      method: req.method,
      url: req.originalUrl,
    });

    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      data: null,
    });
  }
};
