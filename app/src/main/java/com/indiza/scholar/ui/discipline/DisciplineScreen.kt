package com.indiza.scholar.ui.discipline

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.*
import com.indiza.scholar.ui.components.AbsenceItemRow
import com.indiza.scholar.ui.grades.SelectionBreadcrumbs
import com.indiza.scholar.ui.grades.SelectionList
import com.indiza.scholar.ui.grades.SelectionStep

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DisciplineScreen(
    idAnneeScolaire: Long,
    viewModel: DisciplineViewModel,
    onBack: () -> Unit
) {
    var selectedSalle by remember { mutableStateOf<SalleEntity?>(null) }
    var selectedSequence by remember { mutableStateOf<SousPeriodeEntity?>(null) }
    var selectedRepartition by remember { mutableStateOf<RepartitionMatiereEntity?>(null) }
    var selectedCompetence by remember { mutableStateOf<RepartitionCompetenceEntity?>(null) }
    var currentStep by remember { mutableStateOf(SelectionStep.SALLE) }

    val salles by viewModel.salles.collectAsState()
    val sequences by viewModel.sequences.collectAsState()
    val sequenceRepartition by viewModel.sequenceRepartition.collectAsState()
    val repartitions by viewModel.repartitions.collectAsState()
    val repartitionCompetences by viewModel.repartitionCompetences.collectAsState()
    val absences by viewModel.absences.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val hasChanges by viewModel.hasChanges.collectAsState()

    val filteredSequences = remember(selectedSalle, sequences, sequenceRepartition) {
        if (selectedSalle == null) emptyList()
        else {
            val allowedIds = sequenceRepartition
                .filter { it.idClasse == selectedSalle?.idClasseServeur && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            if (allowedIds.isEmpty()) sequences
            else sequences.filter { it.idServeur in allowedIds }
        }
    }

    LaunchedEffect(idAnneeScolaire) {
        viewModel.loadInitialData(idAnneeScolaire)
    }

    LaunchedEffect(selectedSalle, selectedSequence, selectedRepartition, selectedCompetence) {
        if (selectedSalle == null) {
            currentStep = SelectionStep.SALLE
        } else if (selectedSequence == null) {
            currentStep = SelectionStep.SEQUENCE
        } else if (selectedRepartition == null) {
            currentStep = SelectionStep.REPARTITION
            viewModel.loadRepartitions(idAnneeScolaire, selectedSalle!!.idClasseServeur ?: 0L)
        } else if (selectedCompetence == null) {
            currentStep = SelectionStep.COMPETENCE
            viewModel.loadCompetences(selectedRepartition!!.idRepartitionMatiere, selectedSequence!!.idServeur ?: 0L)
        } else {
            currentStep = SelectionStep.CONTENT
            viewModel.loadAbsences(
                selectedSalle!!.idServeur ?: 0L,
                selectedSequence!!.idServeur ?: 0L,
                idAnneeScolaire,
                selectedCompetence!!.id
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Module Discipline", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF2C3E50))
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize().background(Color(0xFF1E2A3A))) {
            Column(modifier = Modifier.fillMaxSize()) {
                SelectionBreadcrumbs(
                    steps = listOf(
                        "Salle" to (selectedSalle?.let { "${it.classeLabel} ${it.nomSalle}" }),
                        "Évaluation" to selectedSequence?.libelleSousPeriodeFr,
                        "Matière" to selectedRepartition?.detailsMatiere?.libelleFr,
                        "Compétence" to selectedCompetence?.detailsCompetence?.libelle
                    ),
                    onStepClick = { step ->
                        when (step) {
                            SelectionStep.SALLE -> {
                                selectedSalle = null
                                selectedSequence = null
                                selectedRepartition = null
                                selectedCompetence = null
                            }
                            SelectionStep.SEQUENCE -> {
                                selectedSequence = null
                                selectedRepartition = null
                                selectedCompetence = null
                            }
                            SelectionStep.REPARTITION -> {
                                selectedRepartition = null
                                selectedCompetence = null
                            }
                            SelectionStep.COMPETENCE -> {
                                selectedCompetence = null
                            }
                            else -> {}
                        }
                    }
                )

                when (currentStep) {
                    SelectionStep.SALLE -> {
                        SelectionList(
                            title = "Choisir une Salle",
                            items = salles,
                            itemContent = { salle ->
                                Column {
                                    Text("${salle.classeLabel} ${salle.nomSalle}", color = Color.White, fontWeight = FontWeight.Bold)
                                    Text(salle.classeLabel ?: "", color = Color.Gray, fontSize = 12.sp)
                                }
                            },
                            onItemClick = { selectedSalle = it }
                        )
                    }
                    SelectionStep.SEQUENCE -> {
                        SelectionList(
                            title = "Choisir une Évaluation",
                            items = filteredSequences,
                            itemContent = { seq ->
                                Text(seq.libelleSousPeriodeFr, color = Color.White, fontWeight = FontWeight.Bold)
                            },
                            onItemClick = { selectedSequence = it }
                        )
                    }
                    SelectionStep.REPARTITION -> {
                        SelectionList(
                            title = "Choisir une Matière",
                            items = repartitions,
                            itemContent = { rep ->
                                Text(rep.detailsMatiere?.libelleFr ?: "N/A", color = Color.White, fontWeight = FontWeight.Bold)
                            },
                            onItemClick = { selectedRepartition = it }
                        )
                    }
                    SelectionStep.COMPETENCE -> {
                        SelectionList(
                            title = "Choisir une Compétence",
                            items = repartitionCompetences,
                            itemContent = { rc ->
                                Text(rc.detailsCompetence?.libelle ?: "N/A", color = Color.White, fontWeight = FontWeight.Bold)
                            },
                            onItemClick = { selectedCompetence = it }
                        )
                    }
                    SelectionStep.CONTENT -> {
                        Column(modifier = Modifier.fillMaxSize()) {
                            if (absences.isNotEmpty()) {
                                LazyColumn(modifier = Modifier.weight(1f).padding(8.dp)) {
                                    itemsIndexed(absences) { index, abs ->
                                        AbsenceItemRow(
                                            absence = abs,
                                            onChanged = { aj, anj -> viewModel.updateAbsenceLocally(index, aj, anj) }
                                        )
                                    }
                                }

                                Button(
                                    onClick = {
                                        if (selectedSequence != null) {
                                            viewModel.saveAbsences(
                                                selectedSequence!!.idServeur ?: 0L,
                                                idAnneeScolaire,
                                                selectedCompetence?.id
                                            ) { }
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    enabled = hasChanges,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1ABC9C))
                                ) {
                                    Text(if (hasChanges) "Enregistrer les modifications" else "Données à jour")
                                }
                            } else if (isLoading) {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = Color(0xFF1ABC9C))
                                }
                            } else {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text("Aucun élève trouvé", color = Color.Gray)
                                }
                            }
                        }
                    }
                    else -> {}
                }
            }
        }
    }
}
