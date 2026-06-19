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
    sequelize
} = require("../models");
const { Op } = require("sequelize");

// 1. BIBLIOTHEQUE DES FRAIS
exports.getFraisExigiblesLibrary = async (req, res) => {
    try {
        const library = await FraisExigible.findAll({ where: { supprimer: false } });
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createFraisExigible = async (req, res) => {
    try {
        const { fraisFr, fraisEn, description } = req.body;
        const frais = await FraisExigible.create({ fraisFr, fraisEn, description });
        res.status(201).json(frais);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateFraisExigible = async (req, res) => {
    try {
        const { id } = req.params;
        await FraisExigible.update(req.body, { where: { idFraisExigible: id } });
        res.json({ message: "Frais mis à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFraisExigible = async (req, res) => {
    try {
        const { id } = req.params;

        // 🛡️ Contrainte 1 : Ne pas supprimer si utilisé dans des tarifs de classe
        const countTarifs = await TarifFraisExigible.count({ where: { idFraisExigible: id, supprimer: false } });
        if (countTarifs > 0) {
            return res.status(400).json({ error: "Ce type de frais est utilisé dans des configurations de classe et ne peut pas être supprimé." });
        }

        await FraisExigible.update({ supprimer: true }, { where: { idFraisExigible: id } });
        res.json({ message: "Frais supprimé" });
    } catch (error) {
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
        res.status(500).json({ error: error.message });
    }
};

// 3. CONFIGURER LES TARIFS (CRUD)
exports.saveTarifs = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idClasse, idAnneeScolaire, tarifs } = req.body;

        // 🛡️ Contrainte 2 : Ne pas supprimer/modifier des tarifs qui ont déjà des paiements
        const existingTarifs = await TarifFraisExigible.findAll({ where: { idClasse, idAnneeScolaire } });
        for (const old of existingTarifs) {
            const hasPayment = await PaiementFraisExigible.findOne({
                where: { idTarifFraisExigible: old.idTarifFraisExigible },
                transaction: t
            });

            // Si le frais est retiré mais qu'il y a des paiements
            const isRemoved = !tarifs.find(nt => nt.idFrais == old.idFraisExigible);
            if (isRemoved && hasPayment) {
                await t.rollback();
                return res.status(400).json({ error: `Impossible de supprimer le frais '${old.idFraisExigible}' : des paiements y sont déjà rattachés.` });
            }
        }

        // Si tout va bien, on remplace
        await TarifFraisExigible.destroy({
            where: { idClasse, idAnneeScolaire },
            transaction: t
        });

        for (const item of tarifs) {
            await TarifFraisExigible.create({
                montantFraisExigible: item.montant,
                ordrePaiement: item.ordre,
                dateLimite: item.dateLimite,
                dateAlerte: item.dateAlerte,
                idClasse,
                idFraisExigible: item.idFrais,
                idAnneeScolaire
            }, { transaction: t });
        }

        await t.commit();
        res.json({ message: "Tarifs mis à jour avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 4. EFFECTUER UN PAIEMENT (LOGIQUE FIFO)
exports.payerFraisExigibles = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idAnneeScolaire, idClasse, montantVerse, modePaiement, reference } = req.body;
        let resteAPayer = parseInt(montantVerse);

        if (resteAPayer <= 0) return res.status(400).json({ error: "Montant invalide" });

        // 1. Créer l'en-tête de paiement
        const global = await PaiementFraisGlobal.create({
            montantTotal: resteAPayer,
            modePaiement,
            referenceTransaction: reference,
            idEleve,
            idAnneeScolaire,
            idCaissier: req.user.userId
        }, { transaction: t });

        // 2. Récupérer tous les tarifs de la classe ordonnés par priorité
        const tarifs = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            order: [['ordrePaiement', 'ASC']],
            transaction: t
        });

        for (const tarif of tarifs) {
            if (resteAPayer <= 0) break;

            // Calculer combien a déjà été payé par cet élève pour CE tarif précis
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisExigible: tarif.idTarifFraisExigible },
                transaction: t
            }) || 0;

            const duSurCeFrais = tarif.montantFraisExigible - dejaPaye;

            if (duSurCeFrais > 0) {
                const allocation = Math.min(resteAPayer, duSurCeFrais);

                await PaiementFraisExigible.create({
                    montantAlloue: allocation,
                    idTarifFraisExigible: tarif.idTarifFraisExigible,
                    idPaiementFraisGlobal: global.idPaiementFraisGlobal
                }, { transaction: t });

                resteAPayer -= allocation;
            }
        }

        await t.commit();
        res.status(201).json({
            message: "Paiement enregistré",
            idPaiement: global.idPaiementFraisGlobal,
            tropPercu: resteAPayer
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 5. ETAT DE RECOUVREMENT PAR CLASSE
exports.getRecouvrementStats = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.params;

        const tarifs = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: "Frais" }],
            order: [['ordrePaiement', 'ASC']]
        });

        // On compte les élèves inscrits dans cette classe pour cette année
        const { Inscription } = require("../models");
        const nbEleves = await Inscription.count({
            where: { idAnneeScolaire, supprimer: false },
            include: [{
                model: require("../models").Salle,
                where: { idClasse }
            }]
        });

        const stats = await Promise.all(tarifs.map(async (t) => {
            const totalAttendu = t.montantFraisExigible * nbEleves;
            const totalEncaisse = await PaiementFraisExigible.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisExigible: t.idTarifFraisExigible }
            }) || 0;

            return {
                idTarif: t.idTarifFraisExigible,
                libelle: t.Frais.fraisFr,
                montantUnitaire: t.montantFraisExigible,
                attendu: totalAttendu,
                encaisse: totalEncaisse,
                pourcentage: totalAttendu > 0 ? (totalEncaisse / totalAttendu) : 0
            };
        }));

        res.json({ nbEleves, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. DETAILS DES PAIEMENTS D'UN ELEVE (POUR LE RECU/BOTTOMSHEET)
exports.getStudentPaymentDetails = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const { Inscription, Salle, Classe, TarifFraisExigible, FraisExigible, PaiementFraisExigible, PaiementFraisGlobal, Eleve } = require("../models");

        // 1. Trouver l'élève et sa classe
        const ins = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [
                { model: Eleve },
                {
                    model: Salle,
                    include: [{ model: Classe, as: 'Classe' }]
                }
            ]
        });

        if (!ins || !ins.Salle || !ins.Salle.Classe) {
            return res.status(404).json({ error: "Élève non inscrit pour cette année." });
        }

        const idClasse = ins.Salle.Classe.idClasse;

        // 2. Récupérer tous les tarifs configurés pour cette classe
        const tarifs = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: "Frais" }],
            order: [['ordrePaiement', 'ASC']]
        });

        // 3. Récupérer les détails pour chaque frais
        const details = await Promise.all(tarifs.map(async (t) => {
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisExigible: t.idTarifFraisExigible }
            }) || 0;

            return {
                idTarif: t.idTarifFraisExigible,
                libelle: t.Frais.fraisFr,
                montantDu: t.montantFraisExigible,
                montantPaye: dejaPaye,
                reste: t.montantFraisExigible - dejaPaye,
                isComplet: dejaPaye >= t.montantFraisExigible
            };
        }));

        const totalDejaVerse = details.reduce((sum, item) => sum + item.montantPaye, 0);
        const totalTotalDu = details.reduce((sum, item) => sum + item.montantDu, 0);

        res.json({
            nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
            classeLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`,
            totalDejaVerse,
            totalTotalDu,
            resteGlobal: totalTotalDu - totalDejaVerse,
            frais: details
        });

    } catch (error) {
        console.error("❌ [FinanceController] Erreur getStudentPaymentDetails:", error);
        res.status(500).json({ error: error.message });
    }
};

// 6. CLASSES MANQUANT UN FRAIS SPECIFIQUE
exports.getClassesMissingFrais = async (req, res) => {
    try {
        const { idFrais, idAnneeScolaire } = req.params;
        const { Classe, TarifFraisExigible, EtablissementStructure } = require("../models");

        // 1. Trouver les types d'enseignements configurés pour cette année
        const configs = await EtablissementStructure.findAll({ where: { idAnneeScolaire } });
        const idsEns = configs.map(c => c.idEnseignement);

        // 2. Trouver toutes les classes de ces enseignements
        const allClasses = await Classe.findAll({
            include: [{
                model: require("../models").Cycle,
                as: "Cycle",
                where: { idEnseignement: idsEns }
            }]
        });

        // 3. Filtrer celles qui ont déjà ce frais
        const existingTarifs = await TarifFraisExigible.findAll({
            where: { idFraisExigible: idFrais, idAnneeScolaire }
        });
        const classIdsWithFrais = existingTarifs.map(t => t.idClasse);

        const missing = allClasses.filter(c => !classIdsWithFrais.includes(c.idClasse));

        // Pour chaque classe, on récupère ses frais actuels pour permettre le positionnement
        const result = await Promise.all(missing.map(async (c) => {
            const currentFrais = await TarifFraisExigible.findAll({
                where: { idClasse: c.idClasse, idAnneeScolaire, supprimer: false },
                include: [{ model: FraisExigible, as: "Frais" }],
                order: [['ordrePaiement', 'ASC']]
            });
            return {
                idClasse: c.idClasse,
                libelleClasse: c.libelleClasseFr,
                currentFrais: currentFrais.map(f => ({ id: f.idFraisExigible, label: f.Frais.fraisFr, ordre: f.ordrePaiement }))
            };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 18. LISTE DES TRANSACTIONS D'UN ÉLÈVE
exports.getStudentTransactions = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const { PaiementFraisGlobal } = require("../models");
        const transactions = await PaiementFraisGlobal.findAll({
            where: { idEleve, idAnneeScolaire },
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 9. GÉNÉRATION DES DONNÉES DU REÇU D'INSCRIPTION
exports.getRegistrationReceiptData = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        console.log(`🖨️ Génération reçu pour Elève:${idEleve}, Année:${idAnneeScolaire}`);

        const {
            Inscription, Eleve, Salle, Classe, AnneeScolaire, Etablissement,
            PaiementFraisGlobal, PaiementFraisExigible, TarifFraisExigible, FraisExigible,
            PaiementFraisPeriscolaire, TarifFraisPeriscolaire, FraisActivitePeriscolaire,
            PaiementTransport, Utilisateur
        } = require("../models");

        // 1. Infos élève et inscription
        const ins = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [
                { model: Eleve },
                { model: AnneeScolaire },
                {
                    model: Salle,
                    include: [{ model: Classe, as: 'Classe' }]
                }
            ]
        });

        if (!ins) {
            console.warn("⚠️ Inscription non trouvée");
            return res.status(404).json({ error: "Inscription non trouvée." });
        }

        // 2. Infos établissement
        const school = await Etablissement.findOne();

        // 3. Dernier paiement pour cet élève
        const lastPayment = await PaiementFraisGlobal.findOne({
            where: { idEleve, idAnneeScolaire, annule: false },
            order: [['createdAt', 'DESC']],
            include: [{ model: Utilisateur, as: 'Caissier', attributes: ['nom'] }]
        });

        if (!lastPayment) {
            console.warn("⚠️ Aucun paiement trouvé");
            return res.status(404).json({ error: "Aucun paiement trouvé pour cet élève." });
        }

        // 4. Détail de la répartition du montant reçu (Aujourd'hui)
        // On récupère TOUS les tarifs exigibles de la classe pour montrer la ventilation (même si 0)
        const idClasse = ins.Salle.Classe.idClasse;
        const allTarifsExigibles = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: 'Frais' }],
            order: [['ordrePaiement', 'ASC']]
        });

        const currentAllocationsExigible = await PaiementFraisExigible.findAll({
            where: { idPaiementFraisGlobal: lastPayment.idPaiementFraisGlobal, annule: false }
        });

        const todayBreakdown = allTarifsExigibles.map(t => {
            const alloc = currentAllocationsExigible.find(a => a.idTarifFraisExigible === t.idTarifFraisExigible);
            return {
                libelle: t.Frais?.fraisFr || "Frais inconnu",
                montantAlloue: alloc ? alloc.montantAlloue : 0
            };
        });

        // Si le paiement concernait aussi (ou uniquement) le périscolaire
        const currentAllocationsPeri = await PaiementFraisPeriscolaire.findAll({
            where: { idPaiementFraisGlobal: lastPayment.idPaiementFraisGlobal, annule: false },
            include: [{
                model: TarifFraisPeriscolaire, as: 'Tarif',
                include: [{ model: FraisActivitePeriscolaire, as: 'Frais' }]
            }]
        });

        currentAllocationsPeri.forEach(p => {
            todayBreakdown.push({
                libelle: p.Tarif?.Frais?.libelleFr || "Activité",
                montantAlloue: p.montantAlloue
            });
        });

        // 5. État actuel des frais (Historique Global)
        const tarifsExigibles = await TarifFraisExigible.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: FraisExigible, as: "Frais" }],
            order: [['ordrePaiement', 'ASC']]
        });

        const fullHistory = await Promise.all(tarifsExigibles.map(async (t, index) => {
            const dejaPaye = await PaiementFraisExigible.sum('montantAlloue', {
                where: {
                    idTarifFraisExigible: t.idTarifFraisExigible,
                    annule: false
                },
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: false }
                }]
            }) || 0;

            return {
                ordre: index + 1,
                libelle: t.Frais?.fraisFr || "Inconnu",
                montantTotal: t.montantFraisExigible,
                augmentation: 0,
                reduction: 0,
                dejaPaye: dejaPaye,
                reste: t.montantFraisExigible - dejaPaye
            };
        }));

        const totalDejaVerse = fullHistory.reduce((sum, h) => sum + h.dejaPaye, 0);
        const totalTotalDu = fullHistory.reduce((sum, h) => sum + h.montantTotal, 0);

        const data = {
            schoolInfo: {
                name: school?.nomFr || "INSTITUT BILINGUE ROGER AMPERE",
                devise: school?.devise || "Discipline - Travail - Succès",
                ministry: school?.tutelle || "Ministère des Enseignements Secondaires",
                address: school?.adresse,
                bp: school?.bp,
                phones: school?.telephone1?.toString(),
                email: school?.email,
                authorizationNo: school?.numeroAgrement,
                logoUrl: school?.logo
            },
            receiptInfo: {
                title: "REÇU DE PAIEMENT",
                receiptNo: `FS-${lastPayment.idPaiementFraisGlobal}`,
                schoolYear: ins.AnneeScolaire.libelleAnneeScolaire,
                dateTime: lastPayment.createdAt,
                operationTime: lastPayment.createdAt
            },
            studentInfo: {
                matricule: ins.Eleve.matricule,
                fullName: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                classLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`,
                dateNaissance: ins.Eleve.dateNaissance,
                lieuNaissance: ins.Eleve.lieuNaissance,
                sexe: ins.Eleve.sexe === 'M' ? 'MASCULIN' : 'FEMININ',
                redoublant: ins.nouveau ? 'NON' : 'OUI'
            },
            financialDetail: {
                nature: "Paiement frais de scolarité",
                amountDigits: lastPayment.montantTotal,
                amountWords: "...",
                paymentMode: lastPayment.modePaiement,
                balance: totalDejaVerse,
                remaining: totalTotalDu - totalDejaVerse,
                penalties: 0,
                printedBy: lastPayment.Caissier?.nom || "ADMINISTRATEUR",
                todayBreakdown,
                fullHistory
            },
            validation: {
                cashierName: lastPayment.Caissier?.nom || "La Caisse",
                qrContent: `REF:${lastPayment.idPaiementFraisGlobal}-EL:${idEleve}`
            }
        };

        console.log("✅ Données reçu générées avec succès");
        res.json(data);
    } catch (error) {
        console.error("❌ Erreur getRegistrationReceiptData:", error);
        res.status(500).json({ error: error.message });
    }
};

