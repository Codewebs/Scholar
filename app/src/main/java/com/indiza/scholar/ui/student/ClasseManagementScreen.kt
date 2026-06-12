package com.indiza.scholar.ui.student

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.SettingsActivity
import com.indiza.scholar.model.ClasseEntity
import com.indiza.scholar.model.ClasseUiModel
import kotlinx.coroutines.launch

import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.text.input.KeyboardType
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.SalleEntity
import com.indiza.scholar.ui.finance.FeesManagementView

enum class ClasseViewMode { DASHBOARD, LIST, STATS, PEDAGOGY, PLAN_ETUDES, DOCUMENTS, FEES }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClasseManagementScreen(
    idAnneeScolaire: Long,
    userRole: String,
    viewModel: ClasseManagementViewModel,
    onBack: () -> Unit
) {
    val classes by viewModel.classes.collectAsState()
    val cycles by viewModel.cycles.collectAsState()
    val context = LocalContext.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    var viewMode by remember { mutableStateOf(ClasseViewMode.DASHBOARD) }
    var showAddClasseSheet by remember { mutableStateOf(false) }
    var selectedClasseForDetails by remember { mutableStateOf<ClasseUiModel?>(null) }
    var selectedClasseForSalle by remember { mutableStateOf<ClasseUiModel?>(null) }

    // 🔔 Observer les événements de synchronisation Remote-First
    LaunchedEffect(Unit) {
        viewModel.syncEvents.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    val role = remember(userRole) { AcademicRole.fromName(userRole) }
    val canManage = role.permissions.contains(AcademicPermission.MANAGE_CLASSES)

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadData(idAnneeScolaire)
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        when(viewMode) {
                            ClasseViewMode.DASHBOARD -> "Dashboard Classes"
                            ClasseViewMode.LIST -> "Mes Classes & Salles"
                            ClasseViewMode.STATS -> "Remplissage & Parité"
                            ClasseViewMode.PEDAGOGY -> "Équipe Pédagogique"
                            ClasseViewMode.PLAN_ETUDES -> "Plan d'études"
                            ClasseViewMode.DOCUMENTS -> "Trombinoscope & Présence"
                            ClasseViewMode.FEES -> "Configuration des Frais"
                        }, 
                        color = Color.White
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (viewMode == ClasseViewMode.DASHBOARD) onBack()
                        else viewMode = ClasseViewMode.DASHBOARD
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        floatingActionButton = {
            if (viewMode == ClasseViewMode.LIST && canManage) {
                FloatingActionButton(
                    onClick = {
                        if (cycles.isEmpty()) {
                            scope.launch {
                                val result = snackbarHostState.showSnackbar(
                                    message = "Aucun cycle configuré. Veuillez d'abord paramétrer les cycles.",
                                    actionLabel = "Paramètres",
                                    duration = SnackbarDuration.Long
                                )
                                if (result == SnackbarResult.ActionPerformed) {
                                    context.startActivity(Intent(context, SettingsActivity::class.java))
                                }
                            }
                        } else {
                            showAddClasseSheet = true
                        }
                    },
                    containerColor = Color(0xFF1ABC9C),
                    contentColor = Color.White,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Ajouter Classe")
                }
            }
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            when (viewMode) {
                ClasseViewMode.DASHBOARD -> ClassesDashboard(onNavigate = { viewMode = it })
                ClasseViewMode.LIST -> ClassesListTable(
                    classes = classes, 
                    onAddSalle = { classe ->
                        selectedClasseForSalle = classe
                    },
                    onClasseClick = { selectedClasseForDetails = it }
                )
                ClasseViewMode.STATS -> ClassesStatsView(classes)
                ClasseViewMode.PLAN_ETUDES -> PlanEtudesView()
                ClasseViewMode.PEDAGOGY -> PedagogicalTeamView()
                ClasseViewMode.DOCUMENTS -> DocumentsView()
                ClasseViewMode.FEES -> FeesManagementView(idAnneeScolaire, viewModel)
            }
        }
    }

    if (showAddClasseSheet) {
        AddClasseBottomSheet(
            cycles = cycles,
            idAnneeScolaire = idAnneeScolaire,
            onDismiss = { showAddClasseSheet = false },
            onConfirm = { newClasse ->
                viewModel.createClasse(newClasse, idAnneeScolaire)
                showAddClasseSheet = false
            }
        )
    }

    if (selectedClasseForSalle != null) {
        AddSalleBottomSheet(
            classe = selectedClasseForSalle!!,
            idAnneeScolaire = idAnneeScolaire,
            onDismiss = { selectedClasseForSalle = null },
            onConfirm = { newSalle ->
                viewModel.createSalle(newSalle, idAnneeScolaire)
                selectedClasseForSalle = null
            }
        )
    }

    if (selectedClasseForDetails != null) {
        ClasseDetailsDialog(
            classe = selectedClasseForDetails!!,
            onDismiss = { selectedClasseForDetails = null }
        )
    }
}

