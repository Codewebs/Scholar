const express = require("express");
const router = express.Router();
const controller = require("../middleware/matiereController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Bibliothèque globale
router.get("/", verifyToken, controller.getAllMatieres);
router.post("/", verifyToken, checkPermission("MANAGE_GRADES"), controller.createMatiere);
router.put("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.updateMatiere);
router.delete("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteMatiere);

// Stats & KPI
router.get("/stats/kpi/:idAnneeScolaire", verifyToken, controller.getMatiereKPIs);
router.get("/stats/repartition-classes/:idAnneeScolaire", verifyToken, controller.getStatsRepartitionByClass);

// Répartition (Programme)
router.get("/repartition/:idAnneeScolaire", verifyToken, controller.getRepartitionByAnnee);
router.post("/repartition/clone", verifyToken, checkPermission("MANAGE_GRADES"), controller.cloneClassProgram);
router.post("/repartition/bulk-assign", verifyToken, checkPermission("MANAGE_GRADES"), controller.bulkAssignSubject);

module.exports = router;
