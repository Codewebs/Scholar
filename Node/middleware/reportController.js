const {
    Inscription,
    Eleve,
    Salle,
    Classe,
    TarifFraisExigible,
    PaiementFraisExigible,
    PaiementFraisGlobal,
    TarifFraisPeriscolaire,
    PaiementFraisPeriscolaire,
    EleveTransport,
    TarifTransport,
    PaiementTransport,
    FraisExigible,
    FraisActivitePeriscolaire,
    sequelize
} = require("../models");
const { Op } = require("sequelize");

exports.getAlphabeticalList = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['matricule', 'nom', 'prenom', 'sexe', 'dateNaissance'] }],
                order: [[{ model: Eleve }, 'nom', 'ASC']]
            });

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                capacite: salle.capacite,
                eleves: inscriptions.map(ins => ({
                    id: ins.idInscription,
                    matricule: ins.Eleve?.matricule,
                    nom: ins.Eleve?.nom,
                    prenom: ins.Eleve?.prenom,
                    sexe: ins.Eleve?.sexe,
                    date: ins.Eleve?.dateNaissance
                }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getInsolventFees = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire, idTarifFraisExigible } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        // 1. Déterminer le tarif cible (cumulatif selon l'ordre)
        let targetTarifs = [];
        if (idTarifFraisExigible) {
            const selectedTarif = await TarifFraisExigible.findByPk(idTarifFraisExigible);
            if (!selectedTarif) return res.status(404).json({ error: "Tarif non trouvé" });

            targetTarifs = await TarifFraisExigible.findAll({
                where: {
                    idClasse,
                    idAnneeScolaire,
                    ordrePaiement: { [Op.lte]: selectedTarif.ordrePaiement },
                    supprimer: false
                }
            });
        } else {
            targetTarifs = await TarifFraisExigible.findAll({
                where: { idClasse, idAnneeScolaire, supprimer: false }
            });
        }

        const cumulativeDue = targetTarifs.reduce((sum, t) => sum + parseFloat(t.montantFraisExigible || 0), 0);

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve }]
            });

            const elevesInsolvables = [];
            for (const ins of inscriptions) {
                // On calcule le total payé par l'élève pour TOUS les frais exigibles (car les paiements sont globaux)
                const totalPaye = await PaiementFraisExigible.sum('montantAlloue', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false },
                        attributes: []
                    }],
                    where: { annule: false }
                }) || 0;

                const reste = cumulativeDue - totalPaye;
                if (reste > 0) {
                    elevesInsolvables.push({
                        id: ins.idInscription,
                        matricule: ins.Eleve?.matricule,
                        nom: ins.Eleve?.nom,
                        prenom: ins.Eleve?.prenom,
                        attendu: cumulativeDue,
                        paye: totalPaye,
                        reste: reste
                    });
                }
            }

            elevesInsolvables.sort((a, b) => b.reste - a.reste);

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                stats: {
                    total: inscriptions.length,
                    insolvables: elevesInsolvables.length,
                    tauxRecouvrement: inscriptions.length > 0 ? Math.round(((inscriptions.length - elevesInsolvables.length) / inscriptions.length) * 100) : 0
                },
                eleves: elevesInsolvables
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getInsolventFees:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getInsolventPerischool = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire, idTarifFraisActivitePeriscolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve }]
            });

            const results = [];
            for (const ins of inscriptions) {
                const filter = { idAnneeScolaire, supprimer: false };
                if (idTarifFraisActivitePeriscolaire) {
                    filter.idTarifFraisActivitePeriscolaire = idTarifFraisActivitePeriscolaire;
                }

                const tarifsPeri = await TarifFraisPeriscolaire.findAll({
                    where: filter,
                    include: [{ model: FraisActivitePeriscolaire, as: 'Frais' }]
                });

                for (const t of tarifsPeri) {
                    const paye = await PaiementFraisPeriscolaire.sum('montantAlloue', {
                        include: [{
                            model: PaiementFraisGlobal,
                            where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false }
                        }],
                        where: { idTarifFraisActivitePeriscolaire: t.idTarifFraisActivitePeriscolaire, annule: false }
                    }) || 0;

                    if (paye < t.montantFraisActivitePeriscolaire) {
                        results.push({
                            nom: `${ins.Eleve?.nom} ${ins.Eleve?.prenom}`,
                            activite: t.Frais?.libelleFr,
                            tarif: t.montantFraisActivitePeriscolaire,
                            paye: paye,
                            dette: t.montantFraisActivitePeriscolaire - paye
                        });
                    }
                }
            }

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: results
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getInsolventPerischool:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getGlobalFinancialStatus = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve }]
            });

            const tarifExigibles = await TarifFraisExigible.sum('montantFraisExigible', {
                where: { idClasse, idAnneeScolaire, supprimer: false }
            }) || 0;

            const list = await Promise.all(inscriptions.map(async (ins) => {
                const payeExigible = await PaiementFraisExigible.sum('montantAlloue', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false },
                        attributes: []
                    }],
                    where: { annule: false }
                }) || 0;

                const payePeri = await PaiementFraisPeriscolaire.sum('montantAlloue', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false },
                        attributes: []
                    }],
                    where: { annule: false }
                }) || 0;

                const transportInfo = await EleveTransport.findOne({
                    where: { idEleve: ins.idEleve, reduction: { [Op.ne]: null } }, // just to find existing
                    include: [{ model: TarifTransport, where: { idAnneeScolaire } }]
                });
                const duTransport = transportInfo?.TarifTransport?.montantTransport || 0;
                const payeTransport = await PaiementTransport.sum('montantVerse', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false },
                        attributes: []
                    }],
                    where: { annule: false }
                }) || 0;

                const solde = (tarifExigibles + duTransport) - (payeExigible + payePeri + payeTransport);

                return {
                    nom: `${ins.Eleve?.nom} ${ins.Eleve?.prenom}`,
                    exigible: { du: tarifExigibles, paye: payeExigible },
                    peri: { paye: payePeri },
                    transport: { du: duTransport, paye: payeTransport },
                    solde: solde
                };
            }));

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: list
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getGlobalFinancialStatus:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDailyPayments = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire, date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                attributes: ['idEleve']
            });
            const eleveIds = inscriptions.map(i => i.idEleve);

            const paiements = await PaiementFraisGlobal.findAll({
                where: {
                    idEleve: eleveIds,
                    idAnneeScolaire,
                    annule: false,
                    [Op.and]: [
                        sequelize.where(sequelize.fn('DATE', sequelize.col('PaiementFraisGlobal.datePaiement')), targetDate)
                    ]
                },
                include: [
                    { model: Eleve, attributes: ['nom', 'prenom'] },
                    { model: PaiementFraisExigible, as: 'detailsExigibles', where: { annule: false }, required: false },
                    { model: PaiementFraisPeriscolaire, as: 'detailsPeriscolaires', where: { annule: false }, required: false },
                    { model: PaiementTransport, as: 'detailsTransport', where: { annule: false }, required: false }
                ],
                order: [['datePaiement', 'ASC']]
            });

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                date: targetDate,
                eleves: paiements.map(p => ({
                    heure: new Date(p.datePaiement).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    nom: `${p.Eleve?.nom} ${p.Eleve?.prenom}`,
                    mode: p.modePaiement,
                    ref: p.referenceTransaction || '-',
                    scolarite: p.detailsExigibles?.reduce((s, d) => s + parseFloat(d.montantAlloue), 0) || 0,
                    peri: p.detailsPeriscolaires?.reduce((s, d) => s + parseFloat(d.montantAlloue), 0) || 0,
                    transport: p.detailsTransport?.reduce((s, d) => s + parseFloat(d.montantVerse), 0) || 0,
                    total: p.montantTotal
                }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getDailyPayments:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getScholarshipList = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve }]
            });

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: inscriptions.map(i => ({
                    matricule: i.Eleve?.matricule,
                    nom: `${i.Eleve?.nom} ${i.Eleve?.prenom}`,
                    tarifNormal: 0,
                    tarifApplique: 0,
                    motif: i.nouveau ? "Nouveau" : "Ancien"
                }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getFeesBilan = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire, type } = req.query; // type: 'exigible' | 'periscolaire' | 'transport'
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const nbEleves = await Inscription.count({ where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false } });

            let attendu = 0;
            let paye = 0;
            let details = [];

            if (type === 'exigible') {
                const tarifs = await TarifFraisExigible.findAll({
                    where: { idClasse, idAnneeScolaire, supprimer: false },
                    include: ['Frais']
                });
                attendu = tarifs.reduce((s, t) => s + (t.montantFraisExigible * nbEleves), 0);

                for (const t of tarifs) {
                    const sum = await PaiementFraisExigible.sum('montantAlloue', {
                        where: { idTarifFraisExigible: t.idTarifFraisExigible, annule: false },
                        include: [{ model: PaiementFraisGlobal, where: { idAnneeScolaire, annule: false }, attributes: [] }]
                    }) || 0;
                    details.push({ label: t.Frais?.fraisFr, attendu: t.montantFraisExigible * nbEleves, paye: sum });
                    paye += sum;
                }
            } else if (type === 'periscolaire') {
                const tarifs = await TarifFraisPeriscolaire.findAll({
                    where: { idAnneeScolaire, supprimer: false },
                    include: ['Frais']
                });
                // Pour le périscolaire, on ne connaît pas forcément le nombre d'abonnés a priori,
                // mais on peut se baser sur ceux qui ont payé au moins une fois
                for (const t of tarifs) {
                    const sum = await PaiementFraisPeriscolaire.sum('montantAlloue', {
                        where: { idTarifFraisActivitePeriscolaire: t.idTarifFraisActivitePeriscolaire, annule: false },
                        include: [{ model: PaiementFraisGlobal, where: { idAnneeScolaire, annule: false }, attributes: [] }]
                    }) || 0;
                    // On pourrait aussi compter les abonnés réels si table d'association
                    details.push({ label: t.Frais?.libelleFr, paye: sum });
                    paye += sum;
                }
            } else if (type === 'transport') {
                const payeTransport = await PaiementTransport.sum('montantVerse', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idAnneeScolaire, annule: false },
                        attributes: [],
                        include: [{ model: Eleve, include: [{ model: Inscription, where: { idSalle: salle.idSalle } }] }]
                    }],
                    where: { annule: false }
                }) || 0;
                paye = payeTransport;
            }

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                nbEleves,
                attendu,
                paye,
                ecart: attendu - paye,
                taux: attendu > 0 ? Math.round((paye / attendu) * 100) : 0,
                details
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getFeesBilan:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAttendanceSheet = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });
        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom'] }],
                order: [[{ model: Eleve }, 'nom', 'ASC']]
            });
            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: inscriptions.map(ins => ({ nom: ins.Eleve?.nom, prenom: ins.Eleve?.prenom }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGenderSplit = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });
        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom', 'sexe', 'matricule'] }],
                order: [[{ model: Eleve }, 'sexe', 'ASC'], [{ model: Eleve }, 'nom', 'ASC']]
            });
            const girls = inscriptions.filter(i => i.Eleve?.sexe === 'F');
            const boys = inscriptions.filter(i => i.Eleve?.sexe === 'M');
            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                stats: {
                    total: inscriptions.length,
                    girls: girls.length,
                    boys: boys.length,
                    girlsPercent: inscriptions.length > 0 ? Math.round((girls.length / inscriptions.length) * 100) : 0,
                    boysPercent: inscriptions.length > 0 ? Math.round((boys.length / inscriptions.length) * 100) : 0
                },
                girls: girls.map(i => ({ nom: i.Eleve?.nom, prenom: i.Eleve?.prenom })),
                boys: boys.map(i => ({ nom: i.Eleve?.nom, prenom: i.Eleve?.prenom }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTrombinoscope = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({ where: { idClasse, idAnneeScolaire, supprimer: false } });
        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom', 'matricule'] }],
                order: [[{ model: Eleve }, 'nom', 'ASC']]
            });
            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: inscriptions.map(i => ({ nom: i.Eleve?.nom, prenom: i.Eleve?.prenom, matricule: i.Eleve?.matricule, photo: null }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
