const express = require("express");
const router = express.Router();
const controller = require("../middleware/reportController");
const { verifyToken } = require("../middleware/auth");

router.get("/alphabetical", verifyToken, controller.getAlphabeticalList);
router.get("/attendance", verifyToken, controller.getAttendanceSheet);
router.get("/gender-split", verifyToken, controller.getGenderSplit);
router.get("/trombinoscope", verifyToken, controller.getTrombinoscope);
router.get("/insolvent-fees", verifyToken, controller.getInsolventFees);
router.get("/insolvent-perischool", verifyToken, controller.getInsolventPerischool);
router.get("/global-finance", verifyToken, controller.getGlobalFinancialStatus);
router.get("/daily-payments", verifyToken, controller.getDailyPayments);
router.get("/scholarship", verifyToken, controller.getScholarshipList);
router.get("/fees-bilan", verifyToken, controller.getFeesBilan);

module.exports = router;
