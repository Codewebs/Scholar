const { Note, Eleve, Inscription, RepartitionMatiere, SousPeriode, Justification, SuiviAbsence, sequelize } = require("../models");
const { Op } = require("sequelize");

const getGradingInfo = (m) => {
    if (m === null || m === undefined) return { cote: null, appreciation: null };
    if (m >= 18.5) return { cote: 'A+', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 17.25) return { cote: 'A', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 16.0) return { cote: 'A-', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 15.3) return { cote: 'B+', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 14.6) return { cote: 'B', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 14.0) return { cote: 'B-', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 13.3) return { cote: 'C+', appreciation: 'Compétences acquises (CA)' };
    if (m >= 12.6) return { cote: 'C', appreciation: 'Compétences acquises (CA)' };
    if (m >= 12.0) return { cote: 'C-', appreciation: 'Compétences acquises (CA)' };
    if (m >= 11.3) return { cote: 'E+', appreciation: 'Compétences moyennement acquises (CMA)' };
    if (m >= 10.6) return { cote: 'E', appreciation: 'Compétences moyennement acquises (CMA)' };
    if (m >= 10.0) return { cote: 'E-', appreciation: 'Compétences moyennement acquises (CMA)' };
    if (m >= 8.5) return { cote: 'F+', appreciation: 'Compétences non acquises (CNA)' };
    if (m >= 6.5) return { cote: 'F', appreciation: 'Compétences non acquises (CNA)' };
    return { cote: 'F-', appreciation: 'Compétences non acquises (CNA)' };
};

const coteToNote = {
    'A+': 20.0, 'A': 18.0, 'A-': 17.0,
    'B+': 15.75, 'B': 15.0, 'B-': 14.5,
    'C+': 13.75, 'C': 13.0, 'C-': 12.5,
    'E+': 11.75, 'E': 11.0, 'E-': 10.5,
    'F+': 9.5, 'F': 8.0, 'F-': 5.0
};

