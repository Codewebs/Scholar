const express = require("express");
const router = express.Router();
const controller = require("../middleware/studentController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.post(
    "/register-enroll", 
    verifyToken,
    checkPermission("REGISTER_STUDENT"),
    controller.registerAndEnrollStudent
);

router.get(
    "/room/:idAnneeScolaire/:idSalle",
    verifyToken,
    controller.getStudentsByRoom
);

router.get(
    "/all/:idAnneeScolaire",
    verifyToken,
    controller.getStudentsBySchoolYear
);

router.put(
    "/:idEleve",
    verifyToken,
    controller.updateStudent
);

router.delete(
    "/enrollment/:idEleve/:idAnneeScolaire",
    verifyToken,
    controller.deleteEnrollment
);

module.exports = router;
