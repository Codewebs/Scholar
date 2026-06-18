package com.indiza.scholar.ui.matieres

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RepartitionMatiereScreen(
    idAnneeScolaire: Long,
    schoolId: Long,
    userRole: String,
    viewModel: MatiereViewModel,
    classeViewModel: com.indiza.scholar.ui.student.ClasseManagementViewModel,
    onBack: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Copier Programme", "Affectation par Matière", "Ancien Programme")
    val saveState by viewModel.saveState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    // Fetch all years to find the previous one
    var previousYearId by remember { mutableLongStateOf(0L) }
    val apiService = remember { viewModel.getApiService() }

    LaunchedEffect(idAnneeScolaire) {
        classeViewModel.loadData(idAnneeScolaire)
        viewModel.loadGlobalLibrary()
        viewModel.loadRepartition(idAnneeScolaire)

        // Find previous year
        try {
            val response = apiService.getYearsBySchool(schoolId)
            if (response.isSuccessful) {
                val years: List<AnneeScolaireEntity> = response.body() ?: emptyList()
                val currentYear = years.find { it.idServeur == idAnneeScolaire }
                if (currentYear != null) {
                    val prevYear = years
                        .filter { it.dateDebut < currentYear.dateDebut }
                        .maxByOrNull { it.dateDebut }
                    previousYearId = prevYear?.idServeur ?: 0L
                }
            }
        } catch (e: Exception) {}
    }

    LaunchedEffect(saveState) {
        when (saveState) {
            is SaveState.SUCCESS -> {
                snackbarHostState.showSnackbar("Répartition enregistrée avec succès")
                viewModel.resetSaveState()
            }
            is SaveState.ERROR -> {
                snackbarHostState.showSnackbar((saveState as SaveState.ERROR).error)
            }
            else -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Répartition des Matières", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            TabRow(
                selectedTabIndex = selectedTab,
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = { Text(title, fontSize = 12.sp) }
                    )
                }
            }

            when (selectedTab) {
                0 -> CloneProgramTab(idAnneeScolaire, viewModel, classeViewModel)
                1 -> BulkAssignTab(idAnneeScolaire, viewModel, classeViewModel)
                2 -> PreviousYearTab(idAnneeScolaire, previousYearId, viewModel, classeViewModel)
            }
        }
    }
}

@Composable
fun CloneProgramTab(
    idAnneeScolaire: Long,
    viewModel: MatiereViewModel,
    classeViewModel: com.indiza.scholar.ui.student.ClasseManagementViewModel
) {
    val classes by classeViewModel.classes.collectAsState()
    val classesWithFees = remember(classes) { classes.filter { it.hasFees } }
    var sourceClasseId by remember { mutableLongStateOf(0L) }
    val targetClasseIds = remember { mutableStateListOf<Long>() }
    val saveState by viewModel.saveState.collectAsState()
    val repartition by viewModel.repartition.collectAsState()

    var showSubjectsFor by remember { mutableStateOf<Long?>(null) }

    Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("1. Classe de référence (Source)", fontWeight = FontWeight.Bold)
        
        ClassSelector(classesWithFees, sourceClasseId) { sourceClasseId = it }

        Text("2. Classes de destination", fontWeight = FontWeight.Bold)
        
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(classesWithFees.filter { it.idClasse != sourceClasseId }) { classe ->
                val isSelected = targetClasseIds.contains(classe.idClasse)
                val classSubjects = repartition.filter { it.idClasse == classe.idClasse }
                
                Card(
                    modifier = Modifier.fillMaxWidth().clickable {
                        if (isSelected) targetClasseIds.remove(classe.idClasse)
                        else targetClasseIds.add(classe.idClasse)
                    },
                    colors = CardDefaults.cardColors(containerColor = if (isSelected) Color(0xFF1ABC9C).copy(alpha = 0.2f) else Color(0xFF2C3E50))
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isSelected, onCheckedChange = null)
                        Spacer(Modifier.width(8.dp))
                        Text(classe.libelleClasseFr, color = Color.White, modifier = Modifier.weight(1f))
                        
                        if (classSubjects.isNotEmpty()) {
                            IconButton(onClick = { showSubjectsFor = classe.idClasse }) {
                                Icon(Icons.Default.List, null, tint = Color(0xFF1ABC9C))
                            }
                        }
                    }
                }
            }
        }

        if (saveState is SaveState.ERROR) {
            Text((saveState as SaveState.ERROR).error, color = Color.Red, fontSize = 12.sp)
        }

        Button(
            onClick = {
                viewModel.cloneProgram(CloneProgramPayload(idAnneeScolaire, sourceClasseId, targetClasseIds.toList())) {
                    targetClasseIds.clear()
                    sourceClasseId = 0L
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = sourceClasseId > 0 && targetClasseIds.isNotEmpty() && saveState !is SaveState.SAVING_REMOTE,

        ) {
            if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            else Text("Appliquer le programme")
        }
    }

    if (showSubjectsFor != null) {
        val classe = classesWithFees.find { it.idClasse == showSubjectsFor }
        val subjects = repartition.filter { it.idClasse == showSubjectsFor }
        AlertDialog(
            onDismissRequest = { showSubjectsFor = null },
            title = { Text("Matières - ${classe?.libelleClasseFr}") },
            text = {
                LazyColumn {
                    items(subjects) { sub ->
                        Text("• ${sub.detailsMatiere?.libelleFr} (Coef ${sub.coef})")
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showSubjectsFor = null }) { Text("Fermer") } }
        )
    }
}

