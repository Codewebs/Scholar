package com.indiza.scholar.ui.settings

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.PeriodeEntity
import com.indiza.scholar.model.SousPeriodeEntity
import com.indiza.scholar.ui.home.SelectableDateField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PeriodeManagementScreen(
    idAnneeScolaire: Long,
    viewModel: PeriodeViewModel,
    onBack: () -> Unit
) {
    val periodes by viewModel.periodes.collectAsState()
    val saveState by viewModel.saveState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    var showPeriodeDialog by remember { mutableStateOf<PeriodeEntity?>(null) }
    var showSousPeriodeDialog by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    var parentPeriodeForSub by remember { mutableStateOf<Long?>(null) }
    var showCloneDialog by remember { mutableStateOf(false) }

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadPeriodes(idAnneeScolaire)
    }

    LaunchedEffect(saveState) {
        when (saveState) {
            is SaveState.SUCCESS -> {
                snackbarHostState.showSnackbar("Opération réussie")
                viewModel.resetSaveState()
            }
            is SaveState.ERROR -> {
                snackbarHostState.showSnackbar((saveState as SaveState.ERROR).error)
                // Not resetting error immediately so it stays visible in dialogs if they are open
            }
            else -> {}
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Périodes & Séquences", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = { showCloneDialog = true }) {
                        Icon(Icons.Default.ContentCopy, "Cloner", tint = Color.White)
                    }
                IconButton(onClick = { showPeriodeDialog = PeriodeEntity(libellePeriodeFr = "", abrevLibelleFr = "", idAnneeScolaire = idAnneeScolaire, dateDebut = "", dateFin = "") }) {
                    Icon(Icons.Default.Add, null, tint = Color.White)
                }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            if (periodes.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Aucune période configurée.", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    items(periodes) { periode ->
                        PeriodeItem(
                            periode = periode,
                            onEdit = { showPeriodeDialog = it },
                            onDelete = { it.idServeur?.let { id -> viewModel.deletePeriode(id, idAnneeScolaire) } },
                            onAddSub = { 
                                parentPeriodeForSub = periode.idServeur
                                showSousPeriodeDialog = SousPeriodeEntity(
                                    idPeriodeServeur = periode.idServeur, 
                                    libelleSousPeriodeFr = "", 
                                    dateDebut = periode.dateDebut, 
                                    dateFin = periode.dateFin
                                )
                            },
                            onEditSub = { sp -> showSousPeriodeDialog = sp },
                            onDeleteSub = { sp -> sp.idServeur?.let { id -> viewModel.deleteSousPeriode(id, idAnneeScolaire) } }
                        )
                    }
                }
            }
        }
    }

    showPeriodeDialog?.let {
        PeriodeDialog(
            periode = it,
            saveState = saveState,
            onDismiss = { showPeriodeDialog = null; viewModel.resetSaveState() },
            onSave = { p -> viewModel.savePeriode(p, idAnneeScolaire) }
        )
    }

    showSousPeriodeDialog?.let {
        SousPeriodeDialog(
            sp = it,
            saveState = saveState,
            onDismiss = { showSousPeriodeDialog = null; viewModel.resetSaveState() },
            onSave = { sp -> viewModel.saveSousPeriode(sp, idAnneeScolaire) }
        )
    }

    if (showCloneDialog) {
        ClonePeriodesDialog(
            saveState = saveState,
            onDismiss = { showCloneDialog = false; viewModel.resetSaveState() },
            onConfirm = { idSource -> viewModel.clonePeriodes(idSource, idAnneeScolaire) }
        )
    }
}

