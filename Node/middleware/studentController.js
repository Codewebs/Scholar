const {
    Eleve,
    Inscription,
    Salle,
    Classe,
    Utilisateur,
    RepartitionEnseignant,
    InscriptionPersonnel,
    TarifFraisExigible,
    PaiementFraisExigible,
    PaiementFraisGlobal,
    PaiementFraisPeriscolaire,
    PaiementTransport,
    Note,
    AnneeScolaire,
    Etablissement,
    TarifFraisPeriscolaire,
    FraisExigible,
    FraisActivitePeriscolaire,
    TarifTransport,
    sequelize
} = require("../models");
const { Op } = require("sequelize");

const generateUniqueInscriptionCode = async (idEtablissement, idAnneeScolaire) => {
    const digits = '0123456789';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 100) {
        code = digits[Math.floor(Math.random() * 10)] +
               letters[Math.floor(Math.random() * 26)] +
               digits[Math.floor(Math.random() * 10)] +
               letters[Math.floor(Math.random() * 26)];

        const existing = await Inscription.findOne({
            where: { codeInscription: code, idAnneeScolaire },
            include: [{
                model: Salle,
                as: 'Salle',
                where: { idEtablissement }
            }]
        });
        if (!existing) isUnique = true;
        attempts++;
    }
    return code;
};

