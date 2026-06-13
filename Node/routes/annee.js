const express = require('express');
const router = express.Router();
const { AnneeScolaire, Etablissement, InscriptionPersonnel, sequelize } = require('../models');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

// ✅ GET années par établissement (Public pour le setup initial)
router.get("/etablissement/:schoolId", async (req, res) => {
  try {
    const { schoolId } = req.params;
    console.log(`🔍 [YearRoute] Recherche années pour l'école: ${schoolId}`);
    const annees = await AnneeScolaire.findAll({
      where: {
        idEtablissement: schoolId,
        cloturerAnnee: false // Filtre pour ne montrer que les années actives
      },
      order: [['dateDebut', 'DESC']]
    });
    console.log(`✅ [YearRoute] ${annees.length} années trouvées.`);
    res.json(annees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.get("/", async (req, res) => {
  try {
    const annees = await AnneeScolaire.findAll({ order: [['dateDebut', 'DESC']] });
    res.json(annees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ POST nouvelle année
router.post("/", async (req, res) => {
  console.log("📝 [YearRoute] Tentative de création d'année scolaire...");
  const t = await sequelize.transaction();
  try {
    const { libelleAnneeScolaire, dateDebut, dateFin, cloturerAnnee, idEtablissement } = req.body;

    if (!libelleAnneeScolaire || !dateDebut || !dateFin || !idEtablissement) {
      console.warn("⚠️ [YearRoute] Données incomplètes:", { libelleAnneeScolaire, dateDebut, dateFin, idEtablissement });
      return res.status(400).json({ error: "Champs manquants (Libellé, dates ou ID Établissement)" });
    }

    const existing = await AnneeScolaire.findOne({
      where: { libelleAnneeScolaire, idEtablissement }
    });
    if (existing) {
      console.warn(`⚠️ [YearRoute] L'année "${libelleAnneeScolaire}" existe déjà pour l'école ${idEtablissement}`);
      return res.status(409).json({ error: "Cette année existe déjà pour cet établissement" });
    }

    console.log("💾 [YearRoute] Enregistrement en base de données...");
    const annee = await AnneeScolaire.create({
      libelleAnneeScolaire,
      dateDebut,
      dateFin,
      idEtablissement,
      cloturerAnnee: cloturerAnnee || false
    }, { transaction: t });

    // ✅ AUTOMATIC ADMIN REGISTRATION for the first user (Creator)
    const school = await Etablissement.findByPk(idEtablissement, { transaction: t });
    if (school && school.idCreateur) {
        // Check if this is the first year or if admin already registered
        const existingAdmin = await InscriptionPersonnel.findOne({
            where: { idUtilisateur: school.idCreateur, idEtablissement, idAnneeScolaire: annee.idAnneeScolaire, role: 'ADMINISTRATEUR' },
            transaction: t
        });

        if (!existingAdmin) {
            console.log(`👑 Auto-registering creator (User: ${school.idCreateur}) as ADMIN for year ${annee.idAnneeScolaire}`);
            await InscriptionPersonnel.create({
                matricule: `ADM-${idEtablissement}`,
                nom: 'ADMIN', // Placeholder, ideally from creator profile
                prenom: 'SYSTEM',
                dateNaissance: '2000-01-01',
                lieuNaissance: 'SYSTEM',
                telephone1: school.telephone1,
                role: 'ADMINISTRATEUR',
                idUtilisateur: school.idCreateur,
                idAnneeScolaire: annee.idAnneeScolaire,
                idEtablissement: idEtablissement
            }, { transaction: t });
        }
    }

    await t.commit();
    console.log("✅ [YearRoute] Année créée avec succès ! ID:", annee.idAnneeScolaire);
    res.status(201).json(annee);

  } catch (error) {
    if (t) await t.rollback();
    console.error("❌ [YearRoute] Erreur lors de la création :", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// ✅ PUT mise à jour
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { libelleAnneeScolaire, dateDebut, dateFin, cloturerAnnee } = req.body;

    const annee = await AnneeScolaire.findByPk(id);
    if (!annee) return res.status(404).json({ error: "Année introuvable" });

    await annee.update({ libelleAnneeScolaire, dateDebut, dateFin, cloturerAnnee });

    res.json(annee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ✅ DELETE suppression
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const annee = await AnneeScolaire.findByPk(id);
    if (!annee) return res.status(404).json({ error: "Année introuvable" });

    await annee.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
