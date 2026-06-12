const {
    Salle,
    Classe,
    Cycle,
    Enseignement,
    EtablissementStructure,
    Inscription,
    Eleve,
    InscriptionPersonnel,
    TarifFraisExigible,
    AffectationPersonnelSalle,
    sequelize
} = require("../models");

exports.createSalle = async (req, res) => {
    try {
        const { nomSalle, capacite, idClasse, idAnneeScolaire, photo } = req.body;

        if (!nomSalle || !idClasse || !idAnneeScolaire) {
            console.warn("⚠️ [SalleController] Tentative de création avec données manquantes:", { nomSalle, idClasse, idAnneeScolaire });
            return res.status(400).json({ error: "Nom de salle, classe et année scolaire requis." });
        }

        // 🛡️ Unicité : Une classe ne peut pas avoir deux fois le même nom de salle la même année
        const existing = await Salle.findOne({
            where: { nomSalle, idClasse, idAnneeScolaire, supprimer: false }
        });
        if (existing) {
            return res.status(409).json({ error: `La salle "${nomSalle}" existe déjà pour cette classe.` });
        }

        const salle = await Salle.create({
            nomSalle,
            capacite,
            idClasse,
            idAnneeScolaire,
            photo
        });

        console.log(`✅ [SalleController] Salle créée: ${nomSalle} (ID: ${salle.idSalle}) pour classe ID: ${idClasse}`);
        res.status(201).json(salle);
    } catch (error) {
        console.error("❌ [SalleController] Erreur création salle:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllSalles = async (req, res) => {
    try {
        const salles = await Salle.findAll({ where: { supprimer: false } });
        res.json(salles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSallesByAnnee = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;

        // 1. Filtrer uniquement les classes qui ont des tarifs définis pour cette année
        const classesWithFees = await TarifFraisExigible.findAll({
            where: { idAnneeScolaire },
            attributes: ['idClasse'],
            group: ['idClasse']
        });
        const validClasseIds = classesWithFees.map(c => c.idClasse);

        const salles = await Salle.findAll({
            where: {
                idAnneeScolaire,
                supprimer: false,
                idClasse: validClasseIds // Filtre d'exclusion
            },
            include: [{
                model: Classe,
                as: 'Classe',
                attributes: ['libelleClasseFr', 'libelleClasseEn', 'libelleClasseEs']
            }]
        });

        // Calculer l'occupation actuelle
        const result = await Promise.all(salles.map(async (s) => {
            const count = await Inscription.count({ where: { idSalle: s.idSalle, idAnneeScolaire, supprimer: false } });
            const sJson = s.toJSON();
            return {
                ...sJson,
                elevesInscrits: count,
                // On aplatit pour Android si besoin ou on laisse l'objet Classe
                classeLabel: sJson.Classe ? sJson.Classe.libelleClasseFr : "N/A"
            };
        }));

        res.json(result);
    } catch (error) {
        console.error("❌ [SalleController] Erreur getSallesByAnnee:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getClassesWithRoomStats = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const user = req.user;
        console.log(`🔍 [SalleController] getClassesWithRoomStats pour Année ID: ${idAnneeScolaire}, User: ${user?.idUtilisateur || user?.userId} (${user?.role})`);

        // 1. Profils choisis
        const configurations = await EtablissementStructure.findAll({
            where: { idAnneeScolaire }
        });
        const idsEnseignement = configurations.map(c => c.idEnseignement);
        console.log(`📑 [SalleController] IDs Enseignement configurés:`, idsEnseignement);

        if (idsEnseignement.length === 0) {
            console.warn(`⚠️ [SalleController] Aucun profil d'enseignement trouvé pour l'année ${idAnneeScolaire}`);
            return res.json([]);
        }

        let classeFilter = { supprimer: false };

        // 2. Filtrage Enseignant : Uniquement ses classes
        if (user && user.role === 'ENSEIGNANT') {
            console.log(`👨‍🏫 [SalleController] Filtrage pour enseignant...`);
            const ins = await InscriptionPersonnel.findOne({
                where: { idUtilisateur: user.idUtilisateur || user.userId, idAnneeScolaire, supprimer: false }
            });
            if (ins) {
                const affs = await AffectationPersonnelSalle.findAll({
                    where: { idInscriptionPersonnel: ins.idInscriptionPersonnel }
                });
                const sIds = affs.map(a => a.idSalle);
                const assignedSalles = await Salle.findAll({ where: { idSalle: sIds } });
                classeFilter.idClasse = [...new Set(assignedSalles.map(s => s.idClasse))];
                console.log(`✅ [SalleController] Classes autorisées pour l'enseignant:`, classeFilter.idClasse);
            } else {
                console.warn(`⚠️ [SalleController] Inscription personnel non trouvée pour l'utilisateur ${user.idUtilisateur || user.userId}`);
                return res.json([]);
            }
        }

        const classes = await Classe.findAll({
            include: [{
                model: Cycle,
                as: 'Cycle',
                required: true,
                include: [{
                    model: Enseignement,
                    as: 'Enseignement',
                    required: true,
                    where: { idEnseignement: idsEnseignement, supprimer: false }
                }]
            }, {
                model: Salle,
                as: 'salles',
                where: { idAnneeScolaire, supprimer: false },
                required: false,
                include: [{
                    model: Inscription,
                    where: { supprimer: false },
                    required: false,
                    include: [{ model: Eleve }]
                }]
            }],
            where: classeFilter
        });

        console.log(`📊 [SalleController] ${classes.length} classes trouvées en base.`);

        // 🚀 CORRECTION ICI : Ajout de Promise.all + async (c)
        const result = await Promise.all(classes.map(async (c) => {
            let totalEnrolled = 0;
            let totalCapacity = 0;
            let boys = 0;
            let girls = 0;

            if (c.salles) {
                c.salles.forEach(s => {
                    totalCapacity += (s.capacite || 0);
                    if (s.Inscriptions) {
                        totalEnrolled += s.Inscriptions.length;
                        s.Inscriptions.forEach(i => {
                            if (i.Eleve) {
                                if (i.Eleve.sexe === 'M') boys++;
                                else if (i.Eleve.sexe === 'F') girls++;
                            }
                        });
                    }
                });
            }

            // La requête de comptage attendra correctement maintenant
            const countFees = await TarifFraisExigible.count({
                where: { idClasse: c.idClasse, idAnneeScolaire }
            });

            return {
                idClasse: c.idClasse,
                idAnneeScolaire: parseInt(idAnneeScolaire),
                libelleClasseFr: c.libelleClasseFr,
                libelleClasseEn: c.libelleClasseEn,
                libelleClasseEs: c.libelleClasseEs,
                abreviation: c.abreviation,
                cycleLabel: c.Cycle ? c.Cycle.libelleCycle : "N/A",
                roomCount: c.salles ? c.salles.length : 0,
                hasFees: countFees > 0,
                totalEnrolled,
                totalCapacity,
                boys,
                girls
            };
        }));

        res.json(result);
    } catch (error) {
        console.error("❌ [SalleController] Erreur getClassesWithRoomStats:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateSalle = async (req, res) => {
    try {
        const { id } = req.params;
        await Salle.update(req.body, { where: { idSalle: id } });
        res.json({ message: "Salle mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSalle = async (req, res) => {
    try {
        const { id } = req.params;
        await Salle.update({ supprimer: true }, { where: { idSalle: id } });
        res.json({ message: "Salle supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
