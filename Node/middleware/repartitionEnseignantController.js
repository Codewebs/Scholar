const { RepartitionEnseignant, InscriptionPersonnel, RepartitionMatiere, Matiere, Salle, Classe, GroupeMatiere, Utilisateur, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.getTeachersPool = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.query;
        const teachers = await InscriptionPersonnel.findAll({
            where: { idAnneeScolaire, role: 'ENSEIGNANT', supprimer: false },
            include: [{ model: Utilisateur, attributes: ['diplomes', 'photo'] }],
            order: [['nom', 'ASC']]
        });

        // Count assignments for each teacher
        const assignments = await RepartitionEnseignant.findAll({
            where: { idAnneeScolaire, supprimer: false },
            attributes: ['idInscriptionPersonnel', [sequelize.fn('COUNT', sequelize.col('idSalle')), 'roomCount']],
            group: ['idInscriptionPersonnel']
        });

        const result = teachers.map(t => {
            const count = assignments.find(a => a.idInscriptionPersonnel === t.idInscriptionPersonnel);
            return {
                ...t.toJSON(),
                assignmentCount: count ? parseInt(count.get('roomCount')) : 0
            };
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRoomAssignments = async (req, res) => {
    try {
        const { idSalle, idAnneeScolaire } = req.query;

        // 1. Get Room Info and Class
        const salle = await Salle.findByPk(idSalle, { include: [{ model: Classe, as: 'Classe' }] });
        if (!salle) return res.status(404).json({ error: "Salle non trouvée" });

        // 2. Get All subjects for this class
        const subjects = await RepartitionMatiere.findAll({
            where: { idClasse: salle.idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: Matiere }, { model: GroupeMatiere }],
            order: [[GroupeMatiere, 'ordre', 'ASC'], ['ordreMatiere', 'ASC']]
        });

        // 3. Get Current teacher assignments
        const assignments = await RepartitionEnseignant.findAll({
            where: { idSalle, idAnneeScolaire, supprimer: false },
            include: [{ model: InscriptionPersonnel }]
        });

        res.json({
            salle,
            subjects,
            assignments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.assignTeacher = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idInscriptionPersonnel, idSalle, idRepartitionMatiere, isPrincipal, idAnneeScolaire } = req.body;

        if (isPrincipal) {
            // Rule: Only one principal teacher per room
            await RepartitionEnseignant.update(
                { isPrincipal: false },
                { where: { idSalle, idAnneeScolaire, isPrincipal: true }, transaction: t }
            );

            // Check if this teacher is already assigned to this room for a subject
            // If so, we might want to just update that record OR create a separate "Principal only" record?
            // Usually, the principal is also a teacher of a subject.
            // If idRepartitionMatiere is provided, we assign/update that subject.
            // If not, it's just a principal role.
        }

        if (idRepartitionMatiere) {
            // Assign/Replace teacher for this specific subject in this room
            // First, remove existing teacher for this subject in this room
            await RepartitionEnseignant.update(
                { supprimer: true },
                { where: { idSalle, idRepartitionMatiere, idAnneeScolaire, supprimer: false }, transaction: t }
            );

            await RepartitionEnseignant.create({
                idInscriptionPersonnel,
                idSalle,
                idRepartitionMatiere,
                isPrincipal: isPrincipal || false,
                idAnneeScolaire
            }, { transaction: t });
        } else if (isPrincipal) {
            // Check if teacher is already assigned in this room for ANY subject
            const existing = await RepartitionEnseignant.findOne({
                where: { idSalle, idInscriptionPersonnel, idAnneeScolaire, supprimer: false },
                transaction: t
            });

            if (existing) {
                existing.isPrincipal = true;
                await existing.save({ transaction: t });
            } else {
                await RepartitionEnseignant.create({
                    idInscriptionPersonnel,
                    idSalle,
                    isPrincipal: true,
                    idAnneeScolaire
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Affectation réussie" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

exports.removeAssignment = async (req, res) => {
    try {
        const { idRepartitionEnseignant } = req.params;
        await RepartitionEnseignant.update({ supprimer: true }, { where: { idRepartitionEnseignant } });
        res.json({ message: "Affectation supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getPrintData = async (req, res) => {
    try {
        const { idSalle, idAnneeScolaire } = req.query;
        const salle = await Salle.findByPk(idSalle, {
            include: [{ model: Classe, as: 'Classe' }]
        });

        const assignments = await RepartitionEnseignant.findAll({
            where: { idSalle, idAnneeScolaire, supprimer: false },
            include: [
                { model: InscriptionPersonnel },
                {
                    model: RepartitionMatiere,
                    include: [{ model: Matiere }]
                }
            ],
            order: [['isPrincipal', 'DESC']]
        });

        res.json({
            salle,
            assignments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
