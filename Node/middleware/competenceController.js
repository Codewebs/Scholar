const { Competence } = require("../models");

exports.getAllCompetences = async (req, res) => {
    try {
        const results = await Competence.findAll({ where: { supprimer: false }, order: [['libelle', 'ASC']] });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createCompetence = async (req, res) => {
    try {
        const item = await Competence.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCompetence = async (req, res) => {
    try {
        const { id } = req.params;
        await Competence.update(req.body, { where: { idCompetence: id } });
        res.json({ message: "Compétence mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCompetence = async (req, res) => {
    try {
        const { id } = req.params;
        await Competence.update({ supprimer: true }, { where: { idCompetence: id } });
        res.json({ message: "Compétence supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
