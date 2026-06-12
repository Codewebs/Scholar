// services/notificationService.js
const axios = require('axios');

exports.sendToUser = async (userId, notification) => {
    console.log(`📡 [FCM] Envoi notification à l'utilisateur ${userId}: ${notification.title}`);

    // In a real implementation, you would use firebase-admin:
    // admin.messaging().sendToDevice(registrationToken, payload)

    // Placeholder for real logic
    return true;
};

exports.notifyDepartmentHead = async (schoolId, departmentId, message) => {
    // Logic to find dept head for this school/dept and notify them
    console.log(`📡 [FCM] Notification Chef de Dept (${departmentId}) de l'école ${schoolId}: ${message}`);
};
