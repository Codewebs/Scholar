package com.indiza.scholar.ui.setup

import android.app.DatePickerDialog
import android.util.Log
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.ui.auth.GlassTextField
import com.indiza.scholar.ui.home.testConnection
import java.util.*
import android.content.Context
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InitialSetupScreen(
    viewModel: InitialSetupViewModel,
    onSetupComplete: (Long, Long, String) -> Unit,
    onNavigateToTracker: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    // 🔔 Observer les événements de synchronisation Remote-First
    LaunchedEffect(Unit) {
        viewModel.syncEvents.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    // Breathing Animation for background glow
    val infiniteTransition = rememberInfiniteTransition(label = "breathing")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "glow"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1A0B2E), Color(0xFF3B125A), Color(0xFF5E1B89))
                )
            )
    ) {
        // Decorative glowing circles
        Box(
            modifier = Modifier
                .size(350.dp)
                .offset(x = (-120).dp, y = (-150).dp)
                .blur(90.dp)
                .background(Color(0xFF8E24AA).copy(alpha = glowAlpha), RoundedCornerShape(175.dp))
        )
        Box(
            modifier = Modifier
                .size(300.dp)
                .offset(x = 180.dp, y = 300.dp)
                .blur(80.dp)
                .background(Color(0xFF311B92).copy(alpha = glowAlpha), RoundedCornerShape(150.dp))
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            ScholarTitle(color = Color.White)
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                text = "Configuration",
                style = TextStyle(
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    shadow = Shadow(color = Color.Black.copy(alpha = 0.3f), blurRadius = 8f)
                )
            )

            Spacer(modifier = Modifier.height(20.dp))

            // --- Résumé des choix ---
            SummarySection(uiState) { step ->
                viewModel.jumpToStep(step)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // --- Zone active (Frosted Glass Card) ---
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.1f))
                    .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                    .padding(24.dp)
            ) {
                AnimatedContent(
                    targetState = uiState.currentStep,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(300)) togetherWith
                                fadeOut(animationSpec = tween(300))
                    },
                    label = "StepTransition"
                ) { step ->
                    when (step) {
                        SetupStep.LANDING -> LandingStep(viewModel, onNavigateToTracker)
                        SetupStep.SELECT_LANGUAGE -> LanguageStep(viewModel)
                        SetupStep.WELCOME -> WelcomeStep(viewModel)
                        SetupStep.SELECT_SCHOOL -> SchoolStep(viewModel, onNavigateToTracker)
                        SetupStep.SELECT_PROFILE -> ProfileStep(viewModel, onNavigateToTracker)
                        SetupStep.SELECT_YEAR -> YearStep(viewModel)
                        SetupStep.SECURITY_PIN -> PinStep(viewModel, onSetupComplete)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun LandingStep(viewModel: InitialSetupViewModel, onNavigateToTracker: () -> Unit) {
    var showServerConfig by remember { mutableStateOf(false) }
    val context = LocalContext.current

    LandingScreen(
        onNavigateToCreate = { pays, ville, arrete -> 
            viewModel.startCreateSchool(pays, ville, arrete)
        },
        onNavigateToJoinStaff = { code -> 
            viewModel.startJoinStaff(code)
        },
        onNavigateToJoinStudent = { code -> 
            viewModel.startJoinStudent(code) {
                // Pour Parent/Eleve, on marque comme complété et on active la session
                context.getSharedPreferences("app_config", Context.MODE_PRIVATE).edit().putBoolean("setup_complete", true).apply()
                // On pourrait extraire schoolId/yearId du code si l'API le permettait
                onNavigateToTracker()
            }
        },
        onServerConfigClick = { showServerConfig = true }
    )

    if (showServerConfig) {
        ServerConfigBottomSheet(onDismiss = { showServerConfig = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerConfigBottomSheet(onDismiss: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val prefs = remember { context.getSharedPreferences("app_config", Context.MODE_PRIVATE) }
    var serverIp by remember { mutableStateOf(prefs.getString("server_ip", "192.168.0.50") ?: "") }
    var isTesting by remember { mutableStateOf(false) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Configuration Réseau", style = MaterialTheme.typography.titleLarge)
            OutlinedTextField(
                value = serverIp,
                onValueChange = { serverIp = it },
                label = { Text("IP du Serveur / URL") },
                modifier = Modifier.fillMaxWidth()
            )
            if (isTesting) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onDismiss) { Text("Annuler") }
                Button(onClick = {
                    scope.launch {
                        isTesting = true
                        val formattedIp = if (serverIp.startsWith("http")) serverIp else "http://$serverIp:4000/"
                        if (testConnection(formattedIp)) {
                            prefs.edit().putString("server_ip", serverIp).apply()
                            com.indiza.scholar.network.ApiClient.updateBaseUrl(serverIp)
                            onDismiss()
                        } else {
                            Toast.makeText(context, "Serveur injoignable", Toast.LENGTH_SHORT).show()
                        }
                        isTesting = false
                    }
                }) { Text("Appliquer") }
            }
        }
    }
}

@Composable
fun SummarySection(state: SetupUiState, onStepClick: (SetupStep) -> Unit) {
    if (state.selectedLanguage == null && state.selectedSchool == null) return

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.05f))
            .border(0.5.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
            .padding(16.dp)
    ) {
        state.selectedLanguage?.let {
            SummaryItem("Langue", it) { onStepClick(SetupStep.SELECT_LANGUAGE) }
        }
        state.selectedSchool?.let {
            SummaryItem("Établissement", it.nomFr) { onStepClick(SetupStep.SELECT_SCHOOL) }
        }
        state.selectedProfile?.let {
            val canChange = (state.availableProfiles.size > 1)
            SummaryItem("Poste / Profil", it, enabled = canChange) { 
                onStepClick(SetupStep.SELECT_PROFILE) 
            }
        }
        state.selectedYear?.let {
            SummaryItem("Année Scolaire", it.libelleAnneeScolaire) { onStepClick(SetupStep.SELECT_YEAR) }
        }
    }
}

@Composable
fun SummaryItem(label: String, value: String, enabled: Boolean = true, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(label, color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
            Text(value, color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Medium)
        }
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(18.dp))
    }
}

