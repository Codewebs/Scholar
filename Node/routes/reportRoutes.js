const express = require("express");
const router = express.Router();
const controller = require("../middleware/reportController");
const { verifyToken } = require("../middleware/auth");

router.get("/alphabetical", verifyToken, controller.getAlphabeticalList);
router.get("/attendance", verifyToken, controller.getAttendanceSheet);
router.get("/gender-split", verifyToken, controller.getGenderSplit);
router.get("/trombinoscope", verifyToken, controller.getTrombinoscope);

module.exports = router;
