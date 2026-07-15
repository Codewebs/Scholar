package com.indiza.scholar.ui.setup

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.ui.auth.ModernButton
import com.indiza.scholar.ui.auth.ModernTextField
import com.indiza.scholar.utils.ValidationUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LandingScreen(
    onNavigateToCreate: (String, String, String) -> Unit, // pays, ville, arrete
    onNavigateToJoinStaff: () -> Unit,
    onNavigateToJoinStudent: () -> Unit,
    onNavigateToJoinParent: () -> Unit
) {
    var step by remember { mutableIntStateOf(0) } // 0: Landing, 1: Rejoindre
    var showCreateSheet by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        AnimatedContent(targetState = step, label = "LandingTransition") { currentStep ->
            if (currentStep == 0) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "Your journey starts here.",
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface,
                        textAlign = TextAlign.Center,
                        lineHeight = 44.sp
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = "Create or join an existing school to begin.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color(0xFF9E9E9E),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(64.dp))

                    ModernButton(
                        text = "Create Establishment",
                        onClick = { showCreateSheet = true }
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    OutlinedButton(
                        onClick = { step = 1 },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    ) {
                        Text("Join Establishment", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
                    }
                }
            } else {
                JoinOptions(
                    onBack = { step = 0 },
                    onStaff = { onNavigateToJoinStaff() },
                    onStudent = { onNavigateToJoinStudent() },
                    onParent = { onNavigateToJoinParent() }
                )
            }
        }
    }

    if (showCreateSheet) {
        ModalBottomSheet(onDismissRequest = { showCreateSheet = false }, containerColor = MaterialTheme.colorScheme.surface) {
            CreateSchoolLandingForm(onConfirm = { pays, ville, arrete ->
                showCreateSheet = false
                onNavigateToCreate(pays, ville, arrete)
            })
        }
    }
}

@Composable
fun CreateSchoolLandingForm(onConfirm: (String, String, String) -> Unit) {
    var pays by remember { mutableStateOf("") }
    var ville by remember { mutableStateOf("") }
    var arrete by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier.padding(24.dp).padding(bottom = 32.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("School Details", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
        
        ModernTextField(value = pays, onValueChange = { pays = it }, label = "Country", placeholder = "e.g. Cameroon")
        ModernTextField(value = ville, onValueChange = { ville = it }, label = "City", placeholder = "e.g. Yaoundé")
        ModernTextField(
            value = arrete, 
            onValueChange = { arrete = it; error = null }, 
            label = "Creation Decree (Arrêté)", 
            placeholder = "Reference number"
        )
        
        if (error != null) {
            Text(error!!, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(16.dp))

        ModernButton(
            text = "Continue",
            onClick = {
                if (pays.isNotBlank() && ville.isNotBlank() && ValidationUtils.validateArrete(arrete, pays)) {
                    onConfirm(pays, ville, arrete)
                } else {
                    error = "Invalid format for this country"
                }
            }
        )
    }
}

@Composable
fun JoinOptions(onBack: () -> Unit, onStaff: () -> Unit, onStudent: () -> Unit, onParent: () -> Unit) {
    Column(horizontalAlignment = Alignment.Start, modifier = Modifier.fillMaxWidth()) {
        IconButton(onClick = onBack, modifier = Modifier.offset(x = (-12).dp)) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("Join as...", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
        
        Spacer(modifier = Modifier.height(32.dp))

        Surface(
            onClick = onStaff,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f)),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Badge, null, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(20.dp))
                Column {
                    Text("Staff Member", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Teachers, administrators, etc.", color = Color(0xFF9E9E9E), fontSize = 14.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            onClick = onParent,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f)),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.FamilyRestroom, null, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(20.dp))
                Column {
                    Text("Parent", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Follow your children's progress.", color = Color(0xFF9E9E9E), fontSize = 14.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Surface(
            onClick = onStudent,
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f)),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.School, null, modifier = Modifier.size(32.dp))
                Spacer(modifier = Modifier.width(20.dp))
                Column {
                    Text("Student", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Access your academic profile.", color = Color(0xFF9E9E9E), fontSize = 14.sp)
                }
            }
        }
    }
}
