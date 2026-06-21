const { Note, Eleve, Inscription, RepartitionMatiere, Periode, SousPeriode, Justification, SuiviAbsence, AnneeScolaire, Etablissement, Salle, Classe, Matiere, GroupeMatiere, RepartitionCompetence, Competence, sequelize } = require("../models");
const { Op } = require("sequelize");

const getGradingInfo = (m) => {
    if (m === null || m === undefined) return { cote: null, appreciation: null };
    if (m >= 18.5) return { cote: 'A+', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 17.25) return { cote: 'A', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 16) return { cote: 'A-', appreciation: 'Compétences très bien acquises (CTBA)' };
    if (m >= 15.25) return { cote: 'B+', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 14.5) return { cote: 'B', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 14) return { cote: 'B-', appreciation: 'Compétences bien acquises (CBA)' };
    if (m >= 12.5) return { cote: 'C+', appreciation: 'Compétences acquises (CA)' };
    if (m >= 11.5) return { cote: 'C', appreciation: 'Compétences acquises (CA)' };
    if (m >= 10) return { cote: 'C-', appreciation: 'Compétences acquises (CA)' };
    if (m >= 8.5) return { cote: 'D+', appreciation: 'Compétences partiellement acquises (CPA)' };
    if (m >= 7.5) return { cote: 'D', appreciation: 'Compétences partiellement acquises (CPA)' };
    if (m >= 6) return { cote: 'D-', appreciation: 'Compétences partiellement acquises (CPA)' };
    if (m >= 4.5) return { cote: 'E+', appreciation: 'Compétences non acquises (CNA)' };
    if (m >= 3.5) return { cote: 'E', appreciation: 'Compétences non acquises (CNA)' };
    return { cote: 'E-', appreciation: 'Compétences non acquises (CNA)' };
};

const coteToNote = { 'A+': 19, 'A': 17.5, 'A-': 16.5, 'B+': 15.5, 'B': 14.8, 'B-': 14.2, 'C+': 13, 'C': 12, 'C-': 11, 'D+': 9, 'D': 8, 'D-': 7, 'E+': 5, 'E': 4, 'E-': 2, 'F': 0 };

