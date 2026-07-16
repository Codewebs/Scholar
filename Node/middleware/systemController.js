const {
    Utilisateur,
    Qualite,
    Eleve,
    AnneeScolaire,
    Enseignement,
    EtablissementStructure,
    FraisExigible,
    TarifFraisExigible,
    Classe,
    Salle,
    Periode,
    SousPeriode,
    RepartitionMatiere,
    InscriptionPersonnel,
    RepartitionEnseignant,
    Inscription,
    Cycle,
    sequelize
} = require("../models");
const { Op } = require("sequelize");

exports.getSystemStats = async (req, res) => {
    try {
        const userRole = req.user.role;

        let stats = {
            online: true,
            infoType: "connected",
            value: 0
        };

        const connectedCount = await Utilisateur.count();

        if (userRole === "ADMINISTRATEUR") {
            stats.value = connectedCount;
            stats.label = "Utilisateurs connectés";
            stats.extra = {
                teachers: await InscriptionPersonnel.count({ where: { role: 'ENSEIGNANT', supprimer: false } }),
                students: await Eleve.count({ where: { supprimer: false } })
            };
        } else if (userRole === "ENSEIGNANT") {
            stats.value = await Eleve.count({ where: { supprimer: false } });
            stats.label = "Élèves suivis";
        } else {
            stats.value = connectedCount;
            stats.label = "En ligne";
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSetupProgress = async (req, res) => {
    try {
        const { schoolId, yearId } = req.query;
        if (!schoolId) return res.status(400).json({ error: "schoolId manquant" });

        console.log(`📊 [SystemController] getSetupProgress schoolId=${schoolId}, yearId=${yearId}`);

        const results = {};

        // 0. Année scolaire en cours
        const activeYear = await AnneeScolaire.findOne({
            where: { idEtablissement: schoolId, cloturerAnnee: false },
            order: [['dateDebut', 'DESC']]
        });

        results.schoolYear = {
            done: !!activeYear,
            label: activeYear ? activeYear.libelleAnneeScolaire : "Non définie"
        };

        const targetYearId = yearId || (activeYear ? activeYear.idAnneeScolaire : null);

        if (!targetYearId) {
            return res.json({
                schoolYear: results.schoolYear,
                academicProfile: { done: false },
                globalFees: { done: false },
                classFees: { done: false, count: 0, total: 0 },
                rooms: { done: false, count: 0, total: 0 },
                periods: { done: false, count: 0 },
                subPeriods: { done: false, count: 0 },
                subjects: { done: false, count: 0, total: 0 },
                teachers: { done: false, assigned: 0, total: 0 },
                students: { count: 0 }
            });
        }

        // 1. Profil académique : On vérifie si des profils sont rattachés à cette année
        const profileCount = await EtablissementStructure.count({
            where: {
                idEtablissement: schoolId,
                idAnneeScolaire: targetYearId
            }
        });
        results.academicProfile = { done: profileCount > 0, count: profileCount };

        // 2. Frais exigibles (Bibliothèque globale)
        const globalFeesCount = await FraisExigible.count();
        results.globalFees = { done: globalFeesCount > 0, count: globalFeesCount };

        // 3. Frais scolaires par classe : On ne compte que les classes de la structure active
        const configEntries = await EtablissementStructure.findAll({
            where: { idEtablissement: schoolId, idAnneeScolaire: targetYearId }
        });
        const ensIds = configEntries.map(c => c.idEnseignement);

        const allClasses = await Classe.findAll({
            include: [{
                model: Cycle,
                as: 'Cycle',
                required: true,
                include: [{
                    model: Enseignement,
                    as: 'Enseignement',
                    required: true,
                    where: { idEnseignement: ensIds }
                }]
            }],
            where: { supprimer: false }
        });

        const totalClasses = allClasses.length;
        const classeIds = allClasses.map(c => c.idClasse);

        const classesWithFees = await TarifFraisExigible.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('idClasse')), 'idClasse']],
            where: { idAnneeScolaire: targetYearId, idClasse: classeIds }
        });

        results.classFees = {
            done: totalClasses > 0 && classesWithFees.length >= totalClasses,
            count: classesWithFees.length,
            total: totalClasses
        };

        // 4. Salles : Toutes les classes doivent avoir au moins une salle
        const roomsCount = await Salle.count({
            distinct: true,
            col: 'idClasse',
            where: { idAnneeScolaire: targetYearId, idClasse: classeIds, supprimer: false }
        });
        results.rooms = {
            done: totalClasses > 0 && roomsCount >= totalClasses,
            count: roomsCount,
            total: totalClasses
        };

        // 5. Périodes
        const periodsCount = await Periode.count({ where: { idAnneeScolaire: targetYearId, supprimer: false } });
        results.periods = { done: periodsCount > 0, count: periodsCount };

        // 6. Sous-périodes
        const subPeriodsCount = await SousPeriode.count({
            include: [{ model: Periode, where: { idAnneeScolaire: targetYearId, supprimer: false } }],
            where: { supprimer: false }
        });
        results.subPeriods = { done: subPeriodsCount > 0, count: subPeriodsCount };

        // 7. Matières (répartition) : Uniquement sur les classes ayant des frais
        const activeClasseIds = classesWithFees.map(c => c.idClasse);
        const classesWithSubjects = await RepartitionMatiere.count({
            distinct: true,
            col: 'idClasse',
            where: { idAnneeScolaire: targetYearId, idClasse: activeClasseIds, supprimer: false }
        });
        results.subjects = {
            done: activeClasseIds.length > 0 && classesWithSubjects >= activeClasseIds.length,
            count: classesWithSubjects,
            total: activeClasseIds.length
        };

        // 8. Enseignants
        const totalTeachers = await InscriptionPersonnel.count({ where: { idAnneeScolaire: targetYearId, role: { [Op.like]: '%ENSEIGNANT%' }, supprimer: false } });
        const assignedTeachers = await RepartitionEnseignant.count({
            distinct: true,
            col: 'idInscriptionPersonnel',
            include: [{ model: Salle, where: { idAnneeScolaire: targetYearId, idClasse: classeIds } }]
        });
        const totalSallesActives = await Salle.count({ where: { idAnneeScolaire: targetYearId, idClasse: classeIds, supprimer: false } });
        const sallesWithTeachers = await RepartitionEnseignant.count({
            distinct: true,
            col: 'idSalle',
            include: [{ model: Salle, where: { idAnneeScolaire: targetYearId, idClasse: classeIds } }]
        });

        results.teachers = {
            done: totalTeachers > 0 && assignedTeachers >= totalTeachers && sallesWithTeachers >= totalSallesActives,
            assigned: assignedTeachers,
            total: totalTeachers,
            sallesAssigned: sallesWithTeachers,
            totalSalles: totalSallesActives
        };

        // 9. Éleves
        const studentsCount = await Eleve.count({
            include: [{ model: Inscription, as: 'Inscriptions', where: { idAnneeScolaire: targetYearId, supprimer: false }, required: true }],
            where: { supprimer: false },
            distinct: true
        });
        results.students = { count: studentsCount };

        res.json(results);
    } catch (error) {
        console.error("❌ [SystemController] SetupProgress Error:", error);
        res.status(500).json({ error: "Erreur lors du calcul de la progression", details: error.message });
    }
};
