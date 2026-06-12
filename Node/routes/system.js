const express = require("express");
const router = express.Router();
const controller = require("../middleware/systemController");
const { verifyToken } = require("../middleware/auth");

router.get("/stats", verifyToken, controller.getSystemStats);
router.get("/setup-progress", verifyToken, controller.getSetupProgress);

module.exports = router;
