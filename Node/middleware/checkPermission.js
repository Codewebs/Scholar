const { AutorisationUtilisateur, Menu, AnneeScolaire, InscriptionPersonnel } = require("../models");
const PermissionToMenu = require("../constants/permissionToMenu");

module.exports = (requiredPermission) => {
    return async (req, res, next) => {
        const userId = req.user?.userId;
        const userRole = req.user?.role;
        const idAnneeScolaire = req.headers["id-annee-scolaire"];

        console.log(`🔐 [AUTH] Vérification: '${requiredPermission}' | User: ${userId} | Rôle: ${userRole}`);

        // 1. Les administrateurs ont tous les droits
        if (userRole === "ADMINISTRATEUR") {
            return next();
        }

        try {
            // 2. Vérifier d'abord le nouveau système (permissionsAjoutees dans InscriptionPersonnel)
            let yearId = idAnneeScolaire;
            if (!yearId) {
                const activeYear = await AnneeScolaire.findOne({ where: { cloturerAnnee: false } });
                yearId = activeYear?.idAnneeScolaire;
            }

            if (userId && yearId) {
                const personnel = await InscriptionPersonnel.findOne({
                    where: { idUtilisateur: userId, idAnneeScolaire: yearId, supprimer: false }
                });

                if (personnel && personnel.permissionsAjoutees) {
                    try {
                        const perms = JSON.parse(personnel.permissionsAjoutees);
                        if (Array.isArray(perms) && perms.includes(requiredPermission)) {
                            console.log(`✅ [AUTH] Permission '${requiredPermission}' accordée via InscriptionPersonnel.`);
                            return next();
                        }
                    } catch (e) {
                        console.error("⚠️ [AUTH] Erreur parsing permissionsAjoutees:", e);
                    }
                }
            }

            // 3. Fallback: Ancien système (Table Menu + AutorisationUtilisateur)
            const menuLabel = PermissionToMenu[requiredPermission] || requiredPermission;
            const menu = await Menu.findOne({ where: { libelleMenu: menuLabel } });

            if (menu) {
                const access = await AutorisationUtilisateur.findOne({
                    where: {
                        idUtilisateur: userId,
                        idMenu: menu.idMenu,
                        idAnneeScolaire: yearId
                    }
                });

                if (access) {
                    console.log(`✅ [AUTH] Permission accordée via AutorisationUtilisateur.`);
                    return next();
                }
            } else {
                console.warn(`🚫 [AUTH] Menu '${menuLabel}' introuvable dans la table Menu.`);
            }

            console.warn(`🚫 [AUTH] Accès refusé pour l'utilisateur ${userId} à l'action ${requiredPermission}`);
            return res.status(403).json({ error: "Vous n'avez pas les droits nécessaires pour cette action." });

        } catch (error) {
            console.error("🔥 [AUTH] Erreur critique lors de la vérification:", error);
            res.status(500).json({ error: "Erreur lors de la vérification des droits." });
        }
    };
};