// 1. SAISIE PAR MATIÈRE
exports.getNotesByMatiere = async (req, res) => {
    try {
        const { idSalle, idRepartitionMatiere, idSequence, idAnneeScolaire } = req.query;
        console.log(`[SERVER] Fetching notes for Salle: ${idSalle}, Subject: ${idRepartitionMatiere}, Sequence: ${idSequence}`);

        const inscriptions = await Inscription.findAll({
            where: { idSalle, idAnneeScolaire, supprimer: false },
            include: [{ model: Eleve, attributes: ['idEleve', 'nom', 'prenom', 'matricule'] }],
            order: [[{ model: Eleve }, 'nom', 'ASC']]
        });

        const notes = await Note.findAll({
            where: { idRepartitionMatiere, idSequence, idAnneeScolaire, supprimer: false }
        });

        const result = inscriptions.map(ins => {
            const noteObj = notes.find(n => n.idInscription === ins.idInscription);
            return {
                idInscription: ins.idInscription,
                idEleve: ins.Eleve.idEleve,
                nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                matricule: ins.Eleve.matricule,
                note: noteObj ? noteObj.note : null,
                cote: noteObj ? noteObj.cote : null,
                appreciation: noteObj ? noteObj.appreciation : null,
                idNote: noteObj ? noteObj.idNote : null,
                nonClasse: noteObj ? noteObj.nonClasse : false,
                idJustification: noteObj ? noteObj.idJustification : null
            };
        });

        res.json(result);
    } catch (error) {
        console.error("[SERVER ERROR] getNotesByMatiere:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.saveNotes = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { notes, idRepartitionMatiere, idSequence, idAnneeScolaire, modeSaisie } = req.body;
        console.log(`[SERVER] Saving/Updating ${notes.length} notes (filtered by client) for Subject: ${idRepartitionMatiere}, Sequence: ${idSequence}`);

        for (const item of notes) {
            let noteVal = item.note;
            let coteVal = item.cote;

            if (modeSaisie === 'ALPHABETIC' && coteVal) {
                noteVal = coteToNote[coteVal] || null;
            }

            const grading = getGradingInfo(noteVal);

            const data = {
                note: noteVal,
                cote: grading.cote,
                appreciation: grading.appreciation,
                nonClasse: item.nonClasse || false,
                idJustification: item.idJustification,
                idRepartitionMatiere,
                idSequence,
                idAnneeScolaire,
                idInscription: item.idInscription,
                supprimer: false // Ensure we reactivate if it was soft-deleted
            };

            // Use upsert to handle uniqueness based on (idInscription, idRepartitionMatiere, idSequence, idAnneeScolaire)
            await Note.upsert(data, { transaction: t });
        }

        await t.commit();
        res.json({ message: "Notes enregistrées avec succès" });
    } catch (error) {
        await t.rollback();
        console.error("[SERVER ERROR] saveNotes:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. SAISIE PAR ÉLÈVE
exports.getNotesByStudent = async (req, res) => {
    try {
        const { idInscription, idSequence, idAnneeScolaire, idClasse } = req.query;
        console.log(`[SERVER] Fetching notes for Inscription: ${idInscription}, Sequence: ${idSequence}`);

        const repartitions = await RepartitionMatiere.findAll({
            where: { idClasse, idAnneeScolaire, supprimer: false },
            include: [{ model: require("../models").Matiere, attributes: ['idMatiere', 'libelleFr', 'abreviation'] }],
            order: [['ordreMatiere', 'ASC']]
        });

        const notes = await Note.findAll({
            where: { idInscription, idSequence, idAnneeScolaire, supprimer: false }
        });

        const result = repartitions.map(rep => {
            const noteObj = notes.find(n => n.idRepartitionMatiere === rep.idRepartitionMatiere);
            return {
                idRepartitionMatiere: rep.idRepartitionMatiere,
                matiereLabel: rep.Matiere.libelleFr,
                matiereAbrev: rep.Matiere.abreviation,
                coef: rep.coef,
                note: noteObj ? noteObj.note : null,
                cote: noteObj ? noteObj.cote : null,
                idNote: noteObj ? noteObj.idNote : null,
                nonClasse: noteObj ? noteObj.nonClasse : false,
                idJustification: noteObj ? noteObj.idJustification : null
            };
        });

        res.json(result);
    } catch (error) {
        console.error("[SERVER ERROR] getNotesByStudent:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.saveNotesByStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { notes, idInscription, idSequence, idAnneeScolaire, modeSaisie } = req.body;
        console.log(`[SERVER] Saving/Updating grades for student Inscription: ${idInscription}, Sequence: ${idSequence}`);

        for (const item of notes) {
            let noteVal = item.note;
            let coteVal = item.cote;

            if (modeSaisie === 'ALPHABETIC' && coteVal) {
                noteVal = coteToNote[coteVal] || null;
            }

            const grading = getGradingInfo(noteVal);

            const data = {
                note: noteVal,
                cote: grading.cote,
                appreciation: grading.appreciation,
                nonClasse: item.nonClasse || false,
                idJustification: item.idJustification,
                idRepartitionMatiere: item.idRepartitionMatiere,
                idSequence,
                idAnneeScolaire,
                idInscription,
                supprimer: false
            };

            await Note.upsert(data, { transaction: t });
        }

        await t.commit();
        res.json({ message: "Notes de l'élève enregistrées" });
    } catch (error) {
        await t.rollback();
        console.error("[SERVER ERROR] saveNotesByStudent:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. ACTIONS DE MASSE
exports.bulkActionNotes = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { action, idsInscription, idRepartitionMatiere, idSequence, idAnneeScolaire, value, idJustification } = req.body;
        console.log(`[SERVER] Bulk Action: ${action} for ${idsInscription.length} students`);

        if (action === 'SET_GLOBAL_NOTE') {
            const noteVal = parseFloat(value);
            const grading = getGradingInfo(noteVal);
            for (const idIns of idsInscription) {
                await Note.upsert({
                    idInscription: idIns,
                    idRepartitionMatiere,
                    idSequence,
                    idAnneeScolaire,
                    note: noteVal,
                    cote: grading.cote,
                    appreciation: grading.appreciation,
                    nonClasse: false,
                    supprimer: false
                }, { transaction: t });
            }
        } else if (action === 'RESET_MATIERE') {
            await Note.update({ supprimer: true }, {
                where: {
                    idRepartitionMatiere,
                    idSequence,
                    idAnneeScolaire,
                    idInscription: { [Op.in]: idsInscription }
                },
                transaction: t
            });
        } else if (action === 'NON_COMPOSE_GLOBAL') {
            for (const idIns of idsInscription) {
                await Note.upsert({
                    idInscription: idIns,
                    idRepartitionMatiere,
                    idSequence,
                    idAnneeScolaire,
                    nonClasse: true,
                    idJustification: idJustification,
                    note: 0,
                    cote: 'F-',
                    appreciation: 'Compétences non acquises (CNA)',
                    supprimer: false
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Action effectuée avec succès" });
    } catch (error) {
        await t.rollback();
        console.error("[SERVER ERROR] bulkActionNotes:", error);
        res.status(500).json({ error: error.message });
    }
};

// 4. SUIVI ABSENCES
exports.getAbsencesBySalle = async (req, res) => {
    try {
        const { idSalle, idSequence, idAnneeScolaire } = req.query;
        console.log(`[SERVER] Fetching absences for Salle: ${idSalle}, Sequence: ${idSequence}`);

        const inscriptions = await Inscription.findAll({
            where: { idSalle, idAnneeScolaire, supprimer: false },
            include: [{ model: Eleve, attributes: ['idEleve', 'nom', 'prenom', 'matricule'] }],
            order: [[{ model: Eleve }, 'nom', 'ASC']]
        });

        const absences = await SuiviAbsence.findAll({
            where: { idSequence, idAnneeScolaire, supprimer: false }
        });

        const result = inscriptions.map(ins => {
            const abs = absences.find(a => a.idInscription === ins.idInscription);
            return {
                idInscription: ins.idInscription,
                nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(),
                matricule: ins.Eleve.matricule,
                heuresAJ: abs ? abs.heuresAJ : 0,
                heuresANJ: abs ? abs.heuresANJ : 0,
                idSuiviAbsence: abs ? abs.idSuiviAbsence : null
            };
        });

        res.json(result);
    } catch (error) {
        console.error("[SERVER ERROR] getAbsencesBySalle:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.saveAbsences = async (req, res) => {
    try {
        const { absences, idSequence, idAnneeScolaire } = req.body;
        console.log(`[SERVER] Saving ${absences.length} absence records for Sequence: ${idSequence}`);

        for (const item of absences) {
            const data = {
                heuresAJ: item.heuresAJ,
                heuresANJ: item.heuresANJ,
                idSequence,
                idAnneeScolaire,
                idInscription: item.idInscription
            };
            if (item.idSuiviAbsence) {
                await SuiviAbsence.update(data, { where: { idSuiviAbsence: item.idSuiviAbsence } });
            } else {
                await SuiviAbsence.create(data);
            }
        }
        res.json({ message: "Absences enregistrées" });
    } catch (error) {
        console.error("[SERVER ERROR] saveAbsences:", error);
        res.status(500).json({ error: error.message });
    }
};

// 5. PV (PROCES VERBAUX)
exports.getPVData = async (req, res) => {
    try {
        const { type, idSalle, idClasse, idSequence, idPeriode, idAnneeScolaire } = req.query;
        res.json({ message: "PV Preview generated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. JUSTIFICATIONS
exports.getJustifications = async (req, res) => {
    try {
        const list = await Justification.findAll({ where: { supprimer: false } });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createJustification = async (req, res) => {
    try {
        const item = await Justification.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateJustification = async (req, res) => {
    try {
        await Justification.update(req.body, { where: { idJustification: req.params.id } });
        res.json({ message: "Justification mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteJustification = async (req, res) => {
    try {
        await Justification.update({ supprimer: true }, { where: { idJustification: req.params.id } });
        res.json({ message: "Justification supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. CRUD NOTES (Individual)
exports.getNote = async (req, res) => {
    try {
        const note = await Note.findByPk(req.params.id);
        if (!note) return res.status(404).json({ message: "Note non trouvée" });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const noteVal = req.body.note;
        const grading = getGradingInfo(noteVal);
        await Note.update({
            ...req.body,
            cote: grading.cote,
            appreciation: grading.appreciation
        }, { where: { idNote: req.params.id } });
        res.json({ message: "Note mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        await Note.update({ supprimer: true }, { where: { idNote: req.params.id } });
        res.json({ message: "Note supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