@Composable
fun ClassesDashboard(onNavigate: (ClasseViewMode) -> Unit) {
    val items = listOf(
        DashboardMenu("🏢", "Mes Classes", "Liste des classes & salles", ClasseViewMode.LIST),
        DashboardMenu("💰", "Frais Scolarité", "Tarifs par classe", ClasseViewMode.FEES),
        DashboardMenu("📖", "Plan d'études", "Matières & Coefficients", ClasseViewMode.PLAN_ETUDES),
        DashboardMenu("👥", "Équipe Pédagogique", "Enseignants affectés", ClasseViewMode.PEDAGOGY),
        DashboardMenu("📊", "Remplissage", "Taux d'occupation", ClasseViewMode.STATS),
        DashboardMenu("👫", "Parité G/F", "Stats démographiques", ClasseViewMode.STATS),
        DashboardMenu("📈", "Performances", "Suivi des notes", ClasseViewMode.STATS),
        DashboardMenu("📸", "Trombinoscope", "Photos & Listing", ClasseViewMode.DOCUMENTS)
    )

    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(items) { item ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp)
                    .clickable { onNavigate(item.target) },
                colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize().padding(12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(item.icon, fontSize = 32.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(item.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp, textAlign = TextAlign.Center)
                    Text(item.desc, color = Color.Gray, fontSize = 10.sp, textAlign = TextAlign.Center, maxLines = 1)
                }
            }
        }
    }
}

data class DashboardMenu(val icon: String, val title: String, val desc: String, val target: ClasseViewMode)

@Composable
fun ClassesStatsView(classes: List<ClasseUiModel>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(classes) { classe ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(classe.libelleClasseFr, color = Color.White, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Remplissage
                    val percent = if(classe.totalCapacity > 0) (classe.totalEnrolled.toFloat() / classe.totalCapacity) else 0f
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Remplissage: ", color = Color.Gray, fontSize = 12.sp)
                        LinearProgressIndicator(
                            progress = percent,
                            modifier = Modifier.weight(1f).height(8.dp).clip(RoundedCornerShape(4.dp)),
                            color = if (percent > 0.9f) Color.Red else Color(0xFF1ABC9C),
                            trackColor = Color.DarkGray
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("${classe.totalEnrolled}/${classe.totalCapacity}", color = Color.White, fontSize = 12.sp)
                    }
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Parité
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Male, contentDescription = null, tint = Color(0xFF3498DB), modifier = Modifier.size(16.dp))
                            Text(" Garçons: ${classe.boys}", color = Color.White, fontSize = 12.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Female, contentDescription = null, tint = Color(0xFFE91E63), modifier = Modifier.size(16.dp))
                            Text(" Filles: ${classe.girls}", color = Color.White, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PlanEtudesView() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Plan d'études : Matières & Groupes (À venir)", color = Color.LightGray)
    }
}

@Composable
fun PedagogicalTeamView() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Équipe Pédagogique (À venir)", color = Color.LightGray)
    }
}

@Composable
fun DocumentsView() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Trombinoscope & Listes de présence (À venir)", color = Color.LightGray)
    }
}

@Composable
fun ClasseDetailsDialog(classe: ClasseUiModel, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(classe.libelleClasseFr) },
        text = {
            Column {
                Text("Cycle: ${classe.cycleLabel}")
                Text("Nombre de salles: ${classe.roomCount}")
                Text("Abréviation: ${classe.abreviation ?: "N/A"}")
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Fermer") }
        }
    )
}

