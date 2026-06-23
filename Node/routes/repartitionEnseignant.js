const express = require("express");
const router = express.Router();
const controller = require("../middleware/repartitionEnseignantController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.get("/pool", verifyToken, controller.getTeachersPool);
router.get("/room", verifyToken, controller.getRoomAssignments);
router.post("/assign", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.assignTeacher);
router.delete("/:idRepartitionEnseignant", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.removeAssignment);
router.get("/print", verifyToken, controller.getPrintData);

module.exports = router;