// 17. ANNULER UN PAIEMENT (GLOBAL + DÉTAILS)
exports.annulerPaiement = async (req, res) => {
    const { idPaiementFraisGlobal } = req.params;
    const t = await sequelize.transaction();
    try {
        const { PaiementFraisGlobal, PaiementFraisExigible, PaiementFraisPeriscolaire, PaiementTransport } = require("../models");

        // 0. Vérification LIFO (Last In First Out)
        // On récupère le paiement à annuler
        const paiementToCancel = await PaiementFraisGlobal.findByPk(idPaiementFraisGlobal);
        if (!paiementToCancel) throw new Error("Paiement introuvable.");
        if (paiementToCancel.annule) throw new Error("Ce paiement est déjà annulé.");

        // On cherche s'il existe un paiement valide PLUS RÉCENT pour cet élève
        const moreRecent = await PaiementFraisGlobal.findOne({
            where: {
                idEleve: paiementToCancel.idEleve,
                idAnneeScolaire: paiementToCancel.idAnneeScolaire,
                annule: false,
                createdAt: { [Op.gt]: paiementToCancel.createdAt }
            },
            transaction: t
        });

        if (moreRecent) {
            throw new Error(`Impossible d'annuler cette transaction. Vous devez d'abord annuler la transaction la plus récente (#FS-${moreRecent.idPaiementFraisGlobal} du ${moreRecent.createdAt.toLocaleDateString()}) pour respecter l'ordre chronologique.`);
        }

        // 1. Marquer le paiement global comme annulé
        await PaiementFraisGlobal.update({ annule: true }, { where: { idPaiementFraisGlobal }, transaction: t });

        // 2. Marquer tous les détails comme annulés
        await PaiementFraisExigible.update({ annule: true }, { where: { idPaiementFraisGlobal }, transaction: t });
        await PaiementFraisPeriscolaire.update({ annule: true }, { where: { idPaiementFraisGlobal }, transaction: t });
        await PaiementTransport.update({ annule: true }, { where: { idPaiementFraisGlobal }, transaction: t });

        await t.commit();
        res.json({ message: "Paiement annulé avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Erreur annulerPaiement:", error.message);
        res.status(400).json({ error: error.message });
    }
};

// 19. GÉNÉRATION DES DONNÉES DU REÇU D'INSCRIPTION (Sans finances)
exports.getSimpleRegistrationReceipt = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const { Inscription, Eleve, Salle, Classe, AnneeScolaire, Etablissement } = require("../models");

        const ins = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [
                { model: Eleve },
                { model: AnneeScolaire },
                { model: Salle, include: [{ model: Classe, as: 'Classe' }] }
            ]
        });

        if (!ins) return res.status(404).json({ error: "Inscription non trouvée." });
        const school = await Etablissement.findOne();

        const data = {
            schoolInfo: {
                name: school?.nomFr || "INSTITUT BILINGUE ROGER AMPERE",
                devise: school?.devise || "Discipline - Travail - Succès",
                ministry: school?.tutelle || "Ministère des Enseignements Secondaires",
                address: school?.adresse,
                bp: school?.bp,
                phones: school?.telephone1?.toString(),
                email: school?.email,
                logoUrl: school?.logo
            },
            receiptInfo: {
                title: "FICHE D'INSCRIPTION",
                receiptNo: `INS-${ins.idInscription}`,
                schoolYear: ins.AnneeScolaire.libelleAnneeScolaire,
                dateTime: ins.createdAt
            },
            studentInfo: {
                matricule: ins.Eleve.matricule,
                fullName: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                classLabel: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`,
                dateNaissance: ins.Eleve.dateNaissance,
                lieuNaissance: ins.Eleve.lieuNaissance,
                sexe: ins.Eleve.sexe === 'M' ? 'MASCULIN' : 'FEMININ',
                redoublant: ins.nouveau ? 'NON' : 'OUI'
            },
            validation: {
                qrContent: `INSCRIPTION:${ins.idInscription}-MAT:${ins.Eleve.matricule}`
            }
        };

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.bulkApplyTarif = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idFrais, idAnneeScolaire, montant, dateLimite, dateAlerte, applications } = req.body;

        for (const app of applications) {
            // Vérifier si paiements existent pour la classe
            const hasPayments = await PaiementFraisExigible.findOne({
                include: [
                    {
                        model: require("../models").PaiementFraisGlobal,
                        where: { idAnneeScolaire }
                    },
                    {
                        model: TarifFraisExigible,
                        as: 'Tarif',
                        where: { idClasse: app.idClasse }
                    }
                ],
                transaction: t
            });

            if (hasPayments) {
                throw new Error(`La classe ID ${app.idClasse} a déjà des paiements. Modification d'ordre impossible.`);
            }

            // Décaler les ordres existants si nécessaire
            await TarifFraisExigible.increment('ordrePaiement', {
                by: 1,
                where: {
                    idClasse: app.idClasse,
                    idAnneeScolaire,
                    ordrePaiement: { [Op.gte]: app.newOrder }
                },
                transaction: t
            });

            // Créer le nouveau tarif
            await TarifFraisExigible.create({
                montantFraisExigible: montant,
                ordrePaiement: app.newOrder,
                dateLimite,
                dateAlerte,
                idClasse: app.idClasse,
                idFraisExigible: idFrais,
                idAnneeScolaire
            }, { transaction: t });
        }

        await t.commit();
        res.json({ message: "Tarif appliqué aux classes sélectionnées" });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 10. BILAN JOURNALIER
