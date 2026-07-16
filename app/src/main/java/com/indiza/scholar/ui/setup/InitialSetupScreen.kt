package com.indiza.scholar.ui.setup

import android.app.DatePickerDialog
import android.content.Context
import android.util.Log
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.ui.ScholarTitle
import com.indiza.scholar.ui.auth.ModernButton
import com.indiza.scholar.ui.auth.ModernTextField
import com.indiza.scholar.ui.auth.ServerConfigIcon
import com.indiza.scholar.ui.auth.ThemeToggleIcon
import com.indiza.scholar.ui.home.testConnection
import com.indiza.scholar.ui.theme.ScholarTheme
import java.util.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InitialSetupScreen(
    viewModel: InitialSetupViewModel,
    onLogout: () -> Unit,
    onSetupComplete: (Long, Long, String) -> Unit,
    onNavigateToTracker: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    var isDarkMode by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.syncEvents.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    ScholarTheme(darkTheme = isDarkMode) {
        var showServerConfig by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {},
                    navigationIcon = {
                        if (uiState.currentStep != SetupStep.LANDING) {
                            IconButton(onClick = { viewModel.jumpToStep(SetupStep.LANDING) }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                            }
                        } else {
                            IconButton(onClick = onLogout) {
                                Icon(Icons.Default.LogOut, contentDescription = "Logout", tint = Color.Red)
                            }
                        }
                    },
                    actions = {
                        ServerConfigIcon(onClick = { showServerConfig = true })
                        ThemeToggleIcon(isDark = isDarkMode, onToggle = { isDarkMode = !isDarkMode })
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                        actionIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            },
            containerColor = MaterialTheme.colorScheme.surface
        ) { padding ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(24.dp)
            ) {
                Text(
                    text = "Setup Configuration.",
                    style = MaterialTheme.typography.headlineLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface,
                    lineHeight = 44.sp
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Complete these steps to start.",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(0xFF9E9E9E)
                )

                Spacer(modifier = Modifier.height(32.dp))

                SummarySection(uiState) { step ->
                    viewModel.jumpToStep(step)
                }

                Spacer(modifier = Modifier.height(32.dp))

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
                        SetupStep.SEARCH_CHILD -> SearchChildStep(viewModel)
                        SetupStep.SELECT_PROFILE -> ProfileStep(viewModel, onNavigateToTracker)
                        SetupStep.SELECT_YEAR -> YearStep(viewModel)
                        SetupStep.SECURITY_PIN -> PinStep(viewModel, onSetupComplete)
                    }
                }
                
                Spacer(modifier = Modifier.height(40.dp))
            }

            if (showServerConfig) {
                ServerConfigBottomSheet(onDismiss = { showServerConfig = false })
            }
        }
    }
}

@Composable
fun LandingStep(viewModel: InitialSetupViewModel, onNavigateToTracker: () -> Unit) {
    LandingScreen(
        onNavigateToCreate = { pays, ville, arrete -> 
            viewModel.startCreateSchool(pays, ville, arrete)
        },
        onNavigateToJoinStaff = { 
            viewModel.startJoinStaff()
        },
        onNavigateToJoinStudent = { 
            viewModel.startJoinStudent()
        },
        onNavigateToJoinParent = {
            viewModel.startJoinParent()
        }
    )
}

