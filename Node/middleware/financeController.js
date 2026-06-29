const {
    FraisExigible,
    TarifFraisExigible,
    FraisActivitePeriscolaire,
    TarifFraisPeriscolaire,
    PaiementFraisGlobal,
    PaiementFraisExigible,
    PaiementFraisPeriscolaire,
    Eleve,
    Classe,
    AnneeScolaire,
    Inscription,
    Salle,
    Note,
    SuiviAbsence,
    EtablissementStructure,
    Etablissement,
    Utilisateur,
    PaiementTransport,
    Quartier,
    TarifTransport,
    EleveTransport,
    EcheancierTransport,
    sequelize
} = require("../models");
const { Op, QueryTypes } = require("sequelize");

// 1. BIBLIOTHEQUE DES FRAIS
exports.getFraisExigiblesLibrary = async (req, res) => {
    try {
        const library = await FraisExigible.findAll({ where: { supprimer: false } });
        res.json(library);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.createFraisExigible = async (req, res) => {
    try {
        const { fraisFr, fraisEn, description } = req.body;
        const frais = await FraisExigible.create({ fraisFr, fraisEn, description });
        res.status(201).json(frais);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateFraisExigible = async (req, res) => {
    try {
        const { id } = req.params;
        await FraisExigible.update(req.body, { where: { idFraisExigible: id } });
        res.json({ message: "Frais mis à jour" });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFraisExigible = async (req, res) => {
    try {
        const { id } = req.params;
        const countTarifs = await TarifFraisExigible.count({ where: { idFraisExigible: id, supprimer: false } });
        if (countTarifs > 0) {
            return res.status(400).json({ error: "Ce type de frais est utilisé dans des configurations de classe et ne peut pas être supprimé." });
        }
        await FraisExigible.update({ supprimer: true }, { where: { idFraisExigible: id } });
        res.json({ message: "Frais supprimé" });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. TARIFS PAR CLASSE
exports.getTarifsByClasse = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.params;
        const tarifs = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: "Frais" }],
            order: [['ordrePaiement', 'ASC']]
        });
        res.json(tarifs);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

// 23. COCKPIT AGGREGATES (WEB)
exports.getCockpitAggregates = async (req, res) => {
    try {
        const idAnneeScolaire = parseInt(req.params.idAnneeScolaire);
        const { idSalle, idClasse, idCycle, period } = req.query;
        let { startDate, endDate } = req.query;

        console.log(`[Cockpit] Request for year ${idAnneeScolaire}, period ${period}, salle ${idSalle}, classe ${idClasse}, cycle ${idCycle}`);

        // Détermination de la plage si non fournie
        if (!startDate || !endDate) {
            let start = new Date();
            if (period === 'WEEKLY') start.setDate(start.getDate() - 7);
            else if (period === 'MONTHLY') start.setMonth(start.getMonth() - 1);
            else if (period === 'ANNUAL' || period === 'ALL') {
                const year = await AnneeScolaire.findByPk(idAnneeScolaire);
                start = year ? new Date(year.dateDebut) : new Date(new Date().getFullYear(), 0, 1);
            } else start.setHours(0,0,0,0);

            startDate = start.toISOString();
            endDate = new Date().toISOString();
        }

        const wherePaiement = {
            idAnneeScolaire,
            annule: 0,
            createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] }
        };

        const transactions = await PaiementFraisGlobal.findAll({
            where: wherePaiement,
            include: [{
                model: Eleve,
                include: [{
                    model: Inscription,
                    where: { idAnneeScolaire, supprimer: false },
                    include: [{
                        model: Salle,
                        include: [{
                            model: Classe,
                            as: 'Classe',
                            include: [{ model: Cycle, as: 'Cycle' }]
                        }]
                    }]
                }]
            }],
            order: [['createdAt', 'ASC']]
        });

        let filteredTransactions = transactions;
        if (idSalle || idClasse || idCycle) {
            filteredTransactions = transactions.filter(t => {
                const inscriptions = t.Eleve?.Inscriptions || [];
                return inscriptions.some(ins => {
                    if (idSalle && ins.idSalle != idSalle) return false;
                    if (idClasse && ins.Salle?.idClasse != idClasse) return false;
                    if (idCycle && ins.Salle?.Classe?.idCycle != idCycle) return false;
                    return true;
                });
            });
        }

        const totalEncaisse = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.montantTotal || 0), 0);

        const evolutionMap = {};
        filteredTransactions.forEach(t => {
            if (!t.createdAt) return;
            const dateObj = new Date(t.createdAt);
            let label = (period === 'DAILY') ? `${dateObj.getHours()}h` : dateObj.toISOString().split('T')[0];
            evolutionMap[label] = (evolutionMap[label] || 0) + parseFloat(t.montantTotal || 0);
        });
        const evolution = Object.keys(evolutionMap).sort().map(label => ({ label, montant: evolutionMap[label] }));

        const studentWhere = { idAnneeScolaire, supprimer: false };
        if (idSalle) studentWhere.idSalle = parseInt(idSalle);
        const studentCount = await Inscription.count({
            where: {
                idAnneeScolaire,
                supprimer: false,
                ...(idSalle ? { idSalle: parseInt(idSalle) } : {})
            },
            include: (idClasse || idCycle) ? [{
                model: Salle,
                required: true,
                where: idClasse ? { idClasse: parseInt(idClasse) } : {},
                include: idCycle ? [{
                    model: Classe,
                    as: 'Classe',
                    required: true,
                    where: { idCycle: parseInt(idCycle) }
                }] : []
            }] : []
        });

        // Taux de Recouvrement (Dates Limites)
        const now = new Date();
        const tarifsUrgent = await TarifFraisExigible.findAll({
            where: {
                idAnneeScolaire,
                supprimer: false,
                dateLimite: { [Op.lte]: now },
                ...(idClasse ? { idClasse: parseInt(idClasse) } : {})
            }
        });

        let totalAttenduUrgent = 0;
        let totalRecouvreUrgent = 0;

        for (const tarif of tarifsUrgent) {
            const count = await Inscription.count({
                where: {
                    idAnneeScolaire,
                    supprimer: false,
                    ...(idSalle ? { idSalle: parseInt(idSalle) } : {})
                },
                include: [{
                    model: Salle,
                    where: { idClasse: tarif.idClasse },
                    required: true,
                    include: idCycle ? [{
                        model: Classe,
                        as: 'Classe',
                        required: true,
                        where: { idCycle: parseInt(idCycle) }
                    }] : []
                }]
            });
            totalAttenduUrgent += (tarif.montantFraisExigible * count);
        }

        if (tarifsUrgent.length > 0) {
            const tarifIds = tarifsUrgent.map(t => t.idTarifFraisExigible);
            totalRecouvreUrgent = await PaiementFraisExigible.sum('montantAlloue', {
                where: { idTarifFraisExigible: { [Op.in]: tarifIds } },
                include: [{
                    model: PaiementFraisGlobal,
                    as: 'PaiementFraisGlobal',
                    where: { annule: 0 },
                    required: true,
                    include: (idSalle || idClasse || idCycle) ? [{
                        model: Eleve,
                        required: true,
                        include: [{
                            model: Inscription,
                            required: true,
                            where: {
                                idAnneeScolaire,
                                supprimer: false,
                                ...(idSalle ? { idSalle: parseInt(idSalle) } : {})
                            },
                            include: (idClasse || idCycle) ? [{
                                model: Salle,
                                required: true,
                                where: idClasse ? { idClasse: parseInt(idClasse) } : {},
                                include: idCycle ? [{
                                    model: Classe,
                                    as: 'Classe',
                                    required: true,
                                    where: { idCycle: parseInt(idCycle) }
                                }] : []
                            }] : []
                        }]
                    }] : []
                }]
            }) || 0;
        }

        const recoveryRate = totalAttenduUrgent > 0 ? (totalRecouvreUrgent / totalAttenduUrgent) * 100 : 100;

        // Correction pour éviter l'ambiguïté sur idAnneeScolaire
        const avgNote = await Note.findAll({
            attributes: [[sequelize.fn('AVG', sequelize.col('Note.note')), 'average']],
            where: { idAnneeScolaire },
            include: [{
                model: Inscription,
                attributes: [],
                where: {
                    supprimer: false,
                    ...(idSalle ? { idSalle: parseInt(idSalle) } : {})
                },
                required: true,
                include: (idClasse || idCycle) ? [{
                    model: Salle,
                    attributes: [],
                    required: true,
                    where: idClasse ? { idClasse: parseInt(idClasse) } : {},
                    include: idCycle ? [{
                        model: Classe,
                        as: 'Classe',
                        attributes: [],
                        required: true,
                        where: { idCycle: parseInt(idCycle) }
                    }] : []
                }] : []
            }],
            raw: true
        }).then(res => parseFloat(res[0]?.average || 0));

        const totalAbsences = await SuiviAbsence.count({
            where: { idAnneeScolaire },
            include: [{
                model: Inscription,
                where: {
                    supprimer: false,
                    ...(idSalle ? { idSalle: parseInt(idSalle) } : {})
                },
                required: true,
                include: (idClasse || idCycle) ? [{
                    model: Salle,
                    required: true,
                    where: idClasse ? { idClasse: parseInt(idClasse) } : {},
                    include: idCycle ? [{
                        model: Classe,
                        as: 'Classe',
                        required: true,
                        where: { idCycle: parseInt(idCycle) }
                    }] : []
                }] : []
            }]
        });
        const attendanceRate = Math.max(0, 100 - (totalAbsences * 0.2));

        res.json({
            revenue: {
                total: totalEncaisse,
                evolution,
                moyenne: filteredTransactions.length > 0 ? totalEncaisse / filteredTransactions.length : 0,
                startDate,
                endDate
            },
            students: {
                total: studentCount,
                insolvables: Math.round(studentCount * 0.12)
            },
            performance: {
                academicAvg: avgNote,
                recoveryRate,
                attendanceRate,
                progressionPass: avgNote > 10 ? 75 : 45 // Estimation simplifiée
            }
        });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.checkTarifPayments = async (req, res) => {
    try {
        const { idTarif } = req.params;
        const count = await PaiementFraisExigible.count({ where: { idTarifFraisExigible: idTarif, annule: 0 } });
        res.json({ hasPayments: count > 0 });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllTarifsOfYear = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const [exigibles, periscolaires] = await Promise.all([
            TarifFraisExigible.findAll({ where: { idAnneeScolaire, supprimer: false } }),
            TarifFraisPeriscolaire.findAll({ where: { idAnneeScolaire, supprimer: false } })
        ]);
        res.json({ exigibles, periscolaires });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.saveTarifs = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idClasse, idAnneeScolaire, tarifs } = req.body;
        const existingTarifs = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: "Frais" }],
            transaction: t
        });

        const incomingIds = tarifs.map(nt => parseInt(nt.idFrais));

        for (const old of existingTarifs) {
            const hasPayment = await PaiementFraisExigible.findOne({
                where: { idTarifFraisExigible: old.idTarifFraisExigible, annule: 0 },
                transaction: t
            });

            if (hasPayment) {
                const newVersion = tarifs.find(nt => parseInt(nt.idFrais) === old.idFraisExigible);
                if (!newVersion) throw new Error(`Impossible de supprimer le frais '${old.Frais?.fraisFr}' : des paiements y sont déjà rattachés.`);
                if (parseFloat(newVersion.montant) !== parseFloat(old.montantFraisExigible) ||
                    parseInt(newVersion.ordre) !== parseInt(old.ordrePaiement)) {
                    throw new Error(`Impossible de modifier le montant ou l'ordre du frais '${old.Frais?.fraisFr}' car des paiements ont déjà été effectués.`);
                }
            }
        }

        for (const old of existingTarifs) {
            if (!incomingIds.includes(old.idFraisExigible)) {
                await TarifFraisExigible.update({ supprimer: true }, { where: { idTarifFraisExigible: old.idTarifFraisExigible }, transaction: t });
            }
        }

        for (const item of tarifs) {
            const existing = existingTarifs.find(et => et.idFraisExigible === parseInt(item.idFrais));
            const data = { montantFraisExigible: item.montant, ordrePaiement: item.ordre, dateLimite: item.dateLimite || null, dateAlerte: item.dateAlerte || null, supprimer: false };

            if (existing) {
                await TarifFraisExigible.update(data, { where: { idTarifFraisExigible: existing.idTarifFraisExigible }, transaction: t });
            } else {
                await TarifFraisExigible.create({ ...data, idClasse, idFraisExigible: item.idFrais, idAnneeScolaire }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Tarifs mis à jour avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

exports.payerFraisExigibles = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idAnneeScolaire, idClasse, montantVerse, modePaiement, reference } = req.body;
        let resteAPayer = parseInt(montantVerse);
        if (resteAPayer <= 0) return res.status(400).json({ error: "Montant invalide" });

        const global = await PaiementFraisGlobal.create({ montantTotal: resteAPayer, modePaiement, referenceTransaction: reference, idEleve, idAnneeScolaire, idCaissier: req.user.userId }, { transaction: t });
        const tarifs = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false }, order: [['ordrePaiement', 'ASC']], transaction: t });

        for (const tarif of tarifs) {
            if (resteAPayer <= 0) break;
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisExigible: tarif.idTarifFraisExigible }, transaction: t }) || 0;
            const duSurCeFrais = tarif.montantFraisExigible - dejaPaye;
            if (duSurCeFrais > 0) {
                const allocation = Math.min(resteAPayer, duSurCeFrais);
                await PaiementFraisExigible.create({ montantAlloue: allocation, idTarifFraisExigible: tarif.idTarifFraisExigible, idPaiementFraisGlobal: global.idPaiementFraisGlobal }, { transaction: t });
                resteAPayer -= allocation;
            }
        }

        await t.commit();
        res.status(201).json({ message: "Paiement enregistré", idPaiement: global.idPaiementFraisGlobal, tropPercu: resteAPayer });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getRecouvrementStats = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.params;
        const tarifs = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false }, include: [{ model: FraisExigible, as: "Frais" }], order: [['ordrePaiement', 'ASC']] });
        const nbEleves = await Inscription.count({ where: { idAnneeScolaire, supprimer: false }, include: [{ model: Salle, where: { idClasse } }] });
        const stats = await Promise.all(tarifs.map(async (t) => {
            const totalAttendu = t.montantFraisExigible * nbEleves;
            const totalEncaisse = await PaiementFraisExigible.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisExigible: t.idTarifFraisExigible } }) || 0;
            return { idTarif: t.idTarifFraisExigible, libelle: t.Frais.fraisFr, montantUnitaire: t.montantFraisExigible, attendu: totalAttendu, encaisse: totalEncaisse, pourcentage: totalAttendu > 0 ? (totalEncaisse / totalAttendu) : 0 };
        }));
        res.json({ nbEleves, stats });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentPaymentDetails = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false }, include: [{ model: Eleve }, { model: Salle, include: [{ model: Classe, as: 'Classe' }] }] });
        if (!ins || !ins.Salle || !ins.Salle.Classe) return res.status(404).json({ error: "Élève non inscrit pour cette année." });
        const idClasse = ins.Salle.Classe.idClasse;
        const tarifs = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false }, include: [{ model: FraisExigible, as: "Frais" }], order: [['ordrePaiement', 'ASC']] });
        const details = await Promise.all(tarifs.map(async (t) => {
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisExigible: t.idTarifFraisExigible } }) || 0;
            return { idTarif: t.idTarifFraisExigible, libelle: t.Frais.fraisFr, montantDu: t.montantFraisExigible, montantPaye: dejaPaye, reste: t.montantFraisExigible - dejaPaye, isComplet: dejaPaye >= t.montantFraisExigible };
        }));
        const totalDejaVerse = details.reduce((sum, item) => sum + item.montantPaye, 0);
        const totalTotalDu = details.reduce((sum, item) => sum + item.montantDu, 0);
        res.json({ nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), classeLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`, totalDejaVerse, totalTotalDu, resteGlobal: totalTotalDu - totalDejaVerse, frais: details });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getClassesMissingFrais = async (req, res) => {
    try {
        const { idFrais, idAnneeScolaire } = req.params;
        const configs = await EtablissementStructure.findAll({ where: { idAnneeScolaire } });
        const idsEns = configs.map(c => c.idEnseignement);
        const allClasses = await Classe.findAll({ include: [{ model: require("../models").Cycle, as: "Cycle", where: { idEnseignement: idsEns } }] });
        const existingTarifs = await TarifFraisExigible.findAll({ where: { idFraisExigible: idFrais, idAnneeScolaire } });
        const classIdsWithFrais = existingTarifs.map(t => t.idClasse);
        const missing = allClasses.filter(c => !classIdsWithFrais.includes(c.idClasse));
        const result = await Promise.all(missing.map(async (c) => {
            const currentFrais = await TarifFraisExigible.findAll({ where: { idClasse: c.idClasse, idAnneeScolaire, supprimer: false }, include: [{ model: FraisExigible, as: "Frais" }], order: [['ordrePaiement', 'ASC']] });
            return { idClasse: c.idClasse, libelleClasse: c.libelleClasseFr, currentFrais: currentFrais.map(f => ({ id: f.idFraisExigible, label: f.Frais.fraisFr, ordre: f.ordrePaiement })) };
        }));
        res.json(result);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentTransactions = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const transactions = await PaiementFraisGlobal.findAll({
            where: { idEleve, idAnneeScolaire },
            include: [
                { model: PaiementFraisExigible, as: 'detailsExigibles' },
                { model: PaiementFraisPeriscolaire, as: 'detailsPeriscolaires' },
                { model: PaiementTransport, as: 'detailsTransport' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        console.error("Error in getStudentTransactions:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getRegistrationReceiptData = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false }, include: [{ model: Eleve }, { model: AnneeScolaire }, { model: Salle, include: [{ model: Classe, as: 'Classe' }] }] });
        if (!ins) return res.status(404).json({ error: "Inscription non trouvée." });
        const school = await Etablissement.findOne();
        const lastPayment = await PaiementFraisGlobal.findOne({ where: { idEleve, idAnneeScolaire, annule: 0 }, order: [['createdAt', 'DESC']], include: [{ model: Utilisateur, as: 'Caissier', attributes: ['nom'] }] });
        if (!lastPayment) return res.status(404).json({ error: "Aucun paiement trouvé pour cet élève." });
        const idClasse = ins.Salle.Classe.idClasse;
        const allTarifsExigibles = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false }, include: [{ model: FraisExigible, as: 'Frais' }], order: [['ordrePaiement', 'ASC']] });
        const currentAllocationsExigible = await PaiementFraisExigible.findAll({ where: { idPaiementFraisGlobal: lastPayment.idPaiementFraisGlobal, annule: 0 } });
        const todayBreakdown = allTarifsExigibles.map(t => {
            const alloc = currentAllocationsExigible.find(a => a.idTarifFraisExigible === t.idTarifFraisExigible);
            return { libelle: t.Frais?.fraisFr || "Frais inconnu", montantAlloue: alloc ? alloc.montantAlloue : 0 };
        });
        const currentAllocationsPeri = await PaiementFraisPeriscolaire.findAll({ where: { idPaiementFraisGlobal: lastPayment.idPaiementFraisGlobal, annule: 0 }, include: [{ model: TarifFraisPeriscolaire, as: 'Tarif', include: [{ model: FraisActivitePeriscolaire, as: 'Frais' }] }] });
        currentAllocationsPeri.forEach(p => { todayBreakdown.push({ libelle: p.Tarif?.Frais?.libelleFr || "Activité", montantAlloue: p.montantAlloue }); });

        const currentAllocationsTransport = await PaiementTransport.findAll({
            where: { idPaiementFraisGlobal: lastPayment.idPaiementFraisGlobal, annule: 0 },
            include: [{ model: EcheancierTransport }]
        });
        currentAllocationsTransport.forEach(tr => {
            todayBreakdown.push({ libelle: `Transport - ${tr.EcheancierTransport?.libelle || ""}`, montantAlloue: tr.montantVerse });
        });

        const tarifsExigibles = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false }, include: [{ model: FraisExigible, as: "Frais" }], order: [['ordrePaiement', 'ASC']] });
        const fullHistory = await Promise.all(tarifsExigibles.map(async (t, index) => {
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', {
                where: { idTarifFraisExigible: t.idTarifFraisExigible, annule: 0 },
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: 0 },
                    attributes: []
                }]
            }) || 0;
            return { ordre: index + 1, libelle: t.Frais?.fraisFr || "Inconnu", montantTotal: t.montantFraisExigible, augmentation: 0, reduction: 0, dejaPaye: dejaPaye, reste: t.montantFraisExigible - dejaPaye };
        }));
        const totalDejaVerse = fullHistory.reduce((sum, h) => sum + h.dejaPaye, 0);
        const totalTotalDu = fullHistory.reduce((sum, h) => sum + h.montantTotal, 0);
        res.json({ schoolInfo: { name: school?.nomFr || "INSTITUT BILINGUE ROGER AMPERE", devise: school?.devise || "Discipline - Travail - Succès", ministry: school?.tutelle || "Ministère des Enseignements Secondaires", address: school?.adresse, bp: school?.bp, phones: school?.telephone1?.toString(), email: school?.email, authorizationNo: school?.numeroAgrement, logoUrl: school?.logo }, receiptInfo: { title: "REÇU DE PAIEMENT", receiptNo: `FS-${lastPayment.idPaiementFraisGlobal}`, schoolYear: ins.AnneeScolaire.libelleAnneeScolaire, dateTime: lastPayment.createdAt, operationTime: lastPayment.createdAt }, studentInfo: { matricule: ins.Eleve.matricule, fullName: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), classLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`, dateNaissance: ins.Eleve.dateNaissance, lieuNaissance: ins.Eleve.lieuNaissance, sexe: ins.Eleve.sexe === 'M' ? 'MASCULIN' : 'FEMININ', redoublant: ins.nouveau ? 'NON' : 'OUI' }, financialDetail: { nature: "Paiement frais de scolarité", amountDigits: lastPayment.montantTotal, amountWords: "...", paymentMode: lastPayment.modePaiement, balance: totalDejaVerse, remaining: totalTotalDu - totalDejaVerse, penalties: 0, printedBy: lastPayment.Caissier?.nom || "ADMINISTRATEUR", todayBreakdown, fullHistory }, validation: { cashierName: lastPayment.Caissier?.nom || "La Caisse", qrContent: `REF:${lastPayment.idPaiementFraisGlobal}-EL:${idEleve}` } });
    } catch (error) {
        console.error("Error in getRegistrationReceiptData:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.annulerPaiement = async (req, res) => {
    const { idPaiementFraisGlobal } = req.params;
    const { motif } = req.body;
    const idCaissier = req.user?.idUtilisateur;

    if (!motif || motif.length < 5) {
        return res.status(400).json({ error: "Un motif d'annulation valide (min 5 caractères) est requis." });
    }

    const t = await sequelize.transaction();
    try {
        const paiementToCancel = await PaiementFraisGlobal.findByPk(idPaiementFraisGlobal);
        if (!paiementToCancel) throw new Error("Paiement introuvable.");
        if (paiementToCancel.annule) throw new Error("Ce paiement est déjà annulé.");

        // Vérification de l'ordre chronologique pour cet élève
        const moreRecent = await PaiementFraisGlobal.findOne({
            where: {
                idEleve: paiementToCancel.idEleve,
                idAnneeScolaire: paiementToCancel.idAnneeScolaire,
                annule: 0,
                createdAt: { [Op.gt]: paiementToCancel.createdAt }
            },
            transaction: t
        });

        if (moreRecent) {
            throw new Error(`Impossible d'annuler cette transaction. Vous devez d'abord annuler la transaction la plus récente (#FS-${moreRecent.idPaiementFraisGlobal} du ${new Date(moreRecent.createdAt).toLocaleDateString()}) pour respecter l'ordre chronologique.`);
        }

        console.log(`[AUDIT] Annulation du paiement #FS-${idPaiementFraisGlobal} par l'utilisateur ID:${idCaissier}. Motif: ${motif}`);

        await PaiementFraisGlobal.update({ annule: 1 }, { where: { idPaiementFraisGlobal }, transaction: t });
        await PaiementFraisExigible.update({ annule: 1 }, { where: { idPaiementFraisGlobal }, transaction: t });
        await PaiementFraisPeriscolaire.update({ annule: 1 }, { where: { idPaiementFraisGlobal }, transaction: t });

        const transportPayments = await PaiementTransport.findAll({ where: { idPaiementFraisGlobal }, transaction: t });
        for (const tp of transportPayments) {
            if (tp.idEcheancier) {
                await EcheancierTransport.decrement('montantPaye', {
                    by: tp.montantVerse,
                    where: { idEcheancier: tp.idEcheancier },
                    transaction: t
                });
            }
        }
        await PaiementTransport.update({ annule: 1 }, { where: { idPaiementFraisGlobal }, transaction: t });

        await t.commit();
        res.json({ message: "Paiement annulé avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        console.error(`[CANCEL_ERROR] #FS-${idPaiementFraisGlobal}:`, error.message);
        res.status(400).json({ error: error.message });
    }
};


exports.bulkAssignPeriscolaire = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, idFraisActivitePeriscolaire, montant, classIds } = req.body;
        for (const idClasse of classIds) {
            const existingTarif = await TarifFraisPeriscolaire.findOne({ where: { idClasse, idAnneeScolaire, idFraisActivitePeriscolaire }, transaction: t });
            if (existingTarif) {
                const hasPayments = await PaiementFraisPeriscolaire.findOne({ where: { idTarifFraisActivitePeriscolaire: existingTarif.idTarifFraisActivitePeriscolaire, annule: 0 }, transaction: t });
                if (hasPayments && parseFloat(existingTarif.montantFraisActivitePeriscolaire) !== parseFloat(montant)) throw new Error(`Impossible de modifier le montant de l'activité car des paiements y sont déjà rattachés.`);
            }
            await TarifFraisPeriscolaire.destroy({ where: { idClasse, idAnneeScolaire, idFraisActivitePeriscolaire }, transaction: t });
            await TarifFraisPeriscolaire.create({ montantFraisActivitePeriscolaire: montant, idClasse, idFraisActivitePeriscolaire, idAnneeScolaire }, { transaction: t });
        }
        await t.commit();
        res.json({ message: "Frais périscolaires affectés avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getSimpleRegistrationReceipt = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false }, include: [{ model: Eleve }, { model: AnneeScolaire }, { model: Salle, include: [{ model: Classe, as: 'Classe' }] }] });
        if (!ins) return res.status(404).json({ error: "Inscription non trouvée." });
        const school = await Etablissement.findOne();
        res.json({ schoolInfo: { name: school?.nomFr || "INSTITUT BILINGUE ROGER AMPERE", devise: school?.devise || "Discipline - Travail - Succès", ministry: school?.tutelle || "Ministère des Enseignements Secondaires", address: school?.adresse, bp: school?.bp, phones: school?.telephone1?.toString(), email: school?.email, logoUrl: school?.logo }, receiptInfo: { title: "FICHE D'INSCRIPTION", receiptNo: `INS-${ins.idInscription}`, schoolYear: ins.AnneeScolaire.libelleAnneeScolaire, dateTime: ins.createdAt }, studentInfo: { matricule: ins.Eleve.matricule, fullName: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), classLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`, dateNaissance: ins.Eleve.dateNaissance, lieuNaissance: ins.Eleve.lieuNaissance, sexe: ins.Eleve.sexe === 'M' ? 'MASCULIN' : 'FEMININ', redoublant: ins.nouveau ? 'NON' : 'OUI' }, validation: { qrContent: `INSCRIPTION:${ins.idInscription}-MAT:${ins.Eleve.matricule}` } });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.bulkApplyTarif = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idFrais, idAnneeScolaire, montant, dateLimite, dateAlerte, applications } = req.body;
        for (const app of applications) {
            const hasPayments = await PaiementFraisExigible.findOne({ include: [{ model: PaiementFraisGlobal, where: { idAnneeScolaire } }, { model: TarifFraisExigible, as: 'Tarif', where: { idClasse: app.idClasse } }], transaction: t });
            if (hasPayments) throw new Error(`La classe ID ${app.idClasse} a déjà des paiements.`);
            await TarifFraisExigible.increment('ordrePaiement', { by: 1, where: { idClasse: app.idClasse, idAnneeScolaire, ordrePaiement: { [Op.gte]: app.newOrder } }, transaction: t });
            await TarifFraisExigible.create({ montantFraisExigible: montant, ordrePaiement: app.newOrder, dateLimite, dateAlerte, idClasse: app.idClasse, idFraisExigible: idFrais, idAnneeScolaire }, { transaction: t });
        }
        await t.commit();
        res.json({ message: "Tarif appliqué aux classes sélectionnées" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getBilanJournalier = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const hourlyData = await sequelize.query(`SELECT HOUR(createdAt) as hour, SUM(montantTotal) as total FROM paiement_frais_global WHERE idAnneeScolaire = :idAnneeScolaire AND DATE(createdAt) = :targetDate AND annule = 0 GROUP BY hour ORDER BY hour ASC`, { replacements: { idAnneeScolaire, targetDate }, type: QueryTypes.SELECT });
        const transactions = await PaiementFraisGlobal.findAll({ where: { idAnneeScolaire, annule: 0, [Op.and]: [sequelize.where(sequelize.fn('DATE', sequelize.col('PaiementFraisGlobal.createdAt')), targetDate)] }, include: [{ model: Eleve, attributes: ['nom', 'prenom', 'matricule'] }], order: [['createdAt', 'ASC']] });
        res.json({ date: targetDate, chartData: hourlyData.map(d => ({ label: `${d.hour}h`, value: parseFloat(d.total) })), transactions });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBilanMensuel = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { month, year } = req.query;
        const targetMonth = month || (new Date().getMonth() + 1);
        const targetYear = year || new Date().getFullYear();
        const dailyData = await sequelize.query(`SELECT DATE(createdAt) as day, SUM(montantTotal) as total FROM paiement_frais_global WHERE idAnneeScolaire = :idAnneeScolaire AND MONTH(createdAt) = :targetMonth AND YEAR(createdAt) = :targetYear AND annule = 0 GROUP BY day ORDER BY total DESC`, { replacements: { idAnneeScolaire, targetMonth, targetYear }, type: QueryTypes.SELECT });
        res.json({ period: `${targetMonth}/${targetYear}`, chartData: dailyData.map(d => { const dayStr = d.day instanceof Date ? d.day.toISOString().split('T')[0] : String(d.day); return { label: dayStr.split('-')[2], value: parseFloat(d.total) }; }), topDays: dailyData.slice(0, 5) });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBilanAnnuel = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const monthlyData = await sequelize.query(`SELECT MONTH(createdAt) as month, SUM(montantTotal) as total FROM paiement_frais_global WHERE idAnneeScolaire = :idAnneeScolaire AND annule = 0 GROUP BY month ORDER BY month ASC`, { replacements: { idAnneeScolaire }, type: QueryTypes.SELECT });
        const monthLabels = ["Sep", "Oct", "Nov", "Dec", "Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou"];
        const chartData = monthLabels.map((label, index) => { const m = ((index + 8) % 12) + 1; const found = monthlyData.find(d => parseInt(d.month) === m); return { label, value: found ? parseFloat(found.total) : 0 }; });
        res.json({ chartData });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPerformanceComparison = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { idCycle, idEnseignement } = req.query;
        const whereSalle = {};
        if (idCycle) whereSalle['$Classe.Cycle.idCycle$'] = idCycle;
        if (idEnseignement) whereSalle['$Classe.Cycle.idEnseignement$'] = idEnseignement;
        const salles = await Salle.findAll({ include: [{ model: Classe, as: 'Classe', include: [{ model: require("../models").Cycle, as: 'Cycle' }] }], where: whereSalle });
        const comparison = await Promise.all(salles.map(async (s) => { const stats = await exports.getRecouvrementStatsInternal(s.idClasse, idAnneeScolaire, s.idSalle); return { idSalle: s.idSalle, nomSalle: `${s.Classe.libelleClasseFr} ${s.nomSalle}`, cycle: s.Classe.Cycle.libelleCycleFr, totalAttendu: stats.totalAttendu, totalEncaisse: stats.totalEncaisse, rp: stats.totalAttendu > 0 ? (stats.totalEncaisse / stats.totalAttendu) * 100 : 0 }; }));
        comparison.sort((a, b) => b.rp - a.rp);
        res.json(comparison);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getRecouvrementStatsInternal = async (idClasse, idAnneeScolaire, idSalle) => {
    const nbEleves = await Inscription.count({ where: { idAnneeScolaire, idSalle, supprimer: false } });
    const totalUnitaire = await TarifFraisExigible.sum('montantFraisExigible', { where: { idClasse, idAnneeScolaire, supprimer: false } }) || 0;
    const totalAttendu = totalUnitaire * nbEleves;
    const totalEncaisse = await PaiementFraisExigible.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idAnneeScolaire, annule: 0 }, attributes: [], include: [{ model: Eleve, include: [{ model: Inscription, where: { idSalle } }] }] }] }) || 0;
    return { totalAttendu, totalEncaisse };
};

exports.getInsolvablesList = async (req, res) => {
    try {
        const { idAnneeScolaire, idTranche } = req.params;
        const { idSalle, severity } = req.query;
        const tarif = await TarifFraisExigible.findByPk(idTranche);
        if (!tarif) return res.status(404).json({ error: "Tranche non trouvée" });
        const whereIns = { idAnneeScolaire, supprimer: false };
        if (idSalle) whereIns.idSalle = idSalle;
        const inscriptions = await Inscription.findAll({ where: whereIns, include: [{ model: Eleve }, { model: Salle, include: [{ model: Classe, as: 'Classe' }] }] });
        const result = [];
        for (const ins of inscriptions) {
            const verse = await PaiementFraisExigible.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve: ins.idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisExigible: idTranche } }) || 0;
            const dette = tarif.montantFraisExigible - verse;
            if (dette > 0) { if (severity === 'TOTAL' && verse > 0) continue; result.push({ matricule: ins.Eleve.matricule, nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), classeSalle: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`, montantExigible: tarif.montantFraisExigible, montantVerse: verse, dette, tauxDefaillance: (dette / tarif.montantFraisExigible) * 100 }); }
        }
        res.json(result);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getFraisPeriscolairesLibrary = async (req, res) => {
    try {
        const library = await FraisActivitePeriscolaire.findAll({ where: { supprimer: false } });
        res.json(library);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.createFraisPeriscolaire = async (req, res) => {
    try {
        const { libelleFr, libelleEn, description } = req.body;
        const frais = await FraisActivitePeriscolaire.create({ libelleFr, libelleEn, description });
        res.status(201).json(frais);
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateFraisPeriscolaire = async (req, res) => {
    try {
        const { id } = req.params;
        await FraisActivitePeriscolaire.update(req.body, { where: { idFraisActivitePeriscolaire: id } });
        res.json({ message: "Frais périscolaire mis à jour" });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFraisPeriscolaire = async (req, res) => {
    try {
        const { id } = req.params;
        const countTarifs = await TarifFraisPeriscolaire.count({ where: { idFraisActivitePeriscolaire: id, supprimer: false } });
        if (countTarifs > 0) return res.status(400).json({ error: "Ce type de frais est utilisé." });
        await FraisActivitePeriscolaire.update({ supprimer: true }, { where: { idFraisActivitePeriscolaire: id } });
        res.json({ message: "Frais périscolaire supprimé" });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.payerFraisPeriscolaires = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idAnneeScolaire, montantVerse, modePaiement, reference, idTarifFraisActivitePeriscolaire } = req.body;
        let resteAPayer = parseInt(montantVerse);
        if (resteAPayer <= 0) return res.status(400).json({ error: "Montant invalide" });
        const global = await PaiementFraisGlobal.create({ montantTotal: resteAPayer, modePaiement, referenceTransaction: reference, idEleve, idAnneeScolaire, idCaissier: req.user.userId }, { transaction: t });
        if (idTarifFraisActivitePeriscolaire) {
            const tarif = await TarifFraisPeriscolaire.findByPk(idTarifFraisActivitePeriscolaire, { transaction: t });
            if (!tarif) throw new Error("Tarif périscolaire introuvable.");
            const dejaPaye = await PaiementFraisPeriscolaire.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisActivitePeriscolaire }, transaction: t }) || 0;
            const duSurCeFrais = tarif.montantFraisActivitePeriscolaire - dejaPaye;
            const allocation = Math.min(resteAPayer, duSurCeFrais);
            if (allocation > 0) { await PaiementFraisPeriscolaire.create({ montantAlloue: allocation, idTarifFraisActivitePeriscolaire, idPaiementFraisGlobal: global.idPaiementFraisGlobal }, { transaction: t }); resteAPayer -= allocation; }
        } else {
            const tarifs = await TarifFraisPeriscolaire.findAll({ where: { idAnneeScolaire, supprimer: false }, order: [['createdAt', 'ASC']], transaction: t });
            for (const tarif of tarifs) { if (resteAPayer <= 0) break; const dejaPaye = await PaiementFraisPeriscolaire.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisActivitePeriscolaire: tarif.idTarifFraisActivitePeriscolaire }, transaction: t }) || 0; const duSurCeFrais = tarif.montantFraisActivitePeriscolaire - dejaPaye; if (duSurCeFrais > 0) { const allocation = Math.min(resteAPayer, duSurCeFrais); await PaiementFraisPeriscolaire.create({ montantAlloue: allocation, idTarifFraisActivitePeriscolaire: tarif.idTarifFraisActivitePeriscolaire, idPaiementFraisGlobal: global.idPaiementFraisGlobal }, { transaction: t }); resteAPayer -= allocation; } }
        }
        await t.commit();
        res.status(201).json({ message: "Paiement périscolaire enregistré", idPaiement: global.idPaiementFraisGlobal, tropPercu: resteAPayer });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentPeriscolaireDetails = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false }, include: [{ model: Eleve }, { model: Salle, include: [{ model: Classe, as: "Classe" }] }] });
        if (!ins) return res.status(404).json({ error: "Élève non trouvé." });
        const tarifs = await TarifFraisPeriscolaire.findAll({ where: { idAnneeScolaire, supprimer: false }, include: [{ model: FraisActivitePeriscolaire, as: "Frais" }], order: [['createdAt', 'ASC']] });
        const details = await Promise.all(tarifs.map(async (t) => {
            const dejaPaye = await PaiementFraisPeriscolaire.sum('montantAlloue', { include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: 0 }, attributes: [] }], where: { idTarifFraisActivitePeriscolaire: t.idTarifFraisActivitePeriscolaire } }) || 0;
            return { idTarif: t.idTarifFraisPeriscolaire, libelle: t.Frais.libelleFr, montantDu: t.montantFraisActivitePeriscolaire, montantPaye: dejaPaye, reste: t.montantFraisActivitePeriscolaire - dejaPaye, isComplet: dejaPaye >= t.montantFraisActivitePeriscolaire };
        }));
        res.json({ nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), classeLabel: ins.Salle ? `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}` : "N/A", totalDejaVerse: details.reduce((sum, item) => sum + item.montantPaye, 0), totalTotalDu: details.reduce((sum, item) => sum + item.montantDu, 0), resteGlobal: details.reduce((sum, item) => sum + item.reste, 0), frais: details });
    } catch (error) {
        console.error("Error in getCockpitAggregates:", error);
        res.status(500).json({ error: error.message });
    }
};

