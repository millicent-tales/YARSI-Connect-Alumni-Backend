const express = require("express");
const {
  latestNews,
  latestEvent,
  latestAlumniProgram,
} = require("../controllers/homepageController");

const router = express.Router();

router.get("/latest-news", latestNews);

router.get("/latest-event", latestEvent);

router.get("/latest-alumni-program", latestAlumniProgram);

module.exports = router;
