package com.indiza.scholar.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.indiza.scholar.model.ClasseUiModel
import com.indiza.scholar.model.SousPeriodeEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SequenceRepartitionScreen(
    yearId: Long,
    viewModel: SequenceRepartitionViewModel,
    onBack: () -> Unit
) {
    val classes by viewModel.classes.collectAsState()
    val sequences by viewModel.sequences.collectAsState()
    val repartition by viewModel.repartition.collectAsState()
    val loading by viewModel.loading.collectAsState()

    var selectedClasses by remember { mutableStateOf(setOf<Long>()) }
    var selectedSequences by remember { mutableStateOf(setOf<Long>()) }

    LaunchedEffect(yearId) {
        viewModel.loadData(yearId)
    }

    // Pre-fill when exactly one class is selected
    LaunchedEffect(selectedClasses) {
        if (selectedClasses.size == 1) {
            val classId = selectedClasses.first()
            val current = repartition.filter { it.idClasse == classId && !it.supprimer }
                .mapNotNull { it.idSousPeriode }
            selectedSequences = current.toSet()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Répartition Séquences", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null) }
                },
                actions = {
                    if (!loading) {
                        Button(
                            onClick = {
                                viewModel.bulkAssign(yearId, selectedClasses.toList(), selectedSequences.toList()) {
                                    // Success
                                }
                            },
                            enabled = selectedClasses.isNotEmpty() && selectedSequences.isNotEmpty(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Save, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Appliquer")
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (loading && classes.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Row(modifier = Modifier.padding(padding).fillMaxSize()) {
                // Column 1: Classes
                Column(modifier = Modifier.weight(1f).fillMaxHeight().border(1.dp, Color.LightGray.copy(alpha = 0.3f))) {
                    Text(
                        "Classes",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(classes) { cls ->
                            val isSelected = selectedClasses.contains(cls.idClasse)
                            val count = repartition.count { it.idClasse == cls.idClasse && !it.supprimer }
                            
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedClasses = if (isSelected) selectedClasses - cls.idClasse else selectedClasses + cls.idClasse
                                    }
                                    .background(if (isSelected) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(checked = isSelected, onCheckedChange = null)
                                Spacer(Modifier.width(12.dp))
                                Column {
                                    Text(cls.libelleClasseFr, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("$count séquences", fontSize = 10.sp, color = Color.Gray)
                                }
                            }
                            HorizontalDivider(thickness = 0.5.dp, color = Color.LightGray.copy(alpha = 0.5f))
                        }
                    }
                }

                // Column 2: Sequences
                Column(modifier = Modifier.weight(1f).fillMaxHeight().alpha(if (selectedClasses.isEmpty()) 0.4f else 1f)) {
                    Text(
                        "Séquences",
                        modifier = Modifier.padding(16.dp),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = Color.Gray
                    )
                    LazyColumn(modifier = Modifier.fillMaxSize()) {
                        items(sequences) { seq ->
                            val isSelected = selectedSequences.contains(seq.idServeur)
                            
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable(enabled = selectedClasses.isNotEmpty()) {
                                        selectedSequences = if (isSelected) selectedSequences - seq.idServeur!! else selectedSequences + seq.idServeur!!
                                    }
                                    .background(if (isSelected) MaterialTheme.colorScheme.secondaryContainer else Color.Transparent)
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    if (isSelected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                    null,
                                    tint = if (isSelected) MaterialTheme.colorScheme.secondary else Color.LightGray
                                )
                                Spacer(Modifier.width(12.dp))
                                Text(seq.libelleSousPeriodeFr, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            }
                            HorizontalDivider(thickness = 0.5.dp, color = Color.LightGray.copy(alpha = 0.5f))
                        }
                    }
                }
            }
        }
    }
}
