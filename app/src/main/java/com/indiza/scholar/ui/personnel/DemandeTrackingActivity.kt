package com.indiza.scholar.ui.personnel

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.indiza.scholar.model.DemandeInscriptionPersonnel
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.theme.ScholarTheme
import kotlinx.coroutines.launch

class DemandeTrackingActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val prefs = getSharedPreferences("user_session", Context.MODE_PRIVATE)
        val userId = prefs.getLong("userId", -1)
        val token = prefs.getString("token", null)
        
        val api = ApiClient.create { token }.create(ApiService::class.java)

        setContent {
            ScholarTheme {
                DemandeTrackingScreen(userId, api, onNavigateToDashboard = { finish() })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DemandeTrackingScreen(userId: Long, api: ApiService, onNavigateToDashboard: () -> Unit) {
    val trackingList = remember { mutableStateListOf<DemandeInscriptionPersonnel>() }
    var isLoading by remember { mutableStateOf(true) }
    var showSuccessDialog by remember { mutableStateOf(false) }
    var validatedRole by remember { mutableStateOf("") }

    // Écouter les notifications en temps réel
    LaunchedEffect(Unit) {
        com.indiza.scholar.network.NotificationEventBus.events.collect { event ->
            if (event is com.indiza.scholar.network.NotificationEvent.DemandeValidee) {
                validatedRole = event.role
                showSuccessDialog = true
                // Optionnel: rafraîchir la liste
                val response = api.getMyDemands(userId)
                if (response.isSuccessful) {
                    trackingList.clear()
                    trackingList.addAll(response.body() ?: emptyList())
                }
            }
        }
    }

    LaunchedEffect(userId) {
        if (userId > 0) {
            try {
                val response = api.getMyDemands(userId)
                if (response.isSuccessful) {
                    trackingList.clear()
                    trackingList.addAll(response.body() ?: emptyList())
                }
            } catch (e: Exception) {
                // Handle error
            } finally {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Suivi de mes demandes") },
                actions = {
                    IconButton(onClick = onNavigateToDashboard) {
                        Icon(Icons.Default.Dashboard, contentDescription = "Dashboard", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A), titleContentColor = Color.White)
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF1ABC9C))
                }
            } else if (trackingList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Info, null, tint = Color.Gray, modifier = Modifier.size(48.dp))
                        Spacer(Modifier.height(16.dp))
                        Text("Aucune demande en cours.", color = Color.Gray)
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(trackingList) { demande ->
                        TrackingItemRow(demande)
                    }
                }
            }
        }
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { showSuccessDialog = false },
            title = { Text("Félicitations !") },
            text = { Text("L'établissement vient de valider votre accès en tant que : $validatedRole.") },
            confirmButton = {
                Button(onClick = { 
                    showSuccessDialog = false
                    onNavigateToDashboard() 
                }) {
                    Text("Accéder à mon espace de travail")
                }
            }
        )
    }
}

@Composable
fun TrackingItemRow(demande: DemandeInscriptionPersonnel) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text(demande.profilDemande, color = Color.White, style = MaterialTheme.typography.titleMedium)
                StatusBadge(demande.etat)
            }
            Text(
                text = demande.etablissement?.nomFr ?: "École ID: ${demande.idEtablissement}",
                color = Color(0xFF1ABC9C),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold
            )
            Text("Date: ${demande.dateDemande}", color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            demande.specialites?.let {
                 Text("Spécialités: $it", color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
fun StatusBadge(status: String) {
    val color = when(status) {
        "VALIDE" -> Color(0xFF2ECC71)
        "REJETE" -> Color(0xFFE74C3C)
        "VALIDÉE" -> Color(0xFF2ECC71)
        "REJETÉE" -> Color(0xFFE74C3C)
        else -> Color(0xFFF1C40F)
    }
    Surface(
        color = color.copy(alpha = 0.2f),
        contentColor = color,
        shape = MaterialTheme.shapes.small
    ) {
        Text(status, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), style = MaterialTheme.typography.labelSmall)
    }
}
