const { AutorisationUtilisateur, Menu, AnneeScolaire } = require("../models");
const PermissionToMenu = require("../constants/permissionToMenu");

module.exports = (requiredPermission) => {
    return async (req, res, next) => {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const idAnneeScolaire = req.headers["id-annee-scolaire"]; // Should be sent by Android

        console.log(`🔐 [AUTH] Vérification: '${requiredPermission}' | User: ${userId} | Rôle: ${userRole}`);

        // 1. Les administrateurs ont tous les droits (bypass DB check for speed if needed)
        if (userRole === "ADMINISTRATEUR") {
            return next();
        }

        // 2. Mapper la permission technique au libellé du menu
        const menuLabel = PermissionToMenu[requiredPermission] || requiredPermission;

        try {
            // 3. Trouver le menu correspondant
            const menu = await Menu.findOne({ where: { libelleMenu: menuLabel } });
            if (!menu) {
                console.warn(`🚫 [AUTH] Menu '${menuLabel}' introuvable.`);
                return res.status(403).json({ error: "Action non configurée dans le système." });
            }

            // 4. Vérifier l'autorisation en base
            // Si pas d'année fournie, on cherche l'année active
            let yearId = idAnneeScolaire;
            if (!yearId) {
                const activeYear = await AnneeScolaire.findOne({ where: { cloturerAnnee: false } });
                yearId = activeYear?.idAnneeScolaire;
            }

            const access = await AutorisationUtilisateur.findOne({
                where: {
                    idUtilisateur: userId,
                    idMenu: menu.idMenu,
                    idAnneeScolaire: yearId
                }
            });

            if (!access) {
                console.warn(`🚫 [AUTH] Accès refusé pour l'utilisateur ${userId} au menu ${menuLabel}`);
                return res.status(403).json({ error: "Vous n'avez pas les droits nécessaires pour cette action." });
            }

            console.log(`✅ [AUTH] Permission accordée.`);
            next();
        } catch (error) {
            console.error("🔥 [AUTH] Erreur:", error);
            res.status(500).json({ error: "Erreur lors de la vérification des droits." });
        }
    };
};