@Composable
fun SearchChildStep(viewModel: InitialSetupViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Link your child", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Search for your child by their full name to link your account.", color = Color(0xFF9E9E9E))

        ModernTextField(
            value = uiState.childSearchQuery,
            onValueChange = { viewModel.searchStudents(it) },
            label = "Student Name",
            placeholder = "Ex: Jean Dupont"
        )

        Spacer(modifier = Modifier.height(8.dp))

        uiState.foundStudents.forEach { student ->
            Surface(
                onClick = { viewModel.selectChild(student) },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, if (student.idServeur == uiState.selectedChild?.idServeur) Color.Black else Color(0xFF9E9E9E).copy(alpha = 0.2f)),
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.School, null, modifier = Modifier.size(24.dp))
                    Spacer(Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("${student.nom} ${student.prenom ?: ""}", fontWeight = FontWeight.Bold)
                        Text("Matricule: ${student.matricule ?: "N/A"}", style = MaterialTheme.typography.bodySmall, color = Color(0xFF9E9E9E))
                    }
                    if (student.idServeur == uiState.selectedChild?.idServeur) Icon(Icons.Default.CheckCircle, null)
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        ModernButton(
            text = "Confirm and Link",
            onClick = { viewModel.validateSchool { } },
            enabled = uiState.selectedChild != null
        )
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

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
                .padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text("Network Configuration", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            
            ModernTextField(
                value = serverIp,
                onValueChange = { serverIp = it },
                label = "Server IP / URL",
                placeholder = "e.g. 192.168.1.100"
            )
            
            if (isTesting) LinearProgressIndicator(modifier = Modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.onSurface)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f).height(56.dp)
                ) {
                    Text("Cancel", color = Color(0xFF9E9E9E))
                }
                ModernButton(
                    text = "Apply",
                    onClick = {
                        scope.launch {
                            isTesting = true
                            val formattedIp = if (serverIp.startsWith("http")) serverIp else "http://$serverIp:4000/"
                            if (testConnection(formattedIp)) {
                                prefs.edit().putString("server_ip", serverIp).apply()
                                com.indiza.scholar.network.ApiClient.updateBaseUrl(serverIp)
                                onDismiss()
                            } else {
                                Toast.makeText(context, "Server unreachable", Toast.LENGTH_SHORT).show()
                            }
                            isTesting = false
                        }
                    },
                    modifier = Modifier.weight(1f),
                    isLoading = isTesting
                )
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
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f), RoundedCornerShape(12.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        state.selectedLanguage?.let {
            SummaryItem("Language", it) { onStepClick(SetupStep.SELECT_LANGUAGE) }
        }
        state.selectedSchool?.let {
            SummaryItem("Establishment", it.nomFr) { onStepClick(SetupStep.SELECT_SCHOOL) }
        }
        state.selectedProfile?.let {
            val canChange = (state.availableProfiles.size > 1)
            SummaryItem("Profile", it, enabled = canChange) { 
                onStepClick(SetupStep.SELECT_PROFILE) 
            }
        }
        state.selectedChild?.let {
            SummaryItem("Child", "${it.nom} ${it.prenom ?: ""}") {
                onStepClick(SetupStep.SEARCH_CHILD)
            }
        }
        state.selectedYear?.let {
            SummaryItem("Academic Year", it.libelleAnneeScolaire) { onStepClick(SetupStep.SELECT_YEAR) }
        }
    }
}

@Composable
fun SummaryItem(label: String, value: String, enabled: Boolean = true, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = enabled) { onClick() }
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(label, color = Color(0xFF9E9E9E), style = MaterialTheme.typography.labelSmall)
            Text(value, color = MaterialTheme.colorScheme.onSurface, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(18.dp))
    }
}

@Composable
fun WelcomeStep(viewModel: InitialSetupViewModel) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Surface(
            shape = CircleShape,
            color = MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.size(80.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.size(40.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(32.dp))
        Text(
            "Welcome to Scholar",
            color = MaterialTheme.colorScheme.onSurface,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Ready to digitize your establishment?",
            color = Color(0xFF9E9E9E),
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(48.dp))
        
        ModernButton(
            text = "Search my school",
            onClick = { viewModel.jumpToStep(SetupStep.SELECT_SCHOOL) }
        )
    }
}

