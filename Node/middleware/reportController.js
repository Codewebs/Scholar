const { Inscription, Eleve, Salle, Classe, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getAlphabeticalList = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;

        // On récupère toutes les salles de la classe
        const salles = await Salle.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false }
        });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{
                    model: Eleve,
                    attributes: ['matricule', 'nom', 'prenom', 'sexe', 'dateNaissance']
                }],
                order: [
                    [{ model: Eleve }, 'nom', 'ASC'],
                    [{ model: Eleve }, 'prenom', 'ASC']
                ]
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
                    date: ins.Eleve?.dateNaissance,
                    statut: ins.nouveau ? 'Nouveau' : 'Redoublant',
                    photo: null,
                    solde: 0
                }))
            };
        }));

        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getAlphabeticalList:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAttendanceSheet = async (req, res) => {
    try {
        const { idClasse, idAnneeScolaire } = req.query;
        const salles = await Salle.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false }
        });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom'] }],
                order: [[{ model: Eleve }, 'nom', 'ASC']]
            });

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                capacite: salle.capacite,
                eleves: inscriptions.map(ins => ({
                    id: ins.idInscription,
                    nom: ins.Eleve?.nom,
                    prenom: ins.Eleve?.prenom
                }))
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
        const salles = await Salle.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false }
        });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom', 'sexe', 'matricule'] }],
                order: [
                    [{ model: Eleve }, 'sexe', 'ASC'],
                    [{ model: Eleve }, 'nom', 'ASC']
                ]
            });

            const girls = inscriptions.filter(i => i.Eleve?.sexe === 'F');
            const boys = inscriptions.filter(i => i.Eleve?.sexe === 'M');

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                capacite: salle.capacite,
                stats: {
                    total: inscriptions.length,
                    girls: girls.length,
                    boys: boys.length,
                    girlsPercent: inscriptions.length > 0 ? Math.round((girls.length / inscriptions.length) * 100) : 0,
                    boysPercent: inscriptions.length > 0 ? Math.round((boys.length / inscriptions.length) * 100) : 0
                },
                girls: girls.map(i => ({ nom: i.Eleve?.nom, prenom: i.Eleve?.prenom, matricule: i.Eleve?.matricule })),
                boys: boys.map(i => ({ nom: i.Eleve?.nom, prenom: i.Eleve?.prenom, matricule: i.Eleve?.matricule }))
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
        const salles = await Salle.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false }
        });

        const reportData = await Promise.all(salles.map(async (salle) => {
            const inscriptions = await Inscription.findAll({
                where: { idSalle: salle.idSalle, idAnneeScolaire, supprimer: false },
                include: [{ model: Eleve, attributes: ['nom', 'prenom', 'matricule'] }],
                order: [[{ model: Eleve }, 'nom', 'ASC']]
            });

            return {
                idSalle: salle.idSalle,
                nomSalle: salle.nomSalle,
                eleves: inscriptions.map(i => ({
                    id: i.idInscription,
                    nom: i.Eleve?.nom,
                    prenom: i.Eleve?.prenom,
                    matricule: i.Eleve?.matricule,
                    photo: null
                }))
            };
        }));
        res.json(reportData);
    } catch (error) {
        console.error("❌ Erreur getTrombinoscope:", error);
        res.status(500).json({ error: error.message });
    }
};
