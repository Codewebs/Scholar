const express = require("express");
const router = express.Router();
const { Annonce, Utilisateur, Etablissement } = require('../models');
const { verifyToken } = require("../middleware/auth");
const { Op } = require("sequelize");

// 🔹 Récupérer les annonces communautaires
router.get("/communaute/:idAnneeScolaire", verifyToken, async (req, res) => {
  try {
    // Note: Pour simplifier, on récupère via l'établissement de l'utilisateur
    // Dans une version plus complexe, on filtrerait par l'année scolaire
    const annonces = await Annonce.findAll({
      include: [
        { model: Utilisateur, as: 'auteur', attributes: ['nom'] },
        { model: Etablissement, as: 'etablissement', attributes: ['nomFr'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = annonces.map(a => ({
      idAnnonce: a.idAnnonce,
      titre: a.titre,
      contenu: a.contenu,
      image: a.image,
      type: a.type,
      datePublication: a.createdAt,
      idAuteur: a.idAuteur,
      nomAuteur: a.auteur?.nom || "Inconnu",
      idEtablissement: a.idEtablissement,
      nomEtablissement: a.etablissement?.nomFr
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Récupérer les annonces publiques
router.get("/publiques", async (req, res) => {
  try {
    const { pays, ville } = req.query;
    let whereClause = { type: 'PUBLIQUE' };

    if (pays || ville) {
      const schoolWhere = {};
      if (pays) schoolWhere.pays = pays;
      if (ville) schoolWhere.ville = ville;

      const annonces = await Annonce.findAll({
        where: whereClause,
        include: [{
          model: Etablissement,
          as: 'etablissement',
          where: schoolWhere,
          attributes: ['nomFr', 'ville', 'pays']
        }, {
          model: Utilisateur,
          as: 'auteur',
          attributes: ['nom']
        }],
        order: [['createdAt', 'DESC']]
      });

      const formatted = annonces.map(a => ({
        idAnnonce: a.idAnnonce,
        titre: a.titre,
        contenu: a.contenu,
        image: a.image,
        type: a.type,
        datePublication: a.createdAt,
        idAuteur: a.idAuteur,
        nomAuteur: a.auteur?.nom || "Inconnu",
        idEtablissement: a.idEtablissement,
        nomEtablissement: a.etablissement?.nomFr,
        villeEtablissement: a.etablissement?.ville,
        paysEtablissement: a.etablissement?.pays
      }));

      return res.json(formatted);
    }

    const annonces = await Annonce.findAll({
      where: whereClause,
      include: [
        { model: Etablissement, as: 'etablissement', attributes: ['nomFr', 'ville', 'pays'] },
        { model: Utilisateur, as: 'auteur', attributes: ['nom'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(annonces.map(a => ({
      idAnnonce: a.idAnnonce,
      titre: a.titre,
      contenu: a.contenu,
      image: a.image,
      type: a.type,
      datePublication: a.createdAt,
      idAuteur: a.idAuteur,
      nomAuteur: a.auteur?.nom || "Inconnu",
      idEtablissement: a.idEtablissement,
      nomEtablissement: a.etablissement?.nomFr,
      villeEtablissement: a.etablissement?.ville,
      paysEtablissement: a.etablissement?.pays
    })));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Publier une annonce
router.post("/", verifyToken, async (req, res) => {
  try {
    const { contenu, type, idEtablissement, titre, image } = req.body;

    // Vérification limite (3 par jour pour utilisateur)
    if (type === 'COMMUNAUTAIRE') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const count = await Annonce.count({
        where: {
          idAuteur: req.user.userId,
          createdAt: { [Op.gte]: today }
        }
      });
      if (count >= 3) return res.status(429).json({ message: "Limite de 3 publications par jour atteinte" });
    }

    const nouvelleAnnonce = await Annonce.create({
      contenu,
      type,
      idAuteur: req.user.userId,
      idEtablissement,
      titre,
      image
    });

    res.json(nouvelleAnnonce);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
