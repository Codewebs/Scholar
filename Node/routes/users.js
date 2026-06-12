// routes/users.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Utilisateur, Qualite, Specialite, sequelize } = require('../models');
const { verifyToken } = require("../middleware/auth");
const { Op } = require("sequelize");

require("dotenv").config();

// 🔹 Profil utilisateur actuel
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await Utilisateur.findByPk(req.user.userId, {
      include: [
        { model: Qualite, as: 'qualite' },
        { model: Specialite, as: 'specialites' }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    res.json({
      success: true,
      userId: user.idUtilisateur,
      name: user.nom,
      identifiant: user.identifiant,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo,
      role: user.qualite ? user.qualite.libelleQualite : "ENSEIGNANT",
      specialites: user.specialites
    });
  } catch (err) {
    console.error("🔥 Erreur /me :", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// 🔹 Mise à jour du profil (Nom, Téléphone, Photo)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { nom, telephone, photo } = req.body;
    await Utilisateur.update(
      { nom, telephone, photo },
      { where: { idUtilisateur: req.user.userId } }
    );
    res.json({ success: true, message: "Profil mis à jour" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Changement de mot de passe (3 étapes gérées côté client, ici validation finale)
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await Utilisateur.findByPk(req.user.userId);

    const valid = await bcrypt.compare(oldPassword, user.mdp);
    if (!valid) return res.status(400).json({ message: "Ancien mot de passe incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ mdp: hashedPassword });

    res.json({ success: true, message: "Mot de passe modifié" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Mise à jour des spécialités
router.post("/specialities", verifyToken, async (req, res) => {
  try {
    const { specialities } = req.body; // Array d'IDs
    const user = await Utilisateur.findByPk(req.user.userId);
    if (user) {
      await user.setSpecialites(specialities);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Inscription utilisateur
router.post("/register", async (req, res) => {
  const { identifiant, nom, email, telephone, password, confirmPassword } = req.body;

  if (!identifiant || !nom || !email || !password || !confirmPassword) {
    return res.status(400).json({ status: "error", message: "Tous les champs sont requis" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ status: "error", message: "Les mots de passe ne correspondent pas" });
  }

  try {
    const existing = await Utilisateur.findOne({ where: { [Op.or]: [{ email }, { identifiant }] } });
    if (existing) {
      return res.status(400).json({ status: "error", message: "Cet utilisateur ou cet email existe déjà" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Si c'est le tout premier utilisateur, on le met admin
    const userCount = await Utilisateur.count();
    let idQualite = null;

    if (userCount === 0) {
      const adminQualite = await Qualite.findOne({ where: { libelleQualite: "ADMINISTRATEUR" } });
      if (adminQualite) idQualite = adminQualite.idQualite;
    }

    const newUser = await Utilisateur.create({
      identifiant,
      nom,
      email,
      telephone,
      mdp: hashedPassword,
      idQualite: idQualite,
      supprimer: false
    });

    console.log(`✅ Nouvel utilisateur créé : ${newUser.nom}`);
    res.json({ status: "ok", message: "Utilisateur créé avec succès" });

  } catch (err) {
    console.error("🔥 Erreur /register :", err);
    res.status(500).json({ status: "error", message: "Erreur serveur lors de l'inscription" });
  }
});

// 🔹 Connexion utilisateur
router.post("/login-user", async (req, res) => {
  const { identifiant, mdp } = req.body;

  if (!identifiant || !mdp) {
    return res.status(400).json({ success: false, message: "Identifiant et mot de passe requis" });
  }

  try {
    const user = await Utilisateur.findOne({
      where: { [Op.or]: [{ identifiant }, { email: identifiant }] },
      include: [{ model: Qualite, as: 'qualite' }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilisateur introuvable" });
    }

    const valid = await bcrypt.compare(mdp, user.mdp);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Mot de passe incorrect" });
    }

    const role = user.qualite ? user.qualite.libelleQualite : "ENSEIGNANT";
    const token = jwt.sign({ userId: user.idUtilisateur, role: role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    });

    res.json({
      success: true,
      token,
      userId: user.idUtilisateur,
      name: user.nom,
      email: user.email,
      telephone: user.telephone,
      role: role
    });
  } catch (err) {
    console.error("🔥 Erreur /login :", err);
    res.status(500).json({ success: false, message: "Erreur de connexion" });
  }
});

module.exports = router;
