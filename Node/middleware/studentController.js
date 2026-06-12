const { Eleve, Inscription, sequelize } = require("../models");

// 1. INSCRIPTION ET CRÉATION DE L'ÉLÈVE (Remote-First)
exports.registerAndEnrollStudent = async (req, res) => {
    console.log("📥 [POST] /register-enroll - Payload reçu:", JSON.stringify(req.body, null, 2));
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

// 4. RECUPERER TOUS LES ELEVES DE L'ETABLISSEMENT POUR UNE ANNEE
exports.getStudentsBySchoolYear = async (req, res) => {
    const { idAnneeScolaire } = req.params;
    try {
        const inscriptions = await Inscription.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [{
                model: Eleve
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
            const idClasse = ins.Salle?.Classe?.idClasse;

            // Calcul rapide du statut de paiement exigible
            let isSolded = false;
            let hasAnyPayment = false;

            if (idClasse) {
                const { TarifFraisExigible, PaiementFraisExigible, PaiementFraisGlobal } = require("../models");
                const totalDu = await TarifFraisExigible.sum('montantFraisExigible', {
                    where: { idClasse, idAnneeScolaire, supprimer: false }
                }) || 0;

                const totalPaye = await PaiementFraisExigible.sum('montantAlloue', {
                    include: [{
                        model: PaiementFraisGlobal,
                        where: { idEleve, idAnneeScolaire, annule: false }
                    }]
                }) || 0;

                isSolded = totalDu > 0 && totalPaye >= totalDu;
                hasAnyPayment = totalPaye > 0;
            }

            return {
                idEleve: ins.Eleve.idEleve,
                matricule: ins.Eleve.matricule || "N/A",
                nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                sexe: ins.Eleve.sexe,
                statutInscription: ins.statut,
                idClasse: idClasse || 0,
                classeLabel: ins.Salle ? `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}` : "N/A",
                dateInscription: ins.createdAt,
                isSolded,
                hasAnyPayment
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

        // Mise à jour de la salle si nécessaire
        if (data.idSalle && data.idAnneeScolaire) {
            await Inscription.update(
                { idSalle: data.idSalle, ancienEtablissement: data.ancienEtablissement },
                { where: { idEleve, idAnneeScolaire: data.idAnneeScolaire }, transaction: t }
            );
        }

        await t.commit();
        res.json({ message: "Élève mis à jour avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 6. DÉSACTIVER UNE INSCRIPTION (SOFT DELETE)
exports.deleteEnrollment = async (req, res) => {
    const { idEleve, idAnneeScolaire } = req.params;
    try {
        // On ne supprime pas physiquement l'élève, juste son inscription pour cette année
        const result = await Inscription.update(
            { supprimer: true, statut: 'DESACTIVE' },
            { where: { idEleve, idAnneeScolaire } }
        );

        if (result[0] > 0) {
            res.json({ message: "Inscription désactivée avec succès" });
        } else {
            res.status(404).json({ error: "Inscription introuvable" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
