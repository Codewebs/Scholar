package com.indiza.scholar.ui.matieres

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.MatiereKPIs
import com.indiza.scholar.model.MatiereEntity
import com.indiza.scholar.ui.settings.SaveState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatiereDashboardScreen(
    idAnneeScolaire: Long,
    viewModel: MatiereViewModel,
    onBack: () -> Unit
) {
    val kpis by viewModel.kpis.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val saveState by viewModel.saveState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var searchQuery by remember { mutableStateOf("") }
    var showAddDialog by remember { mutableStateOf(false) }
    var matiereToEdit by remember { mutableStateOf<MatiereEntity?>(null) }
    var showLibrarySheet by remember { mutableStateOf(false) }
    var showRepartitionSheet by remember { mutableStateOf(false) }

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadKPIs(idAnneeScolaire)
        viewModel.loadGlobalLibrary()
        viewModel.loadRepartitionStats(idAnneeScolaire)
    }

    LaunchedEffect(saveState) {
        when (saveState) {
            is SaveState.SUCCESS -> {
                snackbarHostState.showSnackbar("Opération réussie")
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
                title = { Text("Dashboard Matières", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // 1. KPI Cards
            KPISection(
                kpis = kpis,
                onTotalClick = { showLibrarySheet = true },
                onRepartitionClick = { showRepartitionSheet = true }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 2. Action Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Rechercher...", color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = Color.Gray) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                )

                Button(
                    onClick = { showAddDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.height(56.dp)
                ) {
                    Icon(Icons.Default.Add, null)
                    Text("Matière")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 3. Central Table
            Text("Bibliothèque des Disciplines", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(12.dp))

            when (val state = uiState) {
                is MatiereUIState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
                is MatiereUIState.Success -> {
                    val filtered = state.list.filter { it.libelleFr.contains(searchQuery, ignoreCase = true) }
                    MatiereTable(
                        list = filtered,
                        onEdit = { matiereToEdit = it },
                        onDelete = { it.idServeur?.let { id -> viewModel.deleteMatiere(id) } }
                    )
                }
                is MatiereUIState.Error -> Text(state.message, color = Color.Red)
            }
        }
    }

    if (showAddDialog || matiereToEdit != null) {
        AddMatiereDialog(
            viewModel = viewModel,
            matiereToEdit = matiereToEdit,
            onDismiss = { 
                showAddDialog = false
                matiereToEdit = null
            }
        )
    }

    if (showLibrarySheet) {
        ModalBottomSheet(onDismissRequest = { showLibrarySheet = false }, containerColor = Color(0xFF2C3E50)) {
            LibraryListSheet(viewModel)
        }
    }

    if (showRepartitionSheet) {
        ModalBottomSheet(onDismissRequest = { showRepartitionSheet = false }, containerColor = Color(0xFF2C3E50)) {
            RepartitionStatsSheet(viewModel)
        }
    }
}

@Composable
fun KPISection(kpis: MatiereKPIs?, onTotalClick: () -> Unit, onRepartitionClick: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        KPICard(
            title = "Total Matières",
            value = kpis?.totalMatieres?.toString() ?: "...",
            icon = Icons.Default.Book,
            color = Color(0xFF3498DB),
            modifier = Modifier.weight(1f).clickable { onTotalClick() }
        )
        KPICard(
            title = "Taux Affect.",
            value = "${kpis?.tauxAffectation ?: "..."}%",
            icon = Icons.Default.Person,
            color = Color(0xFF1ABC9C),
            modifier = Modifier.weight(1f)
        )
    }
    Spacer(modifier = Modifier.height(12.dp))
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        KPICard(
            title = "Matières Réparties",
            value = kpis?.matieresReparties?.toString() ?: "...",
            icon = Icons.Default.Class,
            color = Color(0xFFE67E22),
            modifier = Modifier.weight(1f).clickable { onRepartitionClick() }
        )
        KPICard(
            title = "Moy. Coef",
            value = kpis?.avgCoef ?: "...",
            icon = Icons.Default.Functions,
            color = Color(0xFF9B59B6),
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun KPICard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(6.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(5.dp))
                Text(
                    text = value,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = title, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), fontSize = 12.sp)
        }
    }
}

@Composable
fun MatiereTable(list: List<MatiereEntity>, onEdit: (MatiereEntity) -> Unit, onDelete: (MatiereEntity) -> Unit) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items(list) { matiere ->
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(6.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(35.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primaryContainer), contentAlignment = Alignment.Center) {
                        Text(matiere.libelleFr.take(1).uppercase(), color = MaterialTheme.colorScheme.onPrimaryContainer, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(matiere.libelleFr, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
                        Text(matiere.abreviation ?: "Pas d'abr.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), fontSize = 8.sp)
                    }
                    IconButton(onClick = { onEdit(matiere) }) { Icon(Icons.Default.Edit, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)) }
                    IconButton(onClick = { onDelete(matiere) }) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error.copy(alpha = 0.7f)) }
                }
            }
        }
    }
}

@Composable
fun AddMatiereDialog(viewModel: MatiereViewModel, matiereToEdit: MatiereEntity? = null, onDismiss: () -> Unit) {
    var libFr by remember { mutableStateOf(matiereToEdit?.libelleFr ?: "") }
    var libEn by remember { mutableStateOf(matiereToEdit?.libelleEn ?: "") }
    var abreviation by remember { mutableStateOf(matiereToEdit?.abreviation ?: "") }
    val saveState by viewModel.saveState.collectAsState()

    LaunchedEffect(saveState) {
        if (saveState is SaveState.SUCCESS) {
            viewModel.resetSaveState()
            onDismiss()
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (matiereToEdit == null) "Ajouter une matière" else "Modifier la matière") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = libFr, onValueChange = { libFr = it }, label = { Text("Libellé FR") })
                OutlinedTextField(value = libEn, onValueChange = { libEn = it }, label = { Text("Libellé EN") })
                OutlinedTextField(value = abreviation, onValueChange = { abreviation = it }, label = { Text("Abréviation") })
                if (saveState is SaveState.ERROR) {
                    Text((saveState as SaveState.ERROR).error, color = Color.Red, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { 
                    if (matiereToEdit == null) viewModel.createMatiere(libFr, libEn, abreviation)
                    else matiereToEdit.idServeur?.let { id -> viewModel.updateMatiere(id, libFr, libEn, abreviation) }
                },
                enabled = libFr.isNotBlank() && saveState !is SaveState.SAVING_REMOTE
            ) {
                if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text(if (matiereToEdit == null) "Créer" else "Enregistrer")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } }
    )
}

@Composable
fun LibraryListSheet(viewModel: MatiereViewModel) {
    val state by viewModel.uiState.collectAsState()
    Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Bibliothèque Globale", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(16.dp))
        when (state) {
            is MatiereUIState.Success -> {
                LazyColumn(modifier = Modifier.heightIn(max = 400.dp)) {
                    items((state as MatiereUIState.Success).list) { matiere ->
                        ListItem(
                            headlineContent = { Text(matiere.libelleFr, color = MaterialTheme.colorScheme.onSurface) },
                            supportingContent = { Text(matiere.abreviation ?: "", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)) },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }
            else -> CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
fun RepartitionStatsSheet(viewModel: MatiereViewModel) {
    val stats by viewModel.repartitionStats.collectAsState()
    Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Répartition par Classe", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onSurface)
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(modifier = Modifier.heightIn(max = 400.dp)) {
            items(stats) { stat ->
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(stat.libelle, color = MaterialTheme.colorScheme.onSurface)
                    Text("${stat.count} matières", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
            }
        }
    }
}
