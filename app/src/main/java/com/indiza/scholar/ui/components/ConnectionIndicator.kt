package com.indiza.scholar.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.SupervisorAccount
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.network.SystemStats
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ServerConnectionIndicator(api: ApiService) {
    var stats by remember { mutableStateOf<SystemStats?>(null) }
    var isConnected by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    
    // Cycle à travers les infos pour l'admin
    var infoIndex by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        while(true) {
            try {
                val response = api.getSystemStats()
                if (response.isSuccessful) {
                    stats = response.body()
                    isConnected = true
                } else {
                    isConnected = false
                }
            } catch (e: Exception) {
                isConnected = false
            }
            delay(10000)
        }
    }

    val backgroundColor by animateColorAsState(
        if (isConnected) Color(0xFF2ECC71) else Color(0xFFE74C3C), label = ""
    )

    Box(
        modifier = Modifier
            .padding(12.dp)
            .size(width = 110.dp, height = 36.dp)
            .clip(CircleShape)
            .background(backgroundColor.copy(alpha = 0.9f))
            .clickable {
                infoIndex = (infoIndex + 1) % 3
            },
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp) // Espace léger entre l'icône et le texte
        ) {
            // 1. GESTION DES ICÔNES DYNAMIQUES
            if (isConnected && stats != null) {
                val icon = when (infoIndex) {
                    1 -> Icons.Default.SupervisorAccount
                    2 -> Icons.Default.School
                    else -> null
                }

                icon?.let {
                    Icon(
                        imageVector = it,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(16.dp)
                    )
                }
            } else if (!isConnected) {

                Icon(
                    imageVector = Icons.Default.CloudOff,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
            }

            Text(
                text = if (!isConnected) {
                    "Offline"
                } else {
                    stats?.let { s ->
                        when (infoIndex) {
                            0 -> "${s.value} ${s.label}"
                            1 -> s.extra?.get("teachers")?.let { "$it" } ?: s.label
                            2 -> s.extra?.get("students")?.toString() ?: s.label
                            else -> s.label
                        }
                    } ?: "Connecté"
                },
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
