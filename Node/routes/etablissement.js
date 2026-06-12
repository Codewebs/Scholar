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

// Récupérer les établissements créés par un utilisateur spécifique
router.get("/user/:userId", async (req, res) => {
  try {
    const schools = await Etablissement.findAll({
      where: {
        idCreateur: req.params.userId,
        supprimer: false
      },
      order: [['createdAt', 'DESC']]
    });
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un établissement
router.post("/", async (req, res) => {
  try {
    const school = await Etablissement.create(req.body);
    res.status(201).json(school);
  } catch (err) {
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
    await Etablissement.update(req.body, { where: { idEtablissement: req.params.id } });
    res.json({ message: "Établissement mis à jour" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
