package com.indiza.scholar.ui.salle

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.ClasseUiModel
import com.indiza.scholar.model.SalleEntity
import com.indiza.scholar.ui.settings.SaveState
import com.indiza.scholar.ui.student.ClasseManagementActivity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalleManagementScreen(
    idAnneeScolaire: Long,
    viewModel: SalleManagementViewModel,
    onBack: () -> Unit
) {
    val classes by viewModel.classes.collectAsState()
    var selectedClasseForSalle by remember { mutableStateOf<ClasseUiModel?>(null) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadClassesWithStats(idAnneeScolaire)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gestion des Salles", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            if (classes.isEmpty()) {
                EmptyClassesView(idAnneeScolaire)
            } else {
                Text(
                    text = "Sélectionnez une classe pour y ajouter une salle",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.LightGray,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(classes) { classe ->
                        ClasseCard(classe) {
                            selectedClasseForSalle = it
                        }
                    }
                }
            }
        }
    }

    if (selectedClasseForSalle != null) {
        ModalBottomSheet(
            onDismissRequest = { 
                viewModel.resetSaveState()
                selectedClasseForSalle = null 
            },
            sheetState = sheetState,
            containerColor = Color(0xFF2C3E50),
            contentColor = Color.White
        ) {
            AddSalleForm(
                classe = selectedClasseForSalle!!,
                viewModel = viewModel,
                onSuccess = {
                    viewModel.loadClassesWithStats(idAnneeScolaire)
                    selectedClasseForSalle = null
                }
            )
        }
    }
}

@Composable
fun EmptyClassesView(idAnneeScolaire: Long) {
    val context = LocalContext.current
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Aucune classe configurée", color = Color.White, style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "Veuillez d'abord définir la structure de vos classes.",
            color = Color.Gray,
            modifier = Modifier.padding(horizontal = 32.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = {
                val intent = Intent(context, ClasseManagementActivity::class.java)
                intent.putExtra("idAnneeScolaire", idAnneeScolaire)
                context.startActivity(intent)
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            Text("Gérer les classes")
        }
    }
}

@Composable
fun ClasseCard(classe: ClasseUiModel, onClick: (ClasseUiModel) -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick(classe) },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = classe.libelleClasseFr, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(text = classe.cycleLabel, color = Color(0xFF1ABC9C), fontSize = 14.sp)
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Surface(
                    color = Color(0xFF34495E),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "${classe.roomCount} salle(s)",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        color = Color.White,
                        fontSize = 12.sp
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Icon(Icons.Default.Add, contentDescription = null, tint = Color(0xFF1ABC9C))
            }
        }
    }
}

@Composable
fun AddSalleForm(
    classe: ClasseUiModel,
    viewModel: SalleManagementViewModel,
    onSuccess: () -> Unit
) {
    var nomSalle by remember { mutableStateOf("") }
    var capacite by remember { mutableStateOf("") }
    val saveState by viewModel.saveState.collectAsState()
    
    LaunchedEffect(saveState) {
        if (saveState is SaveState.SUCCESS) {
            onSuccess()
        }
    }

    Column(
        modifier = Modifier.padding(16.dp).fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Ajouter une salle à ${classe.libelleClasseFr}",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        OutlinedTextField(
            value = nomSalle,
            onValueChange = { nomSalle = it },
            label = { Text("Nom de la salle (ex: Salle A)") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF1ABC9C))
        )

        OutlinedTextField(
            value = capacite,
            onValueChange = { if (it.all { char -> char.isDigit() }) capacite = it },
            label = { Text("Capacité (nombre d'élèves)") },
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Color(0xFF1ABC9C))
        )

        if (saveState is SaveState.ERROR) {
            Text((saveState as SaveState.ERROR).error, color = Color.Red, fontSize = 12.sp)
        }

        Button(
            onClick = {
                if (nomSalle.isNotBlank()) {
                    val salle = SalleEntity(
                        idClasseServeur = classe.idClasse,
                        idAnneeScolaire = classe.idAnneeScolaire,
                        nomSalle = nomSalle,
                        capacite = capacite.toIntOrNull()
                    )
                    viewModel.createSalle(salle, classe.idAnneeScolaire ?: 0L)
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = saveState !is SaveState.SAVING_REMOTE,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
        ) {
            if (saveState is SaveState.SAVING_REMOTE) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
            } else {
                Text("Enregistrer la salle")
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
