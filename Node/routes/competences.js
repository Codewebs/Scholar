const express = require("express");
const router = express.Router();
const controller = require("../middleware/competenceController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.get("/", verifyToken, controller.getAllCompetences);
router.post("/", verifyToken, checkPermission("MANAGE_GRADES"), controller.createCompetence);
router.put("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.updateCompetence);
router.delete("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteCompetence);

module.exports = router;
