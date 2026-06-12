const express = require("express");
const router = express.Router();
const controller = require("../middleware/salleController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.post("/", controller.createSalle);
router.get("/", controller.getAllSalles);
router.get("/annee/:idAnneeScolaire", verifyToken, controller.getSallesByAnnee);
router.get("/classes/stats/:idAnneeScolaire",verifyToken, controller.getClassesWithRoomStats);
router.put("/:id", controller.updateSalle);
router.delete("/:id", controller.deleteSalle);

module.exports = router;