@Composable
fun WelcomeStep(viewModel: InitialSetupViewModel) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.AutoAwesome,
            contentDescription = null,
            tint = Color(0xFFF1C40F),
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            "Bienvenue sur Scholar",
            color = Color.White,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Prêt à digitaliser votre établissement scolaire ?",
            color = Color.White.copy(alpha = 0.7f),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(48.dp))
        Button(
            onClick = { viewModel.jumpToStep(SetupStep.SELECT_SCHOOL) },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.2f)),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
        ) {
            Text("Rechercher mon établissement", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun LanguageStep(viewModel: InitialSetupViewModel) {
    val languages = listOf("Français", "English")
    Column {
        Text("Choisissez votre langue", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        languages.forEach { lang ->
            Button(
                onClick = { viewModel.selectLanguage(lang) },
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(0.5.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Text(lang, color = Color.White)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolStep(viewModel: InitialSetupViewModel, onNavigateToTracker: () -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    val uiState by viewModel.uiState.collectAsState()
    var showBottomSheet by remember { mutableStateOf(false) }
    var isNewDemandFlow by remember { mutableStateOf(uiState.isNewUser) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    Column {
        Text(
            text = if (isNewDemandFlow) "Demande d'intégration" else "Choisir l'établissement",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(16.dp))

        GlassTextField(
            value = searchQuery,
            onValueChange = {
                searchQuery = it
                viewModel.searchSchools(it)
            },
            label = "Nom de l'école..."
        )

        Spacer(modifier = Modifier.height(16.dp))

        Column {
            if (!isNewDemandFlow && uiState.userAssociations.isNotEmpty()) {
                Text(
                    "Mes établissements",
                    color = Color(0xFF1ABC9C),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                uiState.userAssociations.forEach { assoc ->
                    SchoolItem(assoc.school, assoc.school == uiState.selectedSchool, assoc.etat) {
                        viewModel.selectSchool(assoc.school)
                    }
                }
            } else {
                if (uiState.schools.isNotEmpty()) {
                    Text(
                        "Résultats de recherche",
                        color = Color.White.copy(alpha = 0.5f),
                        fontSize = 12.sp,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                    uiState.schools.forEach { school ->
                        SchoolItem(school, school == uiState.selectedSchool) {
                            viewModel.selectSchool(school)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { showBottomSheet = true },
                modifier = Modifier.weight(1f).height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(0.5.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Créer", fontSize = 14.sp)
            }

            Button(
                onClick = { viewModel.validateSchool(onNavigateToTracker) },
                modifier = Modifier.weight(1f).height(48.dp),
                enabled = uiState.selectedSchool != null,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(if (isNewDemandFlow) "Postuler" else "Valider", fontWeight = FontWeight.Bold)
            }
        }

        if (!isNewDemandFlow) {
            TextButton(
                onClick = { isNewDemandFlow = true },
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text("Postuler dans une autre école", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp)
            }
        }
    }

    if (showBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBottomSheet = false },
            sheetState = sheetState,
            containerColor = Color(0xFF2C3E50),
            contentColor = Color.White
        ) {
            CreateSchoolForm(
                onCreate = { entity ->
                    viewModel.createSchool(
                        nomFr = entity.nomFr,
                        nomEn = entity.nomEn,
                        abreviation = entity.abreviation,
                        ville = entity.ville,
                        telephone1 = entity.telephone1,
                        email = entity.email,
                        deviseFr = entity.deviseFr,
                        deviseEn = entity.deviseEn,
                        description = entity.description
                    )
                    showBottomSheet = false
                },
                onCancel = { showBottomSheet = false }
            )
        }
    }
}

@Composable
fun SchoolItem(school: EtablissementEntity, isSelected: Boolean, status: String? = null, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Color.White.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.05f)
        ),
        shape = RoundedCornerShape(12.dp),
        border = if (isSelected) BorderStroke(1.dp, Color(0xFF1ABC9C)) else BorderStroke(0.5.dp, Color.White.copy(alpha = 0.1f))
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(school.nomFr, color = Color.White, fontWeight = FontWeight.Bold)
                Text(school.ville ?: "Ville non définie", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)
            }
            if (status != null) {
                val color = if (status == "VALIDE") Color(0xFF1ABC9C) else Color(0xFFF1C40F)
                Surface(
                    color = color.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, color.copy(alpha = 0.5f))
                ) {
                    Text(
                        text = if (status == "VALIDE") "Inscrit" else "En attente",
                        color = color,
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun ProfileStep(viewModel: InitialSetupViewModel, onNavigateToTracker: () -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    
    Column {
        Text("Votre poste / profil", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        uiState.availableProfiles.forEach { profile ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
                    .clickable { viewModel.selectProfile(profile) },
                colors = CardDefaults.cardColors(
                    containerColor = if (profile == uiState.selectedProfile) Color.White.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.05f)
                ),
                shape = RoundedCornerShape(12.dp),
                border = if (profile == uiState.selectedProfile) BorderStroke(1.dp, Color(0xFF1ABC9C)) else BorderStroke(0.5.dp, Color.White.copy(alpha = 0.1f))
            ) {
                Text(profile, modifier = Modifier.padding(16.dp), color = Color.White)
            }
        }

        if (uiState.selectedProfile == "ENSEIGNANT") {
            Spacer(modifier = Modifier.height(16.dp))
            Text("Matières enseignées (Max 4)", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold, fontSize = 14.sp)
            
            uiState.availableMatieres.forEach { matiere ->
                val isSelected = uiState.selectedSpecialties.contains(matiere.idServeur)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().clickable { viewModel.toggleSpecialty(matiere.idServeur ?: 0L) }.padding(vertical = 2.dp)
                ) {
                    Checkbox(
                        checked = isSelected,
                        onCheckedChange = { viewModel.toggleSpecialty(matiere.idServeur ?: 0L) },
                        colors = CheckboxDefaults.colors(checkedColor = Color(0xFF1ABC9C), uncheckedColor = Color.White.copy(alpha = 0.5f))
                    )
                    Text(matiere.libelleFr, color = Color.White, fontSize = 14.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = { viewModel.validateProfile(onNavigateToTracker) },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            enabled = uiState.selectedProfile != null,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
            shape = RoundedCornerShape(16.dp)
        ) { Text("Valider et Postuler", fontWeight = FontWeight.Bold) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun YearStep(viewModel: InitialSetupViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var showBottomSheet by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val canCreateYear = remember(uiState.selectedProfile) {
        AcademicRole.fromName(uiState.selectedProfile).permissions.contains(AcademicPermission.REGISTER_SCHOOL_YEAR)
    }

    Column {
        Text("Année scolaire", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        if (uiState.years.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(Icons.Default.EventBusy, null, tint = Color.White.copy(alpha = 0.3f), modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Text("Aucune année scolaire active", color = Color.White.copy(alpha = 0.5f))
                if (!canCreateYear) {
                    Text("Veuillez contacter l'administration", color = Color(0xFFE74C3C), fontSize = 12.sp)
                }
            }
        } else {
            uiState.years.forEach { year ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable { viewModel.selectYear(year) },
                    colors = CardDefaults.cardColors(
                        containerColor = if (year == uiState.selectedYear) Color.White.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.05f)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    border = if (year == uiState.selectedYear) BorderStroke(1.dp, Color(0xFF1ABC9C)) else BorderStroke(0.5.dp, Color.White.copy(alpha = 0.1f))
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(year.libelleAnneeScolaire, color = Color.White, fontWeight = FontWeight.Bold)
                            Text("${year.dateDebut} - ${year.dateFin}", color = Color.White.copy(alpha = 0.6f), fontSize = 12.sp)
                        }
                        if (year == uiState.selectedYear) {
                            Icon(Icons.Default.Check, null, tint = Color(0xFF1ABC9C))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (canCreateYear) {
                Button(
                    onClick = { showBottomSheet = true },
                    modifier = Modifier.weight(1f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(0.5.dp, Color.White.copy(alpha = 0.2f))
                ) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Créer")
                }
            }

            Button(
                onClick = { viewModel.validateYear() },
                modifier = (if (canCreateYear) Modifier.weight(1f) else Modifier.fillMaxWidth()).height(48.dp),
                enabled = uiState.selectedYear != null,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Valider", fontWeight = FontWeight.Bold) }
        }
    }

    if (showBottomSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBottomSheet = false },
            sheetState = sheetState,
            containerColor = Color(0xFF2C3E50),
            contentColor = Color.White
        ) {
            CreateYearForm(
                onCreate = { libelle, start, end ->
                    viewModel.createYear(libelle, start, end)
                    showBottomSheet = false
                },
                onCancel = { showBottomSheet = false }
            )
        }
    }
}

@Composable
fun PinStep(viewModel: InitialSetupViewModel, onComplete: (Long, Long, String) -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    val isCreator = uiState.isCreatingSchool

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = if (isCreator) "Définir le code PIN" else "Code de sécurité",
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = if (isCreator) "Sécurisez l'accès à l'établissement" else "Saisissez le PIN de l'école",
            color = Color.White.copy(alpha = 0.6f),
            fontSize = 14.sp
        )
        
        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = uiState.pinValue,
            onValueChange = { viewModel.onPinChanged(it) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.width(160.dp),
            isError = uiState.error != null,
            textStyle = LocalTextStyle.current.copy(textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 24.sp, color = Color.White),
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFF1ABC9C),
                unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                errorBorderColor = Color.Red
            )
        )
        
        uiState.error?.let {
            Text(it, color = Color.Red, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
        }
        
        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { viewModel.verifyOrSetPin(onComplete) },
            enabled = uiState.pinValue.length == 4,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Terminer la configuration", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun CreateSchoolForm(onCreate: (EtablissementEntity) -> Unit, onCancel: () -> Unit) {
    var nomFr by remember { mutableStateOf("") }
    var nomEn by remember { mutableStateOf("") }
    var abreviation by remember { mutableStateOf("") }
    var deviseFr by remember { mutableStateOf("") }
    var deviseEn by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var telephone1 by remember { mutableStateOf("") }
    var ville by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Nouvel Établissement", style = MaterialTheme.typography.headlineSmall, color = Color.White, fontWeight = FontWeight.Bold)

        OutlinedTextField(value = nomFr, onValueChange = { nomFr = it }, label = { Text("Nom (FR) *") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = telephone1, onValueChange = { telephone1 = it }, label = { Text("Téléphone *") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = ville, onValueChange = { ville = it }, label = { Text("Ville") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = abreviation, onValueChange = { abreviation = it }, label = { Text("Abréviation") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = description, onValueChange = { description = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth(), minLines = 3)

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TextButton(onClick = onCancel, modifier = Modifier.weight(1f)) { Text("Annuler", color = Color.White.copy(alpha = 0.6f)) }
            Button(
                onClick = { 
                    if (nomFr.isNotBlank() && telephone1.isNotBlank()) {
                        onCreate(EtablissementEntity(nomFr = nomFr, nomEn = nomEn, abreviation = abreviation, ville = ville, telephone1 = telephone1.toLongOrNull() ?: 0L, email = email, deviseFr = deviseFr, deviseEn = deviseEn, description = description))
                    }
                },
                modifier = Modifier.weight(1f).height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Créer", fontWeight = FontWeight.Bold) }
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun CreateYearForm(onCreate: (String, String, String) -> Unit, onCancel: () -> Unit) {
    var libelle by remember { mutableStateOf("") }
    var start by remember { mutableStateOf("") }
    var end by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Nouvelle Année Scolaire", style = MaterialTheme.typography.headlineSmall, color = Color.White, fontWeight = FontWeight.Bold)

        OutlinedTextField(value = libelle, onValueChange = { libelle = it }, label = { Text("Libellé (ex: 2023-2024) *") }, modifier = Modifier.fillMaxWidth())

        DatePickerField(label = "Date Début *", value = start) { start = it }
        DatePickerField(label = "Date Fin *", value = end) { end = it }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TextButton(onClick = onCancel, modifier = Modifier.weight(1f)) { Text("Annuler", color = Color.White.copy(alpha = 0.6f)) }
            Button(
                onClick = { 
                    if (libelle.isNotBlank() && start.isNotBlank() && end.isNotBlank()) {
                        onCreate(libelle, start, end)
                    }
                },
                modifier = Modifier.weight(1f).height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Créer", fontWeight = FontWeight.Bold) }
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun DatePickerField(label: String, value: String, onDateSelected: (String) -> Unit) {
    val context = LocalContext.current
    val calendar = Calendar.getInstance()
    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formattedDate = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, dayOfMonth)
            onDateSelected(formattedDate)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

    OutlinedTextField(
        value = value,
        onValueChange = {},
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth().clickable { datePickerDialog.show() },
        readOnly = true,
        trailingIcon = { Icon(Icons.Default.DateRange, null, modifier = Modifier.clickable { datePickerDialog.show() }) },
        enabled = false,
        colors = OutlinedTextFieldDefaults.colors(
            disabledTextColor = Color.White,
            disabledLabelColor = Color.White.copy(alpha = 0.6f),
            disabledBorderColor = Color.White.copy(alpha = 0.2f),
            disabledTrailingIconColor = Color.White.copy(alpha = 0.6f)
        )
    )
}
