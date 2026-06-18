package com.indiza.scholar.ui.matieres

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.GroupeMatiereEntity
import com.indiza.scholar.ui.settings.SaveState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GroupManagementScreen(
    viewModel: MatiereViewModel,
    onBack: () -> Unit
) {
    val groups by viewModel.groups.collectAsState()
    val saveState by viewModel.saveState.collectAsState()
    var showDialog by remember { mutableStateOf(false) }
    var editingGroup by remember { mutableStateOf<GroupeMatiereEntity?>(null) }
    var libelle by remember { mutableStateOf("") }
    var ordre by remember { mutableStateOf("1") }

    LaunchedEffect(Unit) {
        viewModel.loadGroups()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gestion des Groupes", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A)),
                actions = {
                    IconButton(onClick = {
                        editingGroup = null
                        libelle = ""
                        ordre = "1"
                        showDialog = true
                    }) {
                        Icon(Icons.Default.Add, null, tint = Color.White)
                    }
                }
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            LazyColumn(modifier = Modifier.weight(1f).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(groups) { group ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(group.libelleFr, color = Color.White, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                                Text("Ordre: ${group.ordre}", color = Color.Gray, fontSize = 12.sp)
                            }
                            IconButton(onClick = {
                                editingGroup = group
                                libelle = group.libelleFr
                                ordre = group.ordre.toString()
                                showDialog = true
                            }) {
                                Icon(Icons.Default.Edit, null, tint = Color(0xFF3498DB))
                            }
                            IconButton(onClick = {
                                viewModel.deleteGroup(group.idServeur ?: 0L)
                            }) {
                                Icon(Icons.Default.Delete, null, tint = Color.Red)
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text(if (editingGroup == null) "Nouveau Groupe" else "Modifier Groupe") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = libelle,
                        onValueChange = { libelle = it },
                        label = { Text("Libellé (Fr)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = ordre,
                        onValueChange = { ordre = it },
                        label = { Text("Ordre") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number)
                    )
                }
            },
            confirmButton = {
                Button(onClick = {
                    val o = ordre.toIntOrNull() ?: 1
                    if (editingGroup == null) {
                        viewModel.createGroup(libelle, o)
                    } else {
                        viewModel.updateGroup(editingGroup!!.idServeur ?: 0L, libelle, o)
                    }
                    showDialog = false
                }) {
                    Text("Enregistrer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) { Text("Annuler") }
            }
        )
    }
}
