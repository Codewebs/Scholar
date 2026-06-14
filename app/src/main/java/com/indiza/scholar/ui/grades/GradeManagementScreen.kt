package com.indiza.scholar.ui.grades

import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.*
import com.indiza.scholar.ui.student.EleveUiModel
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.SpanStyle

enum class GradeEntryMode { DECIMAL, ALPHABETIC }
enum class GradeView { MENU, ENTRY_BY_SUBJECT, ENTRY_BY_STUDENT, ABSENCES, PV, REPORT_SHEET }

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
    
    // Filtres partagés
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedSequence by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    var selectedRepartition by remember { mutableStateOf<RepartitionMatiereEntity?>(null) }

    var isFiltersCollapsed by remember { mutableStateOf(false) }
    var showDiscardDialog by remember { mutableStateOf(false) }
    var pendingViewChange by remember { mutableStateOf<GradeView?>(null) }

    val salles by viewModel.salles.collectAsState()
    val sequences by viewModel.sequences.collectAsState()
    val repartitions by viewModel.repartitions.collectAsState()
    val justifications by viewModel.justifications.collectAsState()
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

    LaunchedEffect(selectedSalle) {
        selectedSalle?.idClasseServeur?.let { 
            viewModel.loadRepartitions(idAnneeScolaire, it, selectedSalle?.idServeur, selectedSequence?.idServeur)
        }
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
                isFiltersCollapsed = false
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
                        Box {
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
                            }
                        }
                    }
                    if (currentView == GradeView.ENTRY_BY_SUBJECT || currentView == GradeView.ENTRY_BY_STUDENT) {
                        IconButton(onClick = { showModeSelection = true }) {
                            Icon(Icons.Default.Settings, contentDescription = "Mode", tint = Color.White)
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
                    onNavigate = { currentView = it }
                )
                GradeView.ENTRY_BY_SUBJECT -> GradeEntryBySubject(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    salles = salles,
                    sequences = sequences,
                    repartitions = repartitions,
                    justifications = justifications,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    selectedRepartition = selectedRepartition,
                    entryMode = selectedEntryMode,
                    isFiltersCollapsed = isFiltersCollapsed,
                    onFiltersToggle = {
                        if (it && hasChanges) {
                            showDiscardDialog = true
                        } else {
                            isFiltersCollapsed = it
                        }
                    },
                    onFiltersChanged = { s, seq, rep ->
                        selectedSalle = s
                        selectedSequence = seq
                        selectedRepartition = rep
                    }
                )
                GradeView.ENTRY_BY_STUDENT -> GradeEntryByStudent(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    salles = salles,
                    sequences = sequences,
                    justifications = justifications,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    isFiltersCollapsed = isFiltersCollapsed,
                    onFiltersToggle = {
                        if (it && hasChanges) {
                            showDiscardDialog = true
                        } else {
                            isFiltersCollapsed = it
                        }
                    },
                    onFiltersChanged = { s, seq ->
                        selectedSalle = s
                        selectedSequence = seq
                    }
                )
                GradeView.ABSENCES -> AbsenceEntryScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    viewModel = viewModel,
                    salles = salles,
                    sequences = sequences,
                    selectedSalle = selectedSalle,
                    selectedSequence = selectedSequence,
                    onFiltersChanged = { s, seq ->
                        selectedSalle = s
                        selectedSequence = seq
                    }
                )
                GradeView.REPORT_SHEET -> ReportSheetScreen(
                    idAnneeScolaire = idAnneeScolaire,
                    salles = salles,
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
                    salles = salles,
                    sequences = sequences,
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
                        isFiltersCollapsed = false
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
                    },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = selectedEntryMode == GradeEntryMode.DECIMAL, onClick = { 
                        selectedEntryMode = GradeEntryMode.DECIMAL
                        prefs.edit().putString("default_entry_mode", GradeEntryMode.DECIMAL.name).apply()
                        showModeSelection = false 
                    })
                    Text("Notation Décimale (ex: 14.5)")
                }
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { 
                        selectedEntryMode = GradeEntryMode.ALPHABETIC
                        prefs.edit().putString("default_entry_mode", GradeEntryMode.ALPHABETIC.name).apply()
                        showModeSelection = false 
                    },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(selected = selectedEntryMode == GradeEntryMode.ALPHABETIC, onClick = { 
                        selectedEntryMode = GradeEntryMode.ALPHABETIC
                        prefs.edit().putString("default_entry_mode", GradeEntryMode.ALPHABETIC.name).apply()
                        showModeSelection = false 
                    })
                    Text("Notation Alphabétique (Cotation: A+, B, etc.)")
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
    val isReady = sequencesCount > 0 && justificationsCount > 0
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        if (!isReady) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Red.copy(alpha = 0.1f)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Configuration requise :", color = Color.Red, fontWeight = FontWeight.Bold)
                    if (sequencesCount == 0) Text("• Aucune séquence enregistrée", color = Color.White, fontSize = 12.sp)
                    if (justificationsCount == 0) Text("• Aucune justification enregistrée", color = Color.White, fontSize = 12.sp)
                }
            }
        }

        MenuCard("📝", "Saisie par Matière", "Saisie collective par classe/matière", enabled = isReady, onClick = { onNavigate(GradeView.ENTRY_BY_SUBJECT) })
        MenuCard("👤", "Saisie par Élève", "Saisie individuelle des notes", enabled = isReady, onClick = { onNavigate(GradeView.ENTRY_BY_STUDENT) })
        MenuCard("📄", "Fiche de Report", "Grilles papier pour les enseignants", onClick = { onNavigate(GradeView.REPORT_SHEET) })
        MenuCard("⏰", "Saisie des Absences", "Volume horaire (AJ / ANJ)", enabled = isReady, onClick = { onNavigate(GradeView.ABSENCES) })
        MenuCard("🏆", "Procès Verbaux (PV)", "Consultation et gel des résultats", onClick = { onNavigate(GradeView.PV) })
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
fun JustificationManagementDialog(
    justifications: List<JustificationEntity>,
    onDismiss: () -> Unit,
    onSave: (JustificationEntity) -> Unit,
    onDelete: (Long) -> Unit
) {
    var editingJustif by remember { mutableStateOf<JustificationEntity?>(null) }
    var labelFr by remember { mutableStateOf("") }
    var labelEn by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Gérer les motifs d'absence") },
        text = {
            Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = labelFr,
                        onValueChange = { labelFr = it },
                        label = { Text("Libellé (FR)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = labelEn,
                        onValueChange = { labelEn = it },
                        label = { Text("Libellé (EN)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Button(
                        onClick = {
                            onSave(JustificationEntity(
                                idServeur = editingJustif?.idServeur ?: 0L, 
                                libelleJustificationFr = labelFr, 
                                libelleJustificationEn = labelEn,
                                description = ""
                            ))
                            labelFr = ""; labelEn = ""; editingJustif = null
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = labelFr.isNotEmpty()
                    ) {
                        Text(if (editingJustif != null) "Mettre à jour" else "Ajouter")
                    }
                    if (editingJustif != null) {
                        TextButton(onClick = { editingJustif = null; labelFr = ""; labelEn = "" }) {
                            Text("Annuler l'édition")
                        }
                    }
                }

                Divider()

                LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                    itemsIndexed(justifications) { _, justif ->
                        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(justif.libelleJustificationFr, fontWeight = FontWeight.Bold)
                                Text(justif.libelleJustificationEn ?: "", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                            }
                            IconButton(onClick = { 
                                editingJustif = justif
                                labelFr = justif.libelleJustificationFr
                                labelEn = justif.libelleJustificationEn ?: ""
                            }) {
                                Icon(Icons.Default.Edit, null, tint = Color.Blue)
                            }
                            IconButton(onClick = { onDelete(justif.idServeur) }) {
                                Icon(Icons.Default.Delete, null, tint = Color.Red)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Fermer") }
        }
    )
}

@Composable
fun GradeEntryBySubject(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    repartitions: List<RepartitionMatiereEntity>,
    justifications: List<JustificationEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    selectedRepartition: RepartitionMatiereEntity?,
    entryMode: GradeEntryMode,
    isFiltersCollapsed: Boolean,
    onFiltersToggle: (Boolean) -> Unit,
    onFiltersChanged: (SalleEntity?, SousPeriodeEntity?, RepartitionMatiereEntity?) -> Unit
) {
    val notes by viewModel.notes.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()
    val salleProgress by viewModel.salleProgress.collectAsState()
    val matiereProgress by viewModel.matiereProgress.collectAsState()

    var showBulkActions by remember { mutableStateOf(false) }
    
    var showSequentialEntry by remember { mutableStateOf(false) }
    var currentSequentialIndex by remember { mutableIntStateOf(0) }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isFiltersCollapsed) {
            FilterHeader(
                salles = salles,
                sequences = sequences,
                repartitions = repartitions,
                selectedSalle = selectedSalle,
                selectedSequence = selectedSequence,
                selectedRepartition = selectedRepartition,
                onSalleSelect = { onFiltersChanged(it, selectedSequence, selectedRepartition) },
                onSequenceSelect = { 
                    onFiltersChanged(selectedSalle, it, selectedRepartition)
                    if (it != null) {
                        viewModel.loadSallesWithProgress(idAnneeScolaire, it.idServeur ?: 0L)
                        if (selectedSalle != null) {
                            viewModel.loadSalleProgress(selectedSalle.idServeur ?: 0L, it.idServeur ?: 0L, idAnneeScolaire)
                            viewModel.loadRepartitions(idAnneeScolaire, selectedSalle.idClasseServeur ?: 0L, selectedSalle.idServeur, it.idServeur)
                        }
                    }
                },
                onRepartitionSelect = { onFiltersChanged(selectedSalle, selectedSequence, it) },
                onLoad = {
                    if (selectedSalle != null && selectedRepartition != null && selectedSequence != null) {
                        viewModel.loadNotes(
                            selectedSalle.idServeur ?: 0L,
                            selectedRepartition.idRepartitionMatiere,
                            selectedSequence.idServeur ?: 0L,
                            idAnneeScolaire
                        )
                        onFiltersToggle(true)
                    }
                }
            )
        } else {
            CompactFilterSummary(
                salle = selectedSalle?.nomSalle,
                classe = selectedSalle?.classeLabel,
                sequence = selectedSequence?.libelleSousPeriodeFr,
                matiere = selectedRepartition?.detailsMatiere?.libelleFr,
                onEdit = { onFiltersToggle(false) }
            )
        }

        if (selectedSequence != null) {
            GradeProgressBar(label = "Progression Salle", progress = salleProgress)
            if (selectedRepartition != null) {
                GradeProgressBar(label = "Progression Matière", progress = matiereProgress)
            }
        }

        if (notes.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Mode: ${if (entryMode == GradeEntryMode.DECIMAL) "Décimal" else "Cotation"}", color = Color.White)
                Row {
                    TextButton(onClick = { 
                        if (notes.isNotEmpty()) {
                            currentSequentialIndex = 0
                            showSequentialEntry = true
                        }
                    }) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Saisie Rapide")
                    }
                    TextButton(onClick = { showBulkActions = true }) {
                        Icon(Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Actions de masse")
                    }
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
                        onNoteChange = { n, c -> viewModel.updateNoteLocally(index, n, c) },
                        onStatusChange = { nonClasse, idJustif ->
                            viewModel.updateStatusLocally(index, nonClasse, idJustif)
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
                        ) {
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                enabled = hasChanges,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
            ) {
                Text(if (hasChanges) "Enregistrer les modifications" else "Données à jour")
            }
        }
    }

    if (showSequentialEntry && notes.indices.contains(currentSequentialIndex)) {
        SequentialEntryModal(
            note = notes[currentSequentialIndex],
            mode = entryMode,
            noteSur = selectedRepartition?.noteSur ?: 20,
            isLast = currentSequentialIndex == notes.size - 1,
            onDismiss = { showSequentialEntry = false },
            onNext = { n, c, nc ->
                viewModel.updateNoteLocally(currentSequentialIndex, n, c)
                viewModel.updateStatusLocally(currentSequentialIndex, nc, null)
                if (currentSequentialIndex < notes.size - 1) {
                    currentSequentialIndex++
                } else {
                    showSequentialEntry = false
                }
            }
        )
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
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    justifications: List<JustificationEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    isFiltersCollapsed: Boolean,
    onFiltersToggle: (Boolean) -> Unit,
    onFiltersChanged: (SalleEntity?, SousPeriodeEntity?) -> Unit
) {
    val students by viewModel.salleStudents.collectAsState()
    val studentNotes by viewModel.studentNotes.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()
    val salleProgress by viewModel.salleProgress.collectAsState()
    val studentProgress by viewModel.studentProgress.collectAsState()

    var selectedStudent by remember { mutableStateOf<EleveUiModel?>(null) }
    var entryMode by remember { mutableStateOf(GradeEntryMode.DECIMAL) }
    var showDetailSheet by remember { mutableStateOf(false) }
    var showSequentialModal by remember { mutableStateOf(false) }
    var currentSubIndex by remember { mutableIntStateOf(0) }

    LaunchedEffect(selectedSalle) {
        if (selectedSalle != null) {
            viewModel.loadStudentsBySalle(idAnneeScolaire, selectedSalle.idServeur ?: 0L, selectedSequence?.idServeur)
            onFiltersToggle(true)
        }
    }

    LaunchedEffect(selectedSequence, selectedStudent) {
        if (selectedSequence != null && selectedStudent != null) {
            viewModel.loadNotesByStudent(
                selectedStudent!!.idInscription,
                selectedSequence.idServeur ?: 0L,
                idAnneeScolaire,
                selectedSalle?.idClasseServeur ?: 0L
            )
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isFiltersCollapsed) {
            AbsenceFilterHeader(
                salles = salles,
                sequences = sequences,
                selectedSalle = selectedSalle,
                selectedSequence = selectedSequence,
                onSalleSelect = { onFiltersChanged(it, selectedSequence) },
                onSequenceSelect = { 
                    onFiltersChanged(selectedSalle, it)
                    if (it != null) {
                        viewModel.loadSallesWithProgress(idAnneeScolaire, it.idServeur ?: 0L)
                        if (selectedSalle != null) {
                            viewModel.loadSalleProgress(selectedSalle.idServeur ?: 0L, it.idServeur ?: 0L, idAnneeScolaire)
                        }
                    }
                },
                onLoad = {
                    if (selectedSalle != null) {
                        viewModel.loadStudentsBySalle(idAnneeScolaire, selectedSalle.idServeur ?: 0L, selectedSequence?.idServeur)
                        onFiltersToggle(true)
                    }
                }
            )
        } else {
            CompactFilterSummary(
                salle = selectedSalle?.nomSalle,
                classe = selectedSalle?.classeLabel,
                sequence = selectedSequence?.libelleSousPeriodeFr,
                matiere = "Tous les élements de l'élève",
                onEdit = { onFiltersToggle(false) }
            )
        }

        if (selectedSequence != null) {
            GradeProgressBar(label = "Progression Salle", progress = salleProgress)
        }

        if (students.isNotEmpty()) {
            LazyColumn(modifier = Modifier.weight(1f).padding(8.dp)) {
                itemsIndexed(students) { _, student ->
                    StudentListRow(
                        student = student,
                        onSelect = { 
                            selectedStudent = student
                            showSequentialModal = true
                            currentSubIndex = 0
                        },
                        onOpenDetail = {
                            selectedStudent = student
                            showDetailSheet = true
                        }
                    )
                }
            }
        }
    }

    if (showDetailSheet && selectedStudent != null) {
        ModalBottomSheet(onDismissRequest = { showDetailSheet = false }) {
            StudentGradesContent(
                student = selectedStudent!!,
                notes = studentNotes,
                mode = entryMode,
                justifications = justifications,
                hasChanges = hasChanges,
                progress = studentProgress,
                onNoteChange = { idx, n, c -> viewModel.updateStudentNoteLocally(idx, n, c) },
                onStatusChange = { idx, nc, idJ -> viewModel.updateStudentStatusLocally(idx, nc, idJ) },
                onSave = {
                    if (selectedSequence != null) {
                        viewModel.saveStudentNotes(
                            selectedStudent!!.idInscription,
                            selectedSequence.idServeur ?: 0L,
                            idAnneeScolaire,
                            entryMode.name
                        ) { showDetailSheet = false }
                    }
                }
            )
        }
    }

    if (showSequentialModal && selectedStudent != null && studentNotes.indices.contains(currentSubIndex)) {
        val currentNote = studentNotes[currentSubIndex]
        SequentialStudentEntryModal(
            studentName = selectedStudent!!.nomComplet,
            note = currentNote,
            mode = entryMode,
            isLast = currentSubIndex == studentNotes.size - 1,
            onDismiss = { showSequentialModal = false },
            onNext = { n, c, nc ->
                viewModel.updateStudentNoteLocally(currentSubIndex, n, c)
                viewModel.updateStudentStatusLocally(currentSubIndex, nc, null)
                if (currentSubIndex < studentNotes.size - 1) {
                    currentSubIndex++
                } else {
                    if (selectedSequence != null) {
                        viewModel.saveStudentNotes(
                            selectedStudent!!.idInscription,
                            selectedSequence.idServeur ?: 0L,
                            idAnneeScolaire,
                            entryMode.name
                        ) { showSequentialModal = false }
                    }
                }
            }
        )
    }
}

@Composable
fun StudentListRow(student: EleveUiModel, onSelect: () -> Unit, onOpenDetail: () -> Unit) {
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
                        Box(modifier = Modifier.size(6.dp).background(Color.Red, RoundedCornerShape(3.dp)))
                    }
                }
            }
            Text("${student.matiereNotees}/${student.totalMatieres}", color = Color.White, fontSize = 12.sp)
            IconButton(onClick = onOpenDetail) {
                Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF1ABC9C))
            }
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
    onNoteChange: (Int, Double?, String?) -> Unit,
    onStatusChange: (Int, Boolean, Long?) -> Unit,
    onSave: () -> Unit
) {
    Column(modifier = Modifier.fillMaxHeight(0.8f).padding(16.dp)) {
        Text(student.nomComplet, style = MaterialTheme.typography.headlineSmall, color = Color.White)
        GradeProgressBar(label = "Progression individuelle", progress = progress)
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(modifier = Modifier.weight(1f)) {
            itemsIndexed(notes) { index, sn ->
                StudentGradeItemRow(
                    studentNote = sn,
                    mode = mode,
                    justifications = justifications,
                    onNoteChange = { n, c -> onNoteChange(index, n, c) },
                    onStatusChange = { nc, idJ -> onStatusChange(index, nc, idJ) }
                )
            }
        }
        
        Button(
            onClick = onSave,
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            enabled = hasChanges,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Enregistrer")
        }
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SequentialStudentEntryModal(
    studentName: String,
    note: StudentNoteUiModel,
    mode: GradeEntryMode,
    isLast: Boolean,
    onDismiss: () -> Unit,
    onNext: (Double?, String?, Boolean) -> Unit
) {
    var noteValue by remember(note.idRepartitionMatiere) { mutableStateOf(note.note?.toString() ?: "") }
    var coteValue by remember(note.idRepartitionMatiere) { mutableStateOf(note.cote ?: "") }
    var isNonClasse by remember(note.idRepartitionMatiere) { mutableStateOf(note.nonClasse) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {},
        title = {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(studentName, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (!isLast) {
                    TextButton(onClick = { 
                        val v = noteValue.toDoubleOrNull()
                        if (v == null || v <= note.noteSur) {
                            onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse)
                        }
                    }) {
                        Text("Passer")
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(note.matiereLabel, fontWeight = FontWeight.Bold, color = Color(0xFF1ABC9C))
                
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    if (!isNonClasse) {
                        if (mode == GradeEntryMode.DECIMAL) {
                            OutlinedTextField(
                                value = noteValue,
                                onValueChange = { 
                                    val v = it.toDoubleOrNull()
                                    if (v == null || v <= note.noteSur) noteValue = it
                                },
                                label = { Text("Note /${note.noteSur}") },
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                singleLine = true
                            )
                        } else {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Cotation", style = MaterialTheme.typography.labelSmall)
                                CotationGrid(selectedCote = coteValue, onCoteSelected = { coteValue = it })
                            }
                        }
                    } else {
                        Text("Non-Classé", color = Color.Red, modifier = Modifier.weight(1f))
                    }
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(start = 8.dp)) {
                        Text("Classé", style = MaterialTheme.typography.labelSmall)
                        Switch(checked = !isNonClasse, onCheckedChange = { isNonClasse = !it })
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Annuler") }
                    Button(
                        onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= note.noteSur) onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse)
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
fun CompactFilterSummary(salle: String?, classe: String?, sequence: String?, matiere: String?, onEdit: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50).copy(alpha = 0.5f))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text("${classe ?: ""} - ${salle ?: ""}", color = Color.White, fontWeight = FontWeight.Bold)
                Text("${sequence ?: ""} | ${matiere ?: ""}", color = Color.Gray, fontSize = 12.sp)
            }
            IconButton(onClick = onEdit) {
                Icon(Icons.Default.Edit, contentDescription = "Modifier", tint = Color(0xFF1ABC9C))
            }
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
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { progress.percentage / 100f },
            modifier = Modifier.fillMaxWidth().height(6.dp),
            color = Color(0xFF1ABC9C),
            trackColor = Color.White.copy(alpha = 0.1f)
        )
    }
}

