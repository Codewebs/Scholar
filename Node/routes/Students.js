const express = require("express");
const router = express.Router();
const controller = require("../middleware/studentController");

// Points d'accès pour les élèves
router.post("/register-enroll", controller.registerAndEnrollStudent);
router.get("/room/:idAnneeScolaire/:idSalle", controller.getStudentsByRoom);
router.get("/search/:idAnneeScolaire", controller.searchStudents);
router.get("/all/:idAnneeScolaire", controller.getStudentsBySchoolYear);

router.put("/:idEleve", controller.updateStudent);
router.delete("/enrollment/:idEleve/:idAnneeScolaire", controller.deleteEnrollment);

module.exports = router;
