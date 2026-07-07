// services/notificationService.js

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

exports.notifierTelegram = async (ip, uuid) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("❌ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID non configuré dans .env");
    return;
  }

  // Utilisation de Markdown (v1) plus simple pour éviter les erreurs d'échappement strictes de V2
  const message = `*🚨 Nouvelle session détectée !*\n\n` +
                  `*IP :* \`${ip}\`\n` +
                  `*User ID :* \`${uuid}\`\n` +
                  `_Date : ${new Date().toLocaleString('fr-FR')}_`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    console.log("✅ Notification Telegram envoyée !");
  } catch (error) {
    console.error("❌ Erreur Telegram:", error.message);
  }
};
