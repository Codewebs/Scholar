const express = require("express");
const router = express.Router();
const controller = require("../middleware/studentController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Points d'accès pour les élèves
router.post("/register-enroll", verifyToken, checkPermission("REGISTER_STUDENT"), controller.registerAndEnrollStudent);
router.get("/room/:idAnneeScolaire/:idSalle", verifyToken, controller.getStudentsByRoom);
router.get("/search/:idAnneeScolaire", verifyToken, controller.searchStudents);
router.get("/all/:idAnneeScolaire", verifyToken, controller.getStudentsBySchoolYear);
router.get("/global/search", verifyToken, controller.globalSearchStudents);
router.get("/:idEleve", verifyToken, controller.getStudentById);

router.put("/:idEleve", verifyToken, controller.updateStudent);
router.delete("/enrollment/:idEleve/:idAnneeScolaire", verifyToken, controller.deleteEnrollment);

module.exports = router;
