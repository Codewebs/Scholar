const express = require("express");
const router = express.Router();
const controller = require("../middleware/periodeController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.get("/annee/:idAnneeScolaire", verifyToken, controller.getPeriodesByAnnee);

router.post("/", verifyToken, checkPermission("MANAGE_PERIODS"), controller.createPeriode);
router.put("/:id", verifyToken, checkPermission("MANAGE_PERIODS"), controller.updatePeriode);
router.delete("/:id", verifyToken, checkPermission("MANAGE_PERIODS"), controller.deletePeriode);

router.post("/sous-periodes", verifyToken, checkPermission("MANAGE_SUB_PERIODS"), controller.createSousPeriode);
router.put("/sous-periodes/:id", verifyToken, checkPermission("MANAGE_SUB_PERIODS"), controller.updateSousPeriode);
router.delete("/sous-periodes/:id", verifyToken, checkPermission("MANAGE_SUB_PERIODS"), controller.deleteSousPeriode);

router.post("/clone", verifyToken, checkPermission("MANAGE_PERIODS"), controller.clonePeriodes);

module.exports = router;
