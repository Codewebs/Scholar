const express = require("express");
const router = express.Router();
const controller = require("../middleware/institutionalHeaderController");
const { verifyToken } = require("../middleware/auth");

router.get("/etablissement/:idEtablissement", verifyToken, controller.getAllHeaders);
router.post("/save", verifyToken, controller.saveHeader);
router.delete("/:id", verifyToken, controller.deleteHeader);
router.get("/salle", verifyToken, controller.getHeaderForSalle);

module.exports = router;
