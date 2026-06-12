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

    // Vérification du blocage au sein de l'établissement
    const idEtablissement = req.headers['id-etablissement'] || req.body.idEtablissement;
    if (idEtablissement) {
      try {
        const p = await InscriptionPersonnel.findOne({
          where: { idUtilisateur: req.user.idUtilisateur, idEtablissement, bloque: true }
        });
        if (p) {
          return res.status(403).json({ success: false, message: "Utilisateur bloqué", code: "USER_BLOCKED" });
        }
      } catch (e) {
        console.error("Erreur lors de la vérification du statut bloqué:", e);
      }
    }

    next();
  });
}

module.exports = { verifyToken };