@Composable
fun LanguageStep(viewModel: InitialSetupViewModel) {
    val languages = listOf("Français", "English")
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Choose your language", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        languages.forEach { lang ->
            Surface(
                onClick = { viewModel.selectLanguage(lang) },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f)),
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = lang,
                    modifier = Modifier.padding(16.dp),
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
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
    var showSuccessSheet by remember { mutableStateOf(false) }
    var showAlreadyAppliedSheet by remember { mutableStateOf(false) }
    var isNewDemandFlow by remember { mutableStateOf(uiState.isNewUser) }
    val context = LocalContext.current

    LaunchedEffect(uiState.isNewUser) {
        isNewDemandFlow = uiState.isNewUser
    }

    Column {
        Text(
            text = if (isNewDemandFlow) "Join an Integration" else "Select Establishment",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(24.dp))

        ModernTextField(
            value = searchQuery,
            onValueChange = {
                searchQuery = it
                viewModel.searchSchools(it)
            },
            label = "School Name",
            placeholder = "Search..."
        )

        Spacer(modifier = Modifier.height(24.dp))

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (!isNewDemandFlow && uiState.userAssociations.isNotEmpty()) {
                Text(
                    "My Establishments",
                    color = Color(0xFF9E9E9E),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
                uiState.userAssociations.forEach { assoc ->
                    val isClickable = assoc.etat == "VALIDE"
                    SchoolItem(assoc.school, assoc.school == uiState.selectedSchool, assoc.etat, enabled = isClickable) {
                        if (isClickable) {
                            isNewDemandFlow = false
                            viewModel.selectSchool(assoc.school)
                            viewModel.validateSchool { }
                        }
                    }
                }
            } else if (uiState.schools.isNotEmpty()) {
                Text(
                    "Search Results",
                    color = Color(0xFF9E9E9E),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
                uiState.schools.forEach { school ->
                    val existingAssoc = uiState.userAssociations.find { it.school.idServeur == school.idServeur }
                    val status = existingAssoc?.etat
                    
            SchoolItem(school, school == uiState.selectedSchool, status) {
                viewModel.selectSchool(school)
                when (status) {
                    "VALIDE" -> {
                        if (uiState.selectedProfile == "PARENT") {
                             // On autorise un parent valide à lier un autre enfant
                             isNewDemandFlow = true
                             viewModel.jumpToStep(SetupStep.SEARCH_CHILD)
                        } else {
                             isNewDemandFlow = false
                             viewModel.validateSchool { }
                        }
                    }
                    "EN_ATTENTE", "REJETE" -> {
                        if (uiState.selectedProfile == "PARENT") {
                             isNewDemandFlow = true
                             viewModel.jumpToStep(SetupStep.SEARCH_CHILD)
                        } else {
                            isNewDemandFlow = false
                            showAlreadyAppliedSheet = true
                        }
                    }
                    else -> isNewDemandFlow = true
                }
            }
                }
            }
        }

        if (isNewDemandFlow && uiState.selectedSchool != null) {
            Spacer(modifier = Modifier.height(24.dp))
            val isStaff = uiState.selectedProfile != "ELEVE"
            
            ModernTextField(
                value = if (isStaff) uiState.recruitmentCode ?: "" else uiState.inscriptionCode ?: "",
                onValueChange = { 
                    if (isStaff) viewModel.onRecruitmentCodeChanged(it) 
                    else viewModel.onInscriptionCodeChanged(it)
                },
                label = if (isStaff) "Recruitment Code" else "Inscription Code",
                placeholder = if (isStaff) "4-digit code" else "Enter code"
            )
        }

        uiState.error?.let {
            Spacer(modifier = Modifier.height(16.dp))
            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }

        Spacer(modifier = Modifier.height(48.dp))

        val isCodeRequired = isNewDemandFlow && uiState.selectedSchool != null && uiState.selectedSchool?.idCreateur != uiState.userId
        val isCodeFilled = if (uiState.selectedProfile == "ELEVE") !uiState.inscriptionCode.isNullOrBlank() else !uiState.recruitmentCode.isNullOrBlank()

        ModernButton(
            text = if (isNewDemandFlow) "Submit Application" else "Confirm",
            onClick = { 
                viewModel.validateSchool {
                    if (isNewDemandFlow) showSuccessSheet = true
                    else if (uiState.selectedProfile == "ELEVE") {
                        context.getSharedPreferences("app_config", Context.MODE_PRIVATE).edit().putBoolean("setup_complete", true).apply()
                        onNavigateToTracker()
                    }
                }
            },
            enabled = uiState.selectedSchool != null && (!isCodeRequired || isCodeFilled)
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedButton(
            onClick = { showBottomSheet = true },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
        ) {
            Icon(Icons.Default.Add, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onSurface)
            Spacer(Modifier.width(8.dp))
            Text("Create New School", color = MaterialTheme.colorScheme.onSurface)
        }

        if (uiState.userAssociations.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            TextButton(
                onClick = {
                    context.getSharedPreferences("app_config", Context.MODE_PRIVATE).edit().putBoolean("setup_complete", true).apply()
                    onNavigateToTracker()
                },
                modifier = Modifier.align(Alignment.CenterHorizontally)
            ) {
                Text("Finish Setup", color = Color(0xFF9E9E9E), fontWeight = FontWeight.Bold)
            }
        }
    }

    // Modal Sheets Implementation (Success, Already Applied, Create School)
    // ... kept similarly but with new theme colors
    if (showSuccessSheet) {
        ModalBottomSheet(
            onDismissRequest = { showSuccessSheet = false },
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(24.dp).padding(bottom = 32.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.CheckCircle, null, tint = Color.Black, modifier = Modifier.size(64.dp))
                Spacer(Modifier.height(24.dp))
                Text("Demand Sent!", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(8.dp))
                Text("Your request for ${uiState.selectedSchool?.nomFr} is being reviewed.", textAlign = TextAlign.Center, color = Color(0xFF9E9E9E))
                Spacer(modifier = Modifier.height(32.dp))
                ModernButton(text = "OK", onClick = { showSuccessSheet = false })
            }
        }
    }

    if (showBottomSheet) {
        ModalBottomSheet(onDismissRequest = { showBottomSheet = false }, containerColor = MaterialTheme.colorScheme.surface) {
            CreateSchoolForm(
                onCreate = { entity ->
                    viewModel.createSchool(entity.nomFr, entity.nomEn, entity.abreviation, entity.ville, entity.telephone1, entity.email, entity.deviseFr, entity.deviseEn, entity.description)
                    showBottomSheet = false
                },
                onCancel = { showBottomSheet = false }
            )
        }
    }
}

