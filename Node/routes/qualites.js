// routes/qualites.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const Menu = require('../models/menu');
const AutorisationUtilisateur = require('../models/autorisation_utilisateur');
const Qualite = require('../models/qualite');
const Utilisateur = require('../models/utilisateur');
const { verifyToken } = require("../middleware/auth");
const verifyAccess = require("../middleware/verify");
require("dotenv").config();



module.exports = (app) => {


// 🔹 Lister les utilisateurs par rôle
app.get("/users/role/:role", verifyToken,verifyAccess("Administration : Années scolaires"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, fname, lname, email, role FROM users WHERE role = ?", [req.params.role]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 Activer/Désactiver un utilisateur
app.put("/users/:id/toggle-active", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT supprimer FROM users WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }
    const user = rows[0];
    const newStatus = !user.supprimer;
    await db.query("UPDATE users SET supprimer = ? WHERE id = ?", [newStatus, req.params.id]);
    res.json({
      success: true,
      message: `Utilisateur ${newStatus ? "désactivé" : "activé"}`,
      isActive: !newStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Assign role / quality (idQualite)
app.post("/users/:id/assign-role", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { idQualite } = req.body;
    if (typeof idQualite === "undefined") return res.status(400).json({ success: false, message: "idQualite requis" });

    await db.query("UPDATE utilisateur SET idQualite = ? WHERE idUtilisateur = ?", [idQualite, id]);
    res.json({ success: true, message: "Rôle/qualité assigné" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// List menus (permissions)
app.get("/menus", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT idMenu, libelleMenu FROM menu ORDER BY libelleMenu");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// 🔹 Liste des qualités / rôles
app.get("/qualites", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT idQualite, libelleQualite, abreviation, description FROM qualite WHERE supprimer = 0 ORDER BY libelleQualite ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔹 Créer une nouvelle qualité / rôle
app.post("/qualites", verifyToken, async (req, res) => {
  const { libelleQualite, abreviation, description } = req.body;

  if (!libelleQualite) {
    return res.status(400).json({ success: false, message: "Le libellé de la qualité est requis" });
  }

  try {
    // Vérifie si la qualité existe déjà
    const existing = await Qualite.findOne({ where: { libelleQualite } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Cette qualité existe déjà" });
    }

    // Création de la qualité
    const qualite = await Qualite.create({ libelleQualite, abreviation, description });
    res.json({ success: true, message: "Qualité créée avec succès", data: qualite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});


// 🔹 Mettre à jour une qualité / rôle
app.put("/qualites/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { libelleQualite, abreviation, description } = req.body;

  try {
    const qualite = await Qualite.findByPk(id);

    if (!qualite) {
      return res.status(404).json({ success: false, message: "Qualité introuvable" });
    }

    // Vérifie si un autre enregistrement a déjà ce libellé
    if (libelleQualite) {
      const existing = await Qualite.findOne({ 
        where: { libelleQualite, idQualite: { [Sequelize.Op.ne]: id } } 
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Une qualité avec ce libellé existe déjà" });
      }
    }

    // Mise à jour
    qualite.libelleQualite = libelleQualite ?? qualite.libelleQualite;
    qualite.abreviation = abreviation ?? qualite.abreviation;
    qualite.description = description ?? qualite.description;

    await qualite.save();

    res.json({ success: true, message: "Qualité mise à jour avec succès", data: qualite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});


// 🔹 Supprimer une qualité / rôle
app.delete("/qualites/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const qualite = await Qualite.findByPk(id);

    if (!qualite) {
      return res.status(404).json({ success: false, message: "Qualité introuvable" });
    }

    // Option 1 : suppression physique
    await qualite.destroy();

    // Option 2 : suppression logique (si tu veux juste marquer comme supprimée)
    // qualite.supprimer = true;
    // await qualite.save();

    res.json({ success: true, message: "Qualité supprimée avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});



app.get("/utilisateurs/etudiants", verifyToken, async (req, res) => {
  try {
    const etudiants = await Utilisateur.findAll({
      include: {
        model: Qualite,
        where: { libelleQualite: "Étudiant" },
        attributes: ["idQualite", "libelleQualite"]
      }
    });
    res.json(etudiants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.get("/utilisateurs/administratifs", verifyToken, async (req, res) => {
  try {
    const admin = await Utilisateur.findAll({
      include: {
        model: Qualite,
        where: { libelleQualite: "Administratif" },
        attributes: ["idQualite", "libelleQualite"]
      }
    });
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});


app.get("/utilisateurs/stats/roles", verifyToken, async (req, res) => {
  try {
    const stats = await Utilisateur.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Utilisateur.idUtilisateur")), "count"],
      ],
      include: [{
        model: Qualite,
        attributes: ["libelleQualite"]
      }],
      group: ["idQualite"]
    });

    const formatted = stats.map(s => ({
      role: s.Qualite.libelleQualite,
      count: s.dataValues.count
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

}