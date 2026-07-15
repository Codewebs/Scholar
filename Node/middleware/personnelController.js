const {
  DemandeInscriptionPersonnel,
  InscriptionPersonnel,
  CompetenceEnseignant,
  RepartitionEnseignant,
  Utilisateur,
  Matiere,
  Salle,
  Etablissement,
  Inscription,
  sequelize
} = require("../models");
const { Op } = require("sequelize");

const STAFF_ROLES = [
    "ADMINISTRATEUR", "FONDATEUR", "DIRECTEUR", "VICE_PRINCIPAL", "DIRECTEUR_DES_ETUDES",
    "INTENDANT", "SECRETAIRE", "SURVEILLANT_GENERAL", "CHEF_DE_DEPARTEMENT", "ENSEIGNANT",
    "CONSEILLER_ORIENTATION", "INFIRMIER", "AGENT_ENTRETIEN", "PERSONNEL_CANTINE"
];
const USAGER_ROLES = ["PARENT", "ELEVE"];

// 1. ENVOYER UNE DEMANDE
exports.envoyerDemande = async (req, res) => {
    try {
        const { idUtilisateur, idEtablissement, profilDemande, nom, prenom, telephone1, email, specialites, code, idEleveLinked } = req.body;
        console.log(`📩 [PersonnelCtrl] Nouvelle demande d'inscription: User=${idUtilisateur}, School=${idEtablissement}, Profil=${profilDemande}, LinkChild=${idEleveLinked}`);

        // 1. Vérifier si bloqué
        const blocked = await InscriptionPersonnel.findOne({
            where: { idUtilisateur, idEtablissement, bloque: true }
        });
        if (blocked) {
            console.warn(`🚫 [PersonnelCtrl] Tentative de demande par utilisateur bloqué: User=${idUtilisateur}`);
            return res.status(403).json({ error: "Accès refusé par l'établissement." });
        }

        // 2. Vérifier si une demande IDENTIQUE en attente existe
        const existingDemand = await DemandeInscriptionPersonnel.findOne({
            where: {
                idUtilisateur,
                idEtablissement,
                profilDemande,
                etat: 'EN_ATTENTE'
            }
        });
        if (existingDemand) {
            return res.status(409).json({ error: "Une demande pour ce rôle est déjà en cours d'étude." });
        }

        // 3. Récupérer TOUTES les inscriptions de l'utilisateur (ou liées par email/tel) dans cet établissement
        const orConditions = [{ idUtilisateur }];
        if (telephone1) orConditions.push({ telephone1 });
        if (email && email.trim() !== "") orConditions.push({ email });

        const currentInscriptions = await InscriptionPersonnel.findAll({
            where: {
                idEtablissement,
                supprimer: false,
                [Op.or]: orConditions
            }
        });

        const existingRoles = currentInscriptions.map(ins => ins.role);

        // Si l'utilisateur a déjà exactement ce rôle
        if (existingRoles.includes(profilDemande)) {
            return res.status(409).json({ error: `Cet utilisateur est déjà enregistré comme ${profilDemande} dans cet établissement.` });
        }

        // 4. Vérifier les CONFLITS (Règles 1 & 2)
        const isNewStaff = STAFF_ROLES.includes(profilDemande);
        const isNewUsager = USAGER_ROLES.includes(profilDemande);
        const hasStaff = existingRoles.some(r => STAFF_ROLES.includes(r));
        const hasParent = existingRoles.includes("PARENT");
        const hasEleve = existingRoles.includes("ELEVE");

        if (profilDemande === "ELEVE" && hasParent) {
            return res.status(400).json({ error: "Isolation : Un utilisateur ne peut pas être à la fois Élève et Parent dans le même établissement." });
        }
        if (profilDemande === "PARENT" && hasEleve) {
            return res.status(400).json({ error: "Isolation : Un utilisateur ne peut pas être à la fois Élève et Parent dans le même établissement." });
        }
        if (isNewStaff && (hasEleve || hasParent)) {
            return res.status(400).json({ error: "Exclusivité Staff vs Usagers : Un membre du Staff ne peut pas être Élève ou Parent." });
        }
        if (isNewUsager && hasStaff) {
            return res.status(400).json({ error: "Exclusivité Staff vs Usagers : Un Élève ou Parent ne peut pas rejoindre le Staff." });
        }

        // 5. Vérification du CODE (Règle 4)
        const school = await Etablissement.findByPk(idEtablissement);
        if (!school) return res.status(404).json({ error: "Établissement introuvable." });

        if (isNewStaff) {
            if (!code || code !== school.codeRecrutement) {
                return res.status(403).json({ error: "Code de recrutement invalide pour rejoindre le Staff." });
            }
        } else if (isNewUsager) {
            const validInscription = await Inscription.findOne({
                where: { codeInscription: code },
                include: [{
                    model: Salle,
                    where: { idEtablissement }
                }]
            });
            if (!validInscription) {
                return res.status(403).json({ error: "Code d'inscription invalide pour cet établissement. Veuillez vérifier le code sur votre reçu." });
            }
        }

        // 6. Création de la demande
        const demande = await DemandeInscriptionPersonnel.create({
            idUtilisateur, idEtablissement, profilDemande, nom, prenom, telephone1, email, specialites, idEleveLinked
        });

        console.log(`✅ [PersonnelCtrl] Demande créée avec succès ID: ${demande.idDemande}`);
        res.status(201).json(demande);
    } catch (error) {
        console.error(`❌ [PersonnelCtrl] Erreur envoyerDemande:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

// 2. VALIDER UNE DEMANDE
exports.validerDemande = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            idDemande, idAnneeScolaire, matricule, dateNaissance, lieuNaissance,
            sexe, role, diplomes, permissionsAjoutees, permissionsRetirees,
            idEleveLinked: bodyIdEleveLinked // Optionnel: ID de l'élève à lier si rôle ELEVE ou PARENT
        } = req.body;

        const demande = await DemandeInscriptionPersonnel.findByPk(idDemande);
        if (!demande) return res.status(404).json({ error: "Demande introuvable." });

        const idEleveLinked = bodyIdEleveLinked || demande.idEleveLinked;

        // Update diplomas in global user profile if provided
        if (diplomes) {
            await Utilisateur.update({ diplomes }, { where: { idUtilisateur: demande.idUtilisateur }, transaction: t });
        }

        // Créer l'inscription avec surcharges de droits
        const finalRole = role || demande.profilDemande;
        const inscription = await InscriptionPersonnel.create({
            matricule,
            nom: demande.nom,
            prenom: demande.prenom,
            dateNaissance,
            lieuNaissance,
            sexe,
            telephone1: demande.telephone1,
            email: demande.email,
            role: finalRole,
            idUtilisateur: demande.idUtilisateur,
            idAnneeScolaire,
            idEtablissement: demande.idEtablissement,
            idDemandeSource: idDemande,
            permissionsAjoutees: permissionsAjoutees ? JSON.stringify(permissionsAjoutees) : null,
            permissionsRetirees: permissionsRetirees ? JSON.stringify(permissionsRetirees) : null
        }, { transaction: t });

        // LIEN AVEC ELEVE (SI APPLICABLE)
        if (idEleveLinked) {
            if (finalRole === 'ELEVE') {
                await sequelize.models.Eleve.update(
                    { idUtilisateur: demande.idUtilisateur },
                    { where: { idEleve: idEleveLinked }, transaction: t }
                );
            } else if (finalRole === 'PARENT') {
                // Pour un parent, on peut imaginer un lien via une table Pivot ou
                // simplement mettre à jour les champs téléphone si nécessaire,
                // mais le lien formel se fait par idUtilisateur dans Eleve (idParentUser ?)
                // Pour l'instant on suit la consigne: "créer un lien entre eleve/parent et utilsateur"
                // On pourrait ajouter idUtilisateurParent à la table eleve.
                await sequelize.models.Eleve.update(
                    { idUtilisateurParent: demande.idUtilisateur },
                    { where: { idEleve: idEleveLinked }, transaction: t }
                );
            }
        }

        // Gérer les spécialités si enseignant
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

// 2b. REJETER UNE DEMANDE
exports.rejeterDemande = async (req, res) => {
    try {
        const { idDemande } = req.body;
        await DemandeInscriptionPersonnel.update({ etat: 'REJETE' }, { where: { idDemande } });
        res.json({ message: "Demande rejetée." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2c. METTRE A JOUR LES PERMISSIONS
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
        const existing = await RepartitionEnseignant.findOne({
            where: { idSalle, idMatiere, supprimer: false }
        });
        if (existing) return res.status(409).json({ error: "Un enseignant est déjà affecté à cette matière dans cette salle." });

        const affectation = await RepartitionEnseignant.create({
            idInscriptionPersonnel, idSalle, idMatiere, idAnneeScolaire: req.body.idAnneeScolaire
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
            include: [
                { model: Matiere, as: 'specialites' },
                { model: Utilisateur, attributes: ['idUtilisateur', 'nom', 'email', 'telephone', 'diplomes', 'photo'] }
            ]
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
    console.log(`🔍 [PersonnelCtrl] Récupération associations pour UserID: ${userId}`);

    // On récupère les inscriptions validées
    const inscriptions = await InscriptionPersonnel.findAll({
      where: { idUtilisateur: userId, supprimer: false, bloque: false },
      include: [{
        model: Etablissement,
        attributes: ['idEtablissement', 'nomFr', 'nomEn', 'ville', 'idCreateur', 'pinSecurite', 'telephone1', 'abreviation', 'logo', 'adresse', 'pays']
      }]
    });

    const associations = {};
    inscriptions.forEach(ins => {
      if (!ins.Etablissement) return;

      const schoolId = ins.Etablissement.idEtablissement;
      const yearId = ins.idAnneeScolaire;
      const key = `${schoolId}-${yearId}`;

      if (!associations[key]) {
        let perms = [];
        try {
            perms = ins.permissionsAjoutees ? (typeof ins.permissionsAjoutees === 'string' ? JSON.parse(ins.permissionsAjoutees) : ins.permissionsAjoutees) : [];
        } catch (e) { perms = []; }

        associations[key] = {
          school: {
            idEtablissement: ins.Etablissement.idEtablissement,
            nomFr: ins.Etablissement.nomFr,
            nomEn: ins.Etablissement.nomEn,
            ville: ins.Etablissement.ville,
            idCreateur: ins.Etablissement.idCreateur,
            pinSecurite: ins.Etablissement.pinSecurite,
            telephone1: ins.Etablissement.telephone1,
            abreviation: ins.Etablissement.abreviation,
            logo: ins.Etablissement.logo,
            adresse: ins.Etablissement.adresse,
            pays: ins.Etablissement.pays
          },
          idAnneeScolaire: yearId,
          roles: [],
          permissionsAjoutees: perms,
          permissionsRetirees: ins.permissionsRetirees ? (typeof ins.permissionsRetirees === 'string' ? JSON.parse(ins.permissionsRetirees) : ins.permissionsRetirees) : [],
          etat: 'VALIDE'
        };
      }
      if (!associations[key].roles.includes(ins.role)) {
        associations[key].roles.push(ins.role);
      }
    });

    // On récupère AUSSI les demandes pour afficher le statut (En attente, Validé, Rejeté) dans l'UI
    const demandes = await DemandeInscriptionPersonnel.findAll({
      where: {
        idUtilisateur: userId,
        etat: { [Op.in]: ['EN_ATTENTE', 'VALIDE', 'REJETE'] }
      },
      include: [{
        model: Etablissement,
        attributes: ['idEtablissement', 'nomFr', 'nomEn', 'ville', 'idCreateur', 'pinSecurite', 'telephone1', 'abreviation', 'logo', 'adresse', 'pays']
      }]
    });

    demandes.forEach(dem => {
        if (!dem.Etablissement) return;
        const schoolId = dem.Etablissement.idEtablissement;
        // Pour les demandes, on n'a pas encore d'année scolaire définie dans l'association
        // mais on peut utiliser une clé générique ou 0
        const key = `${schoolId}-0`;

        // Si on a déjà une inscription validée (dans la table inscription_personnel) pour cette école,
        // on ne surcharge pas avec le statut de la demande.
        // On vérifie s'il existe une clé schoolId-quelquechose déjà VALIDEE
        const alreadyHasValid = Object.keys(associations).some(k => k.startsWith(`${schoolId}-`) && associations[k].etat === 'VALIDE');
        if (alreadyHasValid) return;

        associations[key] = {
            school: {
                idEtablissement: dem.Etablissement.idEtablissement,
                nomFr: dem.Etablissement.nomFr,
                nomEn: dem.Etablissement.nomEn,
                ville: dem.Etablissement.ville,
                idCreateur: dem.Etablissement.idCreateur,
                pinSecurite: dem.Etablissement.pinSecurite,
                telephone1: dem.Etablissement.telephone1,
                abreviation: dem.Etablissement.abreviation,
                logo: dem.Etablissement.logo,
                adresse: dem.Etablissement.adresse,
                pays: dem.Etablissement.pays
            },
            idAnneeScolaire: 0,
            roles: [dem.profilDemande],
            permissionsAjoutees: [],
            permissionsRetirees: [],
            etat: dem.etat
        };
    });

    const result = Object.values(associations);
    console.log(`✅ [PersonnelCtrl] ${result.length} associations trouvées pour UserID: ${userId}`);
    res.json(result);
  } catch (error) {
    console.error("❌ [PersonnelCtrl] Erreur getUserAssociations:", error);
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

// 10. METTRE A JOUR PROFIL (NOM, PRENOM, DIPLOMES, ETC.)
exports.updateProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { idUtilisateur } = req.params;
        const { nom, prenom, diplomes, email, telephone } = req.body;

        // 1. Mettre à jour l'utilisateur Global
        await Utilisateur.update({
            nom,
            email,
            telephone,
            diplomes
        }, { where: { idUtilisateur }, transaction: t });

        // 2. Mettre à jour les inscriptions locales pour le nom/prenom/email
        await InscriptionPersonnel.update({
            nom,
            prenom,
            email
        }, { where: { idUtilisateur }, transaction: t });

        await t.commit();
        res.json({ message: "Profil mis à jour avec succès." });
    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ [PersonnelCtrl] updateProfile error:", error);
        res.status(500).json({ error: error.message });
    }
};

