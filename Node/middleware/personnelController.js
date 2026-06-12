const {
  DemandeInscriptionPersonnel,
  InscriptionPersonnel,
  CompetenceEnseignant,
  AffectationPersonnelSalle,
  Utilisateur,
  Matiere,
  Salle,
  sequelize
} = require("../models");
const { Op } = require("sequelize");

// 1. ENVOYER UNE DEMANDE
exports.envoyerDemande = async (req, res) => {
    try {
        const { idUtilisateur, idEtablissement, profilDemande, nom, prenom, telephone1, email, specialites } = req.body;

        // Vérifier si une demande identique en attente existe
        const existing = await DemandeInscriptionPersonnel.findOne({
            where: { idUtilisateur, idEtablissement, profilDemande, etat: 'EN_ATTENTE' }
        });
        if (existing) return res.status(409).json({ error: "Une demande est déjà en cours d'étude." });

        // Vérifier si l'utilisateur est bloqué par l'établissement
        const blocked = await InscriptionPersonnel.findOne({
            where: { idUtilisateur, idEtablissement, bloque: true }
        });
        if (blocked) return res.status(403).json({ error: "Accès refusé par l'établissement." });

        const demande = await DemandeInscriptionPersonnel.create({
            idUtilisateur, idEtablissement, profilDemande, nom, prenom, telephone1, email, specialites
        });

        res.status(201).json(demande);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. VALIDER UNE DEMANDE
exports.validerDemande = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idDemande, idAnneeScolaire, matricule, dateNaissance, lieuNaissance, sexe, role, permissionsAjoutees, permissionsRetirees } = req.body;
        const demande = await DemandeInscriptionPersonnel.findByPk(idDemande);
        if (!demande) return res.status(404).json({ error: "Demande introuvable." });

        // Créer l'inscription avec surcharges de droits
        const inscription = await InscriptionPersonnel.create({
            matricule,
            nom: demande.nom,
            prenom: demande.prenom,
            dateNaissance,
            lieuNaissance,
            sexe,
            telephone1: demande.telephone1,
            email: demande.email,
            role: role || demande.profilDemande,
            idUtilisateur: demande.idUtilisateur,
            idAnneeScolaire,
            idEtablissement: demande.idEtablissement,
            idDemandeSource: idDemande,
            permissionsAjoutees: permissionsAjoutees ? JSON.stringify(permissionsAjoutees) : null,
            permissionsRetirees: permissionsRetirees ? JSON.stringify(permissionsRetirees) : null
        }, { transaction: t });

        // Gérer les spécialités si enseignant
        const finalRole = role || demande.profilDemande;
        if (finalRole.includes('ENSEIGNANT') && demande.specialites) {
            const ids = demande.specialites.split(',').map(id => id.trim());
            for (const idMatiere of ids) {
                await CompetenceEnseignant.create({
                    idInscriptionPersonnel: inscription.idInscriptionPersonnel,
                    idMatiere
                }, { transaction: t });
            }
        }

        demande.etat = 'VALIDE';
        await demande.save({ transaction: t });

        await t.commit();

        // 🔔 REAL-TIME NOTIFICATION
        const fcmService = require("../services/fcmService");
        await fcmService.sendValidationNotification(demande.idUtilisateur, {
            schoolId: demande.idEtablissement,
            role: finalRole
        });

        await fcmService.notifyHierarchy(demande.idEtablissement, `Nouveau membre validé: ${demande.nom} (${finalRole})`);

        res.json({ message: "Demande validée avec succès.", idInscription: inscription.idInscriptionPersonnel });
    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 2b. METTRE A JOUR LES PERMISSIONS
exports.updatePermissions = async (req, res) => {
    try {
        const { idInscriptionPersonnel, permissionsAjoutees, permissionsRetirees } = req.body;
        await InscriptionPersonnel.update({
            permissionsAjoutees: JSON.stringify(permissionsAjoutees),
            permissionsRetirees: JSON.stringify(permissionsRetirees)
        }, { where: { idInscriptionPersonnel } });

        res.json({ message: "Permissions mises à jour." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// 3. RECONDUIRE EN MASSE
exports.reconduirePersonnel = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idsInscriptionsPrecedentes, idNouvelleAnnee } = req.body;

        for (const idOld of idsInscriptionsPrecedentes) {
            const old = await InscriptionPersonnel.findByPk(idOld);
            if (!old) continue;

            // Créer nouvelle inscription
            const newIns = await InscriptionPersonnel.create({
                ...old.toJSON(),
                idInscriptionPersonnel: null,
                idAnneeScolaire: idNouvelleAnnee,
                createdAt: null, updatedAt: null
            }, { transaction: t });

            // Copier les spécialités
            const specs = await CompetenceEnseignant.findAll({ where: { idInscriptionPersonnel: idOld } });
            for (const s of specs) {
                await CompetenceEnseignant.create({
                    idInscriptionPersonnel: newIns.idInscriptionPersonnel,
                    idMatiere: s.idMatiere
                }, { transaction: t });
            }
        }

        await t.commit();
        res.json({ message: "Reconduction terminée." });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// 4. BLOQUER / DEBLOQUER
exports.setBloqueStatut = async (req, res) => {
    try {
        const { idUtilisateur, idEtablissement, bloque } = req.body;
        // Interdire de se bloquer soi-même ou l'admin global (simplifié: on check l'ID)
        if (idUtilisateur == req.user.userId) return res.status(400).json({ error: "Action impossible sur soi-même." });

        await InscriptionPersonnel.update(
            { bloque },
            { where: { idUtilisateur, idEtablissement } }
        );

        res.json({ message: bloque ? "Utilisateur bloqué." : "Utilisateur débloqué." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. AFFECTER A UNE SALLE
exports.affecterSalle = async (req, res) => {
    try {
        const { idInscriptionPersonnel, idSalle, idMatiere } = req.body;

        // Vérifier conflit de matière
        const existing = await AffectationPersonnelSalle.findOne({
            where: { idSalle, idMatiere }
        });
        if (existing) return res.status(409).json({ error: "Un enseignant est déjà affecté à cette matière dans cette salle." });

        const affectation = await AffectationPersonnelSalle.create({
            idInscriptionPersonnel, idSalle, idMatiere
        });

        res.status(201).json(affectation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. RECUPERER DEMANDES EN ATTENTE (POUR ADMIN)
exports.getDemandesEnAttente = async (req, res) => {
    try {
        const { idEtablissement } = req.params;
        const demandes = await DemandeInscriptionPersonnel.findAll({
            where: { idEtablissement, etat: 'EN_ATTENTE' },
            include: [{
                model: Utilisateur,
                attributes: ['idUtilisateur', 'nom', 'identifiant']
            }],
            order: [['dateDemande', 'ASC']]
        });
        res.json(demandes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. LISTE PERSONNEL ACTIF
exports.getPersonnelActif = async (req, res) => {
    try {
        const { idEtablissement, idAnneeScolaire } = req.params;
        const personnel = await InscriptionPersonnel.findAll({
            where: { idEtablissement, idAnneeScolaire, supprimer: false },
            include: [{ model: Matiere, as: 'specialites' }]
        });

        // Formatter pour s'assurer que les JSON strings sont parsés en tableaux pour Android
        const formatted = personnel.map(p => {
            const item = p.toJSON();
            try {
                item.permissionsAjoutees = item.permissionsAjoutees ? JSON.parse(item.permissionsAjoutees) : [];
            } catch (e) { item.permissionsAjoutees = []; }

            try {
                item.permissionsRetirees = item.permissionsRetirees ? JSON.parse(item.permissionsRetirees) : [];
            } catch (e) { item.permissionsRetirees = []; }

            return item;
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. RECUPERER ASSOCIATIONS UTILISATEUR (ECOLES + ROLES)
exports.getUserAssociations = async (req, res) => {
  try {
    const { userId } = req.params;

    // On récupère les inscriptions validées
    const inscriptions = await InscriptionPersonnel.findAll({
      where: { idUtilisateur: userId, supprimer: false, bloque: false },
      include: [{
        model: require("../models").Etablissement,
        attributes: ['idEtablissement', 'nomFr', 'nomEn', 'ville', 'idCreateur', 'pinSecurite']
      }]
    });

    const associations = {};
    inscriptions.forEach(ins => {
      if (!ins.Etablissement) return;

      const schoolId = ins.Etablissement.idEtablissement;
      if (!associations[schoolId]) {
        associations[schoolId] = {
          school: {
            idServeur: ins.Etablissement.idEtablissement,
            nomFr: ins.Etablissement.nomFr,
            nomEn: ins.Etablissement.nomEn,
            ville: ins.Etablissement.ville,
            idCreateur: ins.Etablissement.idCreateur,
            pinSecurite: ins.Etablissement.pinSecurite
          },
          roles: [],
          etat: 'VALIDE'
        };
      }
      if (!associations[schoolId].roles.includes(ins.role)) {
        associations[schoolId].roles.push(ins.role);
      }
    });

    // On récupère AUSSI les demandes en attente pour afficher le statut "En attente" dans l'UI
    const demandes = await DemandeInscriptionPersonnel.findAll({
      where: { idUtilisateur: userId, etat: 'EN_ATTENTE' },
      include: [{
        model: require("../models").Etablissement,
        attributes: ['idEtablissement', 'nomFr', 'nomEn', 'ville', 'idCreateur', 'pinSecurite']
      }]
    });

    demandes.forEach(dem => {
        if (!dem.Etablissement) return;
        const schoolId = dem.Etablissement.idEtablissement;

        // Si on a déjà une inscription validée pour cette école, on ignore la demande en attente
        // (L'utilisateur est déjà dedans avec un rôle)
        if (associations[schoolId]) return;

        associations[schoolId] = {
            school: {
                idServeur: dem.Etablissement.idEtablissement,
                nomFr: dem.Etablissement.nomFr,
                nomEn: dem.Etablissement.nomEn,
                ville: dem.Etablissement.ville,
                idCreateur: dem.Etablissement.idCreateur,
                pinSecurite: dem.Etablissement.pinSecurite
            },
            roles: [],
            etat: 'EN_ATTENTE'
        };
    });

    res.json(Object.values(associations));
  } catch (error) {
    console.error("❌ Erreur getUserAssociations:", error);
    res.status(500).json({ error: error.message });
  }
};

// 9. RECUPERER MES DEMANDES (POUR L'UTILISATEUR)
exports.getMyDemands = async (req, res) => {
    try {
        const { userId } = req.params;
        const demandes = await DemandeInscriptionPersonnel.findAll({
            where: { idUtilisateur: userId },
            include: [{
                model: Etablissement,
                attributes: ['idEtablissement', 'nomFr', 'ville']
            }],
            order: [['dateDemande', 'DESC']]
        });
        res.json(demandes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

