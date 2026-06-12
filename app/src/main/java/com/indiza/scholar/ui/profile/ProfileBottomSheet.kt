package com.indiza.scholar.ui.profile

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.Speciality
import com.indiza.scholar.model.SpecialityType
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.personnel.RoleBadge
import kotlinx.coroutines.launch

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.indiza.scholar.utils.ImageStorageUtils
import coil.compose.AsyncImage
import coil.compose.rememberAsyncImagePainter
import android.net.Uri

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileBottomSheet(
    userName: String,
    userRole: String,
    userId: Long,
    apiService: ApiService,
    onDismiss: () -> Unit
) {
    var currentTab by remember { mutableIntStateOf(0) } // 0: Infos, 1: Password, 2: Specialities

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = { BottomSheetDefaults.DragHandle() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 32.dp)
        ) {
            val context = LocalContext.current
            var userPhotoPath by remember { mutableStateOf(ImageStorageUtils.getUserPhoto(context, userId)?.absolutePath) }
            
            val photoLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
                uri?.let {
                    val savedPath = ImageStorageUtils.saveUserPhoto(context, it, userId)
                    userPhotoPath = savedPath
                }
            }

            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer)
                        .clickable { photoLauncher.launch("image/*") },
                    contentAlignment = Alignment.Center
                ) {
                    if (userPhotoPath != null) {
                        AsyncImage(model = userPhotoPath, contentDescription = null, modifier = Modifier.fillMaxSize())
                    } else {
                        Icon(Icons.Default.AddAPhoto, null, modifier = Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
                    }
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text(userName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        userRole.split(",").forEach { role ->
                            RoleBadge(AcademicRole.fromName(role.trim()))
                        }
                    }
                }
            }

            TabRow(selectedTabIndex = currentTab) {
                Tab(selected = currentTab == 0, onClick = { currentTab = 0 }) {
                    Text("Infos", modifier = Modifier.padding(12.dp))
                }
                Tab(selected = currentTab == 1, onClick = { currentTab = 1 }) {
                    Text("Sécurité", modifier = Modifier.padding(12.dp))
                }
                if (userRole.contains("ENSEIGNANT")) {
                    Tab(selected = currentTab == 2, onClick = { currentTab = 2 }) {
                        Text("Spécialités", modifier = Modifier.padding(12.dp))
                    }
                }
            }

            Box(modifier = Modifier.fillMaxWidth()) {
                when (currentTab) {
                    0 -> InfoTab(userName, userId, apiService)
                    1 -> PasswordTab(apiService)
                    2 -> SpecialityTab(apiService)
                }
            }
        }
    }
}

@Composable
fun InfoTab(currentName: String, userId: Long, apiService: ApiService) {
    var name by remember { mutableStateOf(currentName) }
    var phone by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    Column(modifier = Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Nom complet") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = phone, onValueChange = { phone = it }, label = { Text("Téléphone") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth())
        
        Button(
            onClick = {
                scope.launch {
                    val res = apiService.updateProfile(mapOf("nom" to name, "telephone" to phone))
                    if (res.isSuccessful) Toast.makeText(context, "Profil mis à jour", Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Enregistrer les modifications")
        }
    }
}

@Composable
fun PasswordTab(apiService: ApiService) {
    var step by remember { mutableIntStateOf(1) }
    var oldPass by remember { mutableStateOf("") }
    var newPass by remember { mutableStateOf("") }
    var confirmPass by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    Column(modifier = Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Changer le mot de passe (Étape $step/3)", fontWeight = FontWeight.Bold)
        
        when (step) {
            1 -> {
                OutlinedTextField(
                    value = oldPass, 
                    onValueChange = { oldPass = it }, 
                    label = { Text("Ancien mot de passe") }, 
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation()
                )
                Button(onClick = { if (oldPass.isNotEmpty()) step = 2 }, modifier = Modifier.fillMaxWidth()) { Text("Suivant") }
            }
            2 -> {
                OutlinedTextField(
                    value = newPass, 
                    onValueChange = { newPass = it }, 
                    label = { Text("Nouveau mot de passe") }, 
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation()
                )
                Button(onClick = { if (newPass.length >= 6) step = 3 }, modifier = Modifier.fillMaxWidth()) { Text("Suivant") }
            }
            3 -> {
                OutlinedTextField(
                    value = confirmPass, 
                    onValueChange = { confirmPass = it }, 
                    label = { Text("Confirmer le nouveau mot de passe") }, 
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = PasswordVisualTransformation()
                )
                Button(
                    onClick = {
                        if (newPass == confirmPass) {
                            scope.launch {
                                val res = apiService.changePassword(mapOf("oldPassword" to oldPass, "newPassword" to newPass))
                                if (res.isSuccessful) {
                                    Toast.makeText(context, "Mot de passe changé", Toast.LENGTH_SHORT).show()
                                    step = 1
                                    oldPass = ""; newPass = ""; confirmPass = ""
                                } else {
                                    Toast.makeText(context, "Erreur", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Terminer") }
                TextButton(onClick = { step = 2 }, modifier = Modifier.fillMaxWidth()) { Text("Retour") }
            }
        }
    }
}

@Composable
fun SpecialityTab(apiService: ApiService) {
    var specialities by remember { mutableStateOf<List<Speciality>>(emptyList()) }
    var selectedIds by remember { mutableStateOf<Set<Long>>(emptySet()) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        val res = apiService.getSpecialities()
        if (res.isSuccessful) specialities = res.body() ?: emptyList()
    }

    Column(modifier = Modifier.padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Vos spécialités (${selectedIds.size}/5)", fontWeight = FontWeight.Bold)

        SpecialitySection("Matières enseignées", specialities.filter { it.type == SpecialityType.MATIERE }, selectedIds) { id ->
            if (selectedIds.contains(id)) selectedIds -= id
            else if (selectedIds.size < 5) selectedIds += id
        }

        SpecialitySection("Compétences professionnelles", specialities.filter { it.type == SpecialityType.COMPETENCE_PRO }, selectedIds) { id ->
            if (selectedIds.contains(id)) selectedIds -= id
            else if (selectedIds.size < 5) selectedIds += id
        }

        Button(
            onClick = {
                scope.launch {
                    val res = apiService.updateSpecialities(mapOf("specialities" to selectedIds.toList()))
                    if (res.isSuccessful) Toast.makeText(context, "Spécialités mises à jour", Toast.LENGTH_SHORT).show()
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedIds.isNotEmpty()
        ) {
            Text("Enregistrer les spécialités")
        }
    }
}

@Composable
fun SpecialitySection(title: String, items: List<Speciality>, selectedIds: Set<Long>, onToggle: (Long) -> Unit) {
    Column {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(8.dp))
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items.forEach { spec ->
                val isSelected = selectedIds.contains(spec.id)
                FilterChip(
                    selected = isSelected,
                    onClick = { onToggle(spec.id) },
                    label = { Text(spec.libelle) },
                    leadingIcon = if (isSelected) {
                        { Icon(Icons.Default.Check, null, modifier = Modifier.size(16.dp)) }
                    } else null
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalArrangement: Arrangement.Horizontal = Arrangement.Start,
    verticalArrangement: Arrangement.Vertical = Arrangement.Top,
    content: @Composable () -> Unit
) {
    androidx.compose.foundation.layout.FlowRow(
        modifier = modifier,
        horizontalArrangement = horizontalArrangement,
        verticalArrangement = verticalArrangement
    ) {
        content()
    }
}
