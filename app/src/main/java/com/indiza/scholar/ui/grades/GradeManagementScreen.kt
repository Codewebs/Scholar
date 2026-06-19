package com.indiza.scholar.ui.grades

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.*
import com.indiza.scholar.ui.student.EleveUiModel

enum class GradeEntryMode { DECIMAL, ALPHABETIC }
enum class GradeView { MENU, ENTRY_BY_SUBJECT, ENTRY_BY_STUDENT, ABSENCES, PV, REPORT_SHEET }
enum class SelectionStep { SALLE, REPARTITION, SEQUENCE, STUDENT, TYPE_PV, CONTENT, COMPETENCE }

@Composable
fun SelectionBreadcrumbs(
    steps: List<Pair<String, String?>>,
    onStepClick: (SelectionStep) -> Unit
) {
    if (steps.isEmpty()) return
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50).copy(alpha = 0.8f)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            steps.forEachIndexed { index, (label, value) ->
                val stepEnum = when(label) {
                    "Salle" -> SelectionStep.SALLE
                    "Matière" -> SelectionStep.REPARTITION
                    "Séquence", "Évaluation" -> SelectionStep.SEQUENCE
                    "Élève" -> SelectionStep.STUDENT
                    "Type PV" -> SelectionStep.TYPE_PV
                    "Compétence" -> SelectionStep.COMPETENCE
                    else -> SelectionStep.CONTENT
                }
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = value != null) { onStepClick(stepEnum) }
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(label, color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(value ?: "À sélectionner...", color = if (value != null) Color.White else Color.Gray.copy(alpha = 0.5f), fontSize = 14.sp, fontWeight = FontWeight.Black)
                    }
                    if (value != null) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(16.dp))
                    }
                }
                if (index < steps.size - 1) {
                    HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                }
            }
        }
    }
}

@Composable
fun <T> SelectionList(
    title: String,
    items: List<T>,
    itemContent: @Composable (T) -> Unit,
    onItemClick: (T) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = Color.White,
            fontWeight = FontWeight.Black,
            modifier = Modifier.padding(vertical = 16.dp)
        )
        if (items.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Aucun élément disponible", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                itemsIndexed(items) { _, item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onItemClick(item) },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                    ) {
                        Box(modifier = Modifier.padding(16.dp)) {
                            itemContent(item)
                        }
                    }
                }
            }
        }
    }
}


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradeManagementScreen(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    onBack: () -> Unit,
    onGenerateReportSheet: (SalleEntity, RepartitionMatiereEntity?) -> Unit,
    onGeneratePV: (PvExportPayload, SalleEntity) -> Unit
) {
    var currentView by remember { mutableStateOf(GradeView.MENU) }
    
    // Global Selections
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedSequence by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    var selectedRepartition by remember { mutableStateOf<RepartitionMatiereEntity?>(null) }

    var showDiscardDialog by remember { mutableStateOf(false) }
    var pendingViewChange by remember { mutableStateOf<GradeView?>(null) }

    val sequences by viewModel.sequences.collectAsState()
    val repartitions by viewModel.repartitions.collectAsState()
    val justifications by viewModel.justifications.collectAsState()
    val sequenceRepartition by viewModel.sequenceRepartition.collectAsState()
    val currentCompetences by viewModel.currentCompetences.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()

    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("grade_settings", Context.MODE_PRIVATE) }
    
    var showModeSelection by remember { mutableStateOf(false) }
    var selectedEntryMode by remember { 
        mutableStateOf(GradeEntryMode.valueOf(prefs.getString("default_entry_mode", GradeEntryMode.DECIMAL.name) ?: GradeEntryMode.DECIMAL.name)) 
    }

    var showJustifConfig by remember { mutableStateOf(false) }
    var showConfigMenu by remember { mutableStateOf(false) }

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadInitialData(idAnneeScolaire)
    }

    val handleBack = {
        if (hasChanges) {
            showDiscardDialog = true
            pendingViewChange = GradeView.MENU
        } else {
            if (currentView == GradeView.MENU) {
                onBack()
            } else {
                currentView = GradeView.MENU
                selectedSalle = null
                selectedSequence = null
                selectedRepartition = null
                viewModel.clearGrades()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(when(currentView) {
                        GradeView.MENU -> "Gestion des Notes"
                        GradeView.ENTRY_BY_SUBJECT -> "Saisie par Matière"
                        GradeView.ENTRY_BY_STUDENT -> "Saisie par Élève"
                        GradeView.ABSENCES -> "Saisie des Absences"
                        GradeView.PV -> "Procès Verbaux"
                        GradeView.REPORT_SHEET -> "Fiche de Report"
                    }, color = Color.White) 
                },
                navigationIcon = {
                    IconButton(onClick = handleBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                actions = {
                    if (currentView == GradeView.MENU) {
                        IconButton(onClick = { showConfigMenu = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Config", tint = Color.White)
                        }
                        DropdownMenu(expanded = showConfigMenu, onDismissRequest = { showConfigMenu = false }) {
                            DropdownMenuItem(
                                text = { Text("Justifications d'absence") },
                                onClick = { showJustifConfig = true; showConfigMenu = false },
                                leadingIcon = { Icon(Icons.Default.Rule, null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Mode de saisie par défaut") },
                                onClick = { showModeSelection = true; showConfigMenu = false },
                                leadingIcon = { Icon(Icons.Default.Settings, null) }
                            )
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text("Configuration Bulletins") },
                                onClick = { /* TODO: Bulletin Config */ showConfigMenu = false },
                                leadingIcon = { Icon(Icons.Default.PictureAsPdf, null) }
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF2C3E50))
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize().background(Color(0xFF1E2A3A))) {
            when (currentView) {
                GradeView.MENU -> GradeMainMenu(
                    sequencesCount = sequences.size,
                    justificationsCount = justifications.size,
                    onNavigate = { 
                        currentView = it
                        selectedSalle = null
                        selectedSequence = null
                        selectedRepartition = null
                        viewModel.clearGrades()
                    }
                )
                GradeView.ENTRY_BY_SUBJECT -> GradeEntryBySubject(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    sequences = sequences,
                    repartitions = repartitions,
                    sequenceRepartition = sequenceRepartition,
                    justifications = justifications,
                    currentCompetences = currentCompetences,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    selectedRepartition = selectedRepartition,
                    entryMode = selectedEntryMode,
                    onFiltersChanged = { s, rep, seq ->
                        selectedSalle = s
                        selectedRepartition = rep
                        selectedSequence = seq
                    }
                )
                GradeView.ENTRY_BY_STUDENT -> GradeEntryByStudent(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    sequences = sequences,
                    sequenceRepartition = sequenceRepartition,
                    justifications = justifications,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    onFiltersChanged = { s, seq ->
                        selectedSalle = s
                        selectedSequence = seq
                    }
                )
                GradeView.ABSENCES -> AbsenceEntryScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    sequences = sequences,
                    sequenceRepartition = sequenceRepartition,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    onFiltersChanged = { s, seq ->
                        selectedSalle = s
                        selectedSequence = seq
                    }
                )
                GradeView.REPORT_SHEET -> ReportSheetScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    sequences = sequences,
                    repartitions = repartitions,
                    selectedSalle = selectedSalle,
                    selectedRepartition = selectedRepartition,
                    onFiltersChanged = { s, rep ->
                        selectedSalle = s
                        selectedRepartition = rep
                    },
                    onGeneratePdf = { salle, rep, seqIds ->
                        onGenerateReportSheet(salle, rep) 
                    }
                )
                GradeView.PV -> PVManagementScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    sequences = sequences,
                    sequenceRepartition = sequenceRepartition,
                    onGenerate = { payload, salle -> onGeneratePV(payload, salle) }
                )
            }
        }
    }

    if (showDiscardDialog) {
        AlertDialog(
            onDismissRequest = { showDiscardDialog = false },
            title = { Text("Changements non enregistrés") },
            text = { Text("Les données non enregistrées seront perdues. Voulez-vous continuer ?") },
            confirmButton = {
                TextButton(onClick = {
                    showDiscardDialog = false
                    viewModel.clearChanges()
                    if (pendingViewChange != null) {
                        currentView = pendingViewChange!!
                        pendingViewChange = null
                    } else {
                        viewModel.clearGrades()
                    }
                }) { Text("Oui, abandonner") }
            },
            dismissButton = {
                TextButton(onClick = { showDiscardDialog = false }) { Text("Annuler") }
            }
        )
    }

    if (showModeSelection) {
        ModalBottomSheet(onDismissRequest = { showModeSelection = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Paramétrer le mode de saisie", style = MaterialTheme.typography.titleLarge)
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { 
                        selectedEntryMode = GradeEntryMode.DECIMAL
                        prefs.edit().putString("default_entry_mode", GradeEntryMode.DECIMAL.name).apply()
                        showModeSelection = false 
                    }.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = selectedEntryMode == GradeEntryMode.DECIMAL, onClick = null)
                    Text("Notation Décimale (ex: 14.5)", modifier = Modifier.padding(start = 16.dp))
                }
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { 
                        selectedEntryMode = GradeEntryMode.ALPHABETIC
                        prefs.edit().putString("default_entry_mode", GradeEntryMode.ALPHABETIC.name).apply()
                        showModeSelection = false 
                    }.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = selectedEntryMode == GradeEntryMode.ALPHABETIC, onClick = null)
                    Text("Notation Alphabétique (Cotation: A+, B, etc.)", modifier = Modifier.padding(start = 16.dp))
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    if (showJustifConfig) {
        JustificationManagementDialog(
            justifications = justifications,
            onDismiss = { showJustifConfig = false },
            onSave = { viewModel.saveJustification(it) },
            onDelete = { viewModel.deleteJustification(it) }
        )
    }
}

@Composable
fun GradeMainMenu(sequencesCount: Int, justificationsCount: Int, onNavigate: (GradeView) -> Unit) {
    val isReady = sequencesCount > 0
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        if (!isReady) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Red.copy(alpha = 0.1f)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Configuration requise :", color = Color.Red, fontWeight = FontWeight.Bold)
                    if (sequencesCount == 0) Text("• Aucune séquence enregistrée", color = Color.White, fontSize = 12.sp)
                }
            }
        }

        MenuCard("📝", "Saisie par Matière", "Saisie collective par classe/matière", enabled = isReady, onClick = { onNavigate(GradeView.ENTRY_BY_SUBJECT) })
        MenuCard("👤", "Saisie par Élève", "Saisie individuelle des notes", enabled = isReady, onClick = { onNavigate(GradeView.ENTRY_BY_STUDENT) })
        MenuCard("📄", "Fiche de Report", "Grilles papier pour les enseignants", onClick = { onNavigate(GradeView.REPORT_SHEET) })
        MenuCard("⏰", "Saisie des Absences", "Volume horaire (AJ / ANJ)", enabled = isReady, onClick = { onNavigate(GradeView.ABSENCES) })
        MenuCard("🏆", "Procès Verbaux (PV)", "Consultation et gel des résultats", onClick = { onNavigate(GradeView.PV) })
        MenuCard("⚙️", "Configuration Bulletins", "Paramètres du cockpit d'impression", onClick = { /* TODO: Bulletin Config */ })
    }
}

