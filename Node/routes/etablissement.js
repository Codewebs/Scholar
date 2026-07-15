const express = require("express");
const router = express.Router();
const { Etablissement } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration Multer pour le Logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/logos";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max pour éviter les erreurs sur mobile
  fileFilter: (req, file, cb) => {
    console.log(`📁 [Multer] Tentative d'upload: ${file.originalname} (${file.mimetype})`);
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) return cb(null, true);

    // Fallback: si le mimetype est générique mais l'extension est correcte
    if (extname) return cb(null, true);

    cb(new Error(`Type de fichier non supporté: ${file.mimetype}. Seuls les fichiers images (jpeg, jpg, png, webp) sont autorisés.`));
  }
});

// Route pour l'upload du logo
router.post("/upload-logo", upload.single("logo"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier n'a été envoyé." });

    // On retourne l'URL complète pour que l'appli puisse l'afficher directement
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
    res.json({ filename: logoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rechercher un établissement par nom
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`🔍 [SchoolRoute] Recherche: "${q}"`);
    const schools = await Etablissement.findAll({
      where: {
        nomFr: { [Op.like]: `%${q}%` },
        supprimer: false
      },
      limit: 10
    });
    console.log(`✅ [SchoolRoute] ${schools.length} résultats trouvés.`);
    res.json(schools);
  } catch (err) {
    console.error("❌ [SchoolRoute] Erreur recherche:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les établissements d'un utilisateur (créés + recrutés)
router.get("/user/:userId", async (req, res) => {
  try {
    const { InscriptionPersonnel } = require('../models');

    // Écoles créées
    const createdSchools = await Etablissement.findAll({
      where: { idCreateur: req.params.userId, supprimer: false }
    });

    // Écoles où l'utilisateur est recruté
    const recruited = await InscriptionPersonnel.findAll({
      where: { idUtilisateur: req.params.userId, supprimer: false, bloque: false },
      include: [{ model: Etablissement, where: { supprimer: false } }]
    });

    const recruitedSchools = recruited.map(r => r.Etablissement).filter(Boolean);

    // Fusionner et supprimer les doublons
    const allSchools = [...createdSchools, ...recruitedSchools];
    const uniqueSchools = Array.from(new Map(allSchools.map(s => [s.idEtablissement, s])).values());

    res.json(uniqueSchools);
  } catch (err) {
    console.error("❌ [SchoolRoute] Erreur getUserSchools:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Créer un établissement
router.post("/", async (req, res) => {
  try {
    console.log("📝 [SchoolRoute] Tentative de création d'établissement:", req.body.nomFr);
    const school = await Etablissement.create(req.body);
    console.log("✅ [SchoolRoute] Établissement créé avec succès ID:", school.idEtablissement);
    res.status(201).json(school);
  } catch (err) {
    console.error("❌ [SchoolRoute] Erreur création établissement:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Récupérer un établissement par ID
router.get("/:id", async (req, res) => {
  try {
    const school = await Etablissement.findByPk(req.params.id);
    if (!school) return res.status(404).json({ error: "Établissement non trouvé" });
    res.json(school);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modifier un établissement
router.put("/:id", async (req, res) => {
  try {
    console.log(`📝 [SchoolRoute] Mise à jour établissement ID ${req.params.id}:`, req.body);
    await Etablissement.update(req.body, { where: { idEtablissement: req.params.id } });
    console.log(`✅ [SchoolRoute] Établissement ID ${req.params.id} mis à jour.`);
    res.json({ message: "Établissement mis à jour" });
  } catch (err) {
    console.error(`❌ [SchoolRoute] Erreur mise à jour établissement ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Rechercher des élèves dans un établissement
router.get("/:schoolId/students/search", async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { q } = req.query;
    const { Eleve, Inscription, AnneeScolaire } = require("../models");

    const students = await Eleve.findAll({
      where: {
        [Op.or]: [
          { nom: { [Op.like]: `%${q}%` } },
          { prenom: { [Op.like]: `%${q}%` } }
        ],
        supprimer: false
      },
      include: [{
        model: Inscription,
        required: true,
        where: { supprimer: false },
        include: [{
            model: AnneeScolaire,
            required: true,
            where: { idEtablissement: schoolId, supprimer: false }
        }]
      }],
      limit: 20
    });

    res.json(students);
  } catch (err) {
    console.error(`❌ [SchoolRoute] Erreur recherche élèves:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
