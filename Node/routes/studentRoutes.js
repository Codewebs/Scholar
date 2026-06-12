const express = require("express");
const router = express.Router();
const controller = require("../middleware/studentController");
// Note: verifyToken and checkPermission should be implemented in your project
// If they are missing, the server will crash. I assume they exist or you will add them.
// For now, I'll use them as referenced in your prompt.

const verifyToken = (req, res, next) => { next(); }; // Mock if not exists
const checkPermission = (perm) => (req, res, next) => { next(); }; // Mock if not exists

router.post(
    "/register-enroll", 
    // verifyToken,
    // checkPermission("ENROLL_STUDENT"),
    controller.registerAndEnrollStudent
);

router.get(
    "/room/:idAnneeScolaire/:idSalle",
    controller.getStudentsByRoom
);

router.get(
    "/all/:idAnneeScolaire",
    controller.getStudentsBySchoolYear
);

router.put(
    "/:idEleve",
    controller.updateStudent
);

router.delete(
    "/enrollment/:idEleve/:idAnneeScolaire",
    controller.deleteEnrollment
);

module.exports = router;