@Composable
fun SchoolItem(school: EtablissementEntity, isSelected: Boolean, status: String? = null, enabled: Boolean = true, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, if (isSelected) Color.Black else Color(0xFF9E9E9E).copy(alpha = 0.2f)),
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth().alpha(if (enabled) 1f else 0.5f)
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(school.nomFr, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Text(school.ville ?: "No City", style = MaterialTheme.typography.bodySmall, color = Color(0xFF9E9E9E))
            }
            if (status != null) {
                Text(
                    text = status,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (status == "VALIDE") Color.Black else Color(0xFF9E9E9E)
                )
            }
        }
    }
}

@Composable
fun ProfileStep(viewModel: InitialSetupViewModel, onNavigateToTracker: () -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Your Role", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        
        uiState.availableProfiles.forEach { profile ->
            Surface(
                onClick = { viewModel.selectProfile(profile) },
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, if (profile == uiState.selectedProfile) Color.Black else Color(0xFF9E9E9E).copy(alpha = 0.2f)),
                color = MaterialTheme.colorScheme.surface,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(profile, modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold)
            }
        }

        if (uiState.selectedProfile == "ENSEIGNANT") {
            Spacer(modifier = Modifier.height(8.dp))
            Text("Subjects (Max 4)", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            
            uiState.availableMatieres.forEach { matiere ->
                val isSelected = uiState.selectedSpecialties.contains(matiere.idServeur)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().clickable { viewModel.toggleSpecialty(matiere.idServeur ?: 0L) }.padding(vertical = 4.dp)
                ) {
                    Checkbox(
                        checked = isSelected,
                        onCheckedChange = { viewModel.toggleSpecialty(matiere.idServeur ?: 0L) },
                        colors = CheckboxDefaults.colors(checkedColor = Color.Black)
                    )
                    Text(matiere.libelleFr, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        ModernButton(text = "Apply Role", onClick = { viewModel.validateProfile(onNavigateToTracker) })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun YearStep(viewModel: InitialSetupViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    var showBottomSheet by remember { mutableStateOf(false) }

    val canCreateYear = remember(uiState.selectedProfile) {
        AcademicRole.fromName(uiState.selectedProfile).permissions.contains(AcademicPermission.REGISTER_SCHOOL_YEAR)
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Academic Year", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

        if (uiState.years.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                Text("No active years found.", color = Color(0xFF9E9E9E))
            }
        } else {
            uiState.years.forEach { year ->
                Surface(
                    onClick = { viewModel.selectYear(year) },
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, if (year == uiState.selectedYear) Color.Black else Color(0xFF9E9E9E).copy(alpha = 0.2f)),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(year.libelleAnneeScolaire, fontWeight = FontWeight.Bold)
                            Text("${year.dateDebut} - ${year.dateFin}", style = MaterialTheme.typography.bodySmall, color = Color(0xFF9E9E9E))
                        }
                        if (year == uiState.selectedYear) Icon(Icons.Default.Check, null)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
        
        ModernButton(text = "Confirm Year", onClick = { viewModel.validateYear() }, enabled = uiState.selectedYear != null)
        
        if (canCreateYear) {
            OutlinedButton(
                onClick = { showBottomSheet = true },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color.Black.copy(alpha = 0.1f))
            ) {
                Text("Create New Year", color = Color.Black)
            }
        }
    }

    if (showBottomSheet) {
        ModalBottomSheet(onDismissRequest = { showBottomSheet = false }, containerColor = MaterialTheme.colorScheme.surface) {
            CreateYearForm(
                onCreate = { libelle, start, end -> viewModel.createYear(libelle, start, end); showBottomSheet = false },
                onCancel = { showBottomSheet = false }
            )
        }
    }
}

@Composable
fun PinStep(viewModel: InitialSetupViewModel, onComplete: (Long, Long, String) -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    val isCreator = uiState.isCreatingSchool

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = if (isCreator) "Set Security PIN" else "Security Code",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black
        )
        Text(
            text = if (isCreator) "Secure access to your establishment." else "Enter the school security PIN.",
            textAlign = TextAlign.Center,
            color = Color(0xFF9E9E9E)
        )
        
        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = uiState.pinValue,
            onValueChange = { viewModel.onPinChanged(it) },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.width(180.dp),
            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, fontSize = 28.sp, fontWeight = FontWeight.Bold),
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color.Black,
                unfocusedBorderColor = Color(0xFF9E9E9E).copy(alpha = 0.2f)
            )
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        ModernButton(text = "Finish Configuration", onClick = { viewModel.verifyOrSetPin(onComplete) }, enabled = uiState.pinValue.length == 4)
    }
}

