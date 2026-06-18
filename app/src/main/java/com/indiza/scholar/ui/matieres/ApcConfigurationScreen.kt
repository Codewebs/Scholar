package com.indiza.scholar.ui.matieres

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.indiza.scholar.model.*
import com.indiza.scholar.ui.student.ClasseManagementViewModel

enum class ApcStep {
    CLASS_SELECTION,
    GROUP_MANAGEMENT,
    SUBJECT_ASSIGNMENT,
    COMPETENCE_MANAGEMENT
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApcConfigurationScreen(
    idAnneeScolaire: Long,
    viewModel: MatiereViewModel,
    classeViewModel: ClasseManagementViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var currentStep by remember { mutableStateOf(ApcStep.CLASS_SELECTION) }
    
    // Selection States
    var selectedClass by remember { mutableStateOf<ClasseUiModel?>(null) }
    var selectedGroup by remember { mutableStateOf<GroupeMatiereEntity?>(null) }
    var selectedMatiere by remember { mutableStateOf<RepartitionMatiereEntity?>(null) }

    // Data States
    val classes by classeViewModel.classes.collectAsState()
    val groups by viewModel.groups.collectAsState()
    val repartition by viewModel.repartition.collectAsState()
    val sequences by classeViewModel.sequences.collectAsState()
    val globalMatieresState by viewModel.uiState.collectAsState()
    val allCompetences by viewModel.competences.collectAsState()
    val repartitionCompetences by viewModel.repartitionCompetences.collectAsState()

    LaunchedEffect(idAnneeScolaire) {
        classeViewModel.loadData(idAnneeScolaire)
        viewModel.loadGroups()
        viewModel.loadGlobalLibrary()
        viewModel.loadGlobalCompetencies()
    }

    LaunchedEffect(selectedClass) {
        if (selectedClass != null) {
            viewModel.loadRepartition(idAnneeScolaire, selectedClass!!.idClasse)
            classeViewModel.loadSequencesForClass(idAnneeScolaire, selectedClass!!.idClasse)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = when (currentStep) {
                                ApcStep.CLASS_SELECTION -> "1. Choisir une Classe"
                                ApcStep.GROUP_MANAGEMENT -> "2. Groupes de Matières"
                                ApcStep.SUBJECT_ASSIGNMENT -> "3. Matières & Coefs"
                                ApcStep.COMPETENCE_MANAGEMENT -> "4. Compétences APC"
                            },
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        if (selectedClass != null && currentStep != ApcStep.CLASS_SELECTION) {
                            Text(
                                text = selectedClass!!.libelleClasseFr,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        when (currentStep) {
                            ApcStep.CLASS_SELECTION -> onBack()
                            ApcStep.GROUP_MANAGEMENT -> {
                                selectedClass = null
                                currentStep = ApcStep.CLASS_SELECTION
                            }
                            ApcStep.SUBJECT_ASSIGNMENT -> {
                                selectedGroup = null
                                currentStep = ApcStep.GROUP_MANAGEMENT
                            }
                            ApcStep.COMPETENCE_MANAGEMENT -> {
                                selectedMatiere = null
                                currentStep = ApcStep.SUBJECT_ASSIGNMENT
                            }
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null)
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            AnimatedContent(
                targetState = currentStep,
                transitionSpec = {
                    if (targetState.ordinal > initialState.ordinal) {
                        slideInHorizontally { it } + fadeIn() togetherWith slideOutHorizontally { -it } + fadeOut()
                    } else {
                        slideInHorizontally { -it } + fadeIn() togetherWith slideOutHorizontally { it } + fadeOut()
                    }
                },
                label = "StepTransition"
            ) { step ->
                when (step) {
                    ApcStep.CLASS_SELECTION -> {
                        ClassSelectionStep(classes) {
                            selectedClass = it
                            currentStep = ApcStep.GROUP_MANAGEMENT
                        }
                    }
                    ApcStep.GROUP_MANAGEMENT -> {
                        GroupManagementStep(
                            groups = groups,
                            onGroupSelected = {
                                selectedGroup = it
                                currentStep = ApcStep.SUBJECT_ASSIGNMENT
                            },
                            onAddGroup = { lib, ordre -> viewModel.createGroup(lib, ordre) },
                            onEditGroup = { id, lib, ordre -> viewModel.updateGroup(id, lib, ordre) },
                            onDeleteGroup = { id -> viewModel.deleteGroup(id) }
                        )
                    }
                    ApcStep.SUBJECT_ASSIGNMENT -> {
                        SubjectAssignmentStep(
                            selectedClass = selectedClass!!,
                            selectedGroup = selectedGroup!!,
                            repartition = repartition.filter { it.idGroupeMatiere == selectedGroup?.idServeur },
                            globalMatieres = (globalMatieresState as? MatiereUIState.Success)?.list ?: emptyList(),
                            onSubjectSelected = {
                                selectedMatiere = it
                                currentStep = ApcStep.COMPETENCE_MANAGEMENT
                            },
                            onAddSubjects = { assignments ->
                                viewModel.bulkAssignSubject(
                                    BulkAssignSubjectPayload(idAnneeScolaire, null, assignments),
                                    onSuccess = { viewModel.loadRepartition(idAnneeScolaire, selectedClass!!.idClasse) }
                                )
                            }
                        )
                    }
                    ApcStep.COMPETENCE_MANAGEMENT -> {
                        CompetenceManagementStep(
                            selectedMatiere = selectedMatiere!!,
                            sequences = sequences,
                            allCompetences = allCompetences,
                            repartitionCompetences = repartitionCompetences,
                            onSave = { idComp, selectedSeqs ->
                                viewModel.saveRepartitionCompetence(selectedMatiere!!.idRepartitionMatiere, idComp, selectedSeqs)
                                Toast.makeText(context, "Répartition enregistrée", Toast.LENGTH_SHORT).show()
                            },
                            onDelete = { id, idRM, idSP ->
                                viewModel.deleteRepartitionCompetence(id, idRM, idSP)
                            },
                            loadCompetences = { rmId -> viewModel.loadRepartitionCompetences(rmId, null) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ClassSelectionStep(classes: List<ClasseUiModel>, onSelected: (ClasseUiModel) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(classes) { classe ->
            Card(
                onClick = { onSelected(classe) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(MaterialTheme.colorScheme.primary, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = classe.libelleClasseFr.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text(classe.libelleClasseFr, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text(classe.cycleLabel ?: "", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Spacer(Modifier.weight(1f))
                    Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
fun GroupManagementStep(
    groups: List<GroupeMatiereEntity>,
    onGroupSelected: (GroupeMatiereEntity) -> Unit,
    onAddGroup: (String, Int) -> Unit,
    onEditGroup: (Long, String, Int) -> Unit,
    onDeleteGroup: (Long) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var groupToEdit by remember { mutableStateOf<GroupeMatiereEntity?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(groups) { group ->
                Card(
                    onClick = { onGroupSelected(group) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(group.libelleFr, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Ordre: ${group.ordre}", style = MaterialTheme.typography.bodySmall)
                        }
                        IconButton(onClick = { groupToEdit = group }) {
                            Icon(Icons.Default.Edit, null, tint = MaterialTheme.colorScheme.primary)
                        }
                        IconButton(onClick = { group.idServeur?.let { onDeleteGroup(it) } }) {
                            Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error)
                        }
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        }
        
        Button(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Default.Add, null)
            Spacer(Modifier.width(8.dp))
            Text("NOUVEAU GROUPE")
        }
    }

    if (showAddDialog || groupToEdit != null) {
        var libelle by remember { mutableStateOf(groupToEdit?.libelleFr ?: "") }
        var ordre by remember { mutableStateOf(groupToEdit?.ordre?.toString() ?: "1") }

        AlertDialog(
            onDismissRequest = { 
                showAddDialog = false
                groupToEdit = null
            },
            title = { Text(if (groupToEdit != null) "Modifier Groupe" else "Nouveau Groupe") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = libelle, onValueChange = { libelle = it }, label = { Text("Libellé") })
                    OutlinedTextField(value = ordre, onValueChange = { ordre = it }, label = { Text("Ordre") })
                }
            },
            confirmButton = {
                Button(onClick = {
                    val o = ordre.toIntOrNull() ?: 1
                    if (groupToEdit != null) {
                        onEditGroup(groupToEdit!!.idServeur!!, libelle, o)
                    } else {
                        onAddGroup(libelle, o)
                    }
                    showAddDialog = false
                    groupToEdit = null
                }) {
                    Text("Enregistrer")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SubjectAssignmentStep(
    selectedClass: ClasseUiModel,
    selectedGroup: GroupeMatiereEntity,
    repartition: List<RepartitionMatiereEntity>,
    globalMatieres: List<MatiereEntity>,
    onSubjectSelected: (RepartitionMatiereEntity) -> Unit,
    onAddSubjects: (List<SubjectAssignmentItem>) -> Unit
) {
    var showLibrary by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "Groupe: ${selectedGroup.libelleFr}",
            modifier = Modifier.padding(16.dp),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (repartition.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
                        Text("Aucune matière affectée", color = Color.Gray)
                    }
                }
            }
            items(repartition) { rm ->
                Card(
                    onClick = { onSubjectSelected(rm) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(rm.detailsMatiere?.libelleFr ?: "Matière", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Coefficient: ${rm.coef}", style = MaterialTheme.typography.bodySmall)
                        }
                        Icon(Icons.Default.ChevronRight, null)
                    }
                }
            }
        }

        Button(
            onClick = { showLibrary = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF673AB7))
        ) {
            Icon(Icons.Default.Add, null)
            Spacer(Modifier.width(8.dp))
            Text("AJOUTER DES MATIÈRES")
        }
    }

    if (showLibrary) {
        val selectedIds = remember { mutableStateListOf<Long>() }
        val coefs = remember { mutableStateMapOf<Long, Int>() }

        ModalBottomSheet(onDismissRequest = { showLibrary = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxHeight(0.8f)) {
                Text("Bibliothèque des Matières", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(16.dp))
                LazyColumn(modifier = Modifier.weight(1f)) {
                    val filtered = globalMatieres.filter { gm -> !repartition.any { it.idMatiere == gm.idServeur } }
                    items(filtered) { gm ->
                        val isSelected = selectedIds.contains(gm.idServeur)
                        ListItem(
                            headlineContent = { Text(gm.libelleFr) },
                            leadingContent = {
                                Checkbox(checked = isSelected, onCheckedChange = {
                                    if (it) selectedIds.add(gm.idServeur!!)
                                    else selectedIds.remove(gm.idServeur)
                                })
                            },
                            trailingContent = {
                                if (isSelected) {
                                    OutlinedTextField(
                                        value = (coefs[gm.idServeur] ?: 2).toString(),
                                        onValueChange = { coefs[gm.idServeur!!] = it.toIntOrNull() ?: 2 },
                                        label = { Text("Coef") },
                                        modifier = Modifier.width(70.dp),
                                        singleLine = true
                                    )
                                }
                            }
                        )
                    }
                }
                Button(
                    onClick = {
                        val assignments = selectedIds.map { id ->
                            SubjectAssignmentItem(
                                idMatiere = id,
                                idClasse = selectedClass.idClasse,
                                coef = coefs[id] ?: 2,
                                idGroupeMatiere = selectedGroup.idServeur
                            )
                        }
                        onAddSubjects(assignments)
                        showLibrary = false
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = selectedIds.isNotEmpty()
                ) {
                    Text("Ajouter (${selectedIds.size})")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun CompetenceManagementStep(
    selectedMatiere: RepartitionMatiereEntity,
    sequences: List<com.indiza.scholar.model.SousPeriodeEntity>,
    allCompetences: List<CompetenceEntity>,
    repartitionCompetences: List<RepartitionCompetenceEntity>,
    onSave: (Long, List<Long>) -> Unit,
    onDelete: (Long, Long, Long) -> Unit,
    loadCompetences: (Long) -> Unit
) {
    var showAddDialog by remember { mutableStateOf(false) }
    
    LaunchedEffect(selectedMatiere.idRepartitionMatiere) {
        loadCompetences(selectedMatiere.idRepartitionMatiere)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Text(
            text = "Matière: ${selectedMatiere.detailsMatiere?.libelleFr}",
            modifier = Modifier.padding(16.dp),
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val grouped = repartitionCompetences.groupBy { it.idCompetence }
            
            if (grouped.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
                        Text("Aucune compétence associée", color = Color.Gray)
                    }
                }
            }

            items(grouped.keys.toList()) { compId ->
                val comps = grouped[compId] ?: emptyList()
                val details = comps.firstOrNull()?.detailsCompetence
                
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                details?.libelle ?: "Compétence #$compId",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.weight(1f)
                            )
                            IconButton(onClick = { 
                                comps.forEach { onDelete(it.id, it.idRepartitionMatiere, it.idSousPeriode) }
                            }) {
                                Icon(Icons.Default.Delete, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.error)
                            }
                        }
                        
                        androidx.compose.foundation.layout.FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            comps.forEach { rc ->
                                val seq = sequences.find { it.idServeur == rc.idSousPeriode }
                                AssistChip(
                                    onClick = { },
                                    label = { Text("Seq ${seq?.ordreSousPeriode ?: rc.idSousPeriode}") },
                                    leadingIcon = { Icon(Icons.Default.Bolt, null, modifier = Modifier.size(14.dp)) }
                                )
                            }
                        }
                    }
                }
            }
        }

        Button(
            onClick = { showAddDialog = true },
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
        ) {
            Icon(Icons.Default.Add, null)
            Spacer(Modifier.width(8.dp))
            Text("AFFECTER UNE COMPÉTENCE")
        }
    }

    if (showAddDialog) {
        var selectedCompId by remember { mutableLongStateOf(0L) }
        val selectedSeqs = remember { mutableStateListOf<Long>() }
        
        ModalBottomSheet(onDismissRequest = { showAddDialog = false }) {
            Column(modifier = Modifier.padding(16.dp).fillMaxHeight(0.8f)) {
                Text("Choisir une Compétence", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                
                LazyColumn(modifier = Modifier.weight(1f).padding(vertical = 16.dp)) {
                    items(allCompetences) { comp ->
                        val isSelected = selectedCompId == (comp.idServeur ?: 0L)
                        ListItem(
                            headlineContent = { Text(comp.libelle) },
                            modifier = Modifier.clickable { selectedCompId = comp.idServeur ?: 0L },
                            leadingContent = { RadioButton(selected = isSelected, onClick = null) }
                        )
                    }
                }

                Text("Affecter aux séquences", style = MaterialTheme.typography.labelLarge)
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    sequences.forEach { seq ->
                        val isSelected = selectedSeqs.contains(seq.idServeur)
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                if (isSelected) selectedSeqs.remove(seq.idServeur)
                                else selectedSeqs.add(seq.idServeur ?: 0L)
                            },
                            label = { Text("S${seq.ordreSousPeriode}") }
                        )
                    }
                }

                Button(
                    onClick = {
                        onSave(selectedCompId, selectedSeqs.toList())
                        showAddDialog = false
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = selectedCompId > 0 && selectedSeqs.isNotEmpty()
                ) {
                    Text("Valider l'affectation")
                }
            }
        }
    }
}