@Composable
fun StudentGradeItemRow(
    studentNote: StudentNoteUiModel,
    mode: GradeEntryMode,
    justifications: List<JustificationEntity>,
    onNoteChange: (Double?, String?) -> Unit,
    onStatusChange: (Boolean, Long?) -> Unit
) {
    var showJustifDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = CardDefaults.cardColors(containerColor = if (studentNote.nonClasse) Color(0xFFC0392B).copy(alpha = 0.3f) else Color(0xFF34495E))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(studentNote.matiereLabel, color = Color.White, fontWeight = FontWeight.Medium)
                Text("Coef: ${studentNote.coef} | Sur: ${studentNote.noteSur}", color = Color.Gray, fontSize = 10.sp)
                if (studentNote.nonClasse) {
                    val justif = justifications.find { it.idServeur == studentNote.idJustification }
                    Text("Non-Classé : ${justif?.libelleJustificationFr ?: "Sans motif"}", color = Color.Red, fontSize = 10.sp)
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 8.dp)) {
                Text("Composé", color = Color.Gray, fontSize = 10.sp)
                Spacer(Modifier.width(4.dp))
                Switch(
                    checked = !studentNote.nonClasse,
                    onCheckedChange = { 
                        if (it) onStatusChange(false, null) else showJustifDialog = true 
                    },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF1ABC9C))
                )
            }

            if (!studentNote.nonClasse) {
                if (mode == GradeEntryMode.DECIMAL) {
                    val textColor = if ((studentNote.note ?: 0.0) < 10.0) Color.Red else Color.White
                    OutlinedTextField(
                        value = studentNote.note?.toString() ?: "",
                        onValueChange = { 
                            val v = it.toDoubleOrNull()
                            if (v == null || v <= studentNote.noteSur) {
                                onNoteChange(v, null)
                            }
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
                            modifier = Modifier.fillMaxWidth().clickable { onStatusChange(true, justif.idServeur); showJustifDialog = false },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = studentNote.idJustification == justif.idServeur, onClick = { onStatusChange(true, justif.idServeur); showJustifDialog = false })
                            Text(justif.libelleJustificationFr)
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("${note.matricule ?: "N/A"} | Sur: $noteSur", color = Color.Gray, fontSize = 10.sp)
                    if (note.note == null && !note.nonClasse) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Box(modifier = Modifier.size(8.dp).background(Color.Red, RoundedCornerShape(4.dp)))
                    }
                }
                if (note.nonClasse) {
                    val justif = justifications.find { it.idServeur == note.idJustification }
                    Text("Non-Classé : ${justif?.libelleJustificationFr ?: "Sans motif"}", color = Color.Red, fontSize = 10.sp)
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 8.dp)) {
                Text("Composé", color = Color.Gray, fontSize = 10.sp)
                Spacer(Modifier.width(4.dp))
                Switch(
                    checked = !note.nonClasse,
                    onCheckedChange = { 
                        if (it) onStatusChange(false, null) else showJustifDialog = true 
                    },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF1ABC9C))
                )
            }

            if (!note.nonClasse) {
                if (mode == GradeEntryMode.DECIMAL) {
                    val textColor = if ((note.note ?: 0.0) < 10.0) Color.Red else Color.White
                    OutlinedTextField(
                        value = note.note?.toString() ?: "",
                        onValueChange = { 
                            val v = it.toDoubleOrNull()
                            if (v == null || v <= noteSur) {
                                onNoteChange(v, null)
                            }
                        },
                        modifier = Modifier.width(80.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = textColor,
                            unfocusedTextColor = textColor
                        ),
                        label = { Text("/$noteSur", fontSize = 8.sp) }
                    )
                } else {
                    CotationSelector(
                        selectedCote = note.cote,
                        onCoteSelected = { onNoteChange(null, it) }
                    )
                }
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
                            modifier = Modifier.fillMaxWidth().clickable { onStatusChange(true, justif.idServeur); showJustifDialog = false },
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = note.idJustification == justif.idServeur, onClick = { onStatusChange(true, justif.idServeur); showJustifDialog = false })
                            Text(justif.libelleJustificationFr)
                        }
                    }
                }
            },
            confirmButton = {}
        )
    }
}

