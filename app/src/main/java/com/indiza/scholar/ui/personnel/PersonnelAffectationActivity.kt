package com.indiza.scholar.ui.personnel

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.PersonnelRepository
import com.indiza.scholar.ui.theme.ScholarTheme

enum class AffectationStep { SELECT_ENSEIGNANT, SELECT_SALLE, SELECT_MATIERE, SUMMARY }

class PersonnelAffectationActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val idAnnee = intent.getLongExtra("idAnnee", 0)
        val schoolId = intent.getLongExtra("schoolId", 0)

        setContent {
            ScholarTheme {
                val context = LocalContext.current
                val api = ApiClient.create {
                    context.getSharedPreferences("user_session", Context.MODE_PRIVATE).getString("token", null)
                }.create(ApiService::class.java)
                val repo = PersonnelRepository(api)
                val viewModel: PersonnelManagementViewModel = viewModel(
                    factory = object : androidx.lifecycle.ViewModelProvider.Factory {
                        override fun <T : androidx.lifecycle.ViewModel> create(modelClass: Class<T>): T {
                            return PersonnelManagementViewModel(repo, schoolId, idAnnee) as T
                        }
                    }
                )

                PersonnelAffectationWizard(idAnnee, viewModel) { finish() }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PersonnelAffectationWizard(
    idAnnee: Long,
    viewModel: PersonnelManagementViewModel,
    onBack: () -> Unit
) {
    var currentStep by remember { mutableStateOf(AffectationStep.SELECT_ENSEIGNANT) }
    var selectedEnseignant by remember { mutableStateOf<InscriptionPersonnelEntity?>(null) }
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedMatiere by remember { mutableStateOf<MatiereEntity?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Affectation Enseignant", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = {
                        when (currentStep) {
                            AffectationStep.SELECT_ENSEIGNANT -> onBack()
                            AffectationStep.SELECT_SALLE -> currentStep = AffectationStep.SELECT_ENSEIGNANT
                            AffectationStep.SELECT_MATIERE -> currentStep = AffectationStep.SELECT_SALLE
                            AffectationStep.SUMMARY -> currentStep = AffectationStep.SELECT_MATIERE
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            // Breadcrumb Summary
            AffectationSummary(selectedEnseignant, selectedSalle, selectedMatiere)

            Spacer(modifier = Modifier.height(24.dp))

            Box(modifier = Modifier.weight(1f)) {
                AnimatedContent(targetState = currentStep, label = "step_transition") { step ->
                    when (step) {
                        AffectationStep.SELECT_ENSEIGNANT -> SelectEnseignantStep(viewModel) {
                            selectedEnseignant = it
                            currentStep = AffectationStep.SELECT_SALLE
                        }
                        AffectationStep.SELECT_SALLE -> SelectSalleStep(idAnnee, viewModel) {
                            selectedSalle = it
                            currentStep = AffectationStep.SELECT_MATIERE
                        }
                        AffectationStep.SELECT_MATIERE -> SelectMatiereStep(selectedEnseignant!!, viewModel) {
                            selectedMatiere = it
                            currentStep = AffectationStep.SUMMARY
                        }
                        AffectationStep.SUMMARY -> AffectationFinalStep(
                            selectedEnseignant!!,
                            selectedSalle!!,
                            selectedMatiere!!,
                            viewModel
                        ) {
                            onBack()
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AffectationSummary(enseignant: InscriptionPersonnelEntity?, salle: SalleEntity?, matiere: MatiereEntity?) {
    Column(modifier = Modifier.fillMaxWidth().background(Color(0xFF2C3E50), RoundedCornerShape(8.dp)).padding(12.dp)) {
        SummaryRow("Enseignant", enseignant?.let { "${it.nom} ${it.prenom ?: ""}" } ?: "Non choisi")
        SummaryRow("Salle", salle?.let { if (it.classeLabel != null) "${it.classeLabel} ${it.nomSalle}" else it.nomSalle } ?: "Non choisie")
        SummaryRow("Matière", matiere?.libelleFr ?: "Non choisie")
    }
}

@Composable
fun SummaryRow(label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            tint = if (value != "Non choisi" && value != "Non choisie") Color(0xFF2ECC71) else Color.Gray,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text("$label: ", color = Color.Gray, fontSize = 12.sp)
        Text(value, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun SelectEnseignantStep(viewModel: PersonnelManagementViewModel, onSelected: (InscriptionPersonnelEntity) -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        Text("Étape 1 : Choisir l'enseignant", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Rechercher par nom...") },
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = { Icon(Icons.Default.Search, null) }
        )
        Spacer(modifier = Modifier.height(8.dp))

        when (val state = uiState) {
            is PersonnelUIState.Loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Color(0xFF1ABC9C)) }
            is PersonnelUIState.Success -> {
                val teachers = state.list.filter { it.role.contains("ENSEIGNANT") && (it.nom.contains(searchQuery, true) || (it.prenom?.contains(searchQuery, true) ?: false)) }
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(teachers) { teacher ->
                        Card(
                            modifier = Modifier.fillMaxWidth().clickable { onSelected(teacher) },
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                        ) {
                            ListItem(
                                headlineContent = { Text("${teacher.nom} ${teacher.prenom ?: ""}", color = Color.White) },
                                supportingContent = { Text(teacher.role, color = Color.Gray) },
                                colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                            )
                        }
                    }
                }
            }
            else -> {}
        }
    }
}

@Composable
fun SelectSalleStep(idAnnee: Long, viewModel: PersonnelManagementViewModel, onSelected: (SalleEntity) -> Unit) {
    val salles by viewModel.sallesDisponibles.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(idAnnee) {
        viewModel.loadSalles(idAnnee)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Text("Étape 2 : Choisir la salle de classe", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Rechercher une salle...") },
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = { Icon(Icons.Default.Search, null) }
        )
        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(salles.filter { it.nomSalle.contains(searchQuery, true) || (it.classeLabel?.contains(searchQuery, true) ?: false) }) { salle ->
                val label = if (salle.classeLabel != null) "${salle.classeLabel} ${salle.nomSalle}" else salle.nomSalle
                Card(
                    modifier = Modifier.fillMaxWidth().clickable { onSelected(salle) },
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                ) {
                    ListItem(
                        headlineContent = { Text(label, color = Color.White) },
                        colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                    )
                }
            }
        }
    }
}

@Composable
fun SelectMatiereStep(enseignant: InscriptionPersonnelEntity, viewModel: PersonnelManagementViewModel, onSelected: (MatiereEntity) -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("Étape 3 : Choisir la matière", color = Color(0xFF1ABC9C), fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))

        val specialites = enseignant.specialites
        if (specialites.isNullOrEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Cet enseignant n'a pas de spécialités définies.", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(specialites) { matiere ->
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onSelected(matiere) },
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50))
                    ) {
                        ListItem(
                            headlineContent = { Text(matiere.libelleFr, color = Color.White) },
                            colors = ListItemDefaults.colors(containerColor = Color.Transparent)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AffectationFinalStep(
    enseignant: InscriptionPersonnelEntity,
    salle: SalleEntity,
    matiere: MatiereEntity,
    viewModel: PersonnelManagementViewModel,
    onFinish: () -> Unit
) {
    val context = LocalContext.current
    var isSaving by remember { mutableStateOf(false) }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        Text("Confirmation de l'affectation", color = Color.White, style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(24.dp))
        
        val roomLabel = if (salle.classeLabel != null) "${salle.classeLabel} ${salle.nomSalle}" else salle.nomSalle
        Text("Vous allez affecter ${enseignant.nom} à la salle $roomLabel pour la matière ${matiere.libelleFr}.", 
            color = Color.LightGray, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = {
                isSaving = true
                viewModel.affecterPersonnel(
                    AffectationPayload(
                        idInscriptionPersonnel = enseignant.idServeur!!,
                        idSalle = salle.idServeur!!,
                        idMatiere = matiere.idServeur!!
                    )
                ) { success ->
                    isSaving = false
                    if (success) {
                        Toast.makeText(context, "Affectation réussie", Toast.LENGTH_SHORT).show()
                        onFinish()
                    } else {
                        Toast.makeText(context, "Erreur lors de l'affectation", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C)),
            enabled = !isSaving
        ) {
            if (isSaving) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
            } else {
                Text("Valider l'affectation")
            }
        }
    }
}