exports.getBilanJournalier = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { date } = req.query; // YYYY-MM-DD
        const targetDate = date || new Date().toISOString().split('T')[0];

        const { PaiementFraisGlobal } = require("../models");

        // Heure par heure (ex: 8h, 9h, ... 18h)
        const hourlyData = await sequelize.query(`
            SELECT strftime('%H', createdAt) as hour, SUM(montantTotal) as total
            FROM PaiementFraisGlobal
            WHERE idAnneeScolaire = :idAnneeScolaire
            AND date(createdAt) = :targetDate
            AND annule = 0
            GROUP BY hour
            ORDER BY hour ASC
        `, {
            replacements: { idAnneeScolaire, targetDate },
            type: sequelize.QueryTypes.SELECT
        });

        const transactions = await PaiementFraisGlobal.findAll({
            where: {
                idAnneeScolaire,
                annule: false,
                createdAt: {
                    [Op.gte]: targetDate + " 00:00:00",
                    [Op.lte]: targetDate + " 23:59:59"
                }
            },
            include: [{ model: Eleve, attributes: ['nom', 'prenom', 'matricule'] }],
            order: [['createdAt', 'ASC']]
        });

        res.json({
            date: targetDate,
            chartData: hourlyData.map(d => ({ label: `${d.hour}h`, value: parseFloat(d.total) })),
            transactions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 11. BILAN MENSUEL
exports.getBilanMensuel = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { month, year } = req.query; // MM, YYYY
        const targetMonth = month || (new Date().getMonth() + 1).toString().padStart(2, '0');
        const targetYear = year || new Date().getFullYear();

        const dailyData = await sequelize.query(`
            SELECT date(createdAt) as day, SUM(montantTotal) as total
            FROM PaiementFraisGlobal
            WHERE idAnneeScolaire = :idAnneeScolaire
            AND strftime('%m', createdAt) = :targetMonth
            AND strftime('%Y', createdAt) = :targetYear
            AND annule = 0
            GROUP BY day
            ORDER BY total DESC
        `, {
            replacements: { idAnneeScolaire, targetMonth: targetMonth.toString().padStart(2, '0'), targetYear },
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            period: `${targetMonth}/${targetYear}`,
            chartData: dailyData.map(d => ({ label: d.day.split('-')[2], value: parseFloat(d.total) })),
            topDays: dailyData.slice(0, 5)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 12. BILAN ANNUEL (RESTREINT)
exports.getBilanAnnuel = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;

        const monthlyData = await sequelize.query(`
            SELECT strftime('%m', createdAt) as month, SUM(montantTotal) as total
            FROM PaiementFraisGlobal
            WHERE idAnneeScolaire = :idAnneeScolaire
            AND annule = 0
            GROUP BY month
            ORDER BY month ASC
        `, {
            replacements: { idAnneeScolaire },
            type: sequelize.QueryTypes.SELECT
        });

        const monthLabels = ["Sep", "Oct", "Nov", "Dec", "Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou"];
        // On réordonne pour l'année scolaire (Septembre -> Août)
        const chartData = monthLabels.map((label, index) => {
            const m = ((index + 8) % 12) + 1;
            const found = monthlyData.find(d => parseInt(d.month) === m);
            return { label, value: found ? parseFloat(found.total) : 0 };
        });

        res.json({ chartData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 13. COMPARAISON DE PERFORMANCE (Rp)
exports.getPerformanceComparison = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const { idCycle, idEnseignement } = req.query;

        const { Salle, Classe, Cycle } = require("../models");

        // 1. Lister les salles du périmètre
        const whereSalle = {};
        if (idCycle) whereSalle['$Classe.Cycle.idCycle$'] = idCycle;
        if (idEnseignement) whereSalle['$Classe.Cycle.idEnseignement$'] = idEnseignement;

        const salles = await Salle.findAll({
            include: [{
                model: Classe,
                as: 'Classe',
                include: [{ model: Cycle, as: 'Cycle' }]
            }],
            where: whereSalle
        });

        const comparison = await Promise.all(salles.map(async (s) => {
            const stats = await exports.getRecouvrementStatsInternal(s.idClasse, idAnneeScolaire, s.idSalle);
            return {
                idSalle: s.idSalle,
                nomSalle: `${s.Classe.libelleClasseFr} ${s.nomSalle}`,
                cycle: s.Classe.Cycle.libelleCycleFr,
                totalAttendu: stats.totalAttendu,
                totalEncaisse: stats.totalEncaisse,
                rp: stats.totalAttendu > 0 ? (stats.totalEncaisse / stats.totalAttendu) * 100 : 0
            };
        }));

        // Trier par Rp décroissant
        comparison.sort((a, b) => b.rp - a.rp);

        res.json(comparison);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fonction interne pour calculer les stats globales d'une salle
exports.getRecouvrementStatsInternal = async (idClasse, idAnneeScolaire, idSalle) => {
    const { Inscription, TarifFraisExigible, PaiementFraisExigible, PaiementFraisGlobal } = require("../models");

    const nbEleves = await Inscription.count({
        where: { idAnneeScolaire, idSalle, supprimer: false }
    });

    const totalUnitaire = await TarifFraisExigible.sum('montantFraisExigible', {
        where: { idClasse, idAnneeScolaire, supprimer: false }
    }) || 0;

    const totalAttendu = totalUnitaire * nbEleves;

    const totalEncaisse = await PaiementFraisExigible.sum('montantAlloue', {
        include: [{
            model: PaiementFraisGlobal,
            where: { idAnneeScolaire, annule: false },
            include: [{
                model: Inscription,
                where: { idSalle }
            }]
        }]
    }) || 0;

    return { totalAttendu, totalEncaisse };
};

// 14. LISTE DES INSOLVABLES
exports.getInsolvablesList = async (req, res) => {
    try {
        const { idAnneeScolaire, idTranche } = req.params; // idTranche = idTarifFraisExigible
        const { idSalle, idClasse, severity } = req.query;

        const { Inscription, Eleve, Salle, Classe, PaiementFraisExigible, PaiementFraisGlobal, TarifFraisExigible } = require("../models");

        const tarif = await TarifFraisExigible.findByPk(idTranche);
        if (!tarif) return res.status(404).json({ error: "Tranche non trouvée" });

        const whereIns = { idAnneeScolaire, supprimer: false };
        if (idSalle) whereIns.idSalle = idSalle;

        const inscriptions = await Inscription.findAll({
            where: whereIns,
            include: [
                { model: Eleve },
                { model: Salle, include: [{ model: Classe, as: 'Classe' }] }
            ]
        });

        const result = [];
        for (const ins of inscriptions) {
            const verse = await PaiementFraisExigible.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve: ins.idEleve, idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisExigible: idTranche }
            }) || 0;

            const dette = tarif.montantFraisExigible - verse;
            const tauxDefaillance = (dette / tarif.montantFraisExigible) * 100;

            if (dette > 0) {
                if (severity === 'TOTAL' && verse > 0) continue;

                result.push({
                    matricule: ins.Eleve.matricule,
                    nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                    classeSalle: `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}`,
                    montantExigible: tarif.montantFraisExigible,
                    montantVerse: verse,
                    dette,
                    tauxDefaillance
                });
            }
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 18. LISTE DES TRANSACTIONS D'UN ÉLÈVE
exports.getStudentTransactions = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const { PaiementFraisGlobal } = require("../models");
        const transactions = await PaiementFraisGlobal.findAll({
            where: { idEleve, idAnneeScolaire },
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 1b. BIBLIOTHÈQUE DES FRAIS PÉRISCOLAIRES
exports.getFraisPeriscolairesLibrary = async (req, res) => {
    try {
        const library = await FraisActivitePeriscolaire.findAll({ where: { supprimer: false } });
        res.json(library);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createFraisPeriscolaire = async (req, res) => {
    try {
        const { libelleFr, libelleEn, description } = req.body;
        const frais = await FraisActivitePeriscolaire.create({ libelleFr, libelleEn, description });
        res.status(201).json(frais);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateFraisPeriscolaire = async (req, res) => {
    try {
        const { id } = req.params;
        await FraisActivitePeriscolaire.update(req.body, { where: { idFraisActivitePeriscolaire: id } });
        res.json({ message: "Frais périscolaire mis à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFraisPeriscolaire = async (req, res) => {
    try {
        const { id } = req.params;
        const countTarifs = await TarifFraisPeriscolaire.count({ where: { idFraisActivitePeriscolaire: id, supprimer: false } });
        if (countTarifs > 0) {
            return res.status(400).json({ error: "Ce type de frais est utilisé dans des configurations et ne peut pas être supprimé." });
        }
        await FraisActivitePeriscolaire.update({ supprimer: true }, { where: { idFraisActivitePeriscolaire: id } });
        res.json({ message: "Frais périscolaire supprimé" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 15. PAYER FRAIS PÉRISCOLAIRES
exports.payerFraisPeriscolaires = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idEleve, idAnneeScolaire, montantVerse, modePaiement, reference } = req.body;
        let resteAPayer = parseInt(montantVerse);

        if (resteAPayer <= 0) return res.status(400).json({ error: "Montant invalide" });

        const global = await PaiementFraisGlobal.create({
            montantTotal: resteAPayer,
            modePaiement,
            referenceTransaction: reference,
            idEleve,
            idAnneeScolaire,
            idCaissier: req.user.userId
        }, { transaction: t });

        const tarifs = await TarifFraisPeriscolaire.findAll({
            where: { idAnneeScolaire, supprimer: false },
            order: [['createdAt', 'ASC']],
            transaction: t
        });

        for (const tarif of tarifs) {
            if (resteAPayer <= 0) break;

            const dejaPaye = await PaiementFraisPeriscolaire.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisActivitePeriscolaire: tarif.idTarifFraisActivitePeriscolaire },
                transaction: t
            }) || 0;

            const duSurCeFrais = tarif.montantFraisActivitePeriscolaire - dejaPaye;

            if (duSurCeFrais > 0) {
                const allocation = Math.min(resteAPayer, duSurCeFrais);

                await PaiementFraisPeriscolaire.create({
                    montantAlloue: allocation,
                    idTarifFraisActivitePeriscolaire: tarif.idTarifFraisActivitePeriscolaire,
                    idPaiementFraisGlobal: global.idPaiementFraisGlobal
                }, { transaction: t });

                resteAPayer -= allocation;
            }
        }

        await t.commit();
        res.status(201).json({
            message: "Paiement périscolaire enregistré",
            idPaiement: global.idPaiementFraisGlobal,
            tropPercu: resteAPayer
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 16. DÉTAILS PÉRISCOLAIRES D'UN ÉLÈVE
exports.getStudentPeriscolaireDetails = async (req, res) => {
    try {
        const { idEleve, idAnneeScolaire } = req.params;
        const { Inscription, Salle, Classe, TarifFraisPeriscolaire, FraisActivitePeriscolaire, PaiementFraisPeriscolaire, PaiementFraisGlobal, Eleve } = require("../models");

        const ins = await Inscription.findOne({
            where: { idEleve, idAnneeScolaire, supprimer: false },
            include: [{ model: Eleve }, { model: Salle, include: [{ model: Classe, as: "Classe" }] }]
        });

        if (!ins) return res.status(404).json({ error: "Élève non trouvé." });

        const tarifs = await TarifFraisPeriscolaire.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [{ model: FraisActivitePeriscolaire, as: "Frais" }],
            order: [['createdAt', 'ASC']]
        });

        const details = await Promise.all(tarifs.map(async (t) => {
            const dejaPaye = await PaiementFraisPeriscolaire.sum('montantAlloue', {
                include: [{
                    model: PaiementFraisGlobal,
                    where: { idEleve, idAnneeScolaire, annule: false }
                }],
                where: { idTarifFraisActivitePeriscolaire: t.idTarifFraisActivitePeriscolaire }
            }) || 0;

            return {
                idTarif: t.idTarifFraisActivitePeriscolaire,
                libelle: t.Frais.libelleFr,
                montantDu: t.montantFraisActivitePeriscolaire,
                montantPaye: dejaPaye,
                reste: t.montantFraisActivitePeriscolaire - dejaPaye,
                isComplet: dejaPaye >= t.montantFraisActivitePeriscolaire
            };
        }));

        const totalDejaVerse = details.reduce((sum, item) => sum + item.montantPaye, 0);
        const totalTotalDu = details.reduce((sum, item) => sum + item.montantDu, 0);

        res.json({
            nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
            classeLabel: ins.Salle ? `${ins.Salle.Classe.libelleClasseFr} ${ins.Salle.nomSalle}` : "N/A",
            totalDejaVerse,
            totalTotalDu,
            resteGlobal: totalTotalDu - totalDejaVerse,
            frais: details
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
