package com.indiza.scholar.ui.student

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.indiza.scholar.model.MatiereEntity
import com.indiza.scholar.ui.theme.ScholarTheme

class MatiereManagementActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ScholarTheme {
                MatiereManagementScreen(onBack = { finish() })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatiereManagementScreen(onBack: () -> Unit) {
    var showAddSheet by remember { mutableStateOf(false) }
    val matieres = remember { mutableStateListOf<MatiereEntity>() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gestion des Matières") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A), titleContentColor = Color.White)
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showAddSheet = true }, containerColor = Color(0xFF1ABC9C)) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White)
            }
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(matieres) { matiere ->
                    MatiereItem(matiere)
                }
            }
        }
    }

    if (showAddSheet) {
        ModalBottomSheet(onDismissRequest = { showAddSheet = false }, containerColor = Color(0xFF2C3E50)) {
            AddMatiereForm(onAdd = { 
                matieres.add(it)
                showAddSheet = false 
            })
        }
    }
}

@Composable
fun MatiereItem(matiere: MatiereEntity) {
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))) {
        Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(matiere.libelleFr, color = Color.White, style = MaterialTheme.typography.titleMedium)
                Text(matiere.abreviation ?: "", color = Color.Gray, style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
fun AddMatiereForm(onAdd: (MatiereEntity) -> Unit) {
    var libelle by remember { mutableStateOf("") }
    var abrev by remember { mutableStateOf("") }

    Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Nouvelle Matière", style = MaterialTheme.typography.headlineSmall, color = Color.White)
        OutlinedTextField(value = libelle, onValueChange = { libelle = it }, label = { Text("Libellé (FR)") }, modifier = Modifier.fillMaxWidth())
        OutlinedTextField(value = abrev, onValueChange = { abrev = it }, label = { Text("Abréviation") }, modifier = Modifier.fillMaxWidth())
        Button(
            onClick = { onAdd(MatiereEntity(libelleFr = libelle, libelleEn = null, libelleEs = null, abreviation = abrev)) },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Créer la matière")
        }
        Spacer(modifier = Modifier.height(32.dp))
    }
}