@Composable
fun ClonePeriodesDialog(
    saveState: SaveState,
    onDismiss: () -> Unit,
    onConfirm: (Long) -> Unit
) {
    var sourceId by remember { mutableStateOf("") }
    
    LaunchedEffect(saveState) {
        if (saveState is SaveState.SUCCESS) onDismiss()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Cloner les périodes") },
        text = {
            Column {
                Text("Entrez l'ID de l'année scolaire source (ex: de l'an passé)", fontSize = 14.sp)
                OutlinedTextField(
                    value = sourceId,
                    onValueChange = { if (it.all { c -> c.isDigit() }) sourceId = it },
                    label = { Text("ID Année Source") },
                    modifier = Modifier.fillMaxWidth()
                )
                if (saveState is SaveState.ERROR) Text(saveState.error, color = Color.Red, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = { sourceId.toLongOrNull()?.let { onConfirm(it) } }, enabled = sourceId.isNotBlank() && saveState !is SaveState.SAVING_REMOTE) {
                if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Cloner")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } }
    )
}

@Composable
fun PeriodeItem(
    periode: PeriodeEntity,
    onEdit: (PeriodeEntity) -> Unit,
    onDelete: (PeriodeEntity) -> Unit,
    onAddSub: () -> Unit,
    onEditSub: (SousPeriodeEntity) -> Unit,
    onDeleteSub: (SousPeriodeEntity) -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(periode.libellePeriodeFr, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        if (periode.abrevLibelleFr.isNotBlank()) {
                            Text(" (${periode.abrevLibelleFr})", color = Color.White.copy(alpha = 0.5f), fontSize = 12.sp)
                        }
                    }
                    Text("${periode.dateDebut} au ${periode.dateFin}", color = Color(0xFF1ABC9C), fontSize = 12.sp)
                }
                IconButton(onClick = { onEdit(periode) }) { Icon(Icons.Default.Edit, null, tint = Color.Gray, modifier = Modifier.size(20.dp)) }
                IconButton(onClick = { onDelete(periode) }) { Icon(Icons.Default.Delete, null, tint = Color.Red.copy(alpha = 0.7f), modifier = Modifier.size(20.dp)) }
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
            Spacer(modifier = Modifier.height(8.dp))

            periode.sousPeriodes.forEach { sp ->
                Row(modifier = Modifier.padding(vertical = 4.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.SubdirectoryArrowRight, null, tint = Color.Gray, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(sp.libelleSousPeriodeFr, color = Color.White, fontSize = 14.sp)
                            if (sp.abrevLibelleFr.isNotBlank()) {
                                Text(" (${sp.abrevLibelleFr})", color = Color.Gray, fontSize = 10.sp)
                            }
                        }
                        Text("${sp.dateDebut} au ${sp.dateFin}", color = Color.Gray, fontSize = 10.sp)
                    }
                    IconButton(onClick = { onEditSub(sp) }) { Icon(Icons.Default.Edit, null, tint = Color.Gray, modifier = Modifier.size(16.dp)) }
                    IconButton(onClick = { onDeleteSub(sp) }) { Icon(Icons.Default.Delete, null, tint = Color.Red.copy(alpha = 0.5f), modifier = Modifier.size(16.dp)) }
                }
            }

            TextButton(onClick = onAddSub, modifier = Modifier.align(Alignment.End)) {
                Icon(Icons.Default.Add, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Ajouter une séquence", fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun PeriodeDialog(
    periode: PeriodeEntity,
    saveState: SaveState,
    onDismiss: () -> Unit,
    onSave: (PeriodeEntity) -> Unit
) {
    var libelle by remember { mutableStateOf(periode.libellePeriodeFr) }
    var abrev by remember { mutableStateOf(periode.abrevLibelleFr) }
    var start by remember { mutableStateOf(periode.dateDebut) }
    var end by remember { mutableStateOf(periode.dateFin) }

    LaunchedEffect(saveState) {
        if (saveState is SaveState.SUCCESS) onDismiss()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (periode.idServeur != null && periode.idServeur > 0) "Modifier Période" else "Nouvelle Période") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = libelle, onValueChange = { libelle = it }, label = { Text("Libellé (ex: Trimestre 1)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = abrev, 
                    onValueChange = { abrev = it }, 
                    label = { Text("Abréviation (Obligatoire)") },
                    placeholder = { Text("ex: TRIM 1") },
                    supportingText = { Text("Sert de nom de colonne dans les bulletins", fontSize = 10.sp) },
                    modifier = Modifier.fillMaxWidth()
                )
                SelectableDateField(label = "Date début", value = start, onDateSelected = { start = it })
                SelectableDateField(label = "Date fin", value = end, onDateSelected = { end = it })
                if (saveState is SaveState.ERROR) Text(saveState.error, color = Color.Red, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = { onSave(periode.copy(libellePeriodeFr = libelle, abrevLibelleFr = abrev, dateDebut = start, dateFin = end)) }, enabled = libelle.isNotBlank() && abrev.isNotBlank() && start.isNotBlank() && end.isNotBlank() && saveState !is SaveState.SAVING_REMOTE) {
                if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Enregistrer")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } }
    )
}

@Composable
fun SousPeriodeDialog(
    sp: SousPeriodeEntity,
    saveState: SaveState,
    onDismiss: () -> Unit,
    onSave: (SousPeriodeEntity) -> Unit
) {
    var libelle by remember { mutableStateOf(sp.libelleSousPeriodeFr) }
    var abrev by remember { mutableStateOf(sp.abrevLibelleFr) }
    var start by remember { mutableStateOf(sp.dateDebut) }
    var end by remember { mutableStateOf(sp.dateFin) }

    LaunchedEffect(saveState) {
        if (saveState is SaveState.SUCCESS) onDismiss()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (sp.idServeur != null && sp.idServeur > 0) "Modifier Séquence" else "Nouvelle Séquence") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = libelle, onValueChange = { libelle = it }, label = { Text("Libellé (ex: Séquence 1)") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(
                    value = abrev, 
                    onValueChange = { abrev = it }, 
                    label = { Text("Abréviation (Obligatoire)") },
                    placeholder = { Text("ex: SEQ 1") },
                    supportingText = { Text("Sert de nom de colonne dans les bulletins", fontSize = 10.sp) },
                    modifier = Modifier.fillMaxWidth()
                )
                SelectableDateField(label = "Date début", value = start, onDateSelected = { start = it })
                SelectableDateField(label = "Date fin", value = end, onDateSelected = { end = it })
                if (saveState is SaveState.ERROR) Text(saveState.error, color = Color.Red, fontSize = 12.sp)
            }
        },
        confirmButton = {
            Button(onClick = { onSave(sp.copy(libelleSousPeriodeFr = libelle, abrevLibelleFr = abrev, dateDebut = start, dateFin = end)) }, enabled = libelle.isNotBlank() && abrev.isNotBlank() && start.isNotBlank() && end.isNotBlank() && saveState !is SaveState.SAVING_REMOTE) {
                if (saveState is SaveState.SAVING_REMOTE) CircularProgressIndicator(modifier = Modifier.size(20.dp))
                else Text("Enregistrer")
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Annuler") } }
    )
}
