// middleware/verify.js

const AutorisationUtilisateur = require("../models/autorisation_utilisateur");
const Menu = require("../models/Menu");
const AnneeScolaire = require("../models/AnneeScolaire");

async function verifyAccess(menuNames, { logic = "AND" } = {}) {
  console.log("Tentative d'acces à "+menuNames)
  return async (req, res, next) => {
    try {
      console.log("Tentative d'acces à "+menuNames)
      const userId = req.user.idUtilisateur;

      // 🔹 Récupération de l’année scolaire active
      const activeYear = await AnneeScolaire.findOne({
        where: { cloturerAnnee: false }
      });
      if (!activeYear) {
        return res.status(500).json({ message: "Aucune année scolaire active." });
      }

      // 🔹 Récupérer les IDs des menus demandés
      const menus = await Menu.findAll({
        where: { libelleMenu: menuNames }
      });
      if (menus.length !== menuNames.length) {
        return res.status(404).json({ message: "Un ou plusieurs menus sont introuvables." });
      }

      // 🔹 Vérifier les autorisations pour chaque menu
      let hasAccessToAll = true;
      let hasAccessToAtLeastOne = false;

      for (const menu of menus) {
        const access = await AutorisationUtilisateur.findOne({
          where: {
            idUtilisateur: userId,
            idMenu: menu.idMenu,
            idAnneeScolaire: activeYear.idAnneeScolaire
          }
        });

        if (access) {
          hasAccessToAtLeastOne = true;
        } else {
          hasAccessToAll = false;
        }
      }

      // 🔹 Appliquer la logique ET/OU
      if (logic === "AND" && !hasAccessToAll) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé : vous n’êtes pas autorisé à accéder à tous les menus demandés."
        });
      } else if (logic === "OR" && !hasAccessToAtLeastOne) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé : vous n’êtes pas autorisé à accéder à aucun des menus demandés."
        });
      }

      // Accès autorisé
      next();
    } catch (error) {
      console.error("❌ ERREUR verifyAccess :", error);
      res.status(500).json({ message: "Erreur serveur." });
    }
  };
}


/*
router.get(
  "/route-protegee-ou",
  verifyAccess(["Menu1", "Menu2"], { logic: "OR" }),
  (req, res) => {
    res.json({ message: "Accès autorisé à au moins un menu !" });
  }
);

// Logique ET (par défaut) pour un seul menu
router.get(
  "/route-protegee",
  verifyAccess(["Menu1"]),
  (req, res) => {
    res.json({ message: "Accès autorisé au menu !" });
  }
);

// Logique OU pour un seul menu (équivalent à ET)
router.get(
  "/route-protegee-ou",
  verifyAccess(["Menu1"], { logic: "OR" }),
  (req, res) => {
    res.json({ message: "Accès autorisé au menu !" });
  }
);


*/
module.exports = verifyAccess;