@Composable
fun MenuCard(icon: String, title: String, desc: String, enabled: Boolean = true, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(enabled = enabled) { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (enabled) Color(0xFF2C3E50) else Color(0xFF2C3E50).copy(alpha = 0.5f)
        )
    ) {
        Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(icon, fontSize = 32.sp, modifier = Modifier.alpha(if (enabled) 1f else 0.5f))
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, color = if (enabled) Color.White else Color.Gray)
                Text(desc, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            }
        }
    }
}

@Composable
fun GradeEntryBySubject(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    sequences: List<SousPeriodeEntity>,
    repartitions: List<RepartitionMatiereEntity>,
    sequenceRepartition: List<RepartitionSousPeriodeEntity>,
    justifications: List<JustificationEntity>,
    currentCompetences: List<RepartitionCompetenceEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    selectedRepartition: RepartitionMatiereEntity?,
    entryMode: GradeEntryMode,
    onFiltersChanged: (SalleEntity?, RepartitionMatiereEntity?, SousPeriodeEntity?) -> Unit
) {
    val salles by viewModel.salles.collectAsState()
    val notes by viewModel.notes.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()
    val salleProgress by viewModel.salleProgress.collectAsState()
    val matiereProgress by viewModel.matiereProgress.collectAsState()

    var selectedCompetence by remember { mutableStateOf<RepartitionCompetenceEntity?>(null) }
    var currentStep by remember { mutableStateOf(SelectionStep.SALLE) }
    var showBulkActions by remember { mutableStateOf(false) }
    var showSequentialEntry by remember { mutableStateOf(false) }
    var currentSequentialIndex by remember { mutableIntStateOf(0) }
    var currentCompIndex by remember { mutableIntStateOf(0) }

    val filteredSequences = remember(selectedSalle, sequences, sequenceRepartition) {
        if (selectedSalle == null) emptyList()
        else {
            val allowedIds = sequenceRepartition
                .filter { it.idClasse == selectedSalle?.idClasseServeur && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            if (allowedIds.isEmpty()) sequences
            else sequences.filter { it.idServeur in allowedIds }
        }
    }

    LaunchedEffect(selectedSalle, selectedRepartition, selectedSequence, selectedCompetence) {
        if (selectedSalle == null) {
            currentStep = SelectionStep.SALLE
            selectedCompetence = null
        }
        else if (selectedRepartition == null) {
            currentStep = SelectionStep.REPARTITION
            selectedCompetence = null
        }
        else if (selectedSequence == null) {
            currentStep = SelectionStep.SEQUENCE
            selectedCompetence = null
        }
        else if (currentCompetences.isNotEmpty() && selectedCompetence == null) {
            currentStep = SelectionStep.COMPETENCE
        }
        else {
            currentStep = SelectionStep.CONTENT
            viewModel.loadNotes(
                selectedSalle.idServeur ?: 0L,
                selectedRepartition.idRepartitionMatiere,
                selectedSequence.idServeur ?: 0L,
                idAnneeScolaire
            )
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SelectionBreadcrumbs(
            steps = listOf(
                "Salle" to selectedSalle?.nomSalle,
                "Matière" to selectedRepartition?.detailsMatiere?.libelleFr,
                "Évaluation" to selectedSequence?.libelleSousPeriodeFr,
                "Compétence" to selectedCompetence?.detailsCompetence?.libelle
            ),
            onStepClick = { step ->
                when (step) {
                    SelectionStep.SALLE -> onFiltersChanged(null, null, null)
                    SelectionStep.REPARTITION -> onFiltersChanged(selectedSalle, null, null)
                    SelectionStep.SEQUENCE -> onFiltersChanged(selectedSalle, selectedRepartition, null)
                    SelectionStep.COMPETENCE -> { selectedCompetence = null }
                    else -> {}
                }
            }
        )

        when (currentStep) {
            SelectionStep.SALLE -> {
                SelectionList(
                    title = "Choisir une Salle",
                    items = salles,
                    itemContent = { salle ->
                        Column {
                            Text(salle.nomSalle, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { salle ->
                        onFiltersChanged(salle, null, null)
                        salle.idClasseServeur?.let { viewModel.loadRepartitions(idAnneeScolaire, it, salle.idServeur, null) }
                    }
                )
            }
            SelectionStep.REPARTITION -> {
                SelectionList(
                    title = "Choisir une Matière",
                    items = repartitions,
                    itemContent = { rep ->
                        Column {
                            Text(rep.detailsMatiere?.libelleFr ?: "Matière", color = Color.White, fontWeight = FontWeight.Bold)
                            Text("Coefficient: ${rep.coef}", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { rep ->
                        onFiltersChanged(selectedSalle, rep, null)
                    }
                )
            }
            SelectionStep.SEQUENCE -> {
                SelectionList(
                    title = "Choisir une Évaluation",
                    items = filteredSequences,
                    itemContent = { seq ->
                        Text(seq.libelleSousPeriodeFr, color = Color.White, fontWeight = FontWeight.Bold)
                    },
                    onItemClick = { seq ->
                        onFiltersChanged(selectedSalle, selectedRepartition, seq)
                        viewModel.loadSalleProgress(selectedSalle?.idServeur ?: 0L, seq.idServeur ?: 0L, idAnneeScolaire)
                        viewModel.loadMatiereProgress(selectedSalle?.idServeur ?: 0L, selectedRepartition?.idRepartitionMatiere ?: 0L, seq.idServeur ?: 0L, idAnneeScolaire)
                        viewModel.loadCompetences(selectedRepartition?.idRepartitionMatiere ?: 0L, seq.idServeur ?: 0L)
                    }
                )
            }
            SelectionStep.COMPETENCE -> {
                SelectionList(
                    title = "Choisir une Compétence",
                    items = currentCompetences,
                    itemContent = { comp ->
                        Text(comp.detailsCompetence?.libelle ?: "Compétence", color = Color.White, fontWeight = FontWeight.Bold)
                    },
                    onItemClick = { comp ->
                        selectedCompetence = comp
                    }
                )
            }
            SelectionStep.CONTENT -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    if (selectedSequence != null) {
                        GradeProgressBar(label = "Progression Salle", progress = salleProgress)
                        if (selectedRepartition != null) {
                            GradeProgressBar(label = "Progression Matière", progress = matiereProgress)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Mode: ${if (entryMode == GradeEntryMode.DECIMAL) "Décimal" else "Cotation"}", color = Color.White)
                        Row {
                            IconButton(onClick = { 
                                if (notes.isNotEmpty()) {
                                    currentSequentialIndex = 0
                                    currentCompIndex = 0
                                    showSequentialEntry = true
                                }
                            }) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Saisie Rapide", tint = Color.White)
                            }
                            IconButton(onClick = { showBulkActions = true }) {
                                Icon(Icons.Default.Bolt, contentDescription = "Actions de masse", tint = Color.White)
                            }
                        }
                    }

                    if (notes.isNotEmpty()) {
                        val missingByStudent = remember(notes, currentCompetences) {
                            notes.groupBy { it.idInscription }.mapValues { (id, studentNotes) ->
                                if (currentCompetences.isEmpty()) emptyList()
                                else currentCompetences.filter { c ->
                                    !studentNotes.any { n -> n.idCompetence == c.idCompetence && n.note != null }
                                }.map { it.detailsCompetence?.libelle?.take(3)?.uppercase() ?: "???" }
                            }
                        }

                        LazyColumn(modifier = Modifier.weight(1f).padding(horizontal = 8.dp)) {
                            itemsIndexed(notes) { index, note ->
                                GradeItemRow(
                                    note = note,
                                    mode = entryMode,
                                    justifications = justifications,
                                    isSelected = showSequentialEntry && currentSequentialIndex == index,
                                    noteSur = selectedRepartition?.noteSur ?: 20,
                                    missingCompetencies = missingByStudent[note.idInscription] ?: emptyList(),
                                    onNoteChange = { n, c -> 
                                        viewModel.updateNoteLocally(
                                            index = index, 
                                            newNote = n, 
                                            newCote = c,
                                            idComp = selectedCompetence?.idCompetence,
                                            idRepComp = selectedCompetence?.id
                                        ) 
                                    },
                                    onStatusChange = { nonClasse, idJustif ->
                                        viewModel.updateStatusLocally(
                                            index = index, 
                                            nonClasse = nonClasse, 
                                            idJustif = idJustif,
                                            idComp = selectedCompetence?.idCompetence,
                                            idRepComp = selectedCompetence?.id
                                        )
                                    },
                                    onClick = {
                                        currentSequentialIndex = index
                                        showSequentialEntry = true
                                    }
                                )
                            }
                        }

                        Button(
                            onClick = {
                                if (selectedRepartition != null && selectedSequence != null) {
                                    viewModel.saveNotes(
                                        selectedRepartition.idRepartitionMatiere,
                                        selectedSequence.idServeur ?: 0L,
                                        idAnneeScolaire,
                                        entryMode.name
                                    ) { }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            enabled = hasChanges,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                        ) {
                            Text(if (hasChanges) "Enregistrer les modifications" else "Données à jour")
                        }
                    } else if (viewModel.isLoading.collectAsState().value) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C))
                        }
                    }
                }
            }
            else -> {}
        }
    }

    if (showSequentialEntry && notes.indices.contains(currentSequentialIndex)) {
        val isMultiComp = currentCompetences.size > 1
        var isFading by remember { mutableStateOf(false) }

        AnimatedVisibility(
            visible = !isFading,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            SequentialEntryModal(
                note = notes[currentSequentialIndex],
                mode = entryMode,
                noteSur = selectedRepartition?.noteSur ?: 20,
                competences = currentCompetences,
                currentCompIndex = currentCompIndex,
                isLast = currentSequentialIndex == notes.size - 1 && currentCompIndex == (if (isMultiComp) currentCompetences.size - 1 else 0),
                onDismiss = { showSequentialEntry = false },
                onNext = { n, c, nc ->
                    val comp = currentCompetences.getOrNull(currentCompIndex)
                    viewModel.updateNoteLocally(
                        index = currentSequentialIndex, 
                        newNote = n, 
                        newCote = c,
                        idComp = comp?.idCompetence,
                        idRepComp = comp?.id
                    )
                    viewModel.updateStatusLocally(
                        index = currentSequentialIndex, 
                        nonClasse = nc, 
                        idJustif = null,
                        idComp = comp?.idCompetence,
                        idRepComp = comp?.id
                    )
                    
                    if (isMultiComp && currentCompIndex < currentCompetences.size - 1) {
                        isFading = true
                        currentCompIndex++
                        isFading = false
                    } else {
                        if (currentSequentialIndex < notes.size - 1) {
                            isFading = true
                            currentSequentialIndex++
                            currentCompIndex = 0
                            isFading = false
                        } else {
                            showSequentialEntry = false
                        }
                    }
                }
            )
        }
    }

    if (showBulkActions) {
        BulkActionsBottomSheet(
            onDismiss = { showBulkActions = false },
            justifications = justifications,
            onAction = { action, value, idJustif ->
                if (selectedRepartition != null && selectedSequence != null) {
                    viewModel.applyBulkAction(
                        action,
                        notes.map { it.idInscription },
                        selectedRepartition.idRepartitionMatiere,
                        selectedSequence.idServeur ?: 0L,
                        idAnneeScolaire,
                        value,
                        idJustif
                    )
                }
                showBulkActions = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GradeEntryByStudent(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    sequences: List<SousPeriodeEntity>,
    sequenceRepartition: List<RepartitionSousPeriodeEntity>,
    justifications: List<JustificationEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    onFiltersChanged: (SalleEntity?, SousPeriodeEntity?) -> Unit
) {
    val salles by viewModel.salles.collectAsState()
    val students by viewModel.salleStudents.collectAsState()
    val studentNotes by viewModel.studentNotes.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()
    val salleProgress by viewModel.salleProgress.collectAsState()
    val studentProgress by viewModel.studentProgress.collectAsState()

    var currentStep by remember { mutableStateOf(SelectionStep.SALLE) }
    var selectedStudent by remember { mutableStateOf<EleveUiModel?>(null) }
    var entryMode by remember { mutableStateOf(GradeEntryMode.DECIMAL) }

    var showSequentialEntry by remember { mutableStateOf(false) }
    var currentSequentialIndex by remember { mutableIntStateOf(0) }

    val filteredSequences = remember(selectedSalle, sequences, sequenceRepartition) {
        if (selectedSalle == null) emptyList()
        else {
            val allowedIds = sequenceRepartition
                .filter { it.idClasse == selectedSalle?.idClasseServeur && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            if (allowedIds.isEmpty()) sequences
            else sequences.filter { it.idServeur in allowedIds }
        }
    }

    LaunchedEffect(selectedSalle, selectedStudent, selectedSequence) {
        if (selectedSalle == null) currentStep = SelectionStep.SALLE
        else if (selectedStudent == null) currentStep = SelectionStep.STUDENT
        else if (selectedSequence == null) currentStep = SelectionStep.SEQUENCE
        else {
            currentStep = SelectionStep.CONTENT
            viewModel.loadNotesByStudent(
                selectedStudent!!.idInscription,
                selectedSequence.idServeur ?: 0L,
                idAnneeScolaire,
                selectedSalle.idClasseServeur ?: 0L
            )
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SelectionBreadcrumbs(
            steps = listOf(
                "Salle" to selectedSalle?.nomSalle,
                "Élève" to selectedStudent?.nomComplet,
                "Évaluation" to selectedSequence?.libelleSousPeriodeFr
            ),
            onStepClick = { step ->
                when (step) {
                    SelectionStep.SALLE -> {
                        onFiltersChanged(null, null)
                        selectedStudent = null
                    }
                    SelectionStep.STUDENT -> {
                        onFiltersChanged(selectedSalle, null)
                        selectedStudent = null
                    }
                    SelectionStep.SEQUENCE -> {
                        onFiltersChanged(selectedSalle, null)
                    }
                    else -> {}
                }
            }
        )

        when (currentStep) {
            SelectionStep.SALLE -> {
                SelectionList(
                    title = "Choisir une Salle",
                    items = salles,
                    itemContent = { salle ->
                        Column {
                            Text(salle.nomSalle, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { salle ->
                        onFiltersChanged(salle, null)
                        viewModel.loadStudentsBySalle(idAnneeScolaire, salle.idServeur ?: 0L, null)
                    }
                )
            }
            SelectionStep.STUDENT -> {
                SelectionList(
                    title = "Choisir un Élève",
                    items = students,
                    itemContent = { student ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(student.nomComplet, color = Color.White, fontWeight = FontWeight.Bold)
                                Text(student.matricule, color = Color.Gray, fontSize = 11.sp)
                            }
                            if (student.matiereNotees < student.totalMatieres) {
                                Box(modifier = Modifier.size(8.dp).background(Color.Red, CircleShape))
                            }
                        }
                    },
                    onItemClick = { student ->
                        selectedStudent = student
                    }
                )
            }
            SelectionStep.SEQUENCE -> {
                SelectionList(
                    title = "Choisir une Évaluation",
                    items = filteredSequences,
                    itemContent = { seq ->
                        Text(seq.libelleSousPeriodeFr, color = Color.White, fontWeight = FontWeight.Bold)
                    },
                    onItemClick = { seq ->
                        onFiltersChanged(selectedSalle, seq)
                        viewModel.loadSalleProgress(selectedSalle?.idServeur ?: 0L, seq.idServeur ?: 0L, idAnneeScolaire)
                    }
                )
            }
            SelectionStep.CONTENT -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    if (selectedSequence != null) {
                        GradeProgressBar(label = "Progression Salle", progress = salleProgress)
                    }

                    if (studentNotes.isNotEmpty()) {
                        StudentGradesContent(
                            student = selectedStudent!!,
                            notes = studentNotes,
                            mode = entryMode,
                            justifications = justifications,
                            hasChanges = hasChanges,
                            progress = studentProgress,
                            currentSequentialIndex = currentSequentialIndex,
                            showSequentialEntry = showSequentialEntry,
                            onNoteChange = { idx, n, c -> viewModel.updateStudentNoteLocally(idx, n, c) },
                            onStatusChange = { idx, nc, idJ -> viewModel.updateStudentStatusLocally(idx, nc, idJ) },
                            onShowSequentialEntryChange = { showSequentialEntry = it },
                            onCurrentSequentialIndexChange = { currentSequentialIndex = it },
                            onSave = {
                                if (selectedSequence != null) {
                                    viewModel.saveStudentNotes(
                                        selectedStudent!!.idInscription,
                                        selectedSequence.idServeur ?: 0L,
                                        idAnneeScolaire,
                                        entryMode.name
                                    ) { }
                                }
                            }
                        )
                    } else if (viewModel.isLoading.collectAsState().value) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C))
                        }
                    }
                }
            }
            else -> {}
        }
    }

    if (showSequentialEntry && studentNotes.indices.contains(currentSequentialIndex)) {
        SequentialEntryModalStudent(
            studentNote = studentNotes[currentSequentialIndex],
            mode = entryMode,
            isLast = currentSequentialIndex == studentNotes.size - 1,
            onDismiss = { showSequentialEntry = false },
            onNext = { n, c, nc ->
                viewModel.updateStudentNoteLocally(currentSequentialIndex, n, c)
                viewModel.updateStudentStatusLocally(currentSequentialIndex, nc, null)
                if (currentSequentialIndex < studentNotes.size - 1) {
                    currentSequentialIndex++
                } else {
                    showSequentialEntry = false
                }
            }
        )
    }
}

@Composable
fun AbsenceEntryScreen(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    sequences: List<SousPeriodeEntity>,
    sequenceRepartition: List<RepartitionSousPeriodeEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    onFiltersChanged: (SalleEntity?, SousPeriodeEntity?) -> Unit
) {
    val salles by viewModel.salles.collectAsState()
    val absences by viewModel.absences.collectAsState()
    var currentStep by remember { mutableStateOf(SelectionStep.SALLE) }

    val filteredSequences = remember(selectedSalle, sequences, sequenceRepartition) {
        if (selectedSalle == null) emptyList()
        else {
            val allowedIds = sequenceRepartition
                .filter { it.idClasse == selectedSalle?.idClasseServeur && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            if (allowedIds.isEmpty()) sequences
            else sequences.filter { it.idServeur in allowedIds }
        }
    }

    LaunchedEffect(selectedSalle, selectedSequence) {
        if (selectedSalle == null) currentStep = SelectionStep.SALLE
        else if (selectedSequence == null) currentStep = SelectionStep.SEQUENCE
        else {
            currentStep = SelectionStep.CONTENT
            viewModel.loadAbsences(
                selectedSalle.idServeur ?: 0L,
                selectedSequence.idServeur ?: 0L,
                idAnneeScolaire
            )
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SelectionBreadcrumbs(
            steps = listOf(
                "Salle" to selectedSalle?.nomSalle,
                "Évaluation" to selectedSequence?.libelleSousPeriodeFr
            ),
            onStepClick = { step ->
                when (step) {
                    SelectionStep.SALLE -> onFiltersChanged(null, null)
                    SelectionStep.SEQUENCE -> onFiltersChanged(selectedSalle, null)
                    else -> {}
                }
            }
        )

        when (currentStep) {
            SelectionStep.SALLE -> {
                SelectionList(
                    title = "Absences - Choisir une Salle",
                    items = salles,
                    itemContent = { salle ->
                        Column {
                            Text(salle.nomSalle, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { onFiltersChanged(it, null) }
                )
            }
            SelectionStep.SEQUENCE -> {
                SelectionList(
                    title = "Absences - Choisir une Évaluation",
                    items = filteredSequences,
                    itemContent = { seq ->
                        Text(seq.libelleSousPeriodeFr, color = Color.White, fontWeight = FontWeight.Bold)
                    },
                    onItemClick = { onFiltersChanged(selectedSalle, it) }
                )
            }
            SelectionStep.CONTENT -> {
                Column(modifier = Modifier.fillMaxSize()) {
                    if (absences.isNotEmpty()) {
                        LazyColumn(modifier = Modifier.weight(1f).padding(8.dp)) {
                            itemsIndexed(absences) { index, abs ->
                                AbsenceItemRow(
                                    absence = abs,
                                    onChanged = { aj, anj -> viewModel.updateAbsenceLocally(index, aj, anj) }
                                )
                            }
                        }

                        Button(
                            onClick = {
                                if (selectedSequence != null) {
                                    viewModel.saveAbsences(selectedSequence.idServeur ?: 0L, idAnneeScolaire) { }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().padding(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                        ) {
                            Text("Enregistrer les absences")
                        }
                    } else if (viewModel.isLoading.collectAsState().value) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = Color(0xFF1ABC9C))
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportSheetScreen(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    sequences: List<SousPeriodeEntity>,
    repartitions: List<RepartitionMatiereEntity>,
    selectedSalle: SalleEntity?,
    selectedRepartition: RepartitionMatiereEntity?,
    onFiltersChanged: (SalleEntity?, RepartitionMatiereEntity?) -> Unit,
    onGeneratePdf: (SalleEntity, RepartitionMatiereEntity?, List<Long>) -> Unit
) {
    val salles by viewModel.salles.collectAsState()
    var selectedSequences by remember { mutableStateOf<List<Long>>(emptyList()) }
    var currentStep by remember { mutableStateOf(SelectionStep.SALLE) }

    LaunchedEffect(selectedSalle, selectedRepartition) {
        if (selectedSalle == null) currentStep = SelectionStep.SALLE
        else if (selectedRepartition == null) currentStep = SelectionStep.REPARTITION
        else currentStep = SelectionStep.CONTENT
    }

    Column(modifier = Modifier.fillMaxSize()) {
        SelectionBreadcrumbs(
            steps = listOf(
                "Salle" to selectedSalle?.nomSalle,
                "Matière" to (selectedRepartition?.detailsMatiere?.libelleFr ?: if (selectedSalle != null) "Toutes les matières" else null)
            ),
            onStepClick = { step ->
                when (step) {
                    SelectionStep.SALLE -> onFiltersChanged(null, null)
                    SelectionStep.REPARTITION -> onFiltersChanged(selectedSalle, null)
                    else -> {}
                }
            }
        )

        when (currentStep) {
            SelectionStep.SALLE -> {
                SelectionList(
                    title = "Fiche de Report - Choisir Salle",
                    items = salles,
                    itemContent = { salle ->
                        Column {
                            Text(salle.nomSalle, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { salle ->
                        onFiltersChanged(salle, null)
                        salle.idClasseServeur?.let { viewModel.loadRepartitions(idAnneeScolaire, it, salle.idServeur, null) }
                    }
                )
            }
            SelectionStep.REPARTITION -> {
                SelectionList(
                    title = "Choisir une Matière",
                    items = listOf(null) + repartitions,
                    itemContent = { rep ->
                        Text(rep?.detailsMatiere?.libelleFr ?: "Toutes les matières", color = Color.White, fontWeight = FontWeight.Bold)
                    },
                    onItemClick = { rep ->
                        onFiltersChanged(selectedSalle, rep)
                    }
                )
            }
            SelectionStep.CONTENT -> {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("Séquences (Sous-périodes)", color = Color.White, style = MaterialTheme.typography.titleMedium)
                    LazyColumn(modifier = Modifier.weight(1f)) {
                        itemsIndexed(sequences) { _, seq ->
                            Row(
                                modifier = Modifier.fillMaxWidth().clickable {
                                    val id = seq.idServeur ?: 0L
                                    selectedSequences = if (selectedSequences.contains(id)) selectedSequences - id else selectedSequences + id
                                }.padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(checked = selectedSequences.contains(seq.idServeur ?: 0L), onCheckedChange = {
                                    val id = seq.idServeur ?: 0L
                                    selectedSequences = if (it) selectedSequences + id else selectedSequences - id
                                })
                                Text(seq.libelleSousPeriodeFr, color = Color.White)
                            }
                        }
                    }

                    Button(
                        onClick = { if(selectedSalle != null) onGeneratePdf(selectedSalle, selectedRepartition, selectedSequences) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedSalle != null && selectedSequences.isNotEmpty(),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                    ) {
                        Icon(Icons.Default.PictureAsPdf, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Générer le PDF")
                    }
                }
            }
            else -> {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PVManagementScreen(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    sequences: List<SousPeriodeEntity>,
    sequenceRepartition: List<RepartitionSousPeriodeEntity>,
    onGenerate: (PvExportPayload, SalleEntity) -> Unit
) {
    val salles by viewModel.salles.collectAsState()
    var selectedType by remember { mutableStateOf<String?>(null) }
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedSequence by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    var currentStep by remember { mutableStateOf(SelectionStep.TYPE_PV) }

    val filteredSequences = remember(selectedSalle, sequences, sequenceRepartition) {
        if (selectedSalle == null) emptyList()
        else {
            val allowedIds = sequenceRepartition
                .filter { it.idClasse == selectedSalle?.idClasseServeur && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            if (allowedIds.isEmpty()) sequences
            else sequences.filter { it.idServeur in allowedIds }
        }
    }

    LaunchedEffect(selectedType, selectedSalle, selectedSequence) {
        if (selectedType == null) currentStep = SelectionStep.TYPE_PV
        else if (selectedSalle == null) currentStep = SelectionStep.SALLE
        else if (selectedType == "Séquentiel" && selectedSequence == null) currentStep = SelectionStep.SEQUENCE
        else currentStep = SelectionStep.CONTENT
    }

    var showExportOptions by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        SelectionBreadcrumbs(
            steps = listOf(
                "Type PV" to selectedType,
                "Salle" to selectedSalle?.nomSalle,
                "Séquence" to selectedSequence?.libelleSousPeriodeFr
            ),
            onStepClick = { step ->
                when (step) {
                    SelectionStep.TYPE_PV -> { selectedType = null; selectedSalle = null; selectedSequence = null }
                    SelectionStep.SALLE -> { selectedSalle = null; selectedSequence = null }
                    SelectionStep.SEQUENCE -> { selectedSequence = null }
                    else -> {}
                }
            }
        )

        when (currentStep) {
            SelectionStep.TYPE_PV -> {
                SelectionList(
                    title = "Type de Procès Verbal",
                    items = listOf("Séquentiel", "Trimestriel", "Annuel"),
                    itemContent = { Text(it, color = Color.White, fontWeight = FontWeight.Bold) },
                    onItemClick = { selectedType = it }
                )
            }
            SelectionStep.SALLE -> {
                SelectionList(
                    title = "Générer PV - Choisir Salle",
                    items = salles,
                    itemContent = { salle ->
                        Column {
                            Text(salle.nomSalle, color = Color.White, fontWeight = FontWeight.Bold)
                            Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                        }
                    },
                    onItemClick = { selectedSalle = it }
                )
            }
            SelectionStep.SEQUENCE -> {
                SelectionList(
                    title = "Générer PV - Évaluation",
                    items = filteredSequences,
                    itemContent = { Text(it.libelleSousPeriodeFr, color = Color.White, fontWeight = FontWeight.Bold) },
                    onItemClick = { selectedSequence = it }
                )
            }
            SelectionStep.CONTENT -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Button(
                        onClick = { showExportOptions = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                    ) {
                        Icon(Icons.Default.Assessment, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Configurer l'export")
                    }
                }
            }
            else -> {}
        }
    }

    if (showExportOptions && selectedSalle != null) {
        ModalBottomSheet(onDismissRequest = { showExportOptions = false }) {
            Column(
                modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Options de génération du PV", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                
                Card(
                    onClick = {
                        showExportOptions = false
                        onGenerate(
                            PvExportPayload(
                                idSalle = selectedSalle!!.idServeur ?: 0L,
                                idSequence = selectedSequence?.idServeur ?: 0L,
                                idAnneeScolaire = idAnneeScolaire,
                                anneeScolaire = "", 
                                exportType = PdfExportType.SIMPLE
                            ),
                            selectedSalle!!
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    ListItem(
                        headlineContent = { Text("Option 1 : PV Simple") },
                        supportingContent = { Text("Grille de notes pure, sans statistiques de bas de page") },
                        leadingContent = { Icon(Icons.Default.TableChart, null) }
                    )
                }

                Card(
                    onClick = {
                        showExportOptions = false
                        onGenerate(
                            PvExportPayload(
                                idSalle = selectedSalle!!.idServeur ?: 0L,
                                idSequence = selectedSequence?.idServeur ?: 0L,
                                idAnneeScolaire = idAnneeScolaire,
                                anneeScolaire = "",
                                exportType = PdfExportType.COMPLET
                            ),
                            selectedSalle!!
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    ListItem(
                        headlineContent = { Text("Option 2 : PV Complet") },
                        supportingContent = { Text("Grille de notes + Bloc complet des statistiques") },
                        leadingContent = { Icon(Icons.Default.Analytics, null) }
                    )
                }
            }
        }
    }
}

@Composable
fun StudentListRow(student: EleveUiModel, onSelect: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { onSelect() },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF34495E))
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(student.nomComplet, color = Color.White, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(student.matricule, color = Color.Gray, fontSize = 11.sp)
                    if (student.matiereNotees < student.totalMatieres) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.size(6.dp).background(Color.Red, CircleShape))
                    }
                }
            }
            Text("${student.matiereNotees}/${student.totalMatieres}", color = Color.White, fontSize = 12.sp)
            Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF1ABC9C))
        }
    }
}

@Composable
fun StudentGradesContent(
    student: EleveUiModel,
    notes: List<StudentNoteUiModel>,
    mode: GradeEntryMode,
    justifications: List<JustificationEntity>,
    hasChanges: Boolean,
    progress: ProgressUiModel?,
    currentSequentialIndex: Int,
    showSequentialEntry: Boolean,
    onNoteChange: (Int, Double?, String?) -> Unit,
    onStatusChange: (Int, Boolean, Long?) -> Unit,
    onShowSequentialEntryChange: (Boolean) -> Unit,
    onCurrentSequentialIndexChange: (Int) -> Unit,
    onSave: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(student.nomComplet, style = MaterialTheme.typography.headlineSmall, color = Color.White, fontWeight = FontWeight.Black)
        GradeProgressBar(label = "Progression individuelle", progress = progress)
        
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Notes par matière", color = Color.Gray, style = MaterialTheme.typography.labelLarge)
            IconButton(onClick = {
                if (notes.isNotEmpty()) {
                    onCurrentSequentialIndexChange(0)
                    onShowSequentialEntryChange(true)
                }
            }) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Saisie Rapide", tint = Color.White)
            }
        }

        LazyColumn(modifier = Modifier.weight(1f)) {
            itemsIndexed(notes) { index, sn ->
                StudentGradeItemRow(
                    studentNote = sn,
                    mode = mode,
                    justifications = justifications,
                    isSelected = showSequentialEntry && currentSequentialIndex == index,
                    onNoteChange = { n, c -> onNoteChange(index, n, c) },
                    onStatusChange = { nc, idJ -> onStatusChange(index, nc, idJ) },
                    onClick = {
                        onCurrentSequentialIndexChange(index)
                        onShowSequentialEntryChange(true)
                    }
                )
            }
        }
        
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            enabled = hasChanges,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Enregistrer les notes")
        }
    }
}

@Composable
fun StudentGradeItemRow(
    studentNote: StudentNoteUiModel,
    mode: GradeEntryMode,
    justifications: List<JustificationEntity>,
    isSelected: Boolean = false,
    onNoteChange: (Double?, String?) -> Unit,
    onStatusChange: (Boolean, Long?) -> Unit,
    onClick: () -> Unit = {}
) {
    var showJustifDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = when {
                isSelected -> Color(0xFF1ABC9C).copy(alpha = 0.4f)
                studentNote.nonClasse -> Color(0xFFC0392B).copy(alpha = 0.3f)
                else -> Color(0xFF34495E)
            }
        ),
        border = if (isSelected) BorderStroke(1.dp, Color(0xFF1ABC9C)) else null
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(studentNote.matiereLabel, color = Color.White, fontWeight = FontWeight.Medium)
                Text("Coef: ${studentNote.coef} | Sur: ${studentNote.noteSur}", color = Color.Gray, fontSize = 10.sp)
                if (studentNote.nonClasse) {
                    val justif = justifications.find { it.idServeur == studentNote.idJustification }
                    Text("N.C : ${justif?.libelleJustificationFr ?: "Sans motif"}", color = Color.Red, fontSize = 10.sp)
                }
            }

            if (!studentNote.nonClasse) {
                if (mode == GradeEntryMode.DECIMAL) {
                    val textColor = if ((studentNote.note ?: 0.0) < 10.0) Color.Red else Color.White
                    OutlinedTextField(
                        value = studentNote.note?.toString() ?: "",
                        onValueChange = { 
                            val v = it.toDoubleOrNull()
                            if (v == null || v <= studentNote.noteSur) onNoteChange(v, null)
                        },
                        modifier = Modifier.width(70.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = textColor, unfocusedTextColor = textColor),
                        label = { Text("/${studentNote.noteSur}", fontSize = 8.sp) }
                    )
                } else {
                    CotationSelector(selectedCote = studentNote.cote, onCoteSelected = { onNoteChange(null, it) })
                }
            }

            IconButton(onClick = { 
                if (!studentNote.nonClasse) showJustifDialog = true else onStatusChange(false, null)
            }) {
                Icon(if (studentNote.nonClasse) Icons.Default.Block else Icons.Default.CheckCircleOutline, 
                     contentDescription = null, 
                     tint = if (studentNote.nonClasse) Color.Red else Color.Gray)
            }
        }
    }

    if (showJustifDialog) {
        AlertDialog(
            onDismissRequest = { showJustifDialog = false },
            title = { Text("Motif de l'absence") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    justifications.forEach { justif ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { onStatusChange(true, justif.idServeur); showJustifDialog = false }.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = studentNote.idJustification == justif.idServeur, onClick = null)
                            Text(justif.libelleJustificationFr, modifier = Modifier.padding(start = 8.dp))
                        }
                    }
                }
            },
            confirmButton = {}
        )
    }
}

@Composable
fun GradeItemRow(
    note: NoteUiModel,
    mode: GradeEntryMode,
    justifications: List<JustificationEntity>,
    isSelected: Boolean = false,
    noteSur: Int = 20,
    missingCompetencies: List<String> = emptyList(),
    onNoteChange: (Double?, String?) -> Unit,
    onStatusChange: (Boolean, Long?) -> Unit,
    onClick: () -> Unit = {}
) {
    var showJustifDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = when {
                isSelected -> Color(0xFF1ABC9C).copy(alpha = 0.4f)
                note.nonClasse -> Color(0xFFC0392B).copy(alpha = 0.3f)
                else -> Color(0xFF34495E)
            }
        ),
        border = if (isSelected) BorderStroke(1.dp, Color(0xFF1ABC9C)) else null
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(note.nomComplet, color = Color.White, fontWeight = FontWeight.Bold)
                
                if (missingCompetencies.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.padding(vertical = 2.dp)) {
                        missingCompetencies.forEach { comp ->
                            Surface(
                                color = Color.Red.copy(alpha = 0.1f),
                                shape = RoundedCornerShape(4.dp),
                                border = BorderStroke(0.5.dp, Color.Red.copy(alpha = 0.5f))
                            ) {
                                Text(comp, color = Color.Red, fontSize = 7.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                            }
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("${note.matricule ?: "N/A"} | Sur: $noteSur", color = Color.Gray, fontSize = 10.sp)
                    if (note.note == null && !note.nonClasse) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Box(modifier = Modifier.size(8.dp).background(Color.Red, CircleShape))
                    }
                    
                    if (note.idCompetence != null) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.Default.Bolt, null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(10.dp))
                    }
                }
                if (note.nonClasse) {
                    val justif = justifications.find { it.idServeur == note.idJustification }
                    Text("N.C : ${justif?.libelleJustificationFr ?: "Sans motif"}", color = Color.Red, fontSize = 10.sp)
                }
            }

            if (!note.nonClasse) {
                if (mode == GradeEntryMode.DECIMAL) {
                    val textColor = if ((note.note ?: 0.0) < 10.0) Color.Red else Color.White
                    OutlinedTextField(
                        value = note.note?.toString() ?: "",
                        onValueChange = { 
                            val v = it.toDoubleOrNull()
                            if (v == null || v <= noteSur) onNoteChange(v, null)
                        },
                        modifier = Modifier.width(80.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = textColor, unfocusedTextColor = textColor),
                        label = { Text("/$noteSur", fontSize = 8.sp) }
                    )
                } else {
                    CotationSelector(selectedCote = note.cote, onCoteSelected = { onNoteChange(null, it) })
                }
            }

            IconButton(onClick = { 
                if (!note.nonClasse) showJustifDialog = true else onStatusChange(false, null)
            }) {
                Icon(if (note.nonClasse) Icons.Default.Block else Icons.Default.CheckCircleOutline, 
                     contentDescription = null, 
                     tint = if (note.nonClasse) Color.Red else Color.Gray)
            }
        }
    }

    if (showJustifDialog) {
        AlertDialog(
            onDismissRequest = { showJustifDialog = false },
            title = { Text("Motif de l'absence") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    justifications.forEach { justif ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { onStatusChange(true, justif.idServeur); showJustifDialog = false }.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = note.idJustification == justif.idServeur, onClick = null)
                            Text(justif.libelleJustificationFr, modifier = Modifier.padding(start = 8.dp))
                        }
                    }
                }
            },
            confirmButton = {}
        )
    }
}

@Composable
fun SequentialEntryModalStudent(
    studentNote: StudentNoteUiModel,
    mode: GradeEntryMode,
    isLast: Boolean,
    competences: List<RepartitionCompetenceEntity> = emptyList(),
    currentCompIndex: Int = 0,
    onDismiss: () -> Unit,
    onNext: (Double?, String?, Boolean) -> Unit
) {
    var noteValue by remember(studentNote.idRepartitionMatiere, currentCompIndex) { mutableStateOf(studentNote.note?.toString() ?: "") }
    var coteValue by remember(studentNote.idRepartitionMatiere, currentCompIndex) { mutableStateOf(studentNote.cote ?: "") }
    var isNonClasse by remember(studentNote.idRepartitionMatiere) { mutableStateOf(studentNote.nonClasse) }

    val currentComp = competences.getOrNull(currentCompIndex)

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {},
        title = {
            Column {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(studentNote.matiereLabel, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    if (!isLast) {
                        TextButton(onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= studentNote.noteSur) onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse) 
                        }) {
                            Text("Suivant")
                            Icon(Icons.Default.ChevronRight, null)
                        }
                    }
                }
                if (currentComp != null) {
                    Text(
                        text = if (competences.size > 1) "Saisie Multi-Compétence" else "Compétence liée",
                        color = if (competences.size > 1) Color.Red else Color(0xFF1ABC9C),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                if (currentComp != null) {
                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1ABC9C).copy(alpha = 0.1f))) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Bolt, null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(currentComp.detailsCompetence?.libelle ?: "N/A", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (!isNonClasse) {
                    if (mode == GradeEntryMode.DECIMAL) {
                        OutlinedTextField(
                            value = noteValue,
                            onValueChange = { 
                                val v = it.toDoubleOrNull()
                                if (v == null || v <= studentNote.noteSur) noteValue = it
                            },
                            label = { Text("Note /${studentNote.noteSur}") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    } else {
                        CotationGrid(selectedCote = coteValue, onCoteSelected = { coteValue = it })
                    }
                } else {
                    Text("Élève non classé", color = Color.Red, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                }
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Fermer") }
                    Button(
                        onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= studentNote.noteSur) onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                    ) {
                        Text(if (isLast) "Terminer" else "Valider")
                    }
                }
            }
        }
    )
}