@Composable
fun PreviousYearTab(
    idAnneeScolaire: Long,
    previousYearId: Long,
    viewModel: MatiereViewModel,
    classeViewModel: com.indiza.scholar.ui.student.ClasseManagementViewModel
) {
    val context = LocalContext.current
    val classes by classeViewModel.classes.collectAsState()
    val classesWithFees = remember(classes) { classes.filter { it.hasFees } }
    val saveState by viewModel.saveState.collectAsState()
    val repartition by viewModel.repartition.collectAsState()

    var showSubjectsFor by remember { mutableStateOf<Long?>(null) }

    Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Récupérer le programme de l'année précédente", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)

        if (previousYearId == 0L) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Aucune année précédente trouvée.", color = Color.Gray)
            }
        } else {
            Text("Cette action remplacera le programme actuel des classes sélectionnées par celui de l'an dernier.", color = Color.Gray, fontSize = 12.sp)

            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(classesWithFees) { classe ->
                    val classSubjects = repartition.filter { it.idClasse == classe.idClasse }

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(classe.libelleClasseFr, color = Color.White, fontWeight = FontWeight.Bold)
                                Text(classe.cycleLabel, color = Color.Gray, fontSize = 12.sp)
                            }

                            if (classSubjects.isNotEmpty()) {
                                IconButton(onClick = { showSubjectsFor = classe.idClasse }) {
                                    Icon(Icons.Default.List, null, tint = Color(0xFF3498DB))
                                }
                            }

                            Button(
                                onClick = {
                                    viewModel.cloneProgram(CloneProgramPayload(
                                        idAnneeScolaire = idAnneeScolaire,
                                        idClasseSource = classe.idClasse,
                                        targetClasseIds = listOf(classe.idClasse),
                                        idAnneeSource = previousYearId
                                    )) {
                                        Toast.makeText(context, "Programme récupéré pour ${classe.libelleClasseFr}", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                                enabled = saveState !is SaveState.SAVING_REMOTE
                            ) {
                                Text("Récupérer", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showSubjectsFor != null) {
        val classe = classesWithFees.find { it.idClasse == showSubjectsFor }
        val subjects = repartition.filter { it.idClasse == showSubjectsFor }
        AlertDialog(
            onDismissRequest = { showSubjectsFor = null },
            title = { Text("Matières - ${classe?.libelleClasseFr}") },
            text = {
                if (subjects.isEmpty()) {
                    Text("Aucune matière configurée.")
                } else {
                    LazyColumn {
                        items(subjects) { sub ->
                            Text("• ${sub.detailsMatiere?.libelleFr} (Coef ${sub.coef})")
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showSubjectsFor = null }) { Text("Fermer") } }
        )
    }
}

data class AssignInfo(val coef: Int, val noteSur: Int = 20)

@Composable
fun BulkAssignTab(
    idAnneeScolaire: Long,
    viewModel: MatiereViewModel,
    classeViewModel: com.indiza.scholar.ui.student.ClasseManagementViewModel
) {
    val library by viewModel.uiState.collectAsState()
    val classes by classeViewModel.classes.collectAsState()
    val classesWithFees = remember(classes) { classes.filter { it.hasFees } }
    val repartition by viewModel.repartition.collectAsState()

    var selectedMatiereId by remember { mutableLongStateOf(0L) }
    var defaultCoef by remember { mutableStateOf("2") }
    var defaultNoteSur by remember { mutableStateOf("20") }
    val assignments = remember { mutableStateMapOf<Long, AssignInfo>() } // idClasse -> info
    val saveState by viewModel.saveState.collectAsState()

    var showSubjectsFor by remember { mutableStateOf<Long?>(null) }

    Column(modifier = Modifier.padding(16.dp).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("1. Sélectionner la matière", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)

        if (library is MatiereUIState.Success) {
            MatiereSelector((library as MatiereUIState.Success).list, selectedMatiereId) { selectedMatiereId = it }
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = defaultCoef,
                onValueChange = { defaultCoef = it },
                label = { Text("Coef", fontSize = 10.sp) },
                modifier = Modifier.width(70.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
            )
            OutlinedTextField(
                value = defaultNoteSur,
                onValueChange = { defaultNoteSur = it },
                label = { Text("/Sur", fontSize = 10.sp) },
                modifier = Modifier.width(70.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
            )
            Button(onClick = {
                classesWithFees.forEach {
                    assignments[it.idClasse] = AssignInfo(
                        defaultCoef.toIntOrNull() ?: 2,
                        defaultNoteSur.toIntOrNull() ?: 20
                    )
                }
            }) { Text("Appliquer à tous", fontSize = 10.sp) }
        }

        Text("2. Paramètres par classe", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)

        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            items(classesWithFees) { classe ->
                val info = assignments[classe.idClasse]
                val isSelected = info != null
                val classSubjects = repartition.filter { it.idClasse == classe.idClasse }

                Card(
                    colors = CardDefaults.cardColors(containerColor = if (isSelected) Color(0xFF2C3E50) else Color(0xFF1E2A3A))
                ) {
                    Row(modifier = Modifier.padding(8.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = isSelected, onCheckedChange = {
                            if (it) assignments[classe.idClasse] = AssignInfo(defaultCoef.toIntOrNull() ?: 2, defaultNoteSur.toIntOrNull() ?: 20)
                            else assignments.remove(classe.idClasse)
                        })
                        Text(classe.libelleClasseFr, color = Color.White, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        
                        if (classSubjects.isNotEmpty()) {
                            IconButton(onClick = { showSubjectsFor = classe.idClasse }) {
                                Icon(Icons.Default.List, null, tint = Color(0xFF3498DB), modifier = Modifier.size(20.dp))
                            }
                        }

                        if (isSelected && info != null) {
                            OutlinedTextField(
                                value = info.coef.toString(),
                                onValueChange = { if(it.all { c -> c.isDigit() }) assignments[classe.idClasse] = info.copy(coef = it.toIntOrNull() ?: 0) },
                                modifier = Modifier.width(50.dp),
                                label = { Text("Coef", fontSize = 8.sp) },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                            )
                            Spacer(Modifier.width(4.dp))
                            OutlinedTextField(
                                value = info.noteSur.toString(),
                                onValueChange = { if(it.all { c -> c.isDigit() }) assignments[classe.idClasse] = info.copy(noteSur = it.toIntOrNull() ?: 0) },
                                modifier = Modifier.width(50.dp),
                                label = { Text("/Sur", fontSize = 8.sp) },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                            )
                        }
                    }
                }
            }
        }

        Button(
            onClick = {
                val list = assignments.map { (classeId, info) ->
                    SubjectAssignmentItem(
                        idMatiere = selectedMatiereId,
                        idClasse = classeId,
                        coef = info.coef,
                        noteSur = info.noteSur
                    )
                }
                viewModel.bulkAssignSubject(BulkAssignSubjectPayload(idAnneeScolaire, selectedMatiereId, list)) {
                    assignments.clear()
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = selectedMatiereId > 0 && assignments.isNotEmpty() && saveState !is SaveState.SAVING_REMOTE,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3498DB))
        ) {
            if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            else Text("Enregistrer l'affectation")
        }
    }

    if (showSubjectsFor != null) {
        val classe = classesWithFees.find { it.idClasse == showSubjectsFor }
        val subjects = repartition.filter { it.idClasse == showSubjectsFor }
        AlertDialog(
            onDismissRequest = { showSubjectsFor = null },
            title = { Text("Matières - ${classe?.libelleClasseFr}") },
            text = {
                LazyColumn {
                    items(subjects) { sub ->
                        Text("• ${sub.detailsMatiere?.libelleFr} (Coef ${sub.coef})")
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showSubjectsFor = null }) { Text("Fermer") } }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassSelector(classes: List<ClasseUiModel>, selectedId: Long, onSelected: (Long) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val selected = classes.find { it.idClasse == selectedId }

    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        OutlinedTextField(
            value = selected?.libelleClasseFr ?: "Choisir une classe",
            onValueChange = {},
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            classes.forEach {
                DropdownMenuItem(text = { Text(it.libelleClasseFr) }, onClick = { onSelected(it.idClasse); expanded = false })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatiereSelector(matieres: List<MatiereEntity>, selectedId: Long, onSelected: (Long) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val selected = matieres.find { it.idServeur == selectedId }

    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        OutlinedTextField(
            value = selected?.libelleFr ?: "Choisir une matière",
            onValueChange = {},
            readOnly = true,
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(),
            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            matieres.forEach {
                DropdownMenuItem(
                    text = { Text(it.libelleFr ?: "") },
                    onClick = {
                        onSelected(it.idServeur ?: 0L)
                        expanded = false
                    }
                )
            }
        }
    }
}
