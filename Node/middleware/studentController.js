const { Eleve, Inscription, sequelize } = require("../models");
const { Op } = require("sequelize");

// 1. INSCRIPTION ET CRÉATION DE L'ÉLÈVE (Remote-First)
exports.registerAndEnrollStudent = async (req, res) => {
    const { userId, role } = req.user;
    console.log(`📥 [POST] /register-enroll - Utilisateur ID: ${userId}, Rôle: ${role}`);
    console.log("Payload reçu:", JSON.stringify(req.body, null, 2));
    const t = await sequelize.transaction();
    try {
        const data = req.body;

        // Validation détaillée
        const required = ['nom', 'dateNaissance', 'lieuNaissance', 'idAnneeScolaire', 'idSalle'];
        const missing = required.filter(field => !data[field] || data[field] === 0 || data[field] === "0");

        if (missing.length > 0) {
            console.warn("⚠️ [400] Champs obligatoires manquants ou invalides:", missing);
            await t.rollback();
            return res.status(400).json({
                error: "Données invalides.",
                details: `Les champs suivants sont requis et non nuls: ${missing.join(', ')}`
            });
        }

        // Génération automatique du matricule si non fourni
        let finalMatricule = data.matricule;
        if (!finalMatricule) {
            const yearSuffix = new Date().getFullYear().toString().slice(-2);
            const random = Math.floor(1000 + Math.random() * 9000);
            finalMatricule = `SCH-${yearSuffix}-${random}`;
        }
        console.log(`🆔 Matricule utilisé: ${finalMatricule}`);

        // Étape A : Créer la fiche élève
        console.log("💾 Création de l'élève en base...");
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

        // Étape B : Créer son inscription
        console.log(`📝 Création de l'inscription pour l'élève ID: ${student.idEleve} dans la salle ID: ${data.idSalle}`);
        const nouvelleInscription = await Inscription.create({
            idEleve: student.idEleve,
            idAnneeScolaire: data.idAnneeScolaire,
            idSalle: data.idSalle,
            dateInscription: new Date(),
            ancienEtablissement: data.ancienEtablissement,
            nouveau: data.nouveau !== undefined ? data.nouveau : true,
            statut: "INSCRIT",
            supprimer: false
        }, { transaction: t });

        await t.commit();
        console.log("✅ Inscription réussie et transaction validée.");
        return res.status(201).json({
            message: "Élève enregistré et inscrit avec succès.",
            idEleve: student.idEleve,
            idInscription: nouvelleInscription.idInscription,
            matricule: finalMatricule
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ [500] Erreur lors de l'inscription:", error);
        return res.status(500).json({ error: "Échec de l'inscription de l'élève.", details: error.message });
    }
};

// 2. RECUPERER LES ELEVES D'UNE SALLE
exports.getStudentsByRoom = async (req, res) => {
    const { idAnneeScolaire, idSalle } = req.params;
    console.log(`🔍 [GET] /room/${idAnneeScolaire}/${idSalle} - Recherche des élèves...`);
    try {
        const inscriptions = await Inscription.findAll({
            where: { idAnneeScolaire, idSalle, supprimer: false },
            include: [{
                model: Eleve
            }, {
                model: require("../models").Salle,
                include: [{
                    model: require("../models").Classe,
                    as: 'Classe'
                }]
            }]
        });

        console.log(`📊 ${inscriptions.length} élève(s) trouvé(s).`);
        const result = inscriptions.map(ins => ({
            idEleve: ins.Eleve.idEleve,
            matricule: ins.Eleve.matricule || "N/A",
            nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
            sexe: ins.Eleve.sexe,
            statutInscription: ins.statut,
            idClasse: ins.Salle?.Classe?.idClasse || 0,
            classeLabel: ins.Salle?.Classe?.libelleClasseFr || "N/A",
            dateInscription: ins.createdAt
        }));

        res.json(result);
    } catch (error) {
        console.error("❌ Erreur getStudentsByRoom:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. RECHERCHER DES ÉLÈVES (POUR PAIEMENTS)
exports.searchStudents = async (req, res) => {
    const { idAnneeScolaire } = req.params;
    const { q } = req.query;
    const { Op } = require("sequelize");
    try {
        const inscriptions = await Inscription.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [{
                model: Eleve,
                where: {
                    [Op.or]: [
                        { nom: { [Op.like]: `%${q}%` } },
                        { prenom: { [Op.like]: `%${q}%` } },
                        { matricule: { [Op.like]: `%${q}%` } }
                    ]
                }
            }, {
                model: require("../models").Salle,
                include: [{
                    model: require("../models").Classe,
                    as: 'Classe'
                }]
            }],
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

// 9. DOCUMENTS OFFICIELS (CERTIFICATS, REÇUS GLOBAUX)
exports.getOfficialDocumentData = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    const { docType } = req.query;
    const user = req.user;

    try {
        const { Inscription, Salle, Classe, AnneeScolaire, Etablissement, PaiementFraisGlobal, PaiementFraisExigible, PaiementFraisPeriscolaire, PaiementTransport, TarifFraisExigible, FraisExigible, TarifFraisPeriscolaire, FraisActivitePeriscolaire, TarifTransport } = require("../models");

        const student = await Eleve.findByPk(idEleve);
        if (!student) return res.status(404).json({ error: "Élève non trouvé." });

        const inscription = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [{ model: Salle, include: [{ model: Classe, as: 'Classe' }] }, { model: AnneeScolaire }]
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

            // Grouping by year and aggregating by fee type
            const historyByYear = {};
            allPayments.forEach(p => {
                const yLabel = p.AnneeScolaire?.libelleAnneeScolaire || "Inconnue";
                if (!historyByYear[yLabel]) historyByYear[yLabel] = {
                    exigiblesMap: {},
                    periscolairesMap: {},
                    transport: 0,
                    total: 0
                };

                p.detailsExigibles?.forEach(d => {
                    const label = d.Tarif?.Frais?.fraisFr || "Scolarité";
                    historyByYear[yLabel].exigiblesMap[label] = (historyByYear[yLabel].exigiblesMap[label] || 0) + d.montantAlloue;
                });

                p.detailsPeriscolaires?.forEach(d => {
                    const label = d.Tarif?.Frais?.libelleFr || "Activité";
                    historyByYear[yLabel].periscolairesMap[label] = (historyByYear[yLabel].periscolairesMap[label] || 0) + d.montantAlloue;
                });

                p.detailsTransport?.forEach(d => {
                    historyByYear[yLabel].transport += d.montantVerse;
                });

                historyByYear[yLabel].total += p.montantTotal;
            });

            documentData.paymentHistory = Object.keys(historyByYear).map(y => {
                const yearData = historyByYear[y];
                return {
                    year: y,
                    exigibles: Object.keys(yearData.exigiblesMap).map(label => ({ label, amount: yearData.exigiblesMap[label] })),
                    periscolaires: Object.keys(yearData.periscolairesMap).map(label => ({ label, amount: yearData.periscolairesMap[label] })),
                    transport: yearData.transport,
                    total: yearData.total
                };
            });
        }

        res.json(documentData);
    } catch (error) {
        console.error("❌ Erreur getOfficialDocumentData:", error);
        res.status(500).json({ error: error.message });
    }
};

// 4. RECUPERER TOUS LES ELEVES DE L'ETABLISSEMENT POUR UNE ANNEE (AVEC SCOPING)
exports.getStudentsBySchoolYear = async (req, res) => {
    const { idAnneeScolaire } = req.params;
    const { userId, role } = req.user;

    console.log(`🔎 [GET] /school-year/${idAnneeScolaire} - Accès par Utilisateur ID: ${userId}, Rôle: ${role}`);

    try {
        const whereInscription = { idAnneeScolaire, supprimer: false };
        const whereEleve = { supprimer: false };

        // --- SCOPING LOGIC ---
        if (role === 'ADMINISTRATEUR') {
            console.log("🛡️ Rôle ADMINISTRATEUR: Accès global autorisé.");
        } else if (role === 'ENSEIGNANT' || role === 'CHEF_DE_DEPARTEMENT') {
            console.log(`👨‍🏫 Rôle ${role}: Scoping par salles assignées...`);
            const { RepartitionEnseignant, InscriptionPersonnel } = require("../models");
            const insPersonnel = await InscriptionPersonnel.findOne({
                where: { idUtilisateur: userId, idAnneeScolaire, supprimer: false }
            });
            if (insPersonnel) {
                const affectations = await RepartitionEnseignant.findAll({
                    where: { idInscriptionPersonnel: insPersonnel.idInscriptionPersonnel, supprimer: false }
                });
                const idSalles = [...new Set(affectations.map(a => a.idSalle))];
                whereInscription.idSalle = idSalles;
                console.log(`   -> ${idSalles.length} salles trouvées pour cet enseignant.`);
            } else {
                console.warn(`   ⚠️ Utilisateur ID ${userId} n'est pas inscrit en tant que personnel pour cette année.`);
                return res.json([]);
            }
        } else if (role === 'PARENT') {
            console.log(`👨‍👩‍👧 Rôle PARENT: Scoping par lien de parenté (Téléphone)...`);
            const { Utilisateur } = require("../models");
            const parent = await Utilisateur.findByPk(userId);
            whereEleve[Op.or] = [
                { telephonePere: parent.telephone },
                { telephoneMere: parent.telephone },
                { telephoneTuteur: parent.telephone }
            ];
            console.log(`   -> Recherche des élèves liés au téléphone: ${parent.telephone}`);
        } else if (role === 'ELEVE') {
            console.log(`🎓 Rôle ELEVE: Scoping individuel...`);
            const { Utilisateur } = require("../models");
            const me = await Utilisateur.findByPk(userId);
            if (me) {
                whereEleve.matricule = me.identifiant;
                console.log(`   -> Accès restreint au matricule: ${me.identifiant}`);
            }
        }

        const inscriptions = await Inscription.findAll({
            where: whereInscription,
            include: [{
                model: Eleve,
                where: whereEleve
            }, {
                model: require("../models").Salle,
                include: [{
                    model: require("../models").Classe,
                    as: 'Classe'
                }]
            }],
            order: [[Eleve, 'nom', 'ASC']]
        });

        const result = await Promise.all(inscriptions.map(async (ins) => {
            const idEleve = ins.Eleve.idEleve;
            const idInscription = ins.idInscription;
            const idClasse = ins.Salle?.Classe?.idClasse;

            const {
                TarifFraisExigible,
                PaiementFraisExigible,
                PaiementFraisGlobal,
                PaiementFraisPeriscolaire,
                PaiementTransport,
                Note
            } = require("../models");

            // 1. Calcul rapide du statut de paiement exigible
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
                        where: { idEleve, idAnneeScolaire, annule: false }
                    }]
                }) || 0;

                isSolded = totalDuExigible > 0 && totalPayeExigible >= totalDuExigible;
            }

            // 2. Vérification de l'existence de PAIEMENTS ACTIFS (Tous types)
            const hasAnyPayment = (totalPayeExigible > 0) ||
                (await PaiementFraisPeriscolaire.count({
                    where: { annule: false },
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve, idAnneeScolaire, annule: false }
                    }]
                }) > 0) ||
                (await PaiementTransport.count({
                    where: { annule: false },
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve, idAnneeScolaire, annule: false }
                    }]
                }) > 0);

            // 3. Vérification de l'existence de NOTES
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
                classeLabel: ins.Salle ? `${ins.Salle.Classe.libelleClasseFr}` : "N/A",
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
                hasAnyPayment,
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
    const { userId, role } = req.user;
    const data = req.body;
    console.log(`📝 [PUT] /student/${idEleve} - Utilisateur ID: ${userId}, Rôle: ${role}`);
    const t = await sequelize.transaction();
    try {
        const { Inscription, Note, PaiementFraisGlobal, PaiementFraisExigible, PaiementFraisPeriscolaire, PaiementTransport } = require("../models");

        const currentIns = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, supprimer: false }
        });

        // Si on tente de changer de salle (Transfert)
        if (currentIns && data.idSalle && parseInt(data.idSalle) !== currentIns.idSalle) {
            console.log(`🚀 Tentative de transfert: Salle ${currentIns.idSalle} -> ${data.idSalle}`);

            // 1. Vérification des NOTES
            const gradeCount = await Note.count({
                where: { idInscription: currentIns.idInscription, supprimer: false },
                transaction: t
            });

            if (gradeCount > 0) {
                throw new Error("Impossible de transférer un élève ayant déjà des notes enregistrées.");
            }

            // 2. Vérification des PAIEMENTS ACTIFS
            const hasPayments = (await PaiementFraisExigible.count({
                where: { annule: false },
                include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, annule: false } }],
                transaction: t
            }) > 0) || (await PaiementFraisPeriscolaire.count({
                where: { annule: false },
                include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, annule: false } }],
                transaction: t
            }) > 0) || (await PaiementTransport.count({
                where: { annule: false },
                include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire: data.idAnneeScolaire, annule: false } }],
                transaction: t
            }) > 0);

            if (hasPayments) {
                throw new Error("Impossible de transférer un élève ayant des paiements actifs. Veuillez d'abord annuler ses transactions financières.");
            }

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
        console.error("❌ Erreur updateStudent:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// 6. DÉSACTIVER UNE INSCRIPTION (SOFT DELETE)
exports.deleteEnrollment = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    const { userId, role } = req.user;
    console.log(`🗑️ [DELETE] /enrollment/${idEleve}/${idAnneeScolaire} - Utilisateur ID: ${userId}, Rôle: ${role}`);
    try {
        const { Inscription, Note, PaiementFraisGlobal, PaiementFraisExigible, PaiementFraisPeriscolaire, PaiementTransport } = require("../models");

        const ins = await Inscription.findOne({ where: { idEleve, idAnneeScolaire, supprimer: false } });
        if (!ins) return res.status(404).json({ error: "Inscription introuvable" });

        // 1. Check Grades
        const gradeCount = await Note.count({ where: { idInscription: ins.idInscription, supprimer: false } });
        if (gradeCount > 0) return res.status(400).json({ error: "Impossible de supprimer l'inscription: des notes sont déjà enregistrées." });

        // 2. Check Payments
        const hasPayments = (await PaiementFraisExigible.count({
            where: { annule: false },
            include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: false } }]
        }) > 0) || (await PaiementFraisPeriscolaire.count({
            where: { annule: false },
            include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: false } }]
        }) > 0) || (await PaiementTransport.count({
            where: { annule: false },
            include: [{ model: PaiementFraisGlobal, where: { idEleve, idAnneeScolaire, annule: false } }]
        }) > 0);

        if (hasPayments) return res.status(400).json({ error: "Impossible de supprimer l'inscription: des paiements actifs existent." });

        // On ne supprime pas physiquement l'élève, juste son inscription pour cette année
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
        const { Inscription, Salle, Classe } = require("../models");
        const student = await Eleve.findByPk(idEleve, {
            include: [{
                model: Inscription,
                where: { supprimer: false },
                required: false,
                include: [{
                    model: Salle,
                    include: [{ model: Classe, as: 'Classe' }]
                }]
            }]
        });

        if (!student) return res.status(404).json({ error: "Élève non trouvé." });

        const lastIns = student.Inscriptions && student.Inscriptions.length > 0 ? student.Inscriptions[0] : null;

        res.json({
            ...student.toJSON(),
            idSalle: lastIns ? lastIns.idSalle : null,
            classeLabel: lastIns && lastIns.Salle ? `${lastIns.Salle.Classe.libelleClasseFr}` : null,
            nomComplet: `${student.nom} ${student.prenom || ""}`.trim()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. RECHERCHE GLOBALE D'ÉLÈVES (AVEC STATUT INSCRIPTION ANNÉE COURANTE)
exports.globalSearchStudents = async (req, res) => {
    const { q, idAnneeScolaire } = req.query;
    try {
        const { Inscription, Salle, Classe } = require("../models");
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
                where: { idAnneeScolaire, supprimer: false },
                required: false,
                include: [{ model: Salle, include: [{ model: Classe, as: 'Classe' }] }]
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
                dateNaissance: s.dateNaissance,
                lieuNaissance: s.lieuNaissance,
                quartier: s.quartier,
                nomPere: s.nomPere,
                telephonePere: s.telephonePere,
                nomMere: s.nomMere,
                telephoneMere: s.telephoneMere,
                nomTuteur: s.nomTuteur,
                telephoneTuteur: s.telephoneTuteur,
                isInscribed: !!currentIns,
                classeLabel: currentIns && currentIns.Salle ? `${currentIns.Salle.Classe.libelleClasseFr} ${currentIns.Salle.nomSalle}` : null
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 9. DOCUMENTS OFFICIELS (CERTIFICATS, REÇUS GLOBAUX)
exports.getOfficialDocumentData = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    const { docType } = req.query;
    const user = req.user;

    try {
        const { Inscription, Salle, Classe, AnneeScolaire, Etablissement, PaiementFraisGlobal, PaiementFraisExigible, PaiementFraisPeriscolaire, PaiementTransport, TarifFraisExigible, FraisExigible, TarifFraisPeriscolaire, FraisActivitePeriscolaire, TarifTransport } = require("../models");

        const student = await Eleve.findByPk(idEleve);
        if (!student) return res.status(404).json({ error: "Élève non trouvé." });

        const inscription = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [{ model: Salle, include: [{ model: Classe, as: 'Classe' }] }, { model: AnneeScolaire }]
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

            // Grouping by year and aggregating by fee type
            const historyByYear = {};
            allPayments.forEach(p => {
                const yLabel = p.AnneeScolaire?.libelleAnneeScolaire || "Inconnue";
                if (!historyByYear[yLabel]) historyByYear[yLabel] = {
                    exigiblesMap: {},
                    periscolairesMap: {},
                    transport: 0,
                    total: 0
                };

                p.detailsExigibles?.forEach(d => {
                    const label = d.Tarif?.Frais?.fraisFr || "Scolarité";
                    historyByYear[yLabel].exigiblesMap[label] = (historyByYear[yLabel].exigiblesMap[label] || 0) + d.montantAlloue;
                });

                p.detailsPeriscolaires?.forEach(d => {
                    const label = d.Tarif?.Frais?.libelleFr || "Activité";
                    historyByYear[yLabel].periscolairesMap[label] = (historyByYear[yLabel].periscolairesMap[label] || 0) + d.montantAlloue;
                });

                p.detailsTransport?.forEach(d => {
                    historyByYear[yLabel].transport += d.montantVerse;
                });

                historyByYear[yLabel].total += p.montantTotal;
            });

            documentData.paymentHistory = Object.keys(historyByYear).map(y => {
                const yearData = historyByYear[y];
                return {
                    year: y,
                    exigibles: Object.keys(yearData.exigiblesMap).map(label => ({ label, amount: yearData.exigiblesMap[label] })),
                    periscolaires: Object.keys(yearData.periscolairesMap).map(label => ({ label, amount: yearData.periscolairesMap[label] })),
                    transport: yearData.transport,
                    total: yearData.total
                };
            });
        }

        res.json(documentData);
    } catch (error) {
        console.error("❌ Erreur getOfficialDocumentData:", error);
        res.status(500).json({ error: error.message });
    }
};
