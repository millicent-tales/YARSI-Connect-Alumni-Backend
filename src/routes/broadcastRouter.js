const express = require("express");

const {
  broadcastEvent,
  broadcastNews,
  broadcastAlumniProgram,
} = require("../controllers/broadcastController");
const { authMiddleware } = require("../middlewares/userMiddleware");

const router = express.Router();

// Di router
router.post("/broadcast/event/:id", authMiddleware, broadcastEvent);
router.post("/broadcast/news/:id", authMiddleware, broadcastNews);
router.post(
  "/broadcast/alumni-program/:id",
  authMiddleware,
  broadcastAlumniProgram
);

module.exports = router;