@Composable
fun ClassesListTable(
    classes: List<ClasseUiModel>, 
    onAddSalle: (ClasseUiModel) -> Unit,
    onClasseClick: (ClasseUiModel) -> Unit = {}
) {
    if (classes.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Aucune classe disponible", color = Color.LightGray)
        }
    } else {
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(classes) { classe ->
                ClasseItemCard(
                    classe = classe,
                    onAddSalle = { onAddSalle(classe) },
                    onClick = { onClasseClick(classe) }
                )
            }
        }
    }
}

@Composable
fun ClasseItemCard(
    classe: ClasseUiModel,
    onAddSalle: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = classe.libelleClasseFr,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = classe.cycleLabel,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF1ABC9C)
                )
                if (!classe.abreviation.isNullOrBlank()) {
                    Text(
                        text = "(${classe.abreviation})",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    color = Color(0xFF34495E),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "${classe.roomCount} Salles",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                IconButton(
                    onClick = onAddSalle,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color(0xFF1ABC9C), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Gérer les salles",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddClasseBottomSheet(
    cycles: List<com.indiza.scholar.model.CycleEntity>,
    idAnneeScolaire: Long,
    onDismiss: () -> Unit,
    onConfirm: (ClasseEntity) -> Unit
) {
    var libelle by remember { mutableStateOf("") }
    var abreviation by remember { mutableStateOf("") }
    var selectedCycleId by remember { mutableLongStateOf(0L) }
    var expandedCycle by remember { mutableStateOf(false) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF2C3E50),
        contentColor = Color.White
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Ajouter une nouvelle classe", style = MaterialTheme.typography.titleLarge)
            
            OutlinedTextField(
                value = libelle,
                onValueChange = { libelle = it },
                label = { Text("Libellé de la classe") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = abreviation,
                onValueChange = { abreviation = it },
                label = { Text("Abréviation") },
                modifier = Modifier.fillMaxWidth()
            )

            ExposedDropdownMenuBox(
                expanded = expandedCycle,
                onExpandedChange = { expandedCycle = !expandedCycle }
            ) {
                val selectedCycle = cycles.find { it.idServeur == selectedCycleId }
                val cycleName = selectedCycle?.libelleCycleFr ?: "Sélectionner un cycle"
                OutlinedTextField(
                    value = cycleName,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Cycle") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedCycle) },
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expandedCycle,
                    onDismissRequest = { expandedCycle = false }
                ) {
                    cycles.forEach { cycle ->
                        DropdownMenuItem(
                            text = { Text(cycle.libelleCycleFr) },
                            onClick = {
                                selectedCycleId = cycle.idServeur ?: 0L
                                expandedCycle = false
                            }
                        )
                    }
                }
            }

            Button(
                onClick = {
                    val selectedCycle = cycles.find { it.idServeur == selectedCycleId }
                    val classe = ClasseEntity(
                        idAnneeScolaire = idAnneeScolaire,
                        idCycleLocal = selectedCycle?.idLocal ?: 0L, 
                        idCycleServeur = selectedCycle?.idServeur,
                        libelleClasseFr = libelle,
                        libelleClasseEn = libelle,
                        libelleClasseEs = libelle,
                        abreviation = abreviation
                    )
                    onConfirm(classe)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = libelle.isNotBlank() && selectedCycleId > 0L,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
            ) {
                Text("Créer la classe")
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddSalleBottomSheet(
    classe: ClasseUiModel,
    idAnneeScolaire: Long,
    onDismiss: () -> Unit,
    onConfirm: (SalleEntity) -> Unit
) {
    var nomSalle by remember { mutableStateOf("") }
    var capacite by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF2C3E50),
        contentColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Ajouter une salle à ${classe.libelleClasseFr}", style = MaterialTheme.typography.titleLarge)
            
            OutlinedTextField(
                value = nomSalle,
                onValueChange = { nomSalle = it },
                label = { Text("Nom/Numéro de la salle (ex: Salle 101)") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = capacite,
                onValueChange = { if (it.all { char -> char.isDigit() }) capacite = it },
                label = { Text("Capacité (Nombre d'élèves)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )

            Button(
                onClick = {
                    val salle = SalleEntity(
                        idClasseServeur = classe.idClasse,
                        idAnneeScolaire = idAnneeScolaire,
                        nomSalle = nomSalle,
                        capacite = capacite.toIntOrNull()
                    )
                    onConfirm(salle)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = nomSalle.isNotBlank() && capacite.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
            ) {
                Text("Enregistrer la salle")
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