// --- TRANSPORT ---

exports.getQuartiers = async (req, res) => {
    try {
        const quartiers = await Quartier.findAll({ where: { supprimer: false }, order: [['libelle', 'ASC']] });
        res.json(quartiers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createQuartier = async (req, res) => {
    try {
        const { libelle, ville } = req.body;
        const q = await Quartier.create({ libelle, ville });
        res.status(201).json(q);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTarifsTransport = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const tarifs = await TarifTransport.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [{ model: Quartier }]
        });
        res.json(tarifs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveTarifTransport = async (req, res) => {
    try {
        const { idQuartier, idAnneeScolaire, montantTransport } = req.body;
        const [tarif, created] = await TarifTransport.findOrCreate({
            where: { idQuartier, idAnneeScolaire },
            defaults: { montantTransport }
        });

        if (!created) {
            tarif.montantTransport = montantTransport;
            tarif.supprimer = false;
            await tarif.save();
        }
        res.json(tarif);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.subscribeStudentToTransport = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idTarifTransport, reduction, echeances } = req.body;

        const sub = await EleveTransport.create({
            idEleve, idTarifTransport, reduction, statut: 'ACTIF'
        }, { transaction: t });

        if (echeances && echeances.length > 0) {
            for (const ech of echeances) {
                await EcheancierTransport.create({
                    idEleveTransport: sub.idEleveTransport,
                    libelle: ech.libelle,
                    montantDu: ech.montantDu,
                    dateLimite: ech.dateLimite
                }, { transaction: t });
            }
        }

        await t.commit();
        res.status(201).json(sub);
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.getStudentTransportSubscription = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const sub = await EleveTransport.findOne({
            include: [
                { model: TarifTransport, where: { idAnneeScolaire }, include: [Quartier] },
                { model: EcheancierTransport, as: 'echeances' }
            ],
            where: { idEleve, statut: 'ACTIF' }
        });
        res.json(sub);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.payerTransport = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idAnneeScolaire, montantVerse, modePaiement, reference } = req.body;
        let resteAPayer = parseInt(montantVerse);

        const global = await PaiementFraisGlobal.create({
            montantTotal: resteAPayer, modePaiement, referenceTransaction: reference,
            idEleve, idAnneeScolaire, idCaissier: req.user.userId
        }, { transaction: t });

        const sub = await EleveTransport.findOne({
            include: [{ model: TarifTransport, where: { idAnneeScolaire } }],
            where: { idEleve, statut: 'ACTIF' },
            transaction: t
        });

        if (!sub) throw new Error("Abonnement transport non trouvé pour cet élève");

        const echeances = await EcheancierTransport.findAll({
            where: { idEleveTransport: sub.idEleveTransport },
            order: [['dateLimite', 'ASC'], ['idEcheancier', 'ASC']],
            transaction: t
        });

        for (const ech of echeances) {
            if (resteAPayer <= 0) break;
            const du = ech.montantDu - ech.montantPaye;
            if (du > 0) {
                const allocation = Math.min(resteAPayer, du);
                ech.montantPaye += allocation;
                await ech.save({ transaction: t });

                await PaiementTransport.create({
                    montantVerse: allocation,
                    idPaiementFraisGlobal: global.idPaiementFraisGlobal,
                    idEcheancier: ech.idEcheancier,
                    idEleveTransport: sub.idEleveTransport
                }, { transaction: t });

                resteAPayer -= allocation;
            }
        }

        await t.commit();
        res.status(201).json({ message: "Paiement transport enregistré", tropPercu: resteAPayer });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
