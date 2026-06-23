const { Matiere, RepartitionMatiere, Classe, Salle, RepartitionEnseignant, GroupeMatiere, RepartitionCompetence, Competence, sequelize } = require("../models");
const { Op } = require("sequelize");

// 1. CRUD MATIERE (Bibliothèque Globale)
exports.getAllMatieres = async (req, res) => {
    try {
        const matieres = await Matiere.findAll({ where: { supprimer: false }, order: [['libelleFr', 'ASC']] });
        const formatted = matieres.map(m => ({
            ...m.toJSON(),
            idServeur: m.idMatiere,
            codeMatiere: m.abreviation
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 1b. CRUD GROUPE MATIERE (Spécifique Établissement)
exports.getAllGroups = async (req, res) => {
    try {
        const { idEtablissement } = req.query;
        let targetId = idEtablissement || req.headers['id-etablissement'] || req.user?.idEtablissement;

        console.log("--------------------------------------------------");
        console.log("📡 [BACKEND] getAllGroups - Recherche de groupes");
        console.log("   👉 idEtablissement cible:", targetId);

        const where = {
            supprimer: false,
            [Op.or]: [
                { idEtablissement: targetId || -1 }, // ID de l'établissement actuel
                { idEtablissement: null }           // Ou les groupes modèles/globaux
            ]
        };

        const groups = await GroupeMatiere.findAll({
            where,
            order: [['ordre', 'ASC']]
        });
        console.log("   ✅ Groupes trouvés:", groups.length);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.cloneGroupsFromTemplate = async (req, res) => {
    try {
        const idEtablissement = req.body.idEtablissement || req.user?.idEtablissement;
        if (!idEtablissement) return res.status(400).json({ error: "ID établissement manquant" });

        // Get global template groups (idEtablissement IS NULL)
        const templates = await GroupeMatiere.findAll({ where: { idEtablissement: null, supprimer: false } });

        const created = [];
        for (const t of templates) {
            const existing = await GroupeMatiere.findOne({ where: { idEtablissement, libelleFr: t.libelleFr, supprimer: false } });
            if (!existing) {
                const group = await GroupeMatiere.create({
                    libelleFr: t.libelleFr,
                    libelleEn: t.libelleEn,
                    libelleEs: t.libelleEs,
                    ordre: t.ordre,
                    idEtablissement
                });
                created.push(group);
            }
        }
        res.json({ message: `${created.length} groupes importés.`, groups: created });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const data = { ...req.body };
        const idEtablissement = data.idEtablissement || req.headers['id-etablissement'] || req.user?.idEtablissement;

        if (idEtablissement) {
            data.idEtablissement = idEtablissement;
        }

        const group = await GroupeMatiere.create(data);
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        await GroupeMatiere.update(req.body, { where: { idGroupeMatiere: id } });
        res.json({ message: "Groupe mis à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if group is used
        const used = await RepartitionMatiere.findOne({ where: { idGroupeMatiere: id, supprimer: false } });
        if (used) return res.status(400).json({ error: "Ce groupe contient des matières et ne peut être supprimé." });

        await GroupeMatiere.update({ supprimer: true }, { where: { idGroupeMatiere: id } });
        res.json({ message: "Groupe supprimé" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMatiere = async (req, res) => {
    try {
        const { libelleFr, libelleEn, libelleEs, abreviation, codeMatiere } = req.body;
        const finalAbreviation = abreviation || codeMatiere;
        const matiere = await Matiere.create({
            libelleFr,
            libelleEn,
            libelleEs,
            abreviation: finalAbreviation
        });
        res.status(201).json({
            ...matiere.toJSON(),
            idServeur: matiere.idMatiere,
            codeMatiere: matiere.abreviation
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMatiere = async (req, res) => {
    try {
        const { id } = req.params;
        const { libelleFr, libelleEn, libelleEs, abreviation, codeMatiere } = req.body;
        const data = { ...req.body };
        if (codeMatiere) data.abreviation = codeMatiere;

        await Matiere.update(data, { where: { idMatiere: id } });
        res.json({ message: "Matière mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMatiere = async (req, res) => {
    try {
        const { id } = req.params;
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

        const distinctRepartition = await RepartitionMatiere.count({
            distinct: true,
            col: 'idMatiere',
            where: { idAnneeScolaire, supprimer: false }
        });

        const avgCoefResult = await RepartitionMatiere.findOne({
            attributes: [[sequelize.fn('AVG', sequelize.col('coef')), 'avgCoef']],
            where: { idAnneeScolaire, supprimer: false },
            raw: true
        });
        const avgCoef = avgCoefResult ? parseFloat(avgCoefResult.avgCoef || 0) : 0;

        const totalAllocations = await RepartitionMatiere.count({ where: { idAnneeScolaire, supprimer: false } });
        const assignedAllocations = await RepartitionEnseignant.count({
            include: [{
                model: Salle,
                where: { idAnneeScolaire },
                required: true
            }],
            where: { supprimer: false }
        });

        res.json({
            totalMatieres,
            matieresReparties: distinctRepartition,
            avgCoef: avgCoef.toFixed(1),
            tauxAffectation: totalAllocations > 0 ? Math.round((assignedAllocations / totalAllocations) * 100) : 0,
            tauxRepartition: totalMatieres > 0 ? Math.round((distinctRepartition / totalMatieres) * 100) : 0
        });
    } catch (error) {
        console.error("🔥 Erreur getMatiereKPIs:", error);
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
                as: 'RepartitionMatieres',
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
    const { q, idClasse, idSalle } = req.query;
    const user = req.user;

    console.log("--------------------------------------------------");
    console.log("📡 [BACKEND] getRepartitionByAnnee");
    console.log("   👉 idAnneeScolaire:", idAnneeScolaire);
    console.log("   👉 idClasse:", idClasse);
    console.log("   👉 Query:", req.query);

    let where = { idAnneeScolaire, supprimer: false };
    if (idClasse) where.idClasse = idClasse;

    if (user && user.role === 'ENSEIGNANT') {
        const { InscriptionPersonnel } = require("../models");
        const ins = await InscriptionPersonnel.findOne({
            where: { idUtilisateur: user.userId, idAnneeScolaire, supprimer: false }
        });

        if (ins) {
            let affWhere = { idInscriptionPersonnel: ins.idInscriptionPersonnel, supprimer: false };
            if (idSalle) affWhere.idSalle = idSalle;

            const affs = await RepartitionEnseignant.findAll({ where: affWhere });
            const assignedMatiereIds = affs.map(a => a.idRepartitionMatiere).filter(Boolean);
            where.idRepartitionMatiere = { [Op.in]: assignedMatiereIds };
        } else {
            console.log("   ⚠️ Enseignant sans inscription active.");
            return res.json([]);
        }
    }

    const repartition = await RepartitionMatiere.findAll({
      where,
      include: [
        { model: Matiere, as: 'Matiere' },
        { model: Classe, as: 'Classe' }
      ],
      order: [['idClasse', 'ASC'], ['ordreMatiere', 'ASC']]
    });

    console.log(`   ✅ Répartition trouvée: ${repartition.length} items`);
    res.json(repartition);
  } catch (error) {
    console.error("❌ [BACKEND] Erreur repartition:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRepartition = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        await RepartitionCompetence.update({ supprimer: true }, { where: { idRepartitionMatiere: id }, transaction: t });
        await RepartitionMatiere.update({ supprimer: true }, { where: { idRepartitionMatiere: id }, transaction: t });
        await t.commit();
        res.json({ message: "Répartition et compétences supprimées" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.cloneClassProgram = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idClasseSource, targetClasseIds, idAnneeSource } = req.body;
        if (!idClasseSource || !targetClasseIds || targetClasseIds.length === 0) {
            return res.status(400).json({ error: "Source et cibles obligatoires." });
        }
        const sourceYearId = idAnneeSource || idAnneeScolaire;

        const sourceProgram = await RepartitionMatiere.findAll({
            where: { idAnneeScolaire: sourceYearId, idClasse: idClasseSource, supprimer: false }
        });

        if (sourceProgram.length === 0) {
            return res.status(404).json({ error: "La classe source n'a aucune matière configurée." });
        }

        for (const idTarget of targetClasseIds) {
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

exports.bulkAssignSubject = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idMatiere, assignments } = req.body;
        for (const a of assignments) {
            const targetMatiereId = a.idMatiere || idMatiere;
            if (!targetMatiereId) continue;

            // Check for duplicate in the same class
            const existing = await RepartitionMatiere.findOne({
                where: { idAnneeScolaire, idClasse: a.idClasse, idMatiere: targetMatiereId, supprimer: false }
            });

            if (existing) {
                await existing.update({
                    coef: a.coef,
                    noteSur: a.noteSur || 20,
                    ordreMatiere: a.ordreMatiere || 1,
                    idGroupeMatiere: a.idGroupeMatiere
                }, { transaction: t });
            } else {
                await RepartitionMatiere.create({
                    idAnneeScolaire,
                    idMatiere: targetMatiereId,
                    idClasse: a.idClasse,
                    coef: a.coef,
                    noteSur: a.noteSur || 20,
                    ordreMatiere: a.ordreMatiere || 1,
                    idGroupeMatiere: a.idGroupeMatiere
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

exports.transferSubject = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idRepartitionMatiere, targetClasseIds, includeCompetences } = req.body;
        const source = await RepartitionMatiere.findByPk(idRepartitionMatiere);
        if (!source) return res.status(404).json({ error: "Source non trouvée" });

        for (const idClasse of targetClasseIds) {
            // Check if matiere already exists in target class
            const existing = await RepartitionMatiere.findOne({
                where: { idAnneeScolaire, idClasse, idMatiere: source.idMatiere, supprimer: false }
            });

            let newItem;
            if (existing) {
                newItem = await existing.update({
                    coef: source.coef,
                    noteSur: source.noteSur,
                    idGroupeMatiere: source.idGroupeMatiere
                }, { transaction: t });
            } else {
                newItem = await RepartitionMatiere.create({
                    coef: source.coef,
                    noteSur: source.noteSur,
                    idAnneeScolaire,
                    idClasse,
                    idMatiere: source.idMatiere,
                    idGroupeMatiere: source.idGroupeMatiere
                }, { transaction: t });
            }

            if (includeCompetences) {
                const comps = await RepartitionCompetence.findAll({ where: { idRepartitionMatiere: source.idRepartitionMatiere, supprimer: false } });
                for (const c of comps) {
                    await RepartitionCompetence.findOrCreate({
                        where: { idRepartitionMatiere: newItem.idRepartitionMatiere, idCompetence: c.idCompetence, idSousPeriode: c.idSousPeriode, supprimer: false },
                        defaults: { idRepartitionMatiere: newItem.idRepartitionMatiere, idCompetence: c.idCompetence, idSousPeriode: c.idSousPeriode },
                        transaction: t
                    });
                }
            }
        }
        await t.commit();
        res.json({ message: "Transfert réussi" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.transferGroup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idClasseSource, idGroupeMatiere, targetClasseIds } = req.body;
        const sourceSubjects = await RepartitionMatiere.findAll({
            where: { idAnneeScolaire, idClasse: idClasseSource, idGroupeMatiere, supprimer: false }
        });

        for (const idClasse of targetClasseIds) {
            for (const sub of sourceSubjects) {
                const existing = await RepartitionMatiere.findOne({
                    where: { idAnneeScolaire, idClasse, idMatiere: sub.idMatiere, supprimer: false }
                });

                if (existing) {
                    await existing.update({
                        coef: sub.coef,
                        noteSur: sub.noteSur,
                        idGroupeMatiere: sub.idGroupeMatiere
                    }, { transaction: t });
                } else {
                    await RepartitionMatiere.create({
                        coef: sub.coef,
                        noteSur: sub.noteSur,
                        idAnneeScolaire,
                        idClasse,
                        idMatiere: sub.idMatiere,
                        idGroupeMatiere: sub.idGroupeMatiere
                    }, { transaction: t });
                }
            }
        }
        await t.commit();
        res.json({ message: "Transfert du groupe réussi" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getRepartitionCompetences = async (req, res) => {
    try {
        const { idRepartitionMatiere, idSousPeriode, idAnneeScolaire, idClasse } = req.query;
        console.log("--------------------------------------------------");
        console.log("🔍 [BACKEND] getRepartitionCompetences contextuelle");

        const where = { supprimer: false };
        const include = [{ model: Competence }];

        if (idRepartitionMatiere) {
            where.idRepartitionMatiere = idRepartitionMatiere;
        } else if (idAnneeScolaire) {
            // Si on demande pour toute l'année (filtres croisés)
            const repartitionWhere = { idAnneeScolaire, supprimer: false };
            if (idClasse) repartitionWhere.idClasse = idClasse;

            include.push({
                model: RepartitionMatiere,
                where: repartitionWhere,
                include: [{ model: Matiere }, { model: GroupeMatiere }]
            });
        }

        if (idSousPeriode) {
            where.idSousPeriode = idSousPeriode;
        }

        const results = await RepartitionCompetence.findAll({
            where,
            include
        });

        res.json(results);
    } catch (error) {
        console.error("❌ [BACKEND] Error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.saveRepartitionCompetence = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idRepartitionMatiere, idCompetence, idSousPeriodes } = req.body;

        // Mark all existing competence-period mappings for this specific competence in this subject as 'supprimer: true'
        await RepartitionCompetence.update({ supprimer: true }, {
            where: { idRepartitionMatiere, idCompetence },
            transaction: t
        });

        if (idSousPeriodes && idSousPeriodes.length > 0) {
            for (const idSousPeriode of idSousPeriodes) {
                // Find or create the entry
                const [entry, created] = await RepartitionCompetence.findOrCreate({
                    where: { idRepartitionMatiere, idCompetence, idSousPeriode },
                    defaults: { idRepartitionMatiere, idCompetence, idSousPeriode, supprimer: false },
                    transaction: t
                });

                // If it existed but was marked as deleted, reactivate it
                if (!created && entry.supprimer) {
                    await entry.update({ supprimer: false }, { transaction: t });
                }
            }
        }

        await t.commit();
        res.json({ message: "Compétences mises à jour par période" });
    } catch (error) {
        await t.rollback();
        console.error("🔥 Error saveRepartitionCompetence:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.createCompetence = async (req, res) => {
    try {
        const { libelle } = req.body;
        const idEtablissement = req.headers['id-etablissement'] || req.user?.idEtablissement;

        const competence = await Competence.create({
            libelle,
            idEtablissement
        });
        res.status(201).json(competence);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRepartitionCompetence = async (req, res) => {
    try {
        const { id } = req.params;
        await RepartitionCompetence.update({ supprimer: true }, { where: { id } });
        res.json({ message: "Compétence retirée de la répartition" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
