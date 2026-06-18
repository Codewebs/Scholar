package com.indiza.scholar.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.indiza.scholar.model.AnnonceEntity
import com.indiza.scholar.model.AnnonceType
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.launch

@Composable
fun NewsFeedScreen(
    apiService: ApiService,
    userId: Long,
    userName: String,
    userRole: String,
    schoolId: Long,
    schoolName: String,
    onNavigateToSetup: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Communauté, 1: Publique
    var annonces by remember { mutableStateOf<List<AnnonceEntity>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(selectedTab, schoolId) {
        val res = if (selectedTab == 0) {
            apiService.getAnnoncesCommunaute(schoolId)
        } else {
            apiService.getAnnoncesPubliques()
        }
        if (res.isSuccessful) annonces = res.body() ?: emptyList()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Toolbar with Setup Icon
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Fil d'actualité", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            IconButton(onClick = onNavigateToSetup) {
                Icon(Icons.Default.Settings, contentDescription = "Paramètres de configuration", tint = MaterialTheme.colorScheme.primary)
            }
        }

        // Quick Actions Row
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionItem("Élèves", Icons.Default.People, Color(0xFF3498DB)) { /* Navigate */ }
            QuickActionItem("Notes", Icons.Default.Star, Color(0xFFE74C3C)) { /* Navigate */ }
            QuickActionItem("Bulletins", Icons.Default.Description, Color(0xFF9B59B6)) { /* Navigate to Bulletin Config */ }
        }

        // Publish Section
        if (!userRole.contains("PARENT") && !userRole.contains("ELEVE")) {
            PublishSection(userName, schoolName, userRole, onPublish = {
                // Refresh logic
            })
        }

        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                Text("Communauté", modifier = Modifier.padding(12.dp))
            }
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                Text("Publiques", modifier = Modifier.padding(12.dp))
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(annonces) { annonce ->
                if (selectedTab == 0) {
                    CommunityAnnonceCard(annonce)
                } else {
                    PublicAnnonceCard(annonce)
                }
            }
        }
    }
}

@Composable
fun QuickActionItem(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = color.copy(alpha = 0.1f),
            modifier = Modifier.size(56.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(icon, null, tint = color, modifier = Modifier.size(24.dp))
            }
        }
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
    }
}

@Composable
fun PublishSection(userName: String, schoolName: String, userRole: String, onPublish: () -> Unit) {
    var text by remember { mutableStateOf("") }
    var publishAsSchool by remember { mutableStateOf(false) }
    val canPostAsSchool = userRole.contains("ADMIN") || userRole.contains("DIRECTEUR") || userRole.contains("FONDATEUR")

    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray))
                Spacer(Modifier.width(12.dp))
                TextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = { Text("Quoi de neuf ?") },
                    modifier = Modifier.weight(1f),
                    colors = TextFieldDefaults.colors(focusedContainerColor = Color.Transparent, unfocusedContainerColor = Color.Transparent)
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (canPostAsSchool) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = publishAsSchool, onCheckedChange = { publishAsSchool = it })
                        Text("Publier pour $schoolName", fontSize = 11.sp)
                    }
                } else {
                    Text("Poste en tant que : $userName", fontSize = 11.sp, color = Color.Gray)
                }
                
                IconButton(onClick = { /* Image Picker */ }) {
                    Icon(Icons.Default.Image, null)
                }
                
                Button(onClick = { /* API call */ onPublish() }, enabled = text.isNotBlank()) {
                    Text("Publier")
                }
            }
        }
    }
}

@Composable
fun CommunityAnnonceCard(annonce: AnnonceEntity) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.LightGray))
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(annonce.nomAuteur, fontWeight = FontWeight.Bold)
                    Text("(${annonce.posteAuteur})", fontSize = 12.sp, color = Color.Gray)
                }
                Text(formatRelativeTime(annonce.datePublication), fontSize = 11.sp, color = Color.Gray)
            }
            
            Spacer(Modifier.height(12.dp))
            Text(annonce.contenu)
            
            if (annonce.image != null) {
                Spacer(Modifier.height(12.dp))
                AsyncImage(
                    model = annonce.image,
                    contentDescription = null,
                    modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            }
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                IconButton(onClick = { /* Save */ }) { Icon(Icons.Default.BookmarkBorder, null) }
                IconButton(onClick = { /* Share */ }) { Icon(Icons.Default.Share, null) }
            }
        }
    }
}

@Composable
fun PublicAnnonceCard(annonce: AnnonceEntity) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(annonce.nomEtablissement ?: "Établissement", fontWeight = FontWeight.Bold)
                    Text("${annonce.villeEtablissement} (${annonce.paysEtablissement})", fontSize = 11.sp, color = Color.Gray)
                }
                Text(formatRelativeTime(annonce.datePublication), fontSize = 11.sp, color = Color.Gray)
            }
            
            Spacer(Modifier.height(12.dp))
            Text(annonce.contenu)
            
            if (annonce.image != null) {
                Spacer(Modifier.height(12.dp))
                AsyncImage(
                    model = annonce.image,
                    contentDescription = null,
                    modifier = Modifier.fillMaxWidth().height(200.dp).clip(RoundedCornerShape(8.dp)),
                    contentScale = ContentScale.Crop
                )
            }
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                IconButton(onClick = { /* Save */ }) { Icon(Icons.Default.BookmarkBorder, null) }
                IconButton(onClick = { /* Share */ }) { Icon(Icons.Default.Share, null) }
            }
        }
    }
}

fun formatRelativeTime(dateString: String): String {
    // Basic mock for now
    return "3min"
}