@Composable
fun SubjectProgressItem(label: String, progress: Float) {
    val annotatedString = remember(label, progress) {
        val splitIndex = (label.length * (progress / 100f)).toInt()
        buildAnnotatedString {
            if (splitIndex > 0) {
                withStyle(style = SpanStyle(color = Color(0xFF1ABC9C))) {
                    append(label.substring(0, splitIndex))
                }
            }
            if (splitIndex < label.length) {
                withStyle(style = SpanStyle(color = Color.Red)) {
                    append(label.substring(splitIndex))
                }
            }
        }
    }
    Text(text = annotatedString, fontWeight = FontWeight.Bold)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterHeader(
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    repartitions: List<RepartitionMatiereEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    selectedRepartition: RepartitionMatiereEntity?,
    onSalleSelect: (SalleEntity) -> Unit,
    onSequenceSelect: (SousPeriodeEntity) -> Unit,
    onRepartitionSelect: (RepartitionMatiereEntity) -> Unit,
    onLoad: () -> Unit
) {
    var expandedSalle by remember { mutableStateOf(false) }
    var expandedSeq by remember { mutableStateOf(false) }
    var expandedRep by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ExposedDropdownMenuBox(expanded = expandedSalle, onExpandedChange = { expandedSalle = it }) {
            OutlinedTextField(
                value = selectedSalle?.nomSalle ?: "Sélectionner une Salle",
                onValueChange = {},
                readOnly = true,
                label = { Text("Salle") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSalle) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSalle, onDismissRequest = { expandedSalle = false }) {
                salles.forEach { salle ->
                    DropdownMenuItem(
                        text = { 
                            SubjectProgressItem(
                                label = "${salle.classeLabel ?: ""} - ${salle.nomSalle}",
                                progress = salle.progress
                            )
                        },
                        onClick = { onSalleSelect(salle); expandedSalle = false }
                    )
                }
            }
        }

        ExposedDropdownMenuBox(expanded = expandedSeq, onExpandedChange = { expandedSeq = it }) {
            OutlinedTextField(
                value = selectedSequence?.libelleSousPeriodeFr ?: "Sélectionner une Séquence",
                onValueChange = {},
                readOnly = true,
                label = { Text("Séquence") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSeq) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSeq, onDismissRequest = { expandedSeq = false }) {
                sequences.forEach { seq ->
                    DropdownMenuItem(
                        text = { Text(seq.libelleSousPeriodeFr) },
                        onClick = { onSequenceSelect(seq); expandedSeq = false }
                    )
                }
            }
        }

        ExposedDropdownMenuBox(expanded = expandedRep, onExpandedChange = { expandedRep = it }) {
            OutlinedTextField(
                value = selectedRepartition?.detailsMatiere?.libelleFr ?: "Sélectionner une Matière",
                onValueChange = {},
                readOnly = true,
                label = { Text("Matière") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedRep) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedRep, onDismissRequest = { expandedRep = false }) {
                repartitions.forEach { rep ->
                    DropdownMenuItem(
                        text = { 
                            SubjectProgressItem(
                                label = rep.detailsMatiere?.libelleFr ?: "Matière",
                                progress = rep.progress
                            )
                        },
                        onClick = { onRepartitionSelect(rep); expandedRep = false }
                    )
                }
            }
        }

        Button(
            onClick = onLoad,
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedSalle != null && selectedSequence != null && selectedRepartition != null,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Charger la liste")
        }
    }
}

