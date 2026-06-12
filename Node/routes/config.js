const express = require("express");
const router = express.Router();
const { Country, Enseignement, Cycle, Classe, Periode, SousPeriode, GroupeMatiere } = require("../models");

// Bibliothèque globale
router.get("/education-profiles", async (req, res) => {
    try {
        const countries = await Country.findAll({
            include: [{
                model: Enseignement,
                include: [{
                    model: Cycle,
                    as: 'cycles',
                    include: [{
                        model: Classe,
                        as: 'classes'
                    }]
                }]
            }]
        });

        // Formater pour correspondre à l'attente du front si nécessaire
        // Actuellement le front attend PredefinedCountry { nomPays, profils: [PredefinedProfil { nomProfil, ... }] }
        const formatted = countries.map(c => ({
            nomPays: c.nomPays,
            idCountry: c.idCountry,
            profils: c.Enseignements.map(e => ({
                idEnseignement: e.idEnseignement,
                nomProfil: e.enseignementFr,
                enseignementLibelles: { fr: e.enseignementFr, en: e.enseignementEn, es: e.enseignementEs },
                cycles: e.cycles.map(cy => ({
                    idCycle: cy.idCycle,
                    libelles: { fr: cy.libelleCycle, en: cy.libelleCycleEn, es: cy.libelleCycleEs },
                    classes: cy.classes.map(cl => ({
                        idClasse: cl.idClasse,
                        libelles: { fr: cl.libelleClasseFr, en: cl.libelleClasseEn, es: cl.libelleClasseEs },
                        abreviation: cl.abreviation
                    }))
                }))
            }))
        }));

        res.json({ countries: formatted });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

router.get("/countries", async (req, res) => {
    try {
        const countries = await Country.findAll();
        res.json(countries);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/teachings/:idCountry", async (req, res) => {
    try {
        const teachings = await Enseignement.findAll({ where: { idCountry: req.params.idCountry } });
        res.json(teachings);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/cycles/:idEnseignement", async (req, res) => {
    try {
        const cycles = await Cycle.findAll({ where: { idEnseignement: req.params.idEnseignement } });
        res.json(cycles);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/classes/:idCycle", async (req, res) => {
    try {
        const classes = await Classe.findAll({ where: { idCycle: req.params.idCycle } });
        res.json(classes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Pedagogie templates
router.get("/periodes", async (req, res) => {
    try { res.json(await Periode.findAll({ order: [['ordrePeriode', 'ASC']] })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/sous-periodes", async (req, res) => {
    try { res.json(await SousPeriode.findAll({ order: [['ordreSousPeriode', 'ASC']] })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/groupes-matiere", async (req, res) => {
    try { res.json(await GroupeMatiere.findAll({ order: [['ordre', 'ASC']] })); }
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
