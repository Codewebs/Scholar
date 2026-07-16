// middleware/auth.js
const jwt = require("jsonwebtoken");
const { InscriptionPersonnel } = require("../models");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  // Utilisation stricte de la variable d'environnement sans valeur par défaut dégradée
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error("❌ [AUTH] Échec de vérification du jeton:", err.message);
      return res.status(401).json({ success: false, message: "Token invalide ou expiré" });
    }

    // Normalisation de req.user pour qu'il contienne les deux variantes par sécurité
    req.user = decoded;
    if (!req.user.idUtilisateur && decoded.userId) {
       req.user.idUtilisateur = decoded.userId;
    }
    if (!req.user.userId && decoded.idUtilisateur) {
       req.user.userId = decoded.idUtilisateur;
    }

    // Vérification du blocage et synchronisation du rôle au sein de l'établissement
    const idEtablissement = req.headers['id-etablissement'] || req.body.idEtablissement;
    if (idEtablissement) {
      try {
        const p = await InscriptionPersonnel.findOne({
          where: { idUtilisateur: req.user.idUtilisateur, idEtablissement, supprimer: false }
        });

        if (p) {
          if (p.bloque) {
            return res.status(403).json({ success: false, message: "Utilisateur bloqué", code: "USER_BLOCKED" });
          }

          // Mise à jour dynamique du rôle et des permissions basés sur l'inscription réelle dans cet établissement
          // Cela permet de gérer les utilisateurs ayant des rôles multiples ou contextuels
          req.user.role = p.role;
          if (p.permissionsAjoutees) {
            try {
              req.user.permissions = JSON.parse(p.permissionsAjoutees);
            } catch (e) {
              req.user.permissions = [];
            }
          }
        }
      } catch (e) {
        console.error("Erreur lors de la vérification de l'inscription:", e);
      }
    }

    next();
  });
}

module.exports = { verifyToken };