@Composable
fun SequentialEntryModal(
    note: NoteUiModel,
    mode: GradeEntryMode,
    noteSur: Int = 20,
    isLast: Boolean,
    competences: List<RepartitionCompetenceEntity> = emptyList(),
    currentCompIndex: Int = 0,
    onDismiss: () -> Unit,
    onNext: (Double?, String?, Boolean) -> Unit
) {
    var noteValue by remember(note.idInscription, currentCompIndex) { mutableStateOf(note.note?.toString() ?: "") }
    var coteValue by remember(note.idInscription, currentCompIndex) { mutableStateOf(note.cote ?: "") }
    var isNonClasse by remember(note.idInscription) { mutableStateOf(note.nonClasse) }

    val currentComp = competences.getOrNull(currentCompIndex)
    
    val borderColors = listOf(Color(0xFF3498DB), Color(0xFF9B59B6), Color(0xFFE91E63), Color(0xFF2ECC71), Color(0xFFF39C12))
    val borderColor = remember(note.idInscription) { borderColors[(note.idInscription % borderColors.size).toInt()] }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier.border(4.dp, borderColor, RoundedCornerShape(28.dp)),
        confirmButton = {},
        title = {
            Column {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(note.nomComplet, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                    if (!isLast) {
                        TextButton(onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= noteSur) onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse) 
                        }) {
                            Text("Suivant")
                            Icon(Icons.Default.ChevronRight, null)
                        }
                    }
                }
                if (currentComp != null) {
                    Text(
                        text = if (competences.size > 1) "Saisie Multi-Compétence" else "Compétence liée",
                        color = if (competences.size > 1) Color.Red else Color(0xFF1ABC9C),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                if (currentComp != null) {
                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1ABC9C).copy(alpha = 0.1f))) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Bolt, null, tint = Color(0xFF1ABC9C), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text(currentComp.detailsCompetence?.libelle ?: "N/A", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (!isNonClasse) {
                    if (mode == GradeEntryMode.DECIMAL) {
                        OutlinedTextField(
                            value = noteValue,
                            onValueChange = { 
                                val v = it.toDoubleOrNull()
                                if (v == null || v <= noteSur) noteValue = it
                            },
                            label = { Text("Note /$noteSur") },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    } else {
                        CotationGrid(selectedCote = coteValue, onCoteSelected = { coteValue = it })
                    }
                } else {
                    Text("Élève non classé", color = Color.Red, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                }
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Fermer") }
                    Button(
                        onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= noteSur) onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse)
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                    ) {
                        Text(if (isLast) "Terminer" else "Valider")
                    }
                }
            }
        }
    )
}

