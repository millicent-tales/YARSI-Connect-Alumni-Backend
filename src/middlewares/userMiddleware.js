const jwt = require("jsonwebtoken");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

exports.authMiddleware = async (req, res, next) => {
  // 1) fungsi jika di headerna kita masukkan token atau tidak
  let token;

  // if (
  //   req.headers.authorization &&
  //   req.headers.authorization.startsWith("Bearer")
  // ) {
  //   token = req.headers.authorization.split(" ")[1];
  // }

  token = req.cookies.jwt;

  if (!token) {
    return next(
      res.status(401).json({
        status: 401,
        message: "Anda belum login/register token tidak ditemukan",
      })
    );
  }

  // 2) decode verifikasi tokennya
  // invalid token - synchronous
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(
      res.status(401).json({
        error: err,
        message: "Token yang dimasukkan tidak ditemukan/tidak ada",
      })
    );
  }

  // 3) ambil data user berdasarkan kondisi decodednya
  // 3) ambil data user berdasarkan kondisi decodednya
  const currentUser = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      username: true,
      password: true,
      roleId: true,
      profileId: true, // Add this line
    },
  });

  // user jika tidak ada
  if (!currentUser) {
    return res.status(401).json({
      status: 401,
      message: "User sudah dihapus, token sudah tidak bisa ditemukan",
    });
  }

  req.user = currentUser;

  next();
};

exports.permissionUser = (...roles) => {
  return async (req, res, next) => {
    console.log("req user", req.user.roleId);
    // Pastikan req.user ada
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({
        status: 403,
        error: "User tidak terautentikasi atau ID tidak ditemukan",
      });
    }

    // Ambil data user beserta informasi role
    const userData = await prisma.role.findUnique({
      where: { id: req.user.roleId },
      select: {
        name: true,
        // password: true,
        // roleId: true,
      },
    });

    // Cek apakah userData dan role ada
    if (!userData || !userData.name) {
      return res.status(403).json({
        status: 403,
        error: "Role tidak ditemukan atau user tidak memiliki role yang valid",
      });
    }

    const roleName = userData.name; // Ambil nama role

    // Cek apakah roleName ada dalam list roles yang diizinkan
    if (!roles.includes(roleName)) {
      return res.status(403).json({
        status: 403,
        error: "Anda tidak dapat mengakses halaman ini",
      });
    }

    next(); // Lanjutkan ke middleware berikutnya
  };
};
