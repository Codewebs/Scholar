const { Utilisateur } = require("../models");
// In a real project, you would require 'firebase-admin' here
// const admin = require("firebase-admin");

exports.sendValidationNotification = async (userId, data) => {
    try {
        const user = await Utilisateur.findByPk(userId);
        if (!user || !user.fcmToken) {
            console.log(`ℹ️ [FCM] Pas de token pour l'utilisateur ${userId}, notification ignorée.`);
            return;
        }

        const message = {
            notification: {
                title: "Félicitations !",
                body: `Votre accès à l'établissement a été validé en tant que ${data.role}.`
            },
            data: {
                type: "DEMANDE_VALIDEE",
                schoolId: String(data.schoolId),
                role: data.role
            },
            token: user.fcmToken
        };

        console.log(`📡 [FCM] Envoi au token ${user.fcmToken.substring(0, 10)}... :`, message.notification.title);

        // admin.messaging().send(message)
        // .then((response) => console.log('✅ FCM Envoyé:', response))
        // .catch((error) => console.error('❌ Erreur FCM:', error));

    } catch (error) {
        console.error("🔥 [FCM] Erreur service:", error);
    }
};

exports.notifyHierarchy = async (schoolId, messageText) => {
    // Logic to notify admins/directors of the school
    console.log(`📡 [FCM-HIERARCHY] Ecole ${schoolId}: ${messageText}`);
};