@Composable
fun CotationGrid(selectedCote: String?, onCoteSelected: (String) -> Unit) {
    val cotes = listOf("A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "E+", "E", "E-", "F+", "F", "F-")
    Column {
        cotes.chunked(5).forEach { row ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                row.forEach { cote ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .aspectRatio(1f)
                            .background(if (selectedCote == cote) Color(0xFF1ABC9C) else Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                            .clickable { onCoteSelected(cote) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(cote, color = if (selectedCote == cote) Color.White else Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Composable
fun CotationSelector(selectedCote: String?, onCoteSelected: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Text(
            text = selectedCote ?: "--",
            color = Color.White,
            modifier = Modifier
                .background(Color(0xFF2C3E50), RoundedCornerShape(4.dp))
                .clickable { expanded = true }
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .width(40.dp),
            textAlign = TextAlign.Center
        )
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            Box(modifier = Modifier.padding(8.dp).width(200.dp)) {
                CotationGrid(selectedCote = selectedCote, onCoteSelected = { onCoteSelected(it); expanded = false })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BulkActionsBottomSheet(
    onDismiss: () -> Unit,
    justifications: List<JustificationEntity>,
    onAction: (String, String?, Long?) -> Unit
) {
    var globalNote by remember { mutableStateOf("") }
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth().padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Actions Groupées", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            OutlinedTextField(
                value = globalNote,
                onValueChange = { globalNote = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Note globale pour la salle") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                trailingIcon = {
                    IconButton(onClick = { onAction("SET_GLOBAL_NOTE", globalNote, null) }, enabled = globalNote.isNotEmpty()) {
                        Icon(Icons.Default.Send, null)
                    }
                }
            )
            HorizontalDivider()
            ActionItem("🔄", "Réinitialiser la matière", "Effacer toutes les notes", color = Color.Red) { onAction("RESET_MATIERE", null, null) }
            ActionItem("🚫", "Non-composé global", "AJ pour tout le monde") { 
                if (justifications.isNotEmpty()) onAction("NON_COMPOSE_GLOBAL", null, justifications.first().idServeur) 
            }
        }
    }
}

@Composable
fun ActionItem(icon: String, title: String, desc: String, color: Color = Color.White, onClick: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(icon, fontSize = 24.sp)
        Spacer(Modifier.width(16.dp))
        Column {
            Text(title, color = color, fontWeight = FontWeight.Bold)
            Text(desc, color = Color.Gray, fontSize = 11.sp)
        }
    }
}

@Composable
fun GradeProgressBar(label: String, progress: ProgressUiModel?) {
    if (progress == null) return
    Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = Color.Gray, fontSize = 11.sp)
            Text("${progress.filled}/${progress.total} (${progress.percentage.toInt()}%)", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        }
        LinearProgressIndicator(
            progress = { progress.percentage / 100f },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = Color(0xFF1ABC9C),
            trackColor = Color.White.copy(alpha = 0.1f)
        )
    }
}

@Composable
fun AbsenceItemRow(absence: AbsenceUiModel, onChanged: (Int, Int) -> Unit) {
    val statusColor = when {
        absence.heuresANJ >= 45 -> Color.Red
        absence.heuresANJ >= 30 -> Color(0xFFE67E22)
        else -> Color.Transparent
    }
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = if (statusColor != Color.Transparent) statusColor.copy(alpha = 0.2f) else Color(0xFF34495E))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(absence.nomComplet, color = Color.White, fontWeight = FontWeight.Medium)
                Text(absence.matricule ?: "N/A", color = Color.Gray, fontSize = 10.sp)
            }
            CounterButton(label = "AJ", value = absence.heuresAJ, onValueChange = { onChanged(it, absence.heuresANJ) })
            Spacer(Modifier.width(16.dp))
            CounterButton(label = "ANJ", value = absence.heuresANJ, onValueChange = { onChanged(absence.heuresAJ, it) }, color = Color.Red)
        }
    }
}