// 1. INSCRIPTION ET CRÉATION DE L'ÉLÈVE
exports.registerAndEnrollStudent = async (req, res) => {
    const { idUtilisateur: userId, role } = req.user;
    console.log(`📥 [POST] /register-enroll - Utilisateur ID: ${userId}, Rôle: ${role}`);

    const targetSalle = await Salle.findByPk(req.body.idSalle);
    if (!targetSalle) return res.status(404).json({ error: "Salle introuvable." });
    const idEtablissement = targetSalle.idEtablissement;

    const t = await sequelize.transaction();
    try {
        const data = req.body;

        const required = ['nom', 'dateNaissance', 'lieuNaissance', 'idAnneeScolaire', 'idSalle'];
        const missing = required.filter(field => !data[field]);

        if (missing.length > 0) {
            await t.rollback();
            return res.status(400).json({ error: "Champs requis manquants.", details: missing });
        }

        let finalMatricule = data.matricule;
        if (!finalMatricule) {
            const yearSuffix = new Date().getFullYear().toString().slice(-2);
            const random = Math.floor(1000 + Math.random() * 9000);
            finalMatricule = `SCH-${yearSuffix}-${random}`;
        }

        let student = await Eleve.create({
            matricule: finalMatricule,
            nom: data.nom,
            prenom: data.prenom,
            dateNaissance: data.dateNaissance,
            lieuNaissance: data.lieuNaissance,
            sexe: data.sexe,
            nomPere: data.nomPere,
            telephonePere: data.telephonePere,
            nomMere: data.nomMere,
            telephoneMere: data.telephoneMere,
            nomTuteur: data.nomTuteur,
            telephoneTuteur: data.telephoneTuteur,
            quartier: data.quartier,
            supprimer: false
        }, { transaction: t });

        const codeInscription = await generateUniqueInscriptionCode(idEtablissement, data.idAnneeScolaire);

        const nouvelleInscription = await Inscription.create({
            idEleve: student.idEleve,
            idAnneeScolaire: data.idAnneeScolaire,
            idSalle: data.idSalle,
            dateInscription: new Date(),
            ancienEtablissement: data.ancienEtablissement,
            nouveau: data.nouveau !== undefined ? data.nouveau : true,
            statut: "INSCRIT",
            codeInscription: codeInscription,
            supprimer: false
        }, { transaction: t });

        await t.commit();
        return res.status(201).json({
            message: "Élève enregistré et inscrit avec succès.",
            idEleve: student.idEleve,
            idInscription: nouvelleInscription.idInscription,
            matricule: finalMatricule,
            codeInscription: codeInscription
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Erreur registerAndEnrollStudent:", error);
        return res.status(500).json({ error: error.message });
    }
};

// 2. RECUPERER LES ELEVES D'UNE SALLE
exports.getStudentsByRoom = async (req, res) => {
    const { idAnneeScolaire, idSalle } = req.params;
    try {
        const inscriptions = await Inscription.findAll({
            where: { idAnneeScolaire, idSalle, supprimer: false },
            include: [
                { model: Eleve },
                { model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] }
            ]
        });

        const result = inscriptions.map(ins => ({
            idEleve: ins.Eleve.idEleve,
            idInscription: ins.idInscription,
            matricule: ins.Eleve.matricule || "N/A",
            nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
            nom: ins.Eleve.nom,
            prenom: ins.Eleve.prenom,
            sexe: ins.Eleve.sexe,
            statutInscription: ins.statut,
            idClasse: ins.Salle?.Classe?.idClasse || 0,
            classeLabel: ins.Salle?.Classe?.libelleClasseFr || "N/A",
            dateInscription: ins.createdAt
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. RECHERCHER DES ÉLÈVES (POUR PAIEMENTS)
exports.searchStudents = async (req, res) => {
    const { idAnneeScolaire } = req.params;
    const { q } = req.query;
    try {
        const inscriptions = await Inscription.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [
                {
                    model: Eleve,
                    where: {
                        [Op.or]: [
                            { nom: { [Op.like]: `%${q}%` } },
                            { prenom: { [Op.like]: `%${q}%` } },
                            { matricule: { [Op.like]: `%${q}%` } }
                        ]
                    }
                },
                { model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] }
            ],
            limit: 20
        });

        const result = inscriptions.map(ins => ({
            idEleve: ins.Eleve.idEleve,
            matricule: ins.Eleve.matricule || "N/A",
            nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
            sexe: ins.Eleve.sexe,
            statutInscription: ins.statut,
            idClasse: ins.Salle?.Classe?.idClasse || 0,
            classeLabel: ins.Salle ? `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}` : "N/A",
            dateInscription: ins.createdAt
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. RECUPERER TOUS LES ELEVES DE L'ETABLISSEMENT POUR UNE ANNEE (AVEC SCOPING)
exports.getStudentsBySchoolYear = async (req, res) => {
    const { idAnneeScolaire } = req.params;
    const { idUtilisateur: userId, role } = req.user;

    console.log(`🔎 [GET] /students/all/${idAnneeScolaire} - UserID: ${userId}, Role: ${role}`);

    try {
        const whereInscription = { idAnneeScolaire, supprimer: false };
        const whereEleve = { supprimer: false };

        // --- SCOPING LOGIC ---
        const userRoles = role ? role.split(',') : [];
        const isAdmin = userRoles.includes('ADMINISTRATEUR');

        if (isAdmin) {
            console.log("🛡️ Accès global (Admin)");
        } else if (userRoles.includes('ENSEIGNANT') || userRoles.includes('CHEF_DE_DEPARTEMENT')) {
            const insPersonnel = await InscriptionPersonnel.findOne({
                where: { idUtilisateur: userId, idAnneeScolaire, supprimer: false }
            });
            if (insPersonnel) {
                const affectations = await RepartitionEnseignant.findAll({
                    where: { idInscriptionPersonnel: insPersonnel.idInscriptionPersonnel, supprimer: false }
                });
                whereInscription.idSalle = [...new Set(affectations.map(a => a.idSalle))];
            } else {
                return res.json([]);
            }
        } else if (userRoles.includes('PARENT')) {
            // Scoping via le lien idUtilisateurParent
            whereEleve.idUtilisateurParent = userId;
        } else if (userRoles.includes('ELEVE')) {
            whereEleve.idUtilisateur = userId;
        }

        const inscriptions = await Inscription.findAll({
            where: whereInscription,
            include: [
                { model: Eleve, where: whereEleve },
                { model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] }
            ],
            order: [[Eleve, 'nom', 'ASC']]
        });

        const result = await Promise.all(inscriptions.map(async (ins) => {
            const idEleve = ins.Eleve.idEleve;
            const idInscription = ins.idInscription;
            const idClasse = ins.Salle?.Classe?.idClasse;

            let isSolded = false;
            let totalPayeExigible = 0;
            let totalDuExigible = 0;

            if (idClasse) {
                totalDuExigible = await TarifFraisExigible.sum('montantFraisExigible', {
                    where: { idClasse, idAnneeScolaire, supprimer: false }
                }) || 0;

                totalPayeExigible = await PaiementFraisExigible.sum('montantAlloue', {
                    where: { annule: false },
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve, idAnneeScolaire, annule: false },
                        attributes: []
                    }]
                }) || 0;

                isSolded = totalDuExigible > 0 && totalPayeExigible >= totalDuExigible;
            }

            const hasGrades = await Note.count({
                where: { idInscription, idAnneeScolaire, supprimer: false }
            }) > 0;

            return {
                idEleve: ins.Eleve.idEleve,
                idInscription: ins.idInscription,
                matricule: ins.Eleve.matricule || "N/A",
                nom: ins.Eleve.nom,
                prenom: ins.Eleve.prenom,
                nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                sexe: ins.Eleve.sexe,
                statutInscription: ins.statut,
                idClasse: idClasse || 0,
                idSalle: ins.idSalle,
                salleLabel: ins.Salle?.nomSalle,
                classeLabel: ins.Salle?.Classe?.libelleClasseFr || "N/A",
                dateInscription: ins.createdAt,
                dateNaissance: ins.Eleve.dateNaissance,
                lieuNaissance: ins.Eleve.lieuNaissance,
                nomPere: ins.Eleve.nomPere,
                telephonePere: ins.Eleve.telephonePere,
                nomMere: ins.Eleve.nomMere,
                telephoneMere: ins.Eleve.telephoneMere,
                nomTuteur: ins.Eleve.nomTuteur,
                telephoneTuteur: ins.Eleve.telephoneTuteur,
                quartier: ins.Eleve.quartier,
                ancienEtablissement: ins.ancienEtablissement,
                isSolded,
                hasGrades
            };
        }));

        res.json(result);
    } catch (error) {
        console.error("❌ Erreur getStudentsBySchoolYear:", error);
        res.status(500).json({ error: error.message });
    }
};

// 5. METTRE À JOUR UN ÉLÈVE
exports.updateStudent = async (req, res) => {
    const { idEleve } = req.params;
    const data = req.body;
    const t = await sequelize.transaction();
    try {
        const currentIns = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, supprimer: false }
        });

        if (currentIns && data.idSalle && parseInt(data.idSalle) !== currentIns.idSalle) {
            const gradeCount = await Note.count({
                where: { idInscription: currentIns.idInscription, supprimer: false },
                transaction: t
            });
            if (gradeCount > 0) throw new Error("Impossible de transférer un élève ayant déjà des notes.");

            const hasPayments = (await PaiementFraisExigible.count({
                where: { annule: false },
                include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, annule: false } }],
                transaction: t
            }) > 0);
            if (hasPayments) throw new Error("Impossible de transférer un élève ayant des paiements actifs.");

            await Inscription.update(
                { idSalle: data.idSalle, ancienEtablissement: data.ancienEtablissement },
                { where: { idEleve, idAnneeScolaire: data.idAnneeScolaire }, transaction: t }
            );
        }

        await Eleve.update({
            nom: data.nom,
            prenom: data.prenom,
            dateNaissance: data.dateNaissance,
            lieuNaissance: data.lieuNaissance,
            sexe: data.sexe,
            nomPere: data.nomPere,
            telephonePere: data.telephonePere,
            nomMere: data.nomMere,
            telephoneMere: data.telephoneMere,
            nomTuteur: data.nomTuteur,
            telephoneTuteur: data.telephoneTuteur,
            quartier: data.quartier
        }, { where: { idEleve }, transaction: t });

        await t.commit();
        res.json({ message: "Fiche élève mise à jour avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).json({ error: error.message });
    }
};