@Composable
fun CreateSchoolForm(onCreate: (EtablissementEntity) -> Unit, onCancel: () -> Unit) {
    var nomFr by remember { mutableStateOf("") }
    var telephone1 by remember { mutableStateOf("") }
    var ville by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.padding(24.dp).padding(bottom = 32.dp).fillMaxWidth().verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("Create School", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)

        ModernTextField(value = nomFr, onValueChange = { nomFr = it }, label = "School Name (FR) *", placeholder = "Enter name")
        ModernTextField(value = telephone1, onValueChange = { telephone1 = it }, label = "Phone Number *", placeholder = "+237...")
        ModernTextField(value = ville, onValueChange = { ville = it }, label = "City", placeholder = "Enter city")

        Spacer(modifier = Modifier.height(16.dp))
        ModernButton(text = "Create", onClick = { if (nomFr.isNotBlank() && telephone1.isNotBlank()) onCreate(EtablissementEntity(nomFr = nomFr, telephone1 = telephone1.toLongOrNull() ?: 0L, ville = ville)) })
        TextButton(onClick = onCancel, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text("Cancel", color = Color(0xFF9E9E9E)) }
    }
}

@Composable
fun CreateYearForm(onCreate: (String, String, String) -> Unit, onCancel: () -> Unit) {
    var libelle by remember { mutableStateOf("") }
    var start by remember { mutableStateOf("") }
    var end by remember { mutableStateOf("") }

    Column(
        modifier = Modifier.padding(24.dp).padding(bottom = 32.dp).fillMaxWidth().verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text("New School Year", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)

        ModernTextField(value = libelle, onValueChange = { libelle = it }, label = "Label *", placeholder = "e.g. 2024-2025")
        DatePickerField(label = "Start Date *", value = start) { start = it }
        DatePickerField(label = "End Date *", value = end) { end = it }

        Spacer(modifier = Modifier.height(16.dp))
        ModernButton(text = "Create Year", onClick = { if (libelle.isNotBlank() && start.isNotBlank()) onCreate(libelle, start, end) })
        TextButton(onClick = onCancel, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text("Cancel", color = Color(0xFF9E9E9E)) }
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

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 4.dp))
        Surface(
            onClick = { datePickerDialog.show() },
            shape = RoundedCornerShape(8.dp),
            border = BorderStroke(1.dp, Color(0xFF9E9E9E).copy(alpha = 0.2f)),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth().height(56.dp)
        ) {
            Row(modifier = Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(text = if (value.isEmpty()) "Select date" else value, color = if (value.isEmpty()) Color(0xFF9E9E9E) else Color.Black)
                Spacer(modifier = Modifier.weight(1f))
                Icon(Icons.Default.DateRange, null, tint = Color(0xFF9E9E9E))
            }
        }
    }
}
