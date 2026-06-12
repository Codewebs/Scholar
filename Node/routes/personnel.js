const express = require("express");
const router = express.Router();
const controller = require("../middleware/personnelController");
const { verifyToken } = require("../middleware/auth");

router.post("/demande", verifyToken, controller.envoyerDemande);
router.get("/demandes/etablissement/:idEtablissement", verifyToken, controller.getDemandesEnAttente);
router.post("/valider-demande", verifyToken, controller.validerDemande);
router.post("/update-permissions", verifyToken, controller.updatePermissions);
router.post("/reconduire", verifyToken, controller.reconduirePersonnel);
router.post("/bloquer", verifyToken, controller.setBloqueStatut);
router.post("/affecter", verifyToken, controller.affecterSalle);
router.get("/actif/:idEtablissement/:idAnneeScolaire", verifyToken, controller.getPersonnelActif);
router.get("/user-associations/:userId", verifyToken, controller.getUserAssociations);
router.get("/my-demands/:userId", verifyToken, controller.getMyDemands);

module.exports = router;
