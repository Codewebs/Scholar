const express = require("express");
const router = express.Router();
const controller = require("../middleware/matiereController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Bibliothèque globale
router.get("/", verifyToken, controller.getAllMatieres);
router.post("/", verifyToken, checkPermission("MANAGE_GRADES"), controller.createMatiere);
router.post("/import-library", verifyToken, checkPermission("MANAGE_GRADES"), controller.importMatieresFromLibrary);
router.put("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.updateMatiere);
router.delete("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteMatiere);

// Groupes
router.get("/groups", verifyToken, controller.getAllGroups);
router.post("/groups", verifyToken, checkPermission("MANAGE_GRADES"), controller.createGroup);
router.post("/groups/clone-templates", verifyToken, checkPermission("MANAGE_GRADES"), controller.cloneGroupsFromTemplate);
router.put("/groups/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.updateGroup);
router.delete("/groups/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteGroup);

// Stats & KPI
router.get("/stats/kpi/:idAnneeScolaire", verifyToken, controller.getMatiereKPIs);
router.get("/stats/repartition-classes/:idAnneeScolaire", verifyToken, controller.getStatsRepartitionByClass);

// --- Compétences (APC) ---
// IMPORTANT: Placer les routes spécifiques AVANT les routes avec paramètres (:id)
router.get("/repartition/competences", verifyToken, controller.getRepartitionCompetences);
router.post("/repartition/competences", verifyToken, checkPermission("MANAGE_GRADES"), controller.saveRepartitionCompetence);
router.delete("/repartition/competences/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteRepartitionCompetence);

// --- Répartition (Programme) ---
router.get("/repartition/:idAnneeScolaire", verifyToken, controller.getRepartitionByAnnee);
router.post("/repartition/clone", verifyToken, checkPermission("MANAGE_GRADES"), controller.cloneClassProgram);
router.post("/repartition/bulk-assign", verifyToken, checkPermission("MANAGE_GRADES"), controller.bulkAssignSubject);
router.post("/repartition/transfer-subject", verifyToken, checkPermission("MANAGE_GRADES"), controller.transferSubject);
router.post("/repartition/transfer-group", verifyToken, checkPermission("MANAGE_GRADES"), controller.transferGroup);

module.exports = router;