@Composable
fun CounterButton(label: String, value: Int, onValueChange: (Int) -> Unit, color: Color = Color(0xFF1ABC9C)) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, color = Color.Gray, fontSize = 9.sp)
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(4.dp))) {
            IconButton(onClick = { if (value > 0) onValueChange(value - 1) }, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Remove, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
            Text(value.toString(), color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.width(24.dp), textAlign = TextAlign.Center)
            IconButton(onClick = { onValueChange(value + 1) }, modifier = Modifier.size(24.dp)) {
                Icon(Icons.Default.Add, null, tint = color, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun JustificationManagementDialog(
    justifications: List<JustificationEntity>,
    onDismiss: () -> Unit,
    onSave: (JustificationEntity) -> Unit,
    onDelete: (Long) -> Unit
) {
    var labelFr by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Motifs d'absence") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(value = labelFr, onValueChange = { labelFr = it }, label = { Text("Nouveau motif") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { onSave(JustificationEntity(0, labelFr, labelFr, "")); labelFr = "" }, enabled = labelFr.isNotEmpty(), modifier = Modifier.fillMaxWidth()) { Text("Ajouter") }
                LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                    itemsIndexed(justifications) { _, justif ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(justif.libelleJustificationFr, modifier = Modifier.weight(1f))
                            IconButton(onClick = { onDelete(justif.idServeur) }) { Icon(Icons.Default.Delete, null, tint = Color.Red) }
                        }
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Fermer") } }
    )
}
