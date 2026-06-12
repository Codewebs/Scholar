package com.indiza.scholar.ui.settings

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.intl.Locale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.PredefinedCountry

enum class WizardStep { SELECT_PAYS, SELECT_PROFIL }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AcademicStructureSettingsGroup(
    idAnneeScolaireActive: Long,
    viewModel: StructureConfigViewModel,
    userRole: com.indiza.scholar.model.AcademicRole
) {
    val deviceLanguage = remember { Locale.current.language.lowercase() }.let {
        if (it in listOf("fr", "en", "es")) it else "fr"
    }

    val canManageConfig = remember(userRole) {
        userRole.permissions.contains(com.indiza.scholar.model.AcademicPermission.MANAGE_CYCLES) ||
        userRole.permissions.contains(com.indiza.scholar.model.AcademicPermission.MANAGE_CLASSES) ||
        userRole == com.indiza.scholar.model.AcademicRole.ADMINISTRATEUR
    }

    val uiState by viewModel.uiState.collectAsState()
    val saveState by viewModel.saveState.collectAsState()
    val educationProfiles by viewModel.educationProfiles.collectAsState()

    // États mémorisés pour le Wizard
    var currentStep by remember { mutableStateOf(WizardStep.SELECT_PAYS) }
    var selectedCountry by remember { mutableStateOf<com.indiza.scholar.model.PredefinedCountry?>(null) }
    val selectedEnseignements = remember { mutableStateListOf<com.indiza.scholar.model.PredefinedProfil>() }

    // 🔄 Réinitialisation après succès ou changement d'année
    LaunchedEffect(saveState, idAnneeScolaireActive) {
        if (saveState is SaveState.SUCCESS) {
            currentStep = WizardStep.SELECT_PAYS
            selectedCountry = null
            selectedEnseignements.clear()
            viewModel.resetSaveState()
        }
    }

    var showDetailsSheet by remember { mutableStateOf(false) }
    var selectedEnseignementForDetails by remember { mutableStateOf<com.indiza.scholar.model.EnseignementEntity?>(null) }
    val profileDetails by viewModel.profileDetails.collectAsState()
    val context = LocalContext.current

    val alreadyConfigured = remember(uiState) {
        val list = when (val s = uiState) {
            is AcademicUIState.HasConfig -> s.listEnseignements
            is AcademicUIState.Empty -> s.alreadyConfigured
            is AcademicUIState.Loading -> s.currentData
        }
        println("📱 [AcademicStructureSettingsGroup] Re-calcul de alreadyConfigured. Source: ${uiState::class.simpleName}, Size: ${list.size}")
        list
    }

    LaunchedEffect(alreadyConfigured) {
        println("📊 [AcademicStructureSettingsGroup] UI rafraîchie avec ${alreadyConfigured.size} profils.")
        alreadyConfigured.forEach { ens ->
            println("   -> Profil: ${ens.enseignementFr} | ID Serveur: ${ens.idServeur} | ID Local: ${ens.idLocal}")
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF2C3E50), RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Text("Structure Académique", style = MaterialTheme.typography.titleMedium, color = Color.White)
        Spacer(modifier = Modifier.height(12.dp))

        // --- Bloc Résumé (Toujours visible si des profils existent) ---
        if (alreadyConfigured.isNotEmpty()) {
            Text("⚙️ Profils d'enseignement actifs :", style = MaterialTheme.typography.labelMedium, color = Color(0xFF1ABC9C))
            alreadyConfigured.forEach { ens ->
                val ensTraduit = when (deviceLanguage) {
                    "en" -> ens.enseignementEn ?: ens.enseignementFr
                    "es" -> ens.enseignementEs ?: ens.enseignementFr
                    else -> ens.enseignementFr
                }
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable {
                        selectedEnseignementForDetails = ens
                        viewModel.loadProfileDetails(ens.idLocal)
                        showDetailsSheet = true
                    },
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF34495E))
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(ensTraduit, color = Color.White, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
                        Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color(0xFF1ABC9C))
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        when (val state = uiState) {
            is AcademicUIState.Loading -> {
                Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF1ABC9C))
                }
            }

            is AcademicUIState.HasConfig -> {
                if (canManageConfig) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                val intent = Intent(context, com.indiza.scholar.ui.student.ClasseManagementActivity::class.java)
                                intent.putExtra("idAnneeScolaire", idAnneeScolaireActive)
                                context.startActivity(intent)
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3498DB))
                        ) {
                            Icon(Icons.Default.Edit, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Modifier", fontSize = 12.sp)
                        }

                        Button(
                            onClick = { viewModel.passerEnModeModification() },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                        ) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Ajouter", fontSize = 12.sp)
                        }
                    }
                }
            }

            is AcademicUIState.Empty -> {
                if (idAnneeScolaireActive <= 0) {
                    Text("Veuillez sélectionner une année scolaire active.", color = Color.Gray, fontSize = 12.sp)
                } else {
                    // Filtrer les profils déjà choisis
                    val existingNames = alreadyConfigured.map { it.enseignementFr.lowercase() }
                    
                    if (alreadyConfigured.isNotEmpty()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Ajouter un nouveau profil", style = MaterialTheme.typography.labelLarge, color = Color(0xFF1ABC9C))
                            IconButton(onClick = { viewModel.verifierConfigurationExistante(idAnneeScolaireActive) }) {
                                Icon(Icons.Default.Add, "Annuler", tint = Color.LightGray, modifier = Modifier.size(20.dp))
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (currentStep == WizardStep.SELECT_PAYS) {
                        Text("Étape 1 : Sélectionnez votre pays :", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        if (educationProfiles.isEmpty()) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C), modifier = Modifier.size(24.dp))
                        } else {
                            educationProfiles.forEach { country ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth().clickable { 
                                        selectedCountry = country 
                                        currentStep = WizardStep.SELECT_PROFIL
                                    }.padding(vertical = 4.dp)
                                ) {
                                    RadioButton(
                                        selected = (selectedCountry == country),
                                        onClick = { 
                                            selectedCountry = country 
                                            currentStep = WizardStep.SELECT_PROFIL
                                        },
                                        colors = RadioButtonDefaults.colors(selectedColor = Color(0xFF1ABC9C), unselectedColor = Color.White)
                                    )
                                    Text(country.nomPays, color = Color.White, modifier = Modifier.padding(start = 8.dp))
                                }
                            }
                        }
                    }

                    if (currentStep == WizardStep.SELECT_PROFIL) {
                        Text("Étape 2 : Cochez les profils gérés par l'école :", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        val availableProfils = selectedCountry?.profils?.filter { profil ->
                            val profilNameFr = profil.enseignementLibelles["fr"]?.lowercase() ?: ""
                            !existingNames.contains(profilNameFr)
                        } ?: emptyList()

                        if (availableProfils.isEmpty()) {
                            Text("Tous les profils de ce pays sont déjà configurés.", color = Color.Gray, fontSize = 12.sp)
                        } else {
                            availableProfils.forEach { profil ->
                            val isChecked = selectedEnseignements.any { it.idEnseignement == profil.idEnseignement }
                            
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth().clickable { 
                                    if (isChecked) selectedEnseignements.removeAll { it.idEnseignement == profil.idEnseignement } 
                                    else selectedEnseignements.add(profil)
                                }.padding(vertical = 4.dp)
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked -> 
                                        if (checked == true) selectedEnseignements.add(profil) 
                                        else selectedEnseignements.removeAll { it.idEnseignement == profil.idEnseignement }
                                    },
                                    colors = CheckboxDefaults.colors(checkedColor = Color(0xFF1ABC9C), uncheckedColor = Color.White)
                                )
                                Text(profil.nomProfil, color = Color.White, modifier = Modifier.padding(start = 8.dp))
                            }
                        }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))

                        if (saveState is SaveState.SAVING_REMOTE) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C), modifier = Modifier.align(Alignment.CenterHorizontally))
                        } else {
                            Button(
                                onClick = {
                                    viewModel.sauvegarderProfilsEtablissement(
                                        idAnneeScolaireActive, 
                                        selectedCountry?.nomPays ?: "",
                                        selectedEnseignements.toList()
                                    )
                                },
                                enabled = selectedEnseignements.isNotEmpty() && idAnneeScolaireActive > 0,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2ECC71))
                            ) {
                                Text("Enregistrer la Sélection", color = Color.White)
                            }
                            
                            if (alreadyConfigured.isNotEmpty()) {
                                TextButton(
                                    onClick = { viewModel.verifierConfigurationExistante(idAnneeScolaireActive) },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text("Annuler", color = Color.LightGray)
                                }
                            }
                        }
                        
                        TextButton(
                            onClick = { currentStep = WizardStep.SELECT_PAYS },
                            modifier = Modifier.align(Alignment.CenterHorizontally)
                        ) {
                            Text("Changer de pays", color = Color.LightGray)
                        }
                    }
                }
            }
        }
    }

    if (showDetailsSheet && selectedEnseignementForDetails != null) {
        ModalBottomSheet(
            onDismissRequest = { showDetailsSheet = false },
            containerColor = Color(0xFF2C3E50),
            contentColor = Color.White
        ) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth().verticalScroll(rememberScrollState())) {
                val ensTraduit = when (deviceLanguage) {
                    "en" -> selectedEnseignementForDetails!!.enseignementEn ?: selectedEnseignementForDetails!!.enseignementFr
                    "es" -> selectedEnseignementForDetails!!.enseignementEs ?: selectedEnseignementForDetails!!.enseignementFr
                    else -> selectedEnseignementForDetails!!.enseignementFr
                }

                Text(ensTraduit, style = MaterialTheme.typography.headlineSmall, color = Color(0xFF1ABC9C))
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Color.Gray)

                if (profileDetails.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF1ABC9C))
                    }
                } else {
                    profileDetails.forEach { (cycle, classes) ->
                        val cycleTraduit = when (deviceLanguage) {
                            "en" -> cycle.libelleCycleEn ?: cycle.libelleCycleFr
                            "es" -> cycle.libelleCycleEs ?: cycle.libelleCycleFr
                            else -> cycle.libelleCycleFr
                        }

                        Text(cycleTraduit, fontWeight = FontWeight.Bold, color = Color(0xFF3498DB), modifier = Modifier.padding(top = 8.dp))

                        val chaineClasses = classes.joinToString(", ") { cl ->
                            val clTraduit = when (deviceLanguage) {
                                "en" -> cl.libelleClasseEn ?: cl.libelleClasseFr
                                "es" -> cl.libelleClasseEs ?: cl.libelleClasseFr
                                else -> cl.libelleClasseFr
                            }
                            clTraduit
                        }
                        Text(chaineClasses, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}