@Composable
fun SequentialEntryModal(
    note: NoteUiModel,
    mode: GradeEntryMode,
    noteSur: Int = 20,
    isLast: Boolean,
    onDismiss: () -> Unit,
    onNext: (Double?, String?, Boolean) -> Unit
) {
    var noteValue by remember(note.idInscription) { mutableStateOf(note.note?.toString() ?: "") }
    var coteValue by remember(note.idInscription) { mutableStateOf(note.cote ?: "") }
    var isNonClasse by remember(note.idInscription) { mutableStateOf(note.nonClasse) }

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {},
        title = {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(note.nomComplet, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (!isLast) {
                    TextButton(onClick = { 
                        val v = noteValue.toDoubleOrNull()
                        if (v == null || v <= noteSur) {
                            onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse) 
                        }
                    }) {
                        Text("Suivant")
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    if (!isNonClasse) {
                        if (mode == GradeEntryMode.DECIMAL) {
                            OutlinedTextField(
                                value = noteValue,
                                onValueChange = { 
                                    val v = it.toDoubleOrNull()
                                    if (v == null || v <= noteSur) {
                                        noteValue = it
                                    }
                                },
                                label = { Text("Note /$noteSur") },
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                singleLine = true
                            )
                        } else {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Cotation", style = MaterialTheme.typography.labelSmall)
                                CotationGrid(selectedCote = coteValue, onCoteSelected = { coteValue = it })
                            }
                        }
                    } else {
                        Text("Élève non classé", color = Color.Red, modifier = Modifier.weight(1f))
                    }
                    
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(start = 8.dp)) {
                        Text("Classé", style = MaterialTheme.typography.labelSmall)
                        Switch(checked = !isNonClasse, onCheckedChange = { isNonClasse = !it })
                    }
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Annuler") }
                    Button(
                        onClick = { 
                            val v = noteValue.toDoubleOrNull()
                            if (v == null || v <= noteSur) {
                                onNext(v, if(coteValue.isEmpty()) null else coteValue, isNonClasse)
                            }
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
        val rows = cotes.chunked(5)
        rows.forEach { row ->
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
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Actions Groupées", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Note globale pour la salle", style = MaterialTheme.typography.titleSmall)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = globalNote,
                        onValueChange = { globalNote = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Note ex: 10.0") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
                    )
                    Button(onClick = { onAction("SET_GLOBAL_NOTE", globalNote, null) }, enabled = globalNote.isNotEmpty()) {
                        Text("Appliquer")
                    }
                }
            }

            ActionItem("🔄", "Réinitialiser la matière", "Effacer toutes les notes saisies pour cette épreuve", color = Color.Red) {
                onAction("RESET_MATIERE", null, null)
            }
            
            ActionItem("🚫", "Déclarer la salle non-composée", "Mettre tous les élèves en AJ (Justifié)") {
                if (justifications.isNotEmpty()) onAction("NON_COMPOSE_GLOBAL", null, justifications.first().idServeur)
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun ActionItem(icon: String, title: String, desc: String, color: Color = Color.White, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable { onClick() }.padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(icon, fontSize = 24.sp)
        Spacer(Modifier.width(16.dp))
        Column {
            Text(title, color = color, fontWeight = FontWeight.Bold)
            Text(desc, color = Color.Gray, fontSize = 11.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportSheetScreen(
    idAnneeScolaire: Long,
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    repartitions: List<RepartitionMatiereEntity>,
    selectedSalle: SalleEntity?,
    selectedRepartition: RepartitionMatiereEntity?,
    onFiltersChanged: (SalleEntity?, RepartitionMatiereEntity?) -> Unit,
    onGeneratePdf: (SalleEntity, RepartitionMatiereEntity?, List<Long>) -> Unit
) {
    var expandedSalle by remember { mutableStateOf(false) }
    var expandedRep by remember { mutableStateOf(false) }
    var selectedSequences by remember { mutableStateOf<List<Long>>(emptyList()) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Générer une fiche de report", color = Color.White, style = MaterialTheme.typography.titleLarge)
        
        ExposedDropdownMenuBox(expanded = expandedSalle, onExpandedChange = { expandedSalle = it }) {
            OutlinedTextField(
                value = if (selectedSalle != null) "${selectedSalle.classeLabel ?: ""} - ${selectedSalle.nomSalle}" else "Sélectionner une Salle",
                onValueChange = {}, readOnly = true, label = { Text("Salle") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSalle) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSalle, onDismissRequest = { expandedSalle = false }) {
                salles.forEach { salle ->
                    DropdownMenuItem(text = { Text("${salle.classeLabel ?: ""} - ${salle.nomSalle}") }, onClick = { onFiltersChanged(salle, selectedRepartition); expandedSalle = false })
                }
            }
        }

        ExposedDropdownMenuBox(expanded = expandedRep, onExpandedChange = { expandedRep = it }) {
            OutlinedTextField(
                value = selectedRepartition?.detailsMatiere?.libelleFr ?: "Toutes les matières",
                onValueChange = {}, readOnly = true, label = { Text("Matière") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedRep) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedRep, onDismissRequest = { expandedRep = false }) {
                DropdownMenuItem(text = { Text("Toutes les matières") }, onClick = { onFiltersChanged(selectedSalle, null); expandedRep = false })
                repartitions.forEach { rep ->
                    DropdownMenuItem(text = { Text(rep.detailsMatiere?.libelleFr ?: "Matière") }, onClick = { onFiltersChanged(selectedSalle, rep); expandedRep = false })
                }
            }
        }

        Text("Séquences (Sous-périodes)", color = Color.White, style = MaterialTheme.typography.titleMedium)
        LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
            itemsIndexed(sequences) { _, seq ->
                Row(
                    modifier = Modifier.fillMaxWidth().clickable {
                        val id = seq.idServeur ?: 0L
                        selectedSequences = if (selectedSequences.contains(id)) selectedSequences - id else selectedSequences + id
                    },
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
            enabled = selectedSalle != null && selectedSequences.isNotEmpty()
        ) {
            Icon(Icons.Default.PictureAsPdf, null)
            Spacer(Modifier.width(8.dp))
            Text("Générer le PDF")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PVManagementScreen(
    idAnneeScolaire: Long,
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    onGenerate: (PvExportPayload, SalleEntity) -> Unit
) {
    var selectedType by remember { mutableStateOf("Séquentiel") }
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedSequence by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    
    var expandedType by remember { mutableStateOf(false) }
    var expandedSalle by remember { mutableStateOf(false) }
    var expandedSeq by remember { mutableStateOf(false) }

    var showExportOptions by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Générer un Procès Verbal (PV)", color = Color.White, style = MaterialTheme.typography.titleLarge)
        
        ExposedDropdownMenuBox(expanded = expandedType, onExpandedChange = { expandedType = it }) {
            OutlinedTextField(
                value = selectedType, onValueChange = {}, readOnly = true, label = { Text("Type de PV") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedType) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedType, onDismissRequest = { expandedType = false }) {
                listOf("Séquentiel", "Trimestriel", "Annuel").forEach { type ->
                    DropdownMenuItem(text = { Text(type) }, onClick = { selectedType = type; expandedType = false })
                }
            }
        }

        ExposedDropdownMenuBox(expanded = expandedSalle, onExpandedChange = { expandedSalle = it }) {
            OutlinedTextField(
                value = selectedSalle?.nomSalle ?: "Sélectionner une Salle",
                onValueChange = {}, readOnly = true, label = { Text("Salle") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSalle) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSalle, onDismissRequest = { expandedSalle = false }) {
                salles.forEach { salle ->
                    DropdownMenuItem(text = { Text("${salle.classeLabel ?: ""} - ${salle.nomSalle}") }, onClick = { selectedSalle = salle; expandedSalle = false })
                }
            }
        }

        if (selectedType == "Séquentiel") {
            ExposedDropdownMenuBox(expanded = expandedSeq, onExpandedChange = { expandedSeq = it }) {
                OutlinedTextField(
                    value = selectedSequence?.libelleSousPeriodeFr ?: "Sélectionner une Séquence",
                    onValueChange = {}, readOnly = true, label = { Text("Séquence") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSeq) },
                    modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
                )
                ExposedDropdownMenu(expanded = expandedSeq, onDismissRequest = { expandedSeq = false }) {
                    sequences.forEach { seq ->
                        DropdownMenuItem(text = { Text(seq.libelleSousPeriodeFr) }, onClick = { selectedSequence = seq; expandedSeq = false })
                    }
                }
            }
        }

        Button(
            onClick = { 
                if(selectedSalle != null) {
                    showExportOptions = true
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedSalle != null && (selectedType != "Séquentiel" || selectedSequence != null)
        ) {
            Icon(Icons.Default.Assessment, null)
            Spacer(Modifier.width(8.dp))
            Text("Générer PV")
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
fun AbsenceEntryScreen(
    idAnneeScolaire: Long,
    viewModel: GradeManagementViewModel,
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    onFiltersChanged: (SalleEntity?, SousPeriodeEntity?) -> Unit
) {
    val absences by viewModel.absences.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        AbsenceFilterHeader(
            salles = salles,
            sequences = sequences,
            selectedSalle = selectedSalle,
            selectedSequence = selectedSequence,
            onSalleSelect = { onFiltersChanged(it, selectedSequence) },
            onSequenceSelect = { onFiltersChanged(selectedSalle, it) },
            onLoad = {
                if (selectedSalle != null && selectedSequence != null) {
                    viewModel.loadAbsences(
                        selectedSalle.idServeur ?: 0L,
                        selectedSequence.idServeur ?: 0L,
                        idAnneeScolaire
                    )
                }
            }
        )

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
                        viewModel.saveAbsences(selectedSequence.idServeur ?: 0L, idAnneeScolaire) {
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
            ) {
                Text("Enregistrer les absences")
            }
        }
    }
}

@Composable
fun AbsenceItemRow(absence: AbsenceUiModel, onChanged: (Int, Int) -> Unit) {
    val statusColor = when {
        absence.heuresANJ >= 45 -> Color.Red
        absence.heuresANJ >= 30 -> Color(0xFFE67E22) // Blâme
        absence.heuresANJ >= 15 -> Color(0xFFF1C40F) // Avertissement
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

            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("AJ", color = Color.Gray, fontSize = 9.sp)
                CounterButton(value = absence.heuresAJ, onValueChange = { onChanged(it, absence.heuresANJ) })
            }
            Spacer(Modifier.width(8.dp))
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("ANJ", color = Color.Gray, fontSize = 9.sp)
                CounterButton(value = absence.heuresANJ, onValueChange = { onChanged(absence.heuresAJ, it) }, color = Color.Red)
            }
        }
    }
}

@Composable
fun CounterButton(value: Int, onValueChange: (Int) -> Unit, color: Color = Color(0xFF1ABC9C)) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.background(Color.Black.copy(alpha = 0.2f), RoundedCornerShape(4.dp))) {
        IconButton(onClick = { if (value > 0) onValueChange(value - 1) }, modifier = Modifier.size(24.dp)) {
            Icon(Icons.Default.Remove, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
        }
        Text(value.toString(), color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.width(20.dp), textAlign = TextAlign.Center)
        IconButton(onClick = { onValueChange(value + 1) }, modifier = Modifier.size(24.dp)) {
            Icon(Icons.Default.Add, contentDescription = null, tint = color, modifier = Modifier.size(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AbsenceFilterHeader(
    salles: List<SalleEntity>,
    sequences: List<SousPeriodeEntity>,
    selectedSalle: SalleEntity?,
    selectedSequence: SousPeriodeEntity?,
    onSalleSelect: (SalleEntity) -> Unit,
    onSequenceSelect: (SousPeriodeEntity) -> Unit,
    onLoad: () -> Unit
) {
    var expandedSalle by remember { mutableStateOf(false) }
    var expandedSeq by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ExposedDropdownMenuBox(expanded = expandedSalle, onExpandedChange = { expandedSalle = it }) {
            OutlinedTextField(
                value = selectedSalle?.nomSalle ?: "Sélectionner une Salle",
                onValueChange = {},
                readOnly = true,
                label = { Text("Salle") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSalle) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSalle, onDismissRequest = { expandedSalle = false }) {
                salles.forEach { salle ->
                    DropdownMenuItem(
                        text = { 
                            SubjectProgressItem(
                                label = "${salle.classeLabel ?: ""} - ${salle.nomSalle}",
                                progress = salle.progress
                            )
                        },
                        onClick = { onSalleSelect(salle); expandedSalle = false }
                    )
                }
            }
        }

        ExposedDropdownMenuBox(expanded = expandedSeq, onExpandedChange = { expandedSeq = it }) {
            OutlinedTextField(
                value = selectedSequence?.libelleSousPeriodeFr ?: "Sélectionner une Séquence",
                onValueChange = {},
                readOnly = true,
                label = { Text("Séquence") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedSeq) },
                modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
            )
            ExposedDropdownMenu(expanded = expandedSeq, onDismissRequest = { expandedSeq = false }) {
                sequences.forEach { seq ->
                    DropdownMenuItem(text = { Text(seq.libelleSousPeriodeFr) }, onClick = { onSequenceSelect(seq); expandedSeq = false })
                }
            }
        }

        Button(
            onClick = onLoad,
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedSalle != null && selectedSequence != null,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Charger la liste")
        }
    }
}
