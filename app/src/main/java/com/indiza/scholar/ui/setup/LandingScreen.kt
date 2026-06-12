package com.indiza.scholar.ui.setup

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.utils.ValidationUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LandingScreen(
    onNavigateToCreate: (String, String, String) -> Unit, // pays, ville, arrete
    onNavigateToJoinStaff: (String) -> Unit, // codeRecrutement
    onNavigateToJoinStudent: (String) -> Unit, // codeInscription
    onServerConfigClick: () -> Unit
) {
    var step by remember { mutableIntStateOf(0) } // 0: Landing, 1: Rejoindre
    var showCreateSheet by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A0B2E), Color(0xFF3B125A), Color(0xFF5E1B89))
                )
            )
    ) {
        // Server Config Icon
        IconButton(
            onClick = onServerConfigClick,
            modifier = Modifier.align(Alignment.TopEnd).padding(16.dp)
        ) {
            Icon(Icons.Default.Code, null, tint = Color.White)
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            ScholarTitle(color = Color.White)
            Spacer(modifier = Modifier.height(48.dp))

            AnimatedContent(targetState = step, label = "LandingTransition") { currentStep ->
                if (currentStep == 0) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        LandingButton(
                            title = "Créer un établissement",
                            icon = Icons.Default.AddBusiness,
                            onClick = { showCreateSheet = true }
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        LandingButton(
                            title = "Rejoindre un établissement",
                            icon = Icons.Default.Groups,
                            onClick = { step = 1 }
                        )
                    }
                } else {
                    JoinOptions(
                        onBack = { step = 0 },
                        onStaff = { onNavigateToJoinStaff(it) },
                        onStudent = { onNavigateToJoinStudent(it) }
                    )
                }
            }
        }
    }

    if (showCreateSheet) {
        ModalBottomSheet(onDismissRequest = { showCreateSheet = false }) {
            CreateSchoolLandingForm(onConfirm = { pays, ville, arrete ->
                showCreateSheet = false
                onNavigateToCreate(pays, ville, arrete)
            })
        }
    }
}

@Composable
fun LandingButton(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(80.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
    ) {
        Icon(icon, null, modifier = Modifier.size(32.dp), tint = Color.White)
        Spacer(Modifier.width(16.dp))
        Text(title, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun CreateSchoolLandingForm(onConfirm: (String, String, String) -> Unit) {
    var pays by remember { mutableStateOf("") }
    var ville by remember { mutableStateOf("") }
    var arrete by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Column(modifier = Modifier.padding(24.dp).padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Nouvel Établissement", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        
        OutlinedTextField(value = pays, onValueChange = { pays = it }, label = { Text("Pays") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = ville, onValueChange = { ville = it }, label = { Text("Ville") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(
            value = arrete, 
            onValueChange = { arrete = it; error = null }, 
            label = { Text("Arrêté de création") }, 
            modifier = Modifier.fillMaxWidth(),
            isError = error != null,
            supportingText = { error?.let { Text(it, color = MaterialTheme.colorScheme.error) } }
        )

        Button(
            onClick = {
                if (pays.isNotBlank() && ville.isNotBlank() && ValidationUtils.validateArrete(arrete, pays)) {
                    onConfirm(pays, ville, arrete)
                } else {
                    error = "Format d'arrêté invalide pour ce pays"
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Text("Continuer")
        }
    }
}

@Composable
fun JoinOptions(onBack: () -> Unit, onStaff: (String) -> Unit, onStudent: (String) -> Unit) {
    var selectedRole by remember { mutableStateOf<String?>(null) }
    var code by remember { mutableStateOf("") }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        if (selectedRole == null) {
            Text("Rejoindre en tant que...", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(24.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallJoinCard("Enseignant", Icons.Default.School, Modifier.weight(1f)) { selectedRole = "ENSEIGNANT" }
                SmallJoinCard("Staff", Icons.Default.Badge, Modifier.weight(1f)) { selectedRole = "STAFF" }
            }
            Spacer(Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallJoinCard("Parent", Icons.Default.FamilyRestroom, Modifier.weight(1f)) { selectedRole = "PARENT" }
                SmallJoinCard("Élève", Icons.Default.Person, Modifier.weight(1f)) { selectedRole = "ELEVE" }
            }
            TextButton(onClick = onBack, modifier = Modifier.padding(top = 16.dp)) {
                Text("Retour", color = Color.White.copy(alpha = 0.6f))
            }
        } else {
            val isStaff = selectedRole == "ENSEIGNANT" || selectedRole == "STAFF"
            Text(
                text = if (isStaff) "Code de recrutement" else "Code d'inscription",
                color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold
            )
            Text(
                text = if (isStaff) "Entrez le code à 4 chiffres" else "Disponible sur votre reçu",
                color = Color.White.copy(alpha = 0.6f), fontSize = 14.sp
            )
            Spacer(Modifier.height(24.dp))
            OutlinedTextField(
                value = code,
                onValueChange = { if(it.length <= 8) code = it },
                modifier = Modifier.width(200.dp),
                textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, fontSize = 24.sp, color = Color.White),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF1ABC9C), unfocusedBorderColor = Color.White.copy(alpha = 0.3f))
            )
            Spacer(Modifier.height(24.dp))
            Button(
                onClick = { if (isStaff) onStaff(code) else onStudent(code) },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Valider")
            }
            TextButton(onClick = { selectedRole = null }) {
                Text("Changer de rôle", color = Color.White.copy(alpha = 0.6f))
            }
        }
    }
}

@Composable
fun SmallJoinCard(title: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier.height(100.dp).clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.1f)),
        border = BorderStroke(0.5.dp, Color.White.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Icon(icon, null, tint = Color.White)
            Spacer(Modifier.height(8.dp))
            Text(title, color = Color.White, fontSize = 14.sp)
        }
    }
}
