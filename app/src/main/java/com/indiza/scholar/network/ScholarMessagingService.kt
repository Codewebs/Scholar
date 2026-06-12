package com.indiza.scholar.network

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ScholarMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val data = remoteMessage.data
        val type = data["type"]

        if (type == "DEMANDE_VALIDEE") {
            val schoolId = data["schoolId"]?.toLongOrNull() ?: 0L
            val role = data["role"] ?: "Inconnu"
            
            CoroutineScope(Dispatchers.IO).launch {
                NotificationEventBus.emit(NotificationEvent.DemandeValidee(schoolId, role))
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "Nouveau token: $token")
        // Logic to send token to Node.js server for this user
    }
}
