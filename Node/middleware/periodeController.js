const { Periode, SousPeriode, AnneeScolaire, sequelize } = require("../models");
const { Op } = require("sequelize");

// Helper to check interval inclusion
const isWithin = (childStart, childEnd, parentStart, childEndParent) => {
    return childStart >= parentStart && childEnd <= childEndParent;
};

// Helper to check overlap in an array of intervals
const hasOverlap = (newStart, newEnd, existingIntervals, excludeId = null, idField = 'id') => {
    for (const interval of existingIntervals) {
        if (excludeId && interval[idField] == excludeId) continue;
        if (newStart < interval.dateFin && newEnd > interval.dateDebut) return true;
    }
    return false;
};

exports.getPeriodesByAnnee = async (req, res) => {
    try {
        const { idAnneeScolaire } = req.params;
        const periodes = await Periode.findAll({
            where: { idAnneeScolaire, supprimer: false },
            include: [{ model: SousPeriode, as: 'sousPeriodes', where: { supprimer: false }, required: false }],
            order: [['dateDebut', 'ASC'], [{ model: SousPeriode, as: 'sousPeriodes' }, 'dateDebut', 'ASC']]
        });
        res.json(periodes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createPeriode = async (req, res) => {
    try {
        const { libellePeriodeFr, dateDebut, dateFin, idAnneeScolaire, ordrePeriode } = req.body;

        // 1. Check if within year
        const annee = await AnneeScolaire.findByPk(idAnneeScolaire);
        if (!annee) return res.status(404).json({ error: "Année scolaire introuvable" });
        if (!isWithin(dateDebut, dateFin, annee.dateDebut, annee.dateFin)) {
            return res.status(400).json({ error: "Les dates doivent être comprises dans l'intervalle de l'année scolaire." });
        }

        // 2. Check overlap
        const existing = await Periode.findAll({ where: { idAnneeScolaire, supprimer: false } });
        if (hasOverlap(dateDebut, dateFin, existing)) {
            return res.status(400).json({ error: "Cette période chevauche une période existante." });
        }

        const periode = await Periode.create({ libellePeriodeFr, dateDebut, dateFin, idAnneeScolaire, ordrePeriode });
        res.status(201).json(periode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updatePeriode = async (req, res) => {
    try {
        const { id } = req.params;
        const { libellePeriodeFr, dateDebut, dateFin, ordrePeriode } = req.body;
        const periode = await Periode.findByPk(id);
        if (!periode) return res.status(404).json({ error: "Période introuvable" });

        const annee = await AnneeScolaire.findByPk(periode.idAnneeScolaire);
        if (!isWithin(dateDebut, dateFin, annee.dateDebut, annee.dateFin)) {
            return res.status(400).json({ error: "Les dates doivent être comprises dans l'intervalle de l'année scolaire." });
        }

        const existing = await Periode.findAll({ where: { idAnneeScolaire: periode.idAnneeScolaire, supprimer: false } });
        if (hasOverlap(dateDebut, dateFin, existing, id, 'idPeriode')) {
            return res.status(400).json({ error: "Cette période chevauche une période existante." });
        }

        await periode.update({ libellePeriodeFr, dateDebut, dateFin, ordrePeriode });
        res.json(periode);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deletePeriode = async (req, res) => {
    try {
        const { id } = req.params;
        await Periode.update({ supprimer: true }, { where: { idPeriode: id } });
        await SousPeriode.update({ supprimer: true }, { where: { idPeriode: id } });
        res.json({ message: "Période supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Sous-Périodes ---

exports.createSousPeriode = async (req, res) => {
    try {
        const { libelleSousPeriodeFr, dateDebut, dateFin, idPeriode, ordreSousPeriode } = req.body;
        const parent = await Periode.findByPk(idPeriode);
        if (!parent) return res.status(404).json({ error: "Période parente introuvable" });

        if (!isWithin(dateDebut, dateFin, parent.dateDebut, parent.dateFin)) {
            return res.status(400).json({ error: "Les dates doivent être comprises dans l'intervalle de la période parente." });
        }

        const existing = await SousPeriode.findAll({ where: { idPeriode, supprimer: false } });
        if (hasOverlap(dateDebut, dateFin, existing)) {
            return res.status(400).json({ error: "Cette sous-période chevauche une sous-période existante." });
        }

        const sp = await SousPeriode.create({ libelleSousPeriodeFr, dateDebut, dateFin, idPeriode, ordreSousPeriode });
        res.status(201).json(sp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateSousPeriode = async (req, res) => {
    try {
        const { id } = req.params;
        const { libelleSousPeriodeFr, dateDebut, dateFin, ordreSousPeriode } = req.body;
        const sp = await SousPeriode.findByPk(id);
        if (!sp) return res.status(404).json({ error: "Sous-période introuvable" });

        const parent = await Periode.findByPk(sp.idPeriode);
        if (!isWithin(dateDebut, dateFin, parent.dateDebut, parent.dateFin)) {
            return res.status(400).json({ error: "Les dates doivent être comprises dans l'intervalle de la période parente." });
        }

        const existing = await SousPeriode.findAll({ where: { idPeriode: sp.idPeriode, supprimer: false } });
        if (hasOverlap(dateDebut, dateFin, existing, id, 'idSousPeriode')) {
            return res.status(400).json({ error: "Cette sous-période chevauche une sous-période existante." });
        }

        await sp.update({ libelleSousPeriodeFr, dateDebut, dateFin, ordreSousPeriode });
        res.json(sp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSousPeriode = async (req, res) => {
    try {
        const { id } = req.params;
        await SousPeriode.update({ supprimer: true }, { where: { idSousPeriode: id } });
        res.json({ message: "Sous-période supprimée" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Cloning ---

exports.clonePeriodes = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idAnneeSource, idAnneeCible } = req.body;
        const targetYear = await AnneeScolaire.findByPk(idAnneeCible);

        const sourcePeriodes = await Periode.findAll({
            where: { idAnneeScolaire: idAnneeSource, supprimer: false },
            include: [{ model: SousPeriode, as: 'sousPeriodes', where: { supprimer: false }, required: false }]
        });

        for (const p of sourcePeriodes) {
            // Adjust dates logic: usually we just keep labels and let user fix dates if they differ much,
            // but here we can try to shift them or just copy and warn.
            // Requirement says "recuperer les periodes de l'an passé et les ajouter cette année".
            // If we copy them as-is, validation might fail if dates are outside targeting year.
            // Let's copy them but check if they fit, otherwise we might need to reset dates to year start.

            let newPStart = p.dateDebut;
            let newPEnd = p.dateFin;

            // Basic adjustment attempt: replace year part if format is YYYY-MM-DD
            const shiftYear = (dateStr, targetYearStr) => {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    // This is naive, but better than nothing.
                    // Actually targetYear might have different start months.
                    return `${targetYearStr.substring(0,4)}-${parts[1]}-${parts[2]}`;
                }
                return dateStr;
            };

            const newPeriode = await Periode.create({
                libellePeriodeFr: p.libellePeriodeFr,
                libellePeriodeEn: p.libellePeriodeEn,
                libellePeriodeEs: p.libellePeriodeEs,
                dateDebut: targetYear.dateDebut, // Reset to year start for safety, user will adjust
                dateFin: targetYear.dateFin,
                idAnneeScolaire: idAnneeCible,
                ordrePeriode: p.ordrePeriode
            }, { transaction: t });

            for (const sp of p.sousPeriodes) {
                await SousPeriode.create({
                    libelleSousPeriodeFr: sp.libelleSousPeriodeFr,
                    libelleSousPeriodeEn: sp.libelleSousPeriodeEn,
                    libelleSousPeriodeEs: sp.libelleSousPeriodeEs,
                    dateDebut: targetYear.dateDebut,
                    dateFin: targetYear.dateFin,
                    idPeriode: newPeriode.idPeriode,
                    ordreSousPeriode: sp.ordreSousPeriode
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Périodes clonées. Veuillez ajuster les dates." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