// 6. DÉSACTIVER UNE INSCRIPTION
exports.deleteEnrollment = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    try {
        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false } });
        if (!ins) return res.status(404).json({ error: "Inscription introuvable" });

        const gradeCount = await Note.count({ where: { idInscription: ins.idInscription, supprimer: false } });
        if (gradeCount > 0) return res.status(400).json({ error: "Des notes sont déjà enregistrées." });

        await Inscription.update(
            { supprimer: true, statut: 'DESACTIVE' },
            { where: { idEleve, idAnneeScolaire } }
        );

        res.json({ message: "Inscription désactivée avec succès" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. RÉCUPÉRER UN ÉLÈVE PAR SON ID
exports.getStudentById = async (req, res) => {
    const { idEleve } = req.params;
    try {
        const student = await Eleve.findByPk(idEleve, {
            include: [{
                model: Inscription,
                as: 'Inscriptions',
                where: { supprimer: false },
                required: false,
                include: [{ model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] }]
            }]
        });

        if (!student) return res.status(404).json({ error: "Élève non trouvé." });

        const lastIns = student.Inscriptions && student.Inscriptions.length > 0 ? student.Inscriptions[0] : null;

        res.json({
            ...student.toJSON(),
            idSalle: lastIns ? lastIns.idSalle : null,
            classeLabel: lastIns?.Salle?.Classe?.libelleClasseFr || null,
            nomComplet: `${student.nom} ${student.prenom || ""}`.trim()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. RECHERCHE GLOBALE D'ÉLÈVES
exports.globalSearchStudents = async (req, res) => {
    const { q, idAnneeScolaire } = req.query;
    try {
        const students = await Eleve.findAll({
            where: {
                [Op.or]: [
                    { nom: { [Op.like]: `%${q}%` } },
                    { prenom: { [Op.like]: `%${q}%` } }
                ],
                supprimer: false
            },
            include: [{
                model: Inscription,
                as: 'Inscriptions',
                where: { idAnneeScolaire, supprimer: false },
                required: false,
                include: [{ model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] }]
            }],
            limit: 10
        });

        const result = students.map(s => {
            const currentIns = s.Inscriptions && s.Inscriptions.length > 0 ? s.Inscriptions[0] : null;
            return {
                idEleve: s.idEleve,
                nom: s.nom,
                prenom: s.prenom,
                nomComplet: `${s.nom} ${s.prenom || ""}`.trim(),
                sexe: s.sexe,
                isInscribed: !!currentIns,
                classeLabel: currentIns?.Salle?.Classe?.libelleClasseFr || null
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 9. DOCUMENTS OFFICIELS
exports.getOfficialDocumentData = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    const { docType } = req.query;
    const user = req.user;

    try {
        const student = await Eleve.findByPk(idEleve);
        if (!student) return res.status(404).json({ error: "Élève non trouvé." });

        const inscription = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [
                { model: Salle, as: 'Salle', include: [{ model: Classe, as: 'Classe' }] },
                { model: AnneeScolaire, as: 'AnneeScolaire' }
            ]
        });

        const school = await Etablissement.findOne();
        const printerName = user.nom || user.identifiant || "Utilisateur Système";

        let documentData = {
            student: {
                ...student.toJSON(),
                nomComplet: `${student.nom} ${student.prenom || ""}`.trim(),
                classeLabel: inscription?.Salle?.Classe?.libelleClasseFr || "N/A",
                salleLabel: inscription?.Salle?.nomSalle || "N/A"
            },
            inscription: inscription ? inscription.toJSON() : null,
            school: school ? school.toJSON() : null,
            printerName,
            printDate: new Date(),
            docType
        };

        if (docType === 'GLOBAL_RECEIPT_HISTORY' || docType === 'YEAR_RECEIPT') {
            const yearFilter = docType === 'YEAR_RECEIPT' ? { idAnneeScolaire } : {};

            const allPayments = await PaiementFraisGlobal.findAll({
                where: { idEleve, annule: false, ...yearFilter },
                include: [
                    { model: AnneeScolaire },
                    { model: PaiementFraisExigible, as: 'detailsExigibles', where: { annule: false }, required: false, include: [{ model: TarifFraisExigible, as: 'Tarif', include: [{ model: FraisExigible, as: 'Frais' }] }] },
                    { model: PaiementFraisPeriscolaire, as: 'detailsPeriscolaires', where: { annule: false }, required: false, include: [{ model: TarifFraisPeriscolaire, as: 'Tarif', include: [{ model: FraisActivitePeriscolaire, as: 'Frais' }] }] },
                    { model: PaiementTransport, as: 'detailsTransport', where: { annule: false }, required: false }
                ],
                order: [['createdAt', 'DESC']]
            });

            const historyByYear = {};
            allPayments.forEach(p => {
                const yLabel = p.AnneeScolaire?.libelleAnneeScolaire || "Inconnue";
                if (!historyByYear[yLabel]) historyByYear[yLabel] = { exigiblesMap: {}, periscolairesMap: {}, transport: 0, total: 0 };
                p.detailsExigibles?.forEach(d => {
                    const label = d.Tarif?.Frais?.fraisFr || "Scolarité";
                    historyByYear[yLabel].exigiblesMap[label] = (historyByYear[yLabel].exigiblesMap[label] || 0) + d.montantAlloue;
                });
                p.detailsPeriscolaires?.forEach(d => {
                    const label = d.Tarif?.Frais?.libelleFr || "Activité";
                    historyByYear[yLabel].periscolairesMap[label] = (historyByYear[yLabel].periscolairesMap[label] || 0) + d.montantAlloue;
                });
                p.detailsTransport?.forEach(d => { historyByYear[yLabel].transport += d.montantVerse; });
                historyByYear[yLabel].total += p.montantTotal;
            });

            documentData.paymentHistory = Object.keys(historyByYear).map(y => ({
                year: y,
                exigibles: Object.keys(historyByYear[y].exigiblesMap).map(label => ({ label, amount: historyByYear[y].exigiblesMap[label] })),
                periscolaires: Object.keys(historyByYear[y].periscolairesMap).map(label => ({ label, amount: historyByYear[y].periscolairesMap[label] })),
                transport: historyByYear[y].transport,
                total: historyByYear[y].total
            }));
        }
        res.json(documentData);
    } catch (error) {
        console.error("❌ Erreur getOfficialDocumentData:", error);
        res.status(500).json({ error: error.message });
    }
};
