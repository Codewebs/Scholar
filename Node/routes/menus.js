const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const Menu = require('../models/menu');
const AutorisationUtilisateur = require('../models/autorisation_utilisateur');
const Qualite = require('../models/qualite');
const Utilisateur = require('../models/Utilisateur');
const { verifyToken } = require("../middleware/auth");
require("dotenv").config();



module.exports = (app) => {

app.delete("/users/:id/permanent", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM autorisation_utilisateur WHERE idUtilisateur = ?", [id]);
    await db.query("DELETE FROM utilisateur WHERE idUtilisateur = ?", [id]);
    res.json({ success: true, message: "Utilisateur supprimé définitivement" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.post("/users/:id/permissions", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const { menuIds } = req.body; 
    if (!Array.isArray(menuIds)) return res.status(400).json({ success: false, message: "menuIds must be an array" });

    await db.query("DELETE FROM autorisation_utilisateur WHERE idUtilisateur = ?", [id]);

    if (menuIds.length === 0) {
      return res.json({ success: true, message: "Permissions réinitialisées" });
    }

    const placeholders = menuIds.map(() => "(?, ?)").join(", ");
    const params = [];
    menuIds.forEach((menuId) => {
      params.push(null); 
    });

    
    for (const menuId of menuIds) {
      await db.query("INSERT INTO autorisation_utilisateur (idMenu, idUtilisateur) VALUES (?, ?)", [menuId, id]);
    }

    res.json({ success: true, message: "Permissions mises à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user permissions (list menus assigned)
app.get("/users/:id/permissions", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      `SELECT m.idMenu, m.libelleMenu
       FROM autorisation_utilisateur au
       JOIN menu m ON au.idMenu = m.idMenu
       WHERE au.idUtilisateur = ?`,
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Revoke a single permission
app.delete("/users/:id/permissions/:menuId", verifyToken, async (req, res) => {
  try {
    const { id, menuId } = req.params;
    await db.query("DELETE FROM autorisation_utilisateur WHERE idUtilisateur = ? AND idMenu = ?", [id, menuId]);
    res.json({ success: true, message: "Permission supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// 🔹 Liste tous les menus
app.get("/menus", verifyToken, async (req, res) => {
  try {
    const menus = await Menu.findAll({
      attributes: ["idMenu", "libelleMenu"]
    });
    res.json({ success: true, menus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});


// 🔹 Crée un nouveau menu
app.post("/menus", verifyToken, async (req, res) => {
  const { libelleMenu } = req.body;

  if (!libelleMenu) {
    return res.status(400).json({ success: false, message: "Le champ libelleMenu est requis" });
  }

  try {
    const existing = await Menu.findOne({ where: { libelleMenu } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Ce menu existe déjà" });
    }

    const menu = await Menu.create({ libelleMenu });
    res.json({ success: true, message: "Menu créé avec succès", menu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});


// 🔹 Met à jour un menu existant
app.put("/menus/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { libelleMenu } = req.body;

  if (!libelleMenu) {
    return res.status(400).json({ success: false, message: "Le champ libelleMenu est requis" });
  }

  try {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu introuvable" });
    }

    const existing = await Menu.findOne({ where: { libelleMenu, idMenu: { [Sequelize.Op.ne]: id } } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Un menu avec ce libelle existe déjà" });
    }

    menu.libelleMenu = libelleMenu;
    await menu.save();

    res.json({ success: true, message: "Menu mis à jour avec succès", menu });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

app.delete("/menus/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const menu = await Menu.findByPk(id);
    if (!menu) {
      return res.status(404).json({ success: false, message: "Menu introuvable" });
    }

    await menu.destroy();

    res.json({ success: true, message: "Menu supprimé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

}