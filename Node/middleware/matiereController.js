const { Matiere, RepartitionMatiere, Classe, sequelize } = require("../models");
const { Op } = require("sequelize");

// 1. CRUD MATIERE (Bibliothèque Globale)
exports.getAllMatieres = async (req, res) => {
    try {
        const matieres = await Matiere.findAll({ where: { supprimer: false }, order: [['libelleFr', 'ASC']] });
        res.json(matieres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMatiere = async (req, res) => {
    try {
        const { libelleFr, libelleEn, libelleEs, abreviation } = req.body;
        const matiere = await Matiere.create({ libelleFr, libelleEn, libelleEs, abreviation });
        res.status(201).json(matiere);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMatiere = async (req, res) => {
    try {
        const { id } = req.params;
        await Matiere.update(req.body, { where: { idMatiere: id } });
        res.json({ message: "Matière mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMatiere = async (req, res) => {
    try {
        const { id } = req.params;
        // Vérifier si utilisée dans une répartition
        const used = await RepartitionMatiere.findOne({ where: { idMatiere: id, supprimer: false } });
        if (used) return res.status(400).json({ error: "Impossible de supprimer: cette matière est utilisée dans des programmes." });

        await Matiere.update({ supprimer: true }, { where: { idMatiere: id } });
        res.json({ message: "Matière supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. STATISTIQUES & KPI
exports.getMatiereKPIs = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;

        const totalMatieres = await Matiere.count({ where: { supprimer: false } });

        // Matières qui ont au moins une répartition cette année
        const distinctRepartition = await RepartitionMatiere.count({
            distinct: true,
            col: 'idMatiere',
            where: { idAnneeScolaire, supprimer: false }
        });

        const avgCoef = await RepartitionMatiere.avg('coef', {
            where: { idAnneeScolaire, supprimer: false }
        }) || 0;

        // Taux d'affectation enseignant (si on a AffectationPersonnelSalle)
        const { AffectationPersonnelSalle } = require("../models");
        const totalAllocations = await RepartitionMatiere.count({ where: { idAnneeScolaire, supprimer: false } });
        const assignedAllocations = await AffectationPersonnelSalle.count({
            include: [{
                model: require("../models").Salle,
                where: { idAnneeScolaire }
            }]
        });

        res.json({
            totalMatieres,
            matieresReparties: distinctRepartition,
            avgCoef: parseFloat(avgCoef).toFixed(1),
            tauxAffectation: totalAllocations > 0 ? Math.round((assignedAllocations / totalAllocations) * 100) : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. REPARTITION PAR CLASSE
exports.getStatsRepartitionByClass = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const classes = await Classe.findAll({
            where: { supprimer: false },
            include: [{
                model: RepartitionMatiere,
                as: 'RepartitionMatieres', // check alias in index.js
                where: { idAnneeScolaire, supprimer: false },
                required: false
            }]
        });

        const result = classes.map(c => ({
            idClasse: c.idClasse,
            libelle: c.libelleClasseFr,
            count: c.RepartitionMatieres ? c.RepartitionMatieres.length : 0
        })).filter(c => c.count > 0);

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. RÉPARTITION DES MATIÈRES (CRUD)
exports.getRepartitionByAnnee = async (req, res) => {
  try {
    const { idAnneeScolaire } = req.params;
    const { q, idClasse } = req.query;

    let where = { idAnneeScolaire, supprimer: false };
    if (idClasse) where.idClasse = idClasse;

    const repartition = await RepartitionMatiere.findAll({
      where,
      include: [
        { model: Matiere, as: 'Matiere' },
        { model: Classe, as: 'Classe' }
      ],
      order: [['idClasse', 'ASC'], ['ordreMatiere', 'ASC']]
    });

    res.json(repartition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. CLONAGE DE PROGRAMME (Classe à Classe ou Année à Année)
exports.cloneClassProgram = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idClasseSource, targetClasseIds, idAnneeSource } = req.body;

        if (!idClasseSource || !targetClasseIds || targetClasseIds.length === 0) {
            return res.status(400).json({ error: "Source et cibles obligatoires." });
        }

        const sourceYearId = idAnneeSource || idAnneeScolaire;

        // 1. Récupérer le programme source
        const sourceProgram = await RepartitionMatiere.findAll({
            where: { idAnneeScolaire: sourceYearId, idClasse: idClasseSource, supprimer: false }
        });

        if (sourceProgram.length === 0) {
            return res.status(404).json({ error: "La classe source n'a aucune matière configurée." });
        }

        for (const idTarget of targetClasseIds) {
            // Nettoyer l'existant pour éviter les doublons
            await RepartitionMatiere.update({ supprimer: true }, {
                where: { idAnneeScolaire, idClasse: idTarget },
                transaction: t
            });

            for (const item of sourceProgram) {
                const newItem = await RepartitionMatiere.create({
                    coef: item.coef,
                    noteSur: item.noteSur,
                    ordreGroupe: item.ordreGroupe,
                    ordreMatiere: item.ordreMatiere,
                    idAnneeScolaire,
                    idClasse: idTarget,
                    idGroupeMatiere: item.idGroupeMatiere,
                    idMatiere: item.idMatiere
                }, { transaction: t });

                // Cloner les compétences associées
                const { RepartitionCompetence } = require("../models");
                const comps = await RepartitionCompetence.findAll({ where: { idRepartitionMatiere: item.idRepartitionMatiere, supprimer: false } });
                for (const c of comps) {
                    await RepartitionCompetence.create({
                        idRepartitionMatiere: newItem.idRepartitionMatiere,
                        idCompetence: c.idCompetence,
                        idSousPeriode: c.idSousPeriode
                    }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: "Programme dupliqué avec succès." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 6. AFFECTATION EN MASSE D'UNE MATIÈRE (Matière à Classes)
exports.bulkAssignSubject = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idMatiere, assignments } = req.body;
        // assignments: [{ idClasse: 1, coef: 4, noteSur: 20, ordreMatiere: 1 }, ...]

        for (const a of assignments) {
            const existing = await RepartitionMatiere.findOne({
                where: { idAnneeScolaire, idClasse: a.idClasse, idMatiere, supprimer: false }
            });

            if (existing) {
                await existing.update({
                    coef: a.coef,
                    noteSur: a.noteSur || 20,
                    ordreMatiere: a.ordreMatiere || 1
                }, { transaction: t });
            } else {
                await RepartitionMatiere.create({
                    idAnneeScolaire,
                    idMatiere,
                    idClasse: a.idClasse,
                    coef: a.coef,
                    noteSur: a.noteSur || 20,
                    ordreMatiere: a.ordreMatiere || 1
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Affectation en masse terminée." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
