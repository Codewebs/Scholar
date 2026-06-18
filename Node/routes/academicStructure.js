const express = require("express");
const router = express.Router();
const controller = require("../middleware/academicStructureController");
const { Country, Enseignement } = require("../models");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

router.get("/predefined-profiles", verifyToken, async (req, res) => {
    try {
        const countries = await Country.findAll({
            include: [{
                model: Enseignement,
                attributes: ['idEnseignement', 'enseignementFr', 'enseignementEn', 'enseignementEs']
            }]
        });

        const formatted = countries.map(country => ({
            nomPays: country.nomPays,
            profils: country.Enseignements.map(e => ({
                idEnseignement: e.idEnseignement,
                nomProfil: e.enseignementFr,
                enseignementLibelles: {
                    fr: e.enseignementFr,
                    en: e.enseignementEn,
                    es: e.enseignementEs
                }
            }))
        }));

        res.json(formatted);
    } catch (error) {
        console.error("❌ [AcademicStructure] Erreur predefined-profiles:", error);
        res.status(500).json({ error: error.message });
    }
});

router.post("/", verifyToken, checkPermission("MANAGE_CYCLES"), controller.createStructure);
router.get("/annee/:idAnneeScolaire", verifyToken, controller.getStructureByAnnee);
router.get("/cycles/:idAnneeScolaire", verifyToken, controller.getAllCyclesByAnnee);
router.post("/classes", verifyToken, checkPermission("MANAGE_CLASSES"), controller.createClasse);
router.put("/classes/:id", verifyToken, checkPermission("MANAGE_CLASSES"), controller.updateClasse);
router.delete("/classes/:id", verifyToken, checkPermission("MANAGE_CLASSES"), controller.deleteClasse);
router.delete("/:id", verifyToken, checkPermission("MANAGE_CYCLES"), controller.deleteEnseignement);

module.exports = router;