// 1. SAISIE PAR MATIÈRE
exports.getNotesByMatiere = async (req, res) => {
    try {
        const { idRepartitionMatiere, idSequence, idAnneeScolaire } = req.query;

        console.log(`🔍 [NotesByMatiere] Filter criteria:`, {
            idRepartitionMatiere,
            idSequence,
            idAnneeScolaire
        });

        const notes = await Note.findAll({
            where: {
                idSequence,
                idAnneeScolaire,
                //supprimer: false
            },
            include: [{
                model: RepartitionCompetence,
                // Pas besoin de spécifier "as" si la relation par défaut est propre
                where: {
                    idRepartitionMatiere,
                    idSousPeriode: idSequence, // Optionnel si déjà filtré sur la Note, mais sécurise la cohérence
                    supprimer: false
                },
                required: true // Force un INNER JOIN pour ne prendre que les notes qui ont cette correspondance
            }]
        });

        console.log(`✅ [NotesByMatiere] Found ${notes.length} notes`);
        res.json(notes);
    } catch (error) {
        console.error("❌ [NotesByMatiere] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.saveNotes = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { notes, idSequence, idAnneeScolaire, modeSaisie } = req.body;
        if (!notes || notes.length === 0) return res.json({ message: "Aucune note à enregistrer" });

        for (const item of notes) {
            let noteVal = item.note;
            let coteVal = item.cote;
            if (modeSaisie === 'ALPHABETIC' && coteVal) noteVal = coteToNote[coteVal] || null;
            const grading = getGradingInfo(noteVal);

            const data = {
                note: noteVal,
                cote: item.nonClasse ? 'N.C' : (coteVal || grading.cote),
                appreciation: item.nonClasse ? 'Non Classé' : grading.appreciation,
                nonClasse: item.nonClasse || false,
                idJustification: item.idJustification,
                idRepartitionCompetence: item.idRepartitionCompetence,
                idSequence,
                idAnneeScolaire,
                idInscription: item.idInscription,
                supprimer: false
            };
            await Note.upsert(data, { transaction: t });
        }
        await t.commit();
        res.json({ message: "Notes enregistrées avec succès" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 2. SAISIE PAR ÉLÈVE
exports.getNotesByStudent = async (req, res) => {
    try {
        const { idInscription, idSequence, idAnneeScolaire } = req.query;
        console.log(`🔍 [NotesByStudent] Filter:`, { idInscription, idSequence, idAnneeScolaire });
        const notes = await Note.findAll({
            where: { idInscription, idSequence, idAnneeScolaire, supprimer: false }
        });
        console.log(`✅ [NotesByStudent] Found ${notes.length} notes`);
        res.json(notes);
    } catch (error) {
        console.error("❌ [NotesByStudent] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.saveNotesByStudent = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { notes, idInscription, idSequence, idAnneeScolaire, modeSaisie } = req.body;
        for (const item of notes) {
            let noteVal = item.note;
            let coteVal = item.cote;
            if (modeSaisie === 'ALPHABETIC' && coteVal) noteVal = coteToNote[coteVal] || null;
            const grading = getGradingInfo(noteVal);

            await Note.upsert({
                idInscription,
                idSequence,
                idAnneeScolaire,
                idRepartitionCompetence: item.idRepartitionCompetence,
                note: noteVal,
                cote: item.nonClasse ? 'N.C' : (coteVal || grading.cote),
                appreciation: item.nonClasse ? 'Non Classé' : grading.appreciation,
                nonClasse: item.nonClasse || false,
                idJustification: item.idJustification,
                supprimer: false
            }, { transaction: t });
        }
        await t.commit();
        res.json({ message: "Notes enregistrées" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 3. ACTIONS DE MASSE
exports.bulkActionNotes = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { action, idsInscription, idRepartitionCompetence, idSequence, idAnneeScolaire, value, idJustification } = req.body;
        if (action === 'SET_GLOBAL_NOTE') {
            const noteVal = parseFloat(value);
            const grading = getGradingInfo(noteVal);
            for (const idIns of idsInscription) {
                await Note.upsert({ idInscription: idIns, idRepartitionCompetence, idSequence, idAnneeScolaire, note: noteVal, cote: grading.cote, appreciation: grading.appreciation, nonClasse: false, supprimer: false }, { transaction: t });
            }
        } else if (action === 'NON_COMPOSE_GLOBAL') {
            const justif = await Justification.findByPk(idJustification);
            for (const idIns of idsInscription) {
                await Note.upsert({ idInscription: idIns, idRepartitionCompetence, idSequence, idAnneeScolaire, note: 0, cote: 'N.C', appreciation: justif?.libelleJustificationFr || 'Non Classé', nonClasse: true, idJustification, supprimer: false }, { transaction: t });
            }
        } else if (action === 'RESET_MATIERE') {
            await Note.update({ supprimer: true }, { where: { idRepartitionCompetence, idSequence, idAnneeScolaire, idInscription: { [Op.in]: idsInscription } }, transaction: t });
        }
        await t.commit();
        res.json({ message: "Action effectuée" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 4. SUIVI ABSENCES
exports.getAbsencesBySalle = async (req, res) => {
    try {
        const { idSalle, idSequence, idAnneeScolaire } = req.query;
        const inscriptions = await Inscription.findAll({
            where: { idSalle, idAnneeScolaire, supprimer: false },
            include: [{ model: Eleve, attributes: ['idEleve', 'nom', 'prenom', 'matricule'] }],
            order: [[{ model: Eleve }, 'nom', 'ASC']]
        });
        const absences = await SuiviAbsence.findAll({ where: { idSequence, idAnneeScolaire, supprimer: false } });
        const result = inscriptions.map(ins => {
            const abs = absences.find(a => a.idInscription === ins.idInscription);
            return { idInscription: ins.idInscription, nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), matricule: ins.Eleve.matricule, heuresAJ: abs ? abs.heuresAJ : 0, heuresANJ: abs ? abs.heuresANJ : 0, idSuiviAbsence: abs ? abs.idSuiviAbsence : null };
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveAbsences = async (req, res) => {
    try {
        const { absences, idSequence, idAnneeScolaire } = req.body;
        for (const item of absences) {
            const data = { heuresAJ: item.heuresAJ, heuresANJ: item.heuresANJ, idSequence, idAnneeScolaire, idInscription: item.idInscription };
            if (item.idSuiviAbsence) await SuiviAbsence.update(data, { where: { idSuiviAbsence: item.idSuiviAbsence } });
            else await SuiviAbsence.create(data);
        }
        res.json({ message: "Absences enregistrées" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. PV (PROCES VERBAUX)
exports.getPVData = async (req, res) => {
    try {
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

// 7. CRUD NOTES
exports.getNote = async (req, res) => {
    try {
        const note = await Note.findByPk(req.params.id);
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const grading = getGradingInfo(req.body.note);
        await Note.update({ ...req.body, cote: grading.cote, appreciation: grading.appreciation }, { where: { idNote: req.params.id } });
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

// 8. EXPORT BULLETINS (A4 Web)
exports.exportBulletins = async (req, res) => {
    try {
        const { perimeter, id, periodType, selectedPeriodId, idAnneeScolaire, allowIncompleteStudent, allowIncompleteRoom } = req.query;
        console.log(`[BULLETIN] 🖨️ Export request: Perimeter=${perimeter}, ID=${id}, PeriodType=${periodType}, PeriodID=${selectedPeriodId}`);

        const year = await AnneeScolaire.findByPk(idAnneeScolaire, { include: [{ model: Etablissement }] });
        if (!year) return res.status(404).json({ message: "Année scolaire non trouvée" });

        // 1. Determine Periode/Sequence Scope
        let targetSequenceIds = [];
        let expandedSequenceIds = [];
        let periodLabel = "Bilan";
        let subPeriodInfo = [];

        if (periodType === 'SEQUENCE') {
            const spId = parseInt(selectedPeriodId);
            targetSequenceIds = [spId];
            const sp = await SousPeriode.findByPk(spId);
            periodLabel = sp ? sp.libelleSousPeriodeFr : "Séquence";
            if (sp) {
                subPeriodInfo.push({ id: sp.idSousPeriode, label: sp.libelleSousPeriodeFr, abrev: sp.abrevLibelleFr });
                const related = await SousPeriode.findAll({
                    where: { libelleSousPeriodeFr: sp.libelleSousPeriodeFr, supprimer: false },
                    include: [{ model: Periode, where: { idAnneeScolaire } }]
                });
                expandedSequenceIds = related.map(r => r.idSousPeriode);
            }
        } else if (periodType === 'TRIMESTER') {
            const sequences = await SousPeriode.findAll({
                where: { idPeriode: selectedPeriodId, supprimer: false },
                order: [['idSousPeriode', 'ASC']]
            });
            targetSequenceIds = sequences.map(s => s.idSousPeriode);
            const p = await Periode.findByPk(selectedPeriodId);
            periodLabel = p ? p.libellePeriodeFr : "Trimestre";
            subPeriodInfo = sequences.map(s => ({ id: s.idSousPeriode, label: s.libelleSousPeriodeFr, abrev: s.abrevLibelleFr }));

            const labels = sequences.map(s => s.libelleSousPeriodeFr);
            const related = await SousPeriode.findAll({
                where: { libelleSousPeriodeFr: { [Op.in]: labels }, supprimer: false },
                include: [{ model: Periode, where: { idAnneeScolaire } }]
            });
            expandedSequenceIds = related.map(r => r.idSousPeriode);
        } else {
            const allSp = await SousPeriode.findAll({
                include: [{ model: Periode, where: { idAnneeScolaire, supprimer: false } }],
                where: { supprimer: false },
                order: [['idSousPeriode', 'ASC']]
            });
            targetSequenceIds = allSp.map(s => s.idSousPeriode);
            expandedSequenceIds = [...targetSequenceIds];
            periodLabel = "Bilan Annuel";
            subPeriodInfo = allSp.map(s => ({ id: s.idSousPeriode, label: s.libelleSousPeriodeFr, abrev: s.abrevLibelleFr }));
        }

        if (expandedSequenceIds.length === 0) expandedSequenceIds = targetSequenceIds;

        // 2. Determine Perimeter and Get Inscriptions
        let whereInscriptions = { idAnneeScolaire, supprimer: false };
        if (perimeter === 'SALLE') whereInscriptions.idSalle = id;
        else if (perimeter === 'CLASSE') {
            const salles = await Salle.findAll({ where: { idClasse: id, idAnneeScolaire } });
            whereInscriptions.idSalle = { [Op.in]: salles.map(s => s.idSalle) };
        } else if (perimeter === 'CYCLE') {
            const classes = await Classe.findAll({ where: { idCycle: id } });
            const salles = await Salle.findAll({ where: { idClasse: { [Op.in]: classes.map(c => c.idClasse) }, idAnneeScolaire } });
            whereInscriptions.idSalle = { [Op.in]: salles.map(s => s.idSalle) };
        }

        const inscriptions = await Inscription.findAll({
            where: whereInscriptions,
            include: [{ model: Eleve }, { model: Salle, include: [{ model: Classe, as: 'Classe' }] }],
            order: [[{ model: Eleve }, 'nom', 'ASC']]
        });

        if (inscriptions.length === 0) return res.status(400).json({ message: "Aucun élève trouvé." });

        // 3. Load Global Data Filtered by Period
        const repartitions = await RepartitionMatiere.findAll({
            where: { idAnneeScolaire },
            include: [
                { model: Matiere },
                { model: GroupeMatiere },
                {
                    model: RepartitionCompetence,
                    where: { idSousPeriode: { [Op.in]: expandedSequenceIds }, supprimer: false },
                    required: false,
                    include: [{ model: Competence }]
                }
            ]
        });

        const allNotesCriteria = {
            idAnneeScolaire,
            idSequence: { [Op.in]: expandedSequenceIds },
            supprimer: false
        };
        console.log(`🔍 [Bulletins] Global notes fetch criteria:`, allNotesCriteria);

        const allNotes = await Note.findAll({ where: allNotesCriteria });
        console.log(`✅ [Bulletins] Found ${allNotes.length} total notes for the period scope.`);

        const allAbsences = await SuiviAbsence.findAll({
            where: { idAnneeScolaire, idSequence: { [Op.in]: targetSequenceIds }, supprimer: false }
        });

        // --- RANKING LOGIC ---
        const subjectScores = {};
        const generalScores = {};

        inscriptions.forEach(ins => {
            if (!subjectScores[ins.idSalle]) subjectScores[ins.idSalle] = {};
            if (!generalScores[ins.idSalle]) generalScores[ins.idSalle] = [];

            const studentNotes = allNotes.filter(n => n.idInscription === ins.idInscription);
            let totalPoints = 0, totalCoef = 0;

            repartitions.filter(rep => rep.idClasse === ins.Salle.idClasse).forEach(rep => {
                const repCompIds = (rep.RepartitionCompetences || []).map(rc => rc.id);
                const notesForSubject = studentNotes.filter(n => repCompIds.includes(n.idRepartitionCompetence));

                let avgNote = null;
                if (periodType === 'TRIMESTER' && targetSequenceIds.length >= 1) {
                    const getSeqAvg = (seqId) => {
                        const relatedSeqIds = expandedSequenceIds.filter(id => {
                            // En pratique on utilise expandedSequenceIds car le filtre se fait déjà sur idRepartitionCompetence
                            return true;
                        });
                        // Trouver les IDs de répartition pour CETTE séquence spécifique du trimestre
                        const comps = (rep.RepartitionCompetences || []).filter(rc => rc.idSousPeriode === seqId);
                        const compIds = comps.map(rc => rc.id);
                        const v = notesForSubject.filter(n => compIds.includes(n.idRepartitionCompetence)).map(n => n.note).filter(v => v !== null && v !== undefined);
                        return v.length > 0 ? (v.reduce((s, val) => s + val, 0) / v.length) : null;
                    };
                    const n1 = getSeqAvg(targetSequenceIds[0]);
                    const n2 = targetSequenceIds.length >= 2 ? getSeqAvg(targetSequenceIds[1]) : null;
                    const validSeqAvgs = [n1, n2].filter(v => v !== null);
                    avgNote = validSeqAvgs.length > 0 ? (validSeqAvgs.reduce((s, v) => s + v, 0) / validSeqAvgs.length) : null;
                } else {
                    const v = notesForSubject.map(n => n.note).filter(v => v !== null && v !== undefined);
                    avgNote = v.length > 0 ? (v.reduce((sum, v) => sum + v, 0) / v.length) : null;
                }

                if (!subjectScores[ins.idSalle][rep.idRepartitionMatiere]) {
                    subjectScores[ins.idSalle][rep.idRepartitionMatiere] = [];
                }
                subjectScores[ins.idSalle][rep.idRepartitionMatiere].push({ idInscription: ins.idInscription, avg: avgNote });

                if (avgNote !== null) {
                    totalPoints += (avgNote * rep.coef);
                    totalCoef += rep.coef;
                }
            });

            const studentAverage = totalCoef > 0 ? (totalPoints / totalCoef) : 0;
            generalScores[ins.idSalle].push({ idInscription: ins.idInscription, avg: studentAverage });
        });

        const computeRanks = (scores) => {
            const sorted = [...scores].sort((a, b) => (b.avg || 0) - (a.avg || 0));
            const ranks = {};
            let currentRank = 1;
            for (let i = 0; i < sorted.length; i++) {
                if (i > 0 && (sorted[i].avg || 0) < (sorted[i-1].avg || 0)) currentRank = i + 1;
                ranks[sorted[i].idInscription] = currentRank;
            }
            return ranks;
        };

        const subjectRanks = {};
        const generalRanks = {};
        Object.keys(subjectScores).forEach(sId => {
            subjectRanks[sId] = {};
            Object.keys(subjectScores[sId]).forEach(repId => {
                subjectRanks[sId][repId] = computeRanks(subjectScores[sId][repId]);
            });
            generalRanks[sId] = computeRanks(generalScores[sId]);
        });

        // --- ASSEMBLE BULLETINS ---
        const bulletins = [];
        const missingData = [];

        for (const ins of inscriptions) {
            const studentNotes = allNotes.filter(n => n.idInscription === ins.idInscription);
            const studentAbsencesList = allAbsences.filter(a => a.idInscription === ins.idInscription);
            const totalAbsJ = studentAbsencesList.reduce((sum, a) => sum + (a.heuresAJ || 0), 0);
            const totalAbsNJ = studentAbsencesList.reduce((sum, a) => sum + (a.heuresANJ || 0), 0);

            if (allowIncompleteStudent !== 'true' && studentNotes.length === 0) {
                missingData.push({ nomEleve: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), reason: "Aucune note saisie." });
                continue;
            }

            const subjectGroupsArr = {};
            let totalPoints = 0, totalCoef = 0;

            repartitions.filter(rep => rep.idClasse === ins.Salle.idClasse).forEach(rep => {
                const groupName = rep.GroupeMatiere?.libelleFr || "Matières Générales";
                if (!subjectGroupsArr[groupName]) {
                    subjectGroupsArr[groupName] = {
                        name: groupName,
                        subjects: [],
                        groupTotalPoints: 0,
                        groupTotalCoef: 0,
                        groupAverage: 0,
                        ordre: rep.GroupeMatiere?.ordre || 99
                    };
                }

                const repCompIds = (rep.RepartitionCompetences || []).map(rc => rc.id);
                const notesForSubject = studentNotes.filter(n => repCompIds.includes(n.idRepartitionCompetence));

                let n1 = null, n2 = null, avgNote = null;
                if (periodType === 'TRIMESTER' && targetSequenceIds.length >= 1) {
                    const getSeqAvg = (seqId) => {
                        const comps = (rep.RepartitionCompetences || []).filter(rc => rc.idSousPeriode === seqId);
                        const compIds = comps.map(rc => rc.id);
                        const v = notesForSubject.filter(n => compIds.includes(n.idRepartitionCompetence)).map(n => n.note).filter(v => v !== null && v !== undefined);
                        return v.length > 0 ? (v.reduce((s, val) => s + val, 0) / v.length) : null;
                    };
                    n1 = getSeqAvg(targetSequenceIds[0]);
                    n2 = targetSequenceIds.length >= 2 ? getSeqAvg(targetSequenceIds[1]) : null;
                    const validSeqAvgs = [n1, n2].filter(v => v !== null);
                    avgNote = validSeqAvgs.length > 0 ? (validSeqAvgs.reduce((s, v) => s + v, 0) / validSeqAvgs.length) : null;
                } else {
                    const v = notesForSubject.map(n => n.note).filter(v => v !== null && v !== undefined);
                    avgNote = v.length > 0 ? (v.reduce((sum, v) => sum + v, 0) / v.length) : null;
                }

                const competencyMap = new Map();
                (rep.RepartitionCompetences || []).forEach(rc => {
                    if (!competencyMap.has(rc.idCompetence)) {
                        const noteComp = notesForSubject.find(n => n.idRepartitionCompetence === rc.id);
                        competencyMap.set(rc.idCompetence, {
                            libelle: rc.Competence?.libelle || "Compétence",
                            note: noteComp ? noteComp.note : null,
                            cote: noteComp ? noteComp.cote : null,
                            appreciation: noteComp ? noteComp.appreciation : null
                        });
                    }
                });

                const competencies = Array.from(competencyMap.values());
                const rank = subjectRanks[ins.idSalle]?.[rep.idRepartitionMatiere]?.[ins.idInscription] || 1;

                subjectGroupsArr[groupName].subjects.push({
                    name: rep.Matiere.libelleFr,
                    teacher: "Enseignant",
                    note1: n1,
                    note2: n2,
                    coef: rep.coef,
                    total: avgNote,
                    rank: rank,
                    appreciation: getGradingInfo(avgNote).appreciation,
                    competencies
                });

                if (avgNote !== null) {
                    subjectGroupsArr[groupName].groupTotalPoints += (avgNote * rep.coef);
                    subjectGroupsArr[groupName].groupTotalCoef += rep.coef;
                    totalPoints += (avgNote * rep.coef);
                    totalCoef += rep.coef;
                }
            });

            const finalGroups = Object.values(subjectGroupsArr)
                .sort((a, b) => a.ordre - b.ordre)
                .map(group => ({
                    ...group,
                    groupAverage: group.groupTotalCoef > 0 ? (group.groupTotalPoints / group.groupTotalCoef) : 0
                }));

            const classAverages = generalScores[ins.idSalle].map(s => s.avg);
            const stats = {
                maxMoy: Math.max(...classAverages),
                minMoy: Math.min(...classAverages),
                avgMoy: classAverages.reduce((a, b) => a + b, 0) / classAverages.length,
                successRate: (classAverages.filter(a => a >= 10).length / classAverages.length) * 100
            };

            bulletins.push({
                school: {
                    nomFr: year.Etablissement.nomFr,
                    abreviation: year.Etablissement.abreviation,
                    logo: year.Etablissement.logo,
                    numBP: year.Etablissement.numBp,
                    ville: year.Etablissement.ville,
                    tel1: year.Etablissement.telephone1,
                    arrete: year.Etablissement.arrete,
                    devise: year.Etablissement.devise
                },
                student: { nomComplet: `${ins.Eleve.nom} ${ins.Eleve.prenom || ""}`.trim(), matricule: ins.Eleve.matricule, sexe: ins.Eleve.sexe, dateNaissance: ins.Eleve.dateNaissance, lieuNaissance: ins.Eleve.lieuNaissance, photo: ins.Eleve.photo },
                salle: { nomSalle: `${ins.Salle.Classe?.libelleClasseFr} ${ins.Salle.nomSalle}`, effectif: classAverages.length },
                year: { libelle: year.libelleAnneeScolaire },
                period: { label: periodLabel, subPeriods: subPeriodInfo },
                performance: {
                    groups: finalGroups,
                    totalPoints,
                    totalCoef,
                    average: totalCoef > 0 ? (totalPoints / totalCoef) : 0,
                    rank: generalRanks[ins.idSalle][ins.idInscription] || 1,
                    appreciation: totalCoef > 0 ? getGradingInfo(totalPoints / totalCoef).appreciation : "N/A"
                },
                stats,
                discipline: { absencesJustified: totalAbsJ, absencesUnjustified: totalAbsNJ, conductNotes: [] }
            });
        }

        if (missingData.length > 0 && allowIncompleteRoom !== 'true') return res.status(400).json({ message: "Données incomplètes.", missingData });
        res.json(bulletins);
    } catch (error) {
        console.error("❌ [BULLETIN ERROR]:", error);
        res.status(500).json({ error: error.message });
    }
};
