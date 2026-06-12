const express = require("express");
const router = express.Router();
const controller = require("../middleware/academicStructureController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.post("/", verifyToken, checkPermission("MANAGE_CYCLES"), controller.createStructure);
router.get("/annee/:idAnneeScolaire", verifyToken, controller.getStructureByAnnee);
router.get("/cycles/:idAnneeScolaire", verifyToken, controller.getAllCyclesByAnnee);
router.post("/classes", verifyToken, checkPermission("MANAGE_CLASSES"), controller.createClasse);
router.put("/classes/:id", verifyToken, checkPermission("MANAGE_CLASSES"), controller.updateClasse);
router.delete("/:id", verifyToken, checkPermission("MANAGE_CYCLES"), controller.deleteEnseignement);

module.exports = router;
