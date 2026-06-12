package com.indiza.scholar.ui.personnel

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
import androidx.lifecycle.viewmodel.compose.viewModel
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiClient
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.PersonnelRepository
import com.indiza.scholar.ui.theme.ScholarTheme

class EquipePedagogiqueActivity : ComponentActivity() {
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

                EquipePedagogiqueScreen(idAnnee, schoolId, viewModel) { finish() }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EquipePedagogiqueScreen(
    idAnnee: Long,
    schoolId: Long,
    viewModel: PersonnelManagementViewModel,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val salles by viewModel.sallesDisponibles.collectAsState()
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Équipe Pédagogique", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1E2A3A))
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = {
                    val intent = Intent(context, com.indiza.scholar.ui.personnel.PersonnelAffectationActivity::class.java)
                    intent.putExtra("idAnnee", idAnnee)
                    intent.putExtra("schoolId", schoolId)
                    context.startActivity(intent)
                },
                containerColor = Color(0xFF1ABC9C),
                contentColor = Color.White,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Affecter") }
            )
        },
        containerColor = Color(0xFF1E2A3A)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            Text(
                "Salles de classe",
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFF1ABC9C),
                modifier = Modifier.padding(bottom = 16.dp)
            )

            if (salles.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Aucune salle trouvée", color = Color.Gray)
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    items(salles) { salle ->
                        SalleCard(salle) {
                            selectedSalle = salle
                        }
                    }
                }
            }
        }

        if (selectedSalle != null) {
            ModalBottomSheet(
                onDismissRequest = { selectedSalle = null },
                containerColor = Color(0xFF1E2A3A),
                sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
            ) {
                EnseignantsBySalleContent(selectedSalle!!, viewModel)
            }
        }
    }

    LaunchedEffect(idAnnee) {
        viewModel.loadSalles(idAnnee)
    }
}

@Composable
fun SalleCard(salle: SalleEntity, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2C3E50)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(48.dp).background(Color(0xFF1ABC9C).copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.MeetingRoom, null, tint = Color(0xFF1ABC9C))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                val label = if (salle.classeLabel != null) "${salle.classeLabel} ${salle.nomSalle}" else salle.nomSalle
                Text(label, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text("${salle.elevesInscrits} élèves inscrits", color = Color.Gray, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, null, tint = Color.Gray)
        }
    }
}

@Composable
fun EnseignantsBySalleContent(salle: SalleEntity, viewModel: PersonnelManagementViewModel) {
    val enseignants by viewModel.enseignantsBySalle.collectAsState()
    val isLoading by viewModel.isLoadingAffectations.collectAsState()

    LaunchedEffect(salle.idServeur) {
        salle.idServeur?.let { viewModel.loadEnseignantsBySalle(it) }
    }

    Column(modifier = Modifier.fillMaxWidth().padding(16.dp).heightIn(min = 300.dp)) {
        val label = if (salle.classeLabel != null) "${salle.classeLabel} ${salle.nomSalle}" else salle.nomSalle
        Text("Enseignants - $label", style = MaterialTheme.typography.titleLarge, color = Color(0xFF1ABC9C))
        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF1ABC9C))
            }
        } else if (enseignants.isEmpty()) {
            Box(Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                Text("Aucun enseignant affecté", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(enseignants) { affectation ->
                    AffectationItem(affectation)
                }
            }
        }
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun AffectationItem(affectation: AffectationPersonnelSalleResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF34495E).copy(alpha = 0.5f))
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Person, null, tint = Color(0xFF3498DB), modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(affectation.nomComplet, color = Color.White, fontWeight = FontWeight.Medium)
                Text(affectation.matiereLabel, color = Color(0xFFF1C40F), fontSize = 12.sp)
            }
        }
    }
